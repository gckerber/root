// Functions/EventsPhotosHistory.cs
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using SaintLouisvilleApi.Models;
using SaintLouisvilleApi.Services;
using System.Net;

namespace SaintLouisvilleApi.Functions;

// ── Events ─────────────────────────────────────────────────────────────────

public class EventsFunctions : FunctionBase
{
    private readonly CosmosService _cosmos;
    private const string Container = "events";

    public EventsFunctions(CosmosService cosmos, ILogger<EventsFunctions> logger)
        : base(logger) => _cosmos = cosmos;

    [Function("GetEvents")]
    public async Task<HttpResponseData> Get(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "events")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);

        if (!_cosmos.IsAvailable)
            return OkJson(req, new ApiResponse<CalendarEvent> { Items = DemoData.Events });

        try
        {
            var month = req.Query["month"];
            QueryDefinition query;

            if (!string.IsNullOrEmpty(month))
                query = new QueryDefinition("SELECT * FROM c WHERE c.month = @month ORDER BY c.date ASC")
                    .WithParameter("@month", month);
            else
                query = new QueryDefinition("SELECT * FROM c ORDER BY c.date ASC");

            var items = await _cosmos.QueryAsync<CalendarEvent>(Container, query);
            return OkJson(req, new ApiResponse<CalendarEvent> { Items = items });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetEvents error");
            return OkJson(req, new ApiResponse<CalendarEvent> { Items = DemoData.Events });
        }
    }

    [Function("CreateEvent")]
    public async Task<HttpResponseData> Post(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "events")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var body = await ReadBodyAsync<CalendarEvent>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.Title) || string.IsNullOrWhiteSpace(body.Date))
            return ErrorJson(req, HttpStatusCode.BadRequest, "title and date are required");

        if (!DateTime.TryParse(body.Date, out var eventDate))
            return ErrorJson(req, HttpStatusCode.BadRequest, "Invalid date format");

        var month = eventDate.ToString("yyyy-MM");
        var item = new CalendarEvent
        {
            Id = Guid.NewGuid().ToString(),
            Title = body.Title.Trim(),
            Date = eventDate.ToString("o"),
            Month = month,
            Time = body.Time?.Trim(),
            Location = body.Location?.Trim() ?? "Village Hall",
            Description = body.Description?.Trim(),
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        var created = await _cosmos.CreateAsync(Container, item, new PartitionKey(month));
        return CreatedJson(req, created);
    }

    [Function("UpdateEvent")]
    public async Task<HttpResponseData> Put(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "events")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        if (string.IsNullOrEmpty(id)) return ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        var body = await ReadBodyAsync<CalendarEvent>(req);
        if (body == null || string.IsNullOrEmpty(body.Month))
            return ErrorJson(req, HttpStatusCode.BadRequest, "month required in body");

        var existing = await _cosmos.ReadAsync<CalendarEvent>(Container, id, new PartitionKey(body.Month));
        if (existing == null) return ErrorJson(req, HttpStatusCode.NotFound, "Not found");

        existing.Title = body.Title?.Trim() ?? existing.Title;
        existing.Time = body.Time?.Trim();
        existing.Location = body.Location?.Trim() ?? existing.Location;
        existing.Description = body.Description?.Trim();

        var updated = await _cosmos.ReplaceAsync(Container, id, existing, new PartitionKey(existing.Month));
        return OkJson(req, updated);
    }

    [Function("DeleteEvent")]
    public async Task<HttpResponseData> Delete(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "events")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        var month = req.Query["month"];
        if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(month))
            return ErrorJson(req, HttpStatusCode.BadRequest, "id and month required");

        await _cosmos.DeleteAsync(Container, id, new PartitionKey(month));
        return OkJson(req, new { success = true });
    }
}

// ── Photos ─────────────────────────────────────────────────────────────────

public class PhotosFunctions : FunctionBase
{
    private readonly CosmosService _cosmos;
    private const string Container = "photos";

    public PhotosFunctions(CosmosService cosmos, ILogger<PhotosFunctions> logger)
        : base(logger) => _cosmos = cosmos;

