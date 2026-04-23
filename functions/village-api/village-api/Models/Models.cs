// Models/Models.cs
using Newtonsoft.Json;

namespace SaintLouisvilleApi.Models;

// ── Generic API response wrapper ──────────────────────────
public class ApiResponse<T>
{
    [JsonProperty("items")]
    public List<T> Items { get; set; } = new();

    [JsonProperty("total")]
    public int Total => Items.Count;
}

// ── Bulletin ──────────────────────────────────────────────
public class Bulletin
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonProperty("title")]
    public string Title { get; set; } = string.Empty;

    [JsonProperty("body")]
    public string Body { get; set; } = string.Empty;

    [JsonProperty("category")]
    public string Category { get; set; } = "notice";   // partition key

    [JsonProperty("pinned")]
    public bool Pinned { get; set; }

    [JsonProperty("link")]
    public string? Link { get; set; }

    [JsonProperty("date")]
    public string Date { get; set; } = DateTime.UtcNow.ToString("o");

    [JsonProperty("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

// ── Council Minutes ───────────────────────────────────────
public class Minutes
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonProperty("meetingDate")]
    public string MeetingDate { get; set; } = string.Empty;

    [JsonProperty("year")]
    public int Year { get; set; }                       // partition key

    [JsonProperty("title")]
    public string Title { get; set; } = string.Empty;

    [JsonProperty("type")]
    public string Type { get; set; } = "Regular Session";

    [JsonProperty("approved")]
    public bool Approved { get; set; }

    [JsonProperty("fileUrl")]
    public string? FileUrl { get; set; }

    [JsonProperty("fileSize")]
    public long? FileSize { get; set; }

    [JsonProperty("fileName")]
    public string? FileName { get; set; }

    [JsonProperty("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

// ── Official ──────────────────────────────────────────────
public class Official
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("title")]
    public string Title { get; set; } = string.Empty;

    [JsonProperty("bio")]
    public string Bio { get; set; } = string.Empty;

    [JsonProperty("email")]
    public string Email { get; set; } = string.Empty;

    [JsonProperty("order")]
    public int Order { get; set; }

    [JsonProperty("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

// ── Ordinance ─────────────────────────────────────────────
public class Ordinance
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonProperty("number")]
    public string Number { get; set; } = string.Empty;

    [JsonProperty("title")]
    public string Title { get; set; } = string.Empty;

    [JsonProperty("category")]
    public string Category { get; set; } = "general";  // partition key

    [JsonProperty("summary")]
    public string? Summary { get; set; }

    [JsonProperty("fileUrl")]
    public string? FileUrl { get; set; }

    [JsonProperty("year")]
    public int Year { get; set; } = DateTime.UtcNow.Year;

    [JsonProperty("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

// ── Calendar Event ────────────────────────────────────────
public class CalendarEvent
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonProperty("title")]
    public string Title { get; set; } = string.Empty;

    [JsonProperty("date")]
    public string Date { get; set; } = string.Empty;

    [JsonProperty("month")]
    public string Month { get; set; } = string.Empty;  // partition key  e.g. "2024-07"

    [JsonProperty("time")]
    public string? Time { get; set; }

    [JsonProperty("location")]
    public string Location { get; set; } = "Village Hall";

    [JsonProperty("description")]
    public string? Description { get; set; }

    [JsonProperty("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

// ── Photo ─────────────────────────────────────────────────
public class Photo
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonProperty("caption")]
    public string Caption { get; set; } = string.Empty;

    [JsonProperty("year")]
    public int? Year { get; set; }

    [JsonProperty("url")]
    public string Url { get; set; } = string.Empty;

    [JsonProperty("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

// ── History text ──────────────────────────────────────────
public class HistoryRecord
{
    [JsonProperty("id")]
    public string Id { get; set; } = "history-text";

    [JsonProperty("partitionKey")]
    public string PartitionKey { get; set; } = "settings";  // partition key

    [JsonProperty("text")]
    public string Text { get; set; } = string.Empty;

    [JsonProperty("updatedAt")]
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

// ── Request bodies ────────────────────────────────────────
public class HistoryUpdateRequest
{
    [JsonProperty("text")]
    public string Text { get; set; } = string.Empty;
}

public class UploadUrlRequest
{
    [JsonProperty("container")]
    public string Container { get; set; } = string.Empty;

    [JsonProperty("filename")]
    public string Filename { get; set; } = string.Empty;

    [JsonProperty("contentType")]
    public string ContentType { get; set; } = "application/octet-stream";
}

public class UploadUrlResponse
{
    [JsonProperty("uploadUrl")]
    public string UploadUrl { get; set; } = string.Empty;

    [JsonProperty("publicUrl")]
    public string PublicUrl { get; set; } = string.Empty;

    [JsonProperty("blobName")]
    public string BlobName { get; set; } = string.Empty;
}
