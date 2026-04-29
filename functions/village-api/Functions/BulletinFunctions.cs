// Functions/BulletinFunctions.cs
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using SaintLouisvilleApi.Models;
using SaintLouisvilleApi.Services;
using System.Net;

namespace SaintLouisvilleApi.Functions;

public class BulletinFunctions : FunctionBase
{
    private readonly CosmosService _cosmos;
    private static readonly string[] ValidCategories = ["notice", "event", "urgent", "general"];
    private const string Container = "bulletins";

    public BulletinFunctions(CosmosService cosmos, ILogger<BulletinFunctions> logger)
        : base(logger) => _cosmos = cosmos;

    [Function("GetBulletins")]
    public async Task<HttpResponseData> Get(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "bulletin")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!_cosmos.IsAvailable)
            return await OkJson(req, new ApiResponse<Bulletin> { Items = DemoData.Bulletins });
        try
        {
            var category = req.Query["category"];
            var search = req.Query["search"]?.ToLower();
            var limit = int.TryParse(req.Query["limit"], out var l) ? Math.Min(l, 50) : 20;

            QueryDefinition query;
            if (!string.IsNullOrEmpty(category) && ValidCategories.Contains(category))
                query = new QueryDefinition("SELECT * FROM c WHERE c.category = @cat")
                    .WithParameter("@cat", category);
            else
                query = new QueryDefinition("SELECT * FROM c");

            var items = await _cosmos.QueryAsync<Bulletin>(Container, query);

            if (!string.IsNullOrEmpty(search))
                items = items.Where(b =>
                    b.Title.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    b.Body.Contains(search, StringComparison.OrdinalIgnoreCase)).ToList();

            items = items
                .OrderByDescending(b => b.Pinned)
                .ThenByDescending(b => b.Date)
                .Take(limit)
                .ToList();

            return await OkJson(req, new ApiResponse<Bulletin> { Items = items });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetBulletins error: {msg}", ex.Message);
            return await OkJson(req, new ApiResponse<Bulletin> { Items = DemoData.Bulletins });
        }
    }

    [Function("CreateBulletin")]
    public async Task<HttpResponseData> Post(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "bulletin")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var body = await ReadBodyAsync<Bulletin>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.Title) || string.IsNullOrWhiteSpace(body.Body))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "title and body are required");

        var category = ValidCategories.Contains(body.Category) ? body.Category : "notice";
        var item = new Bulletin
        {
            Id = Guid.NewGuid().ToString(),
            Title = body.Title.Trim()[..Math.Min(body.Title.Length, 200)],
            Body = body.Body.Trim()[..Math.Min(body.Body.Length, 5000)],
            Category = category,
            Pinned = body.Pinned,
            Link = body.Link?.Trim(),
            Date = DateTime.UtcNow.ToString("o"),
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        var created = await _cosmos.CreateAsync(Container, item, new PartitionKey(category));
        return await CreatedJson(req, created);
    }

    [Function("UpdateBulletin")]
    public async Task<HttpResponseData> Put(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "bulletin")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        if (string.IsNullOrEmpty(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        var body = await ReadBodyAsync<Bulletin>(req);
        if (body == null || string.IsNullOrEmpty(body.Category))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "category required in body");

        var newCategory = ValidCategories.Contains(body.Category) ? body.Category : "notice";

        // Find existing document — search all categories since category may have changed
        Bulletin? existing = null;
        foreach (var cat in ValidCategories)
        {
            existing = await _cosmos.ReadAsync<Bulletin>(Container, id, new PartitionKey(cat));
            if (existing != null) break;
        }

        if (existing == null) return await ErrorJson(req, HttpStatusCode.NotFound, "Not found");

        // If category changed, delete old and create new (partition key is immutable in Cosmos)
        if (existing.Category != newCategory)
        {
            await _cosmos.DeleteAsync(Container, id, new PartitionKey(existing.Category));
            var newItem = new Bulletin
            {
                Id = id,
                Title = body.Title?.Trim() ?? existing.Title,
                Body = body.Body?.Trim() ?? existing.Body,
                Category = newCategory,
                Pinned = body.Pinned,
                Link = body.Link?.Trim(),
                Date = existing.Date,
                CreatedAt = existing.CreatedAt
            };
            var created = await _cosmos.CreateAsync(Container, newItem, new PartitionKey(newCategory));
            return await OkJson(req, created);
        }

        // Same category — just replace
        existing.Title = body.Title?.Trim() ?? existing.Title;
        existing.Body = body.Body?.Trim() ?? existing.Body;
        existing.Pinned = body.Pinned;
        existing.Link = body.Link?.Trim();

        var updated = await _cosmos.ReplaceAsync(Container, id, existing, new PartitionKey(existing.Category));
        return await OkJson(req, updated);
    }

    [Function("DeleteBulletin")]
    public async Task<HttpResponseData> Delete(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "bulletin")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var id = req.Query["id"];
        var category = req.Query["category"];

        // If no category provided, search all partitions
        if (string.IsNullOrEmpty(category))
        {
            foreach (var cat in ValidCategories)
            {
                var item = await _cosmos.ReadAsync<Bulletin>(Container, id, new PartitionKey(cat));
                if (item != null)
                {
                    await _cosmos.DeleteAsync(Container, id, new PartitionKey(cat));
                    return await OkJson(req, new { success = true });
                }
            }
            return await ErrorJson(req, HttpStatusCode.NotFound, "Not found");
        }

        await _cosmos.DeleteAsync(Container, id, new PartitionKey(category));
        return await OkJson(req, new { success = true });
    }
}
