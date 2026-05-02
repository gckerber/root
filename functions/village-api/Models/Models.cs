// Models/Models.cs
using System.Text.Json.Serialization;

namespace SaintLouisvilleApi.Models;

public class ApiResponse<T>
{
    [JsonPropertyName("items")]
    public List<T> Items { get; set; } = new();

    [JsonPropertyName("total")]
    public int Total => Items.Count;
}

public class Bulletin
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    [JsonPropertyName("body")]
    public string Body { get; set; } = string.Empty;
    [JsonPropertyName("category")]
    public string Category { get; set; } = "notice";
    [JsonPropertyName("pinned")]
    public bool Pinned { get; set; }
    [JsonPropertyName("link")]
    public string? Link { get; set; }
    [JsonPropertyName("date")]
    public string Date { get; set; } = DateTime.UtcNow.ToString("o");
    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class Minutes
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [JsonPropertyName("meetingDate")]
    public string MeetingDate { get; set; } = string.Empty;
    [JsonPropertyName("year")]
    public int Year { get; set; }
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    [JsonPropertyName("type")]
    public string Type { get; set; } = "Regular Session";
    [JsonPropertyName("approved")]
    public bool Approved { get; set; }
    [JsonPropertyName("fileUrl")]
    public string? FileUrl { get; set; }
    [JsonPropertyName("fileSize")]
    public long? FileSize { get; set; }
    [JsonPropertyName("fileName")]
    public string? FileName { get; set; }
    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class Official
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    [JsonPropertyName("bio")]
    public string Bio { get; set; } = string.Empty;
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
    [JsonPropertyName("photoUrl")]
    public string? PhotoUrl { get; set; }
    [JsonPropertyName("order")]
    public int Order { get; set; }
    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class Ordinance
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [JsonPropertyName("number")]
    public string Number { get; set; } = string.Empty;
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    [JsonPropertyName("category")]
    public string Category { get; set; } = "general";
    [JsonPropertyName("summary")]
    public string? Summary { get; set; }
    [JsonPropertyName("fileUrl")]
    public string? FileUrl { get; set; }
    [JsonPropertyName("year")]
    public int Year { get; set; } = DateTime.UtcNow.Year;
    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class CalendarEvent
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;
    [JsonPropertyName("month")]
    public string Month { get; set; } = string.Empty;
    [JsonPropertyName("time")]
    public string? Time { get; set; }
    [JsonPropertyName("location")]
    public string Location { get; set; } = "Village Hall";
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    [JsonPropertyName("photoUrl")]
    public string? PhotoUrl { get; set; }
    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class Photo
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [JsonPropertyName("caption")]
    public string Caption { get; set; } = string.Empty;
    [JsonPropertyName("year")]
    public int? Year { get; set; }
    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;
    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class HistoryRecord
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "history-text";
    [JsonPropertyName("partitionKey")]
    public string PartitionKey { get; set; } = "settings";
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
    [JsonPropertyName("updatedAt")]
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class HistoryUpdateRequest
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

public class UploadUrlRequest
{
    [JsonPropertyName("container")]
    public string Container { get; set; } = string.Empty;
    [JsonPropertyName("filename")]
    public string Filename { get; set; } = string.Empty;
    [JsonPropertyName("contentType")]
    public string ContentType { get; set; } = "application/octet-stream";
}

public class UploadUrlResponse
{
    [JsonPropertyName("uploadUrl")]
    public string UploadUrl { get; set; } = string.Empty;
    [JsonPropertyName("publicUrl")]
    public string PublicUrl { get; set; } = string.Empty;
    [JsonPropertyName("blobName")]
    public string BlobName { get; set; } = string.Empty;
}

public class Citation
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [JsonPropertyName("citationNumber")]
    public string CitationNumber { get; set; } = string.Empty;
    [JsonPropertyName("firstName")]
    public string? FirstName { get; set; }
    [JsonPropertyName("lastName")]
    public string LastName { get; set; } = string.Empty;
    [JsonPropertyName("dob")]
    public string? Dob { get; set; }
    [JsonPropertyName("address")]
    public string? Address { get; set; }
    [JsonPropertyName("vehicleInfo")]
    public string? VehicleInfo { get; set; }
    [JsonPropertyName("violationDate")]
    public string ViolationDate { get; set; } = string.Empty;
    [JsonPropertyName("violationType")]
    public string ViolationType { get; set; } = "Speeding";
    [JsonPropertyName("violationDescription")]
    public string? ViolationDescription { get; set; }
    [JsonPropertyName("fineAmount")]
    public decimal FineAmount { get; set; }
    [JsonPropertyName("balance")]
    public decimal Balance { get; set; }
    [JsonPropertyName("officer")]
    public string? Officer { get; set; }
    [JsonPropertyName("status")]
    public string Status { get; set; } = "unpaid";
    [JsonPropertyName("courtDate")]
    public string? CourtDate { get; set; }
    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class PdCourtDate
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;
    [JsonPropertyName("year")]
    public int Year { get; set; }
    [JsonPropertyName("location")]
    public string Location { get; set; } = "Village Hall — Council Chambers";
    [JsonPropertyName("judge")]
    public string Judge { get; set; } = "Mayor Zack Allen";
    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class PdImage
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;
    [JsonPropertyName("caption")]
    public string? Caption { get; set; }
    [JsonPropertyName("order")]
    public int Order { get; set; }
    [JsonPropertyName("type")]
    public string Type { get; set; } = "image";
}

public class PdFaqItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [JsonPropertyName("question")]
    public string Question { get; set; } = string.Empty;
    [JsonPropertyName("answer")]
    public string Answer { get; set; } = string.Empty;
    [JsonPropertyName("order")]
    public int Order { get; set; }
    [JsonPropertyName("type")]
    public string Type { get; set; } = "faq";
}

public class PdContact
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "contact";
    [JsonPropertyName("type")]
    public string Type { get; set; } = "config";
    [JsonPropertyName("address")]
    public string Address { get; set; } = "100 N. High Street";
    [JsonPropertyName("address2")]
    public string Address2 { get; set; } = "Saint Louisville, OH 43071";
    [JsonPropertyName("phone")]
    public string Phone { get; set; } = "(740) 568-7800";
    [JsonPropertyName("email")]
    public string Email { get; set; } = "pd@saintlouisvilleohio.gov";
    [JsonPropertyName("hours")]
    public string Hours { get; set; } = "Monday – Friday: 8:00 AM – 4:30 PM\nAfter hours: call non-emergency line";
    [JsonPropertyName("chief")]
    public string Chief { get; set; } = "Contact Village Hall";
    [JsonPropertyName("courtPresidedBy")]
    public string CourtPresidedBy { get; set; } = "Mayor Zack Allen";
}

public class FineLookupRequest
{
    [JsonPropertyName("citationNumber")]
    public string CitationNumber { get; set; } = string.Empty;
    [JsonPropertyName("lastName")]
    public string LastName { get; set; } = string.Empty;
}

public class FinePaymentRequest
{
    [JsonPropertyName("citationId")]
    public string CitationId { get; set; } = string.Empty;
    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}
