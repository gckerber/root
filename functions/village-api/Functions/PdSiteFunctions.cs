// Functions/PdSiteFunctions.cs
using System.Net;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using SaintLouisvilleApi.Models;
using SaintLouisvilleApi.Services;

namespace SaintLouisvilleApi.Functions;

public class PdSiteFunctions : FunctionBase
{
    private readonly CosmosService _cosmos;
    private readonly StorageService _storage;

    public PdSiteFunctions(CosmosService cosmos, StorageService storage, ILogger<PdSiteFunctions> logger)
        : base(logger)
    {
        _cosmos = cosmos;
        _storage = storage;
    }

    private Container CourtSchedule() => _cosmos.GetContainer("pddb", "courtSchedule");
    private Container PdImages() => _cosmos.GetContainer("pddb", "pdImages");
    private Container PdSettings() => _cosmos.GetContainer("pddb", "pdSettings");
    private Container PdFaq() => _cosmos.GetContainer("pddb", "pdFaq");

    // ═══════════════════════════════════════════════════════════════
    // COURT SCHEDULE
    // ═══════════════════════════════════════════════════════════════

    // ── GET /api/pd-court-schedule (public) ───────────────────────
    [Function("GetPdCourtSchedule")]
    public async Task<HttpResponseData> GetCourtSchedule(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "pd-court-schedule")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var qs = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var upcoming = qs["upcoming"] == "true";

        QueryDefinition query;
        if (upcoming)
        {
            var now = DateTime.UtcNow.ToString("o");
            query = new QueryDefinition(
                "SELECT * FROM c WHERE c.date >= @now ORDER BY c.date ASC")
                .WithParameter("@now", now);
        }
        else
        {
            query = new QueryDefinition("SELECT * FROM c ORDER BY c.date ASC");
        }

        var container = CourtSchedule();
        var items = new List<PdCourtDate>();
        using var feed = container.GetItemQueryIterator<PdCourtDate>(query);
        while (feed.HasMoreResults)
        {
            var batch = await feed.ReadNextAsync();
            items.AddRange(batch);
        }

