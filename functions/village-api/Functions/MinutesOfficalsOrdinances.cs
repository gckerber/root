// Functions/MinutesOfficalsOrdinances.cs
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using SaintLouisvilleApi.Models;
using SaintLouisvilleApi.Services;
using System.Net;

namespace SaintLouisvilleApi.Functions;

public class MinutesFunctions : FunctionBase
{
    private readonly CosmosService _cosmos;
    private const string Container = "minutes";

    public MinutesFunctions(CosmosService cosmos, ILogger<MinutesFunctions> logger)
        : base(logger) => _cosmos = cosmos;

    [Function("GetMinutes")]
    public async Task<HttpResponseData> Get(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "minutes")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!_cosmos.IsAvailable)
            return await OkJson(req, new ApiResponse<Minutes> { Items = DemoData.Minutes });
        try
        {
            QueryDefinition query;
            if (int.TryParse(req.Query["year"], out var year))
                query = new QueryDefinition("SELECT * FROM c WHERE c.year = @year")
                    .WithParameter("@year", year);
            else
                query = new QueryDefinition("SELECT * FROM c");

            var items = await _cosmos.QueryAsync<Minutes>(Container, query);
            var search = req.Query["search"]?.ToLower();
            if (!string.IsNullOrEmpty(search))
                items = items.Where(m =>
                    m.Title.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    m.Type.Contains(search, StringComparison.OrdinalIgnoreCase)).ToList();

            items = items.OrderByDescending(m => m.MeetingDate).ToList();
            return await OkJson(req, new ApiResponse<Minutes> { Items = items });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetMinutes error: {msg}", ex.Message);
            return await OkJson(req, new ApiResponse<Minutes> { Items = DemoData.Minutes });
        }
    }

    [Function("CreateMinutes")]
    public async Task<HttpResponseData> Post(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "minutes")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var body = await ReadBodyAsync<Minutes>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.MeetingDate))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "meetingDate is required");

        if (!DateTime.TryParse(body.MeetingDate, out var date))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid meetingDate format");

        var title = !string.IsNullOrWhiteSpace(body.Title)
            ? body.Title.Trim()
            : $"{date:MMMM d, yyyy} Council Meeting";

        var item = new Minutes
        {
            Id = Guid.NewGuid().ToString(),
            MeetingDate = date.ToString("o"),
            Year = date.Year,
            Title = title,
            Type = body.Type ?? "Regular Session",
            Approved = body.Approved,
            FileUrl = body.FileUrl,
            FileSize = body.FileSize,
            FileName = body.FileName,
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        var created = await _cosmos.CreateAsync(Container, item, new PartitionKey(item.Year));
        return await CreatedJson(req, created);
    }

    [Function("UpdateMinutes")]
    public async Task<HttpResponseData> Put(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "minutes")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        if (string.IsNullOrEmpty(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        var body = await ReadBodyAsync<Minutes>(req);
        if (body == null) return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid body");

        if (!DateTime.TryParse(body.MeetingDate, out var date))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid meetingDate");

        var existing = await _cosmos.ReadAsync<Minutes>(Container, id, new PartitionKey(date.Year));
        if (existing == null) return await ErrorJson(req, HttpStatusCode.NotFound, "Not found");

        existing.Title = !string.IsNullOrWhiteSpace(body.Title) ? body.Title.Trim() : existing.Title;
        existing.Type = body.Type ?? existing.Type;
        existing.Approved = body.Approved;
        existing.FileUrl = body.FileUrl ?? existing.FileUrl;
        existing.FileName = body.FileName ?? existing.FileName;
        existing.FileSize = body.FileSize ?? existing.FileSize;

        var updated = await _cosmos.ReplaceAsync(Container, id, existing, new PartitionKey(existing.Year));
        return await OkJson(req, updated);
    }

    [Function("DeleteMinutes")]
    public async Task<HttpResponseData> Delete(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "minutes")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        if (!int.TryParse(req.Query["year"], out var year) || string.IsNullOrEmpty(id))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "id and year required");

        await _cosmos.DeleteAsync(Container, id, new PartitionKey(year));
        return await OkJson(req, new { success = true });
    }
}

public class OfficialsFunctions : FunctionBase
{
    private readonly CosmosService _cosmos;
    private const string Container = "officials";