    [Function("GetPhotos")]
    public async Task<HttpResponseData> Get(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "photos")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);

        if (!_cosmos.IsAvailable)
            return OkJson(req, new ApiResponse<Photo> { Items = DemoData.Photos });

        try
        {
            var items = await _cosmos.QueryAsync<Photo>(Container,
                new QueryDefinition("SELECT * FROM c ORDER BY c.year ASC"));
            return OkJson(req, new ApiResponse<Photo> { Items = items });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetPhotos error");
            return OkJson(req, new ApiResponse<Photo> { Items = DemoData.Photos });
        }
    }

    [Function("CreatePhoto")]
    public async Task<HttpResponseData> Post(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "photos")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var body = await ReadBodyAsync<Photo>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.Caption) || string.IsNullOrWhiteSpace(body.Url))
            return ErrorJson(req, HttpStatusCode.BadRequest, "caption and url are required");

        var id = Guid.NewGuid().ToString();
        var item = new Photo
        {
            Id = id,
            Caption = body.Caption.Trim(),
            Year = body.Year,
            Url = body.Url.Trim(),
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        var created = await _cosmos.CreateAsync(Container, item, new PartitionKey(id));
        return CreatedJson(req, created);
    }

    [Function("DeletePhoto")]
    public async Task<HttpResponseData> Delete(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "photos")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        if (string.IsNullOrEmpty(id)) return ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        await _cosmos.DeleteAsync(Container, id, new PartitionKey(id));
        return OkJson(req, new { success = true });
    }
}

// ── History ────────────────────────────────────────────────────────────────

public class HistoryFunctions : FunctionBase
{
    private readonly CosmosService _cosmos;
    private const string Container = "settings";

    public HistoryFunctions(CosmosService cosmos, ILogger<HistoryFunctions> logger)
        : base(logger) => _cosmos = cosmos;

    [Function("GetHistory")]
    public async Task<HttpResponseData> Get(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "history")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);

        if (!_cosmos.IsAvailable)
            return OkJson(req, new { text = DemoData.HistoryText });

        try
        {
            var record = await _cosmos.ReadAsync<HistoryRecord>(
                Container, "history-text", new PartitionKey("settings"));
            return OkJson(req, new { text = record?.Text ?? string.Empty });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetHistory error");
            return OkJson(req, new { text = DemoData.HistoryText });
        }
    }

    [Function("SaveHistory")]
    public async Task<HttpResponseData> Post(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "history")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var body = await ReadBodyAsync<HistoryUpdateRequest>(req);

        var record = new HistoryRecord
        {
            Id = "history-text",
            PartitionKey = "settings",
            Text = body?.Text ?? string.Empty,
            UpdatedAt = DateTime.UtcNow.ToString("o")
        };

        await _cosmos.UpsertAsync(Container, record, new PartitionKey("settings"));
        return OkJson(req, new { success = true });
    }
}

// ── Upload URL ─────────────────────────────────────────────────────────────

public class UploadUrlFunctions : FunctionBase
{
    private readonly StorageService _storage;

    public UploadUrlFunctions(StorageService storage, ILogger<UploadUrlFunctions> logger)
        : base(logger) => _storage = storage;

    [Function("GetUploadUrl")]
    public async Task<HttpResponseData> Post(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options", Route = "upload-url")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!IsAdmin(req)) return ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_storage.IsAvailable) return ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Storage not available");

        var body = await ReadBodyAsync<UploadUrlRequest>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.Container) || string.IsNullOrWhiteSpace(body.Filename))
            return ErrorJson(req, HttpStatusCode.BadRequest, "container and filename are required");

        try
        {
            var (uploadUrl, publicUrl, blobName) = await _storage.GenerateSasUploadUrlAsync(
                body.Container, body.Filename, body.ContentType);

            return OkJson(req, new UploadUrlResponse
            {
                UploadUrl = uploadUrl,
                PublicUrl = publicUrl,
                BlobName = blobName
            });
        }
        catch (ArgumentException ex)
        {
            return ErrorJson(req, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetUploadUrl error");
            return ErrorJson(req, HttpStatusCode.InternalServerError, "Could not generate upload URL");
        }
    }
}
