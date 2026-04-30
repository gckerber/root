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
