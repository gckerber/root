// Functions/EventsPhotosHistory.cs
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using SaintLouisvilleApi.Models;
using SaintLouisvilleApi.Services;
using System.Net;

namespace SaintLouisvilleApi.Functions;

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
            return await OkJson(req, new ApiResponse<CalendarEvent> { Items = DemoData.Events });
        try
        {
            var month = req.Query["month"];
            var department = req.Query["department"];
            QueryDefinition query;
            if (!string.IsNullOrEmpty(month) && !string.IsNullOrEmpty(department))
                query = new QueryDefinition("SELECT * FROM c WHERE c.month = @month AND c.department = @dept")
                    .WithParameter("@month", month)
                    .WithParameter("@dept", department);
            else if (!string.IsNullOrEmpty(month))
                query = new QueryDefinition("SELECT * FROM c WHERE c.month = @month")
                    .WithParameter("@month", month);
            else if (!string.IsNullOrEmpty(department))
                query = new QueryDefinition("SELECT * FROM c WHERE c.department = @dept")
                    .WithParameter("@dept", department);
            else
                query = new QueryDefinition("SELECT * FROM c");

            var items = await _cosmos.QueryAsync<CalendarEvent>(Container, query);
            items = items.OrderBy(e => e.Date).ToList();
            return await OkJson(req, new ApiResponse<CalendarEvent> { Items = items });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetEvents error: {msg}", ex.Message);
            return await OkJson(req, new ApiResponse<CalendarEvent> { Items = DemoData.Events });
        }
    }

    [Function("CreateEvent")]
    public async Task<HttpResponseData> Post(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "events")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var body = await ReadBodyAsync<CalendarEvent>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.Title) || string.IsNullOrWhiteSpace(body.Date))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "title and date are required");

        if (!DateTime.TryParse(body.Date, out var eventDate))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid date format");

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
            PhotoUrl = body.PhotoUrl?.Trim(),
            Department = body.Department?.Trim(),
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        var created = await _cosmos.CreateAsync(Container, item, new PartitionKey(month));
        return await CreatedJson(req, created);
    }

    [Function("UpdateEvent")]
    public async Task<HttpResponseData> Put(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "events")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        if (string.IsNullOrEmpty(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        var body = await ReadBodyAsync<CalendarEvent>(req);
        if (body == null) return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid body");

        if (!DateTime.TryParse(body.Date, out var newDate))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid date format");

        var newMonth = newDate.ToString("yyyy-MM");

        // Find existing — search by provided month or try common months
        CalendarEvent? existing = null;
        var searchMonths = new HashSet<string> { newMonth };
        if (!string.IsNullOrEmpty(body.Month)) searchMonths.Add(body.Month);

        foreach (var m in searchMonths)
        {
            existing = await _cosmos.ReadAsync<CalendarEvent>(Container, id, new PartitionKey(m));
            if (existing != null) break;
        }

        if (existing == null)
        {
            // Try fetching all events to find it
            var allItems = await _cosmos.QueryAsync<CalendarEvent>(Container,
                new QueryDefinition("SELECT * FROM c WHERE c.id = @id").WithParameter("@id", id));
            existing = allItems.FirstOrDefault();
        }

        if (existing == null) return await ErrorJson(req, HttpStatusCode.NotFound, "Event not found");

        // If date/month changed, delete old and create new
        if (existing.Month != newMonth)
        {
            await _cosmos.DeleteAsync(Container, id, new PartitionKey(existing.Month));
            var newItem = new CalendarEvent
            {
                Id = id,
                Title = body.Title?.Trim() ?? existing.Title,
                Date = newDate.ToString("o"),
                Month = newMonth,
                Time = body.Time?.Trim(),
                Location = body.Location?.Trim() ?? existing.Location,
                Description = body.Description?.Trim(),
                PhotoUrl = body.PhotoUrl?.Trim() ?? existing.PhotoUrl,
                Department = body.Department?.Trim() ?? existing.Department,
                CreatedAt = existing.CreatedAt
            };
            var created = await _cosmos.CreateAsync(Container, newItem, new PartitionKey(newMonth));
            return await OkJson(req, created);
        }

        // Same month — just update
        existing.Title = body.Title?.Trim() ?? existing.Title;
        existing.Date = newDate.ToString("o");
        existing.Time = body.Time?.Trim();
        existing.Location = body.Location?.Trim() ?? existing.Location;
        existing.Description = body.Description?.Trim();
        existing.PhotoUrl = body.PhotoUrl?.Trim() ?? existing.PhotoUrl;
        existing.Department = body.Department?.Trim() ?? existing.Department;

        var updated = await _cosmos.ReplaceAsync(Container, id, existing, new PartitionKey(existing.Month));
        return await OkJson(req, updated);
    }

    [Function("DeleteEvent")]
    public async Task<HttpResponseData> Delete(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "events")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        var month = req.Query["month"];
        if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(month))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "id and month required");

        await _cosmos.DeleteAsync(Container, id, new PartitionKey(month));
        return await OkJson(req, new { success = true });
    }
}

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
            return await OkJson(req, new ApiResponse<Photo> { Items = DemoData.Photos });
        try
        {
            var items = await _cosmos.QueryAsync<Photo>(Container, new QueryDefinition("SELECT * FROM c"));
            items = items.OrderBy(p => p.Year ?? 9999).ToList();
            return await OkJson(req, new ApiResponse<Photo> { Items = items });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetPhotos error: {msg}", ex.Message);
            return await OkJson(req, new ApiResponse<Photo> { Items = DemoData.Photos });
        }
    }

    [Function("CreatePhoto")]
    public async Task<HttpResponseData> Post(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "photos")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var body = await ReadBodyAsync<Photo>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.Caption) || string.IsNullOrWhiteSpace(body.Url))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "caption and url are required");

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
        return await CreatedJson(req, created);
    }

    [Function("DeletePhoto")]
    public async Task<HttpResponseData> Delete(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "photos")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        if (string.IsNullOrEmpty(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        await _cosmos.DeleteAsync(Container, id, new PartitionKey(id));
        return await OkJson(req, new { success = true });
    }
}

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
            return await OkJson(req, new { text = DemoData.HistoryText });
        try
        {
            var record = await _cosmos.ReadAsync<HistoryRecord>(
                Container, "history-text", new PartitionKey("settings"));
            return await OkJson(req, new { text = record?.Text ?? string.Empty });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetHistory error: {msg}", ex.Message);
            return await OkJson(req, new { text = DemoData.HistoryText });
        }
    }

    [Function("SaveHistory")]
    public async Task<HttpResponseData> Post(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "history")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var body = await ReadBodyAsync<HistoryUpdateRequest>(req);
        var record = new HistoryRecord
        {
            Id = "history-text",
            PartitionKey = "settings",
            Text = body?.Text ?? string.Empty,
            UpdatedAt = DateTime.UtcNow.ToString("o")
        };

        await _cosmos.UpsertAsync(Container, record, new PartitionKey("settings"));
        return await OkJson(req, new { success = true });
    }
}

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
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_storage.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Storage not available");

        var body = await ReadBodyAsync<UploadUrlRequest>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.Container) || string.IsNullOrWhiteSpace(body.Filename))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "container and filename are required");

        try
        {
            var (uploadUrl, publicUrl, blobName) = await _storage.GenerateSasUploadUrlAsync(
                body.Container, body.Filename, body.ContentType);
            return await OkJson(req, new UploadUrlResponse
            {
                UploadUrl = uploadUrl,
                PublicUrl = publicUrl,
                BlobName = blobName
            });
        }
        catch (ArgumentException ex)
        {
            return await ErrorJson(req, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetUploadUrl error: {msg}", ex.Message);
            return await ErrorJson(req, HttpStatusCode.InternalServerError, "Could not generate upload URL");
        }
    }
}
