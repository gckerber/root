# Saint Louisville Village Site — Claude Notes

## Project Overview
- **Village site**: `apps/village-site/` (React + Vite, Azure Static Web Apps)
- **Admin site**: `apps/admin/` (React + Vite, Azure Static Web Apps)
- **API**: `functions/village-api/` (C# .NET 8 Azure Functions)
- **API base**: `https://func-village-prod.azurewebsites.net`
- **Cosmos DB account**: `cosmos-slv-prod-fs7n7vaxa4ywc` in resource group `rg-saintlouisville-prod`
- **Admin API key**: stored in Function App setting `ADMIN_API_KEY` — retrieve with:
  ```
  az functionapp config appsettings list --name func-village-prod --resource-group rg-saintlouisville-prod --query "[?name=='ADMIN_API_KEY'].value" -o tsv
  ```

---

## Ordinance Bulk Upload Workflow

When the user provides a folder of `.docx` ordinance files, do the following:

### 1. Upload files + create records (PowerShell)
Files follow naming convention: `Ordinance_YYYY-NN_Title_Words_Here.docx`
- Parse number as `ORD-YYYY-NN`, title from slug, year from prefix
- Handle `_PARTIAL` and `_TABLED` suffixes → strip from title, add note to summary
- Skip Word temp files (`~$*.docx`)
- Upload via `POST /api/upload-url` (container: `ordinances`) → PUT to blob → POST to `/api/ordinances`

```powershell
$apiBase  = "https://func-village-prod.azurewebsites.net"
$adminKey = "<key from ADMIN_API_KEY setting>"
$headers  = @{ "x-admin-key" = $adminKey; "Content-Type" = "application/json" }
$dir      = "<path to docx folder>"

$files = Get-ChildItem $dir -Filter "*.docx" | Where-Object { $_.Name -notmatch "^\~\$" }

foreach ($file in $files) {
  if ($file.Name -notmatch '^Ordinance_(\d{4})-(\d{2})_(.+)$') { continue }
  $year = [int]$Matches[1]; $num = $Matches[2]; $slug = $Matches[3]
  $ordNum = "ORD-$year-$num"
  $summary = $null
  if ($slug -match '_PARTIAL$') { $summary = "Partial ordinance — document may be incomplete."; $slug = $slug -replace '_PARTIAL$','' }
  if ($slug -match '_TABLED$')  { $summary = "This ordinance was tabled and not enacted.";      $slug = $slug -replace '_TABLED$','' }
  $title = $slug -replace '_',' '

  $uploadBody = @{ container = "ordinances"; filename = $file.Name; contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } | ConvertTo-Json -Compress
  $urlRes = Invoke-RestMethod -Method POST -Uri "$apiBase/api/upload-url" -Headers $headers -Body $uploadBody

  $fileBytes = [System.IO.File]::ReadAllBytes($file.FullName)
  Invoke-RestMethod -Method PUT -Uri $urlRes.uploadUrl -Body $fileBytes -ContentType "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -Headers @{ "x-ms-blob-type" = "BlockBlob" } | Out-Null

  $record = @{ number = $ordNum; title = $title; category = "general"; year = $year; fileUrl = $urlRes.publicUrl; createdAt = "$year-01-01T00:00:00Z" }
  if ($summary) { $record.summary = $summary }
  Invoke-RestMethod -Method POST -Uri "$apiBase/api/ordinances" -Headers $headers -Body ($record | ConvertTo-Json -Compress)
}
```

### 2. Extract plain-language summaries and update records (PowerShell)
Each `.docx` contains a **"Plain-Language Summary"** section. Extract it and update the Cosmos DB record.

Key details:
- `.docx` is a ZIP — read `word/document.xml`, strip XML tags, collapse whitespace
- Find text after `Plain-Language Summary` heading, stop at `Transcription Notes`, `WHEREAS`, `NOW, THEREFORE`, or `BE IT ORDAINED`
- Smart quotes and em/en dashes must be replaced with ASCII equivalents before POSTing JSON (use char codes, not literal Unicode in PS strings)
- Match files to API records by ordinance number (`ORD-YYYY-NN`)
- Update via `PUT /api/ordinances?id=<id>`

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-PlainSummary($path) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
  $entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
  $stream = $entry.Open()
  $reader = New-Object System.IO.StreamReader($stream)
  $xml = $reader.ReadToEnd(); $reader.Close(); $zip.Dispose()
  $text = ($xml -replace '<[^>]+>', ' ') -replace '\s+', ' '
  $match = [regex]::Match($text, '(?i)plain.language summary\s+(.+?)(?=\s+Transcription Notes|\s+WHEREAS|\s+NOW,\s+THEREFORE|\s+BE IT ORDAINED|$)', [System.Text.RegularExpressions.RegexOptions]::Singleline)
  if ($match.Success) { return $match.Groups[1].Value.Trim() }
  return $null
}

function Clean-Summary($s) {
  $s = $s -replace [char]0x201C, '"'; $s = $s -replace [char]0x201D, '"'
  $s = $s -replace [char]0x2018, "'"; $s = $s -replace [char]0x2019, "'"
  $s = $s -replace [char]0x2013, '-'; $s = $s -replace [char]0x2014, '-'
  $s = $s -replace [char]0x2026, '...'; $s = $s -replace [char]0x00A0, ' '
  [System.Text.RegularExpressions.Regex]::Replace($s, '[^\x00-\x7F]', '').Trim()
}

$all = (Invoke-RestMethod -Uri "$apiBase/api/ordinances").items

foreach ($file in (Get-ChildItem $dir -Filter "*.docx" | Where-Object { $_.Name -notmatch "^\~\$" })) {
  if ($file.Name -notmatch '^Ordinance_(\d{4})-(\d{2})_') { continue }
  $ordNum = "ORD-$($Matches[1])-$($Matches[2])"
  $record = $all | Where-Object { $_.number -eq $ordNum } | Select-Object -First 1
  if (-not $record) { continue }
  $summary = Clean-Summary (Get-PlainSummary $file.FullName)
  if (-not $summary) { continue }

  $body = [ordered]@{ id = $record.id; number = $record.number; title = $record.title; category = $record.category; year = [int]$record.year; fileUrl = $record.fileUrl; summary = $summary } | ConvertTo-Json -Compress
  Invoke-WebRequest -Method PUT -Uri "$apiBase/api/ordinances?id=$($record.id)" -Headers $headers -Body $body -UseBasicParsing | Out-Null
  Write-Host "Updated $ordNum"
}
```

---

## Cosmos DB Containers

| Database   | Container   | Partition Key | Notes                        |
|------------|-------------|---------------|------------------------------|
| `villagedb`| (various)   | varies        | Village site data            |
| `pddb`     | `pdLinks`   | `/type`       | PD Links & Resources (value always `"link"`) |

To create a missing container via CLI:
```powershell
az cosmosdb sql container create --account-name cosmos-slv-prod-fs7n7vaxa4ywc --resource-group rg-saintlouisville-prod --database-name <db> --name <container> --partition-key-path "/<field>"
```

---

## Git / Deploy Notes
- All 4 apps deploy via GitHub Actions on push to `main`
- Azure/static-web-apps-deploy **only v1 exists** (v2/v3 do not) — do not upgrade
- OneDrive can corrupt `.git/objects` — if a blob goes missing, recreate with `git hash-object -w <file>`