        return await OkJson(req, new { items, total = items.Count });
    }

    // ── POST /api/pd-court-schedule (admin) ───────────────────────
    [Function("CreatePdCourtDate")]
    public async Task<HttpResponseData> CreateCourtDate(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "pd-court-schedule")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var body = await ReadBodyAsync<PdCourtDate>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.Date))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "date is required");

        body.Id = Guid.NewGuid().ToString();
        body.Year = DateTime.Parse(body.Date).Year;
        if (string.IsNullOrWhiteSpace(body.Location)) body.Location = "Village Hall — Council Chambers";
        if (string.IsNullOrWhiteSpace(body.Judge)) body.Judge = "Mayor Zack Allen";
        body.CreatedAt = DateTime.UtcNow.ToString("o");

        var container = CourtSchedule();
        var res = await container.CreateItemAsync(body, new PartitionKey((double)body.Year));
        return await CreatedJson(req, res.Resource);
    }

    // ── PUT /api/pd-court-schedule?id= (admin) ────────────────────
    [Function("UpdatePdCourtDate")]
    public async Task<HttpResponseData> UpdateCourtDate(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "pd-court-schedule")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var qs = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var id = qs["id"];
        if (string.IsNullOrWhiteSpace(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        var body = await ReadBodyAsync<PdCourtDate>(req);
        if (body == null) return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid body");
        if (body.Year == 0) return await ErrorJson(req, HttpStatusCode.BadRequest, "year is required in body");

        body.Id = id;

        var container = CourtSchedule();
        var res = await container.ReplaceItemAsync(body, id, new PartitionKey((double)body.Year));
        return await OkJson(req, res.Resource);
    }

    // ── DELETE /api/pd-court-schedule?id=&year= (admin) ──────────
    [Function("DeletePdCourtDate")]
    public async Task<HttpResponseData> DeleteCourtDate(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "pd-court-schedule")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var qs = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var id = qs["id"];
        var yearStr = qs["year"];
        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(yearStr))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "id and year are required");

        if (!int.TryParse(yearStr, out var year))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "year must be an integer");

        var container = CourtSchedule();
        await container.DeleteItemAsync<PdCourtDate>(id, new PartitionKey((double)year));
        return await OkJson(req, new { success = true });
    }

    // ═══════════════════════════════════════════════════════════════
    // PD IMAGES
    // ═══════════════════════════════════════════════════════════════

    // ── GET /api/pd-images (public) ───────────────────────────────
    [Function("GetPdImages")]
    public async Task<HttpResponseData> GetPdImages(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "pd-images")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var container = PdImages();
        var query = new QueryDefinition("SELECT * FROM c ORDER BY c.order ASC");
        var items = new List<PdImage>();
        using var feed = container.GetItemQueryIterator<PdImage>(query,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey("image") });
        while (feed.HasMoreResults)
        {
            var batch = await feed.ReadNextAsync();
            items.AddRange(batch);
        }

        return await OkJson(req, new { items, total = items.Count });
    }

    // ── POST /api/pd-images (admin) ───────────────────────────────
    [Function("CreatePdImage")]
    public async Task<HttpResponseData> CreatePdImage(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "pd-images")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var body = await ReadBodyAsync<PdImage>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.Url))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "url is required");

        body.Id = Guid.NewGuid().ToString();
        body.Type = "image";

        var container = PdImages();
        var res = await container.CreateItemAsync(body, new PartitionKey(body.Type));
        return await CreatedJson(req, res.Resource);
    }

    // ── PUT /api/pd-images?id= (admin) ────────────────────────────
    [Function("UpdatePdImage")]
    public async Task<HttpResponseData> UpdatePdImage(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "pd-images")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var qs = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var id = qs["id"];
        if (string.IsNullOrWhiteSpace(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        var body = await ReadBodyAsync<PdImage>(req);
        if (body == null) return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid body");

        body.Id = id;
        body.Type = "image";

        var container = PdImages();
        var res = await container.ReplaceItemAsync(body, id, new PartitionKey(body.Type));
        return await OkJson(req, res.Resource);
    }

    // ── DELETE /api/pd-images?id= (admin) ─────────────────────────
    [Function("DeletePdImage")]
    public async Task<HttpResponseData> DeletePdImage(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "pd-images")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var qs = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var id = qs["id"];
        if (string.IsNullOrWhiteSpace(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        var container = PdImages();
        await container.DeleteItemAsync<PdImage>(id, new PartitionKey("image"));
        return await OkJson(req, new { success = true });
    }

    // ═══════════════════════════════════════════════════════════════
    // PD UPLOAD URL
    // ═══════════════════════════════════════════════════════════════

    // ── POST /api/pd-upload-url (admin) ───────────────────────────
    [Function("PdUploadUrl")]
    public async Task<HttpResponseData> PdUploadUrl(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options", Route = "pd-upload-url")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_storage.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Storage unavailable");

        var body = await ReadBodyAsync<UploadUrlRequest>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.Filename))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "filename is required");

        var (uploadUrl, publicUrl, _) = await _storage.GenerateSasUploadUrlAsync(
            "pd-hero", body.Filename, body.ContentType);

        return await OkJson(req, new { uploadUrl, publicUrl });
    }

    // ═══════════════════════════════════════════════════════════════
    // PD CONTACT
    // ═══════════════════════════════════════════════════════════════

    // ── GET /api/pd-contact (public) ──────────────────────────────
    [Function("GetPdContact")]
    public async Task<HttpResponseData> GetPdContact(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "pd-contact")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var container = PdSettings();
        try
        {
            var res = await container.ReadItemAsync<PdContact>("contact", new PartitionKey("config"));
            return await OkJson(req, res.Resource);
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            // Return defaults
            return await OkJson(req, new PdContact());
        }
    }

    // ── PUT /api/pd-contact (admin) ───────────────────────────────
    [Function("UpsertPdContact")]
    public async Task<HttpResponseData> UpsertPdContact(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "pd-contact")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var body = await ReadBodyAsync<PdContact>(req);
        if (body == null) return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid body");

        body.Id = "contact";
        body.Type = "config";

        var container = PdSettings();
        var res = await container.UpsertItemAsync(body, new PartitionKey(body.Type));
        return await OkJson(req, res.Resource);
    }

    // ═══════════════════════════════════════════════════════════════
    // PD FAQ
    // ═══════════════════════════════════════════════════════════════

    // ── GET /api/pd-faq (public) ──────────────────────────────────
    [Function("GetPdFaq")]
    public async Task<HttpResponseData> GetPdFaq(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "pd-faq")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var container = PdFaq();
        var query = new QueryDefinition("SELECT * FROM c ORDER BY c.order ASC");
        var items = new List<PdFaqItem>();
        using var feed = container.GetItemQueryIterator<PdFaqItem>(query,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey("faq") });
        while (feed.HasMoreResults)
        {
            var batch = await feed.ReadNextAsync();
            items.AddRange(batch);
        }

        return await OkJson(req, new { items, total = items.Count });
    }

    // ── POST /api/pd-faq (admin) ──────────────────────────────────
    [Function("CreatePdFaqItem")]
    public async Task<HttpResponseData> CreatePdFaqItem(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "pd-faq")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var body = await ReadBodyAsync<PdFaqItem>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.Question) || string.IsNullOrWhiteSpace(body.Answer))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "question and answer are required");

        body.Id = Guid.NewGuid().ToString();
        body.Type = "faq";

        var container = PdFaq();
        var res = await container.CreateItemAsync(body, new PartitionKey(body.Type));
        return await CreatedJson(req, res.Resource);
    }

    // ── PUT /api/pd-faq?id= (admin) ───────────────────────────────
    [Function("UpdatePdFaqItem")]
    public async Task<HttpResponseData> UpdatePdFaqItem(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "pd-faq")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var qs = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var id = qs["id"];
        if (string.IsNullOrWhiteSpace(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        var body = await ReadBodyAsync<PdFaqItem>(req);
        if (body == null) return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid body");

        body.Id = id;
        body.Type = "faq";

        var container = PdFaq();
        var res = await container.ReplaceItemAsync(body, id, new PartitionKey(body.Type));
        return await OkJson(req, res.Resource);
    }

    // ── DELETE /api/pd-faq?id= (admin) ────────────────────────────
    [Function("DeletePdFaqItem")]
    public async Task<HttpResponseData> DeletePdFaqItem(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "pd-faq")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var qs = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var id = qs["id"];
        if (string.IsNullOrWhiteSpace(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        var container = PdFaq();
        await container.DeleteItemAsync<PdFaqItem>(id, new PartitionKey("faq"));
        return await OkJson(req, new { success = true });
    }
}
