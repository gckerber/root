// Functions/VillageSiteFunctions.cs
// Village homepage carousel images — GET public, POST/PUT/DELETE admin
using System.Net;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using SaintLouisvilleApi.Models;
using SaintLouisvilleApi.Services;

namespace SaintLouisvilleApi.Functions;

public class VillageSiteFunctions : FunctionBase
{
    private readonly CosmosService _cosmos;

    public VillageSiteFunctions(CosmosService cosmos, ILogger<VillageSiteFunctions> logger)
        : base(logger) => _cosmos = cosmos;

    private Container Images() => _cosmos.GetContainer("villageImages");

    // ── GET /api/village-images (public) ──────────────────────────
    [Function("GetVillageImages")]
    public async Task<HttpResponseData> GetImages(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "village-images")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!_cosmos.IsAvailable) return await OkJson(req, new { items = Array.Empty<VillageImage>(), total = 0 });

        try
        {
            var query = new QueryDefinition("SELECT * FROM c ORDER BY c['order'] ASC");
            var items = new List<VillageImage>();
            using var feed = Images().GetItemQueryIterator<VillageImage>(query);
            while (feed.HasMoreResults)
            {
                var batch = await feed.ReadNextAsync();
                items.AddRange(batch);
            }
            return await OkJson(req, new { items, total = items.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetVillageImages error: {msg}", ex.Message);
            return await OkJson(req, new { items = Array.Empty<VillageImage>(), total = 0 });
        }
    }

    // ── POST /api/village-images (admin) ──────────────────────────
    [Function("CreateVillageImage")]
    public async Task<HttpResponseData> CreateImage(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "village-images")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        try
        {
            var body = await ReadBodyAsync<VillageImage>(req);
            if (body == null || string.IsNullOrWhiteSpace(body.Url))
                return await ErrorJson(req, HttpStatusCode.BadRequest, "url is required");

            body.Id = Guid.NewGuid().ToString();
            body.Type = "image";

            var res = await Images().CreateItemAsync(body, new PartitionKey(body.Type));
            return await CreatedJson(req, res.Resource);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CreateVillageImage error: {msg}", ex.Message);
            return await ErrorJson(req, HttpStatusCode.InternalServerError, ex.Message);
        }
    }

    // ── PUT /api/village-images?id= (admin) ───────────────────────
    [Function("UpdateVillageImage")]
    public async Task<HttpResponseData> UpdateImage(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "village-images")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        try
        {
            var qs = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
            var id = qs["id"];
            if (string.IsNullOrWhiteSpace(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

            var body = await ReadBodyAsync<VillageImage>(req);
            if (body == null) return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid body");

            body.Id = id;
            body.Type = "image";

            try
            {
                var res = await Images().ReplaceItemAsync(body, id, new PartitionKey(body.Type));
                return await OkJson(req, res.Resource);
            }
            catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                var res = await Images().UpsertItemAsync(body, new PartitionKey("image"));
                return await OkJson(req, res.Resource);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UpdateVillageImage error: {msg}", ex.Message);
            return await ErrorJson(req, HttpStatusCode.InternalServerError, ex.Message);
        }
    }

    // ── DELETE /api/village-images?id= (admin) ────────────────────
    [Function("DeleteVillageImage")]
    public async Task<HttpResponseData> DeleteImage(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "village-images")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        try
        {
            var qs = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
            var id = qs["id"];
            if (string.IsNullOrWhiteSpace(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

            try
            {
                await Images().DeleteItemAsync<VillageImage>(id, new PartitionKey("image"));
            }
            catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                // Already gone — that's fine
            }
            return await OkJson(req, new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DeleteVillageImage error: {msg}", ex.Message);
            return await ErrorJson(req, HttpStatusCode.InternalServerError, ex.Message);
        }
    }
}