    public OfficialsFunctions(CosmosService cosmos, ILogger<OfficialsFunctions> logger)
        : base(logger) => _cosmos = cosmos;

    [Function("GetOfficials")]
    public async Task<HttpResponseData> Get(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "officials")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!_cosmos.IsAvailable)
            return await OkJson(req, new ApiResponse<Official> { Items = DemoData.Officials });
        try
        {
            var items = await _cosmos.QueryAsync<Official>(Container, new QueryDefinition("SELECT * FROM c"));
            items = items.OrderBy(o => o.Order).ToList();
            return await OkJson(req, new ApiResponse<Official>
            {
                Items = items.Count > 0 ? items : DemoData.Officials
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetOfficials error: {msg}", ex.Message);
            return await OkJson(req, new ApiResponse<Official> { Items = DemoData.Officials });
        }
    }

    [Function("CreateOfficial")]
    public async Task<HttpResponseData> Post(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "officials")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var body = await ReadBodyAsync<Official>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.Name) || string.IsNullOrWhiteSpace(body.Title))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "name and title are required");

        var id = Guid.NewGuid().ToString();
        var item = new Official
        {
            Id = id,
            Name = body.Name.Trim(),
            Title = body.Title.Trim(),
            Bio = body.Bio?.Trim() ?? string.Empty,
            Email = body.Email?.Trim() ?? string.Empty,
            Phone = body.Phone?.Trim(),
            PhoneWork = body.PhoneWork?.Trim(),
            PhoneCell = body.PhoneCell?.Trim(),
            PhoneHome = body.PhoneHome?.Trim(),
            PhotoUrl = body.PhotoUrl,
            Committees = body.Committees,
            Department = body.Department?.Trim(),
            Order = body.Order,
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        var created = await _cosmos.CreateAsync(Container, item, new PartitionKey(id));
        return await CreatedJson(req, created);
    }

    [Function("UpdateOfficial")]
    public async Task<HttpResponseData> Put(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "officials")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        if (string.IsNullOrEmpty(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        var body = await ReadBodyAsync<Official>(req);
        if (body == null) return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid body");

        var existing = await _cosmos.ReadAsync<Official>(Container, id, new PartitionKey(id));
        if (existing == null) return await ErrorJson(req, HttpStatusCode.NotFound, "Not found");

        existing.Name = body.Name?.Trim() ?? existing.Name;
        existing.Title = body.Title?.Trim() ?? existing.Title;
        existing.Bio = body.Bio?.Trim() ?? existing.Bio;
        existing.Email = body.Email?.Trim() ?? existing.Email;
        existing.Phone = body.Phone?.Trim() ?? existing.Phone;
        existing.PhoneWork = body.PhoneWork?.Trim() ?? existing.PhoneWork;
        existing.PhoneCell = body.PhoneCell?.Trim() ?? existing.PhoneCell;
        existing.PhoneHome = body.PhoneHome?.Trim() ?? existing.PhoneHome;
        existing.PhotoUrl = body.PhotoUrl ?? existing.PhotoUrl;
        existing.Committees = body.Committees ?? existing.Committees;
        existing.Department = body.Department?.Trim() ?? existing.Department;
        existing.Order = body.Order;

        var updated = await _cosmos.ReplaceAsync(Container, id, existing, new PartitionKey(id));
        return await OkJson(req, updated);
    }

    [Function("DeleteOfficial")]
    public async Task<HttpResponseData> Delete(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "officials")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        if (string.IsNullOrEmpty(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        await _cosmos.DeleteAsync(Container, id, new PartitionKey(id));
        return await OkJson(req, new { success = true });
    }
}

public class OrdinancesFunctions : FunctionBase
{
    private readonly CosmosService _cosmos;
    private const string Container = "ordinances";
    private static readonly string[] ValidCategories = ["zoning", "general", "traffic", "health", "utilities", "police"];

    public OrdinancesFunctions(CosmosService cosmos, ILogger<OrdinancesFunctions> logger)
        : base(logger) => _cosmos = cosmos;

    [Function("GetOrdinances")]
    public async Task<HttpResponseData> Get(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "ordinances")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!_cosmos.IsAvailable)
            return await OkJson(req, new ApiResponse<Ordinance> { Items = DemoData.Ordinances });
        try
        {
            var category = req.Query["category"];
            QueryDefinition query;
            if (!string.IsNullOrEmpty(category) && ValidCategories.Contains(category))
                query = new QueryDefinition("SELECT * FROM c WHERE c.category = @cat")
                    .WithParameter("@cat", category);
            else
                query = new QueryDefinition("SELECT * FROM c");

            var items = await _cosmos.QueryAsync<Ordinance>(Container, query);
            var search = req.Query["search"]?.ToLower();
            if (!string.IsNullOrEmpty(search))
                items = items.Where(o =>
                    o.Title.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    o.Number.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    (o.Summary?.Contains(search, StringComparison.OrdinalIgnoreCase) ?? false)).ToList();

            items = items.OrderByDescending(o => o.Year).ThenByDescending(o => o.Number).ToList();
            return await OkJson(req, new ApiResponse<Ordinance> { Items = items });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetOrdinances error: {msg}", ex.Message);
            return await OkJson(req, new ApiResponse<Ordinance> { Items = DemoData.Ordinances });
        }
    }

    [Function("CreateOrdinance")]
    public async Task<HttpResponseData> Post(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "ordinances")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var body = await ReadBodyAsync<Ordinance>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.Number) ||
            string.IsNullOrWhiteSpace(body.Title) || string.IsNullOrWhiteSpace(body.Category))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "number, title, and category are required");

        var item = new Ordinance
        {
            Id = Guid.NewGuid().ToString(),
            Number = body.Number.Trim(),
            Title = body.Title.Trim(),
            Category = body.Category,
            Summary = body.Summary?.Trim(),
            FileUrl = body.FileUrl?.Trim(),
            Year = body.Year > 0 ? body.Year : DateTime.UtcNow.Year,
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        var created = await _cosmos.CreateAsync(Container, item, new PartitionKey(item.Category));
        return await CreatedJson(req, created);
    }

    [Function("UpdateOrdinance")]
    public async Task<HttpResponseData> Put(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "ordinances")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        if (string.IsNullOrEmpty(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        var body = await ReadBodyAsync<Ordinance>(req);
        if (body == null || string.IsNullOrEmpty(body.Category))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "category required in body");

        // Try to find the existing document — search all categories since it may have changed
        Ordinance? existing = null;
        foreach (var cat in ValidCategories)
        {
            existing = await _cosmos.ReadAsync<Ordinance>(Container, id, new PartitionKey(cat));
            if (existing != null) break;
        }

        if (existing == null) return await ErrorJson(req, HttpStatusCode.NotFound, "Not found");

        // If category changed, delete old and create new (Cosmos partition key is immutable)
        if (existing.Category != body.Category)
        {
            await _cosmos.DeleteAsync(Container, id, new PartitionKey(existing.Category));
            var newItem = new Ordinance
            {
                Id = id,
                Number = body.Number?.Trim() ?? existing.Number,
                Title = body.Title?.Trim() ?? existing.Title,
                Category = body.Category,
                Summary = body.Summary?.Trim(),
                FileUrl = body.FileUrl?.Trim() ?? existing.FileUrl,
                Year = body.Year > 0 ? body.Year : existing.Year,
                CreatedAt = existing.CreatedAt
            };
            var created = await _cosmos.CreateAsync(Container, newItem, new PartitionKey(newItem.Category));
            return await OkJson(req, created);
        }

        // Same category — just replace
        existing.Number = body.Number?.Trim() ?? existing.Number;
        existing.Title = body.Title?.Trim() ?? existing.Title;
        existing.Summary = body.Summary?.Trim();
        existing.FileUrl = body.FileUrl?.Trim() ?? existing.FileUrl;
        existing.Year = body.Year > 0 ? body.Year : existing.Year;

        var updated = await _cosmos.ReplaceAsync(Container, id, existing, new PartitionKey(existing.Category));
        return await OkJson(req, updated);
    }

    [Function("DeleteOrdinance")]
    public async Task<HttpResponseData> Delete(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "ordinances")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        var category = req.Query["category"];
        if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(category))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "id and category required");

        await _cosmos.DeleteAsync(Container, id, new PartitionKey(category));
        return await OkJson(req, new { success = true });
    }
}
