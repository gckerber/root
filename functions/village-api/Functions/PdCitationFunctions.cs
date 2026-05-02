// Functions/PdCitationFunctions.cs
using System.Collections.Concurrent;
using System.Net;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using SaintLouisvilleApi.Models;
using SaintLouisvilleApi.Services;

namespace SaintLouisvilleApi.Functions;

public class PdCitationFunctions : FunctionBase
{
    private readonly CosmosService _cosmos;
    private static readonly string[] Statuses = ["unpaid", "paid", "court", "dismissed"];

    // Rate limiting: IP -> list of request timestamps
    private static readonly ConcurrentDictionary<string, List<DateTimeOffset>> _rateLimitMap = new();
    private const int RateLimit = 10;
    private static readonly TimeSpan RateWindow = TimeSpan.FromMinutes(15);

    public PdCitationFunctions(CosmosService cosmos, ILogger<PdCitationFunctions> logger)
        : base(logger)
    {
        _cosmos = cosmos;
    }

    private Container Citations() => _cosmos.GetContainer("pddb", "citations");

    // ── GET /api/pd-citations (admin) ─────────────────────────────────────────
    [Function("GetPdCitations")]
    public async Task<HttpResponseData> GetCitations(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "pd-citations")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var qs = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var status = qs["status"];
        var search = qs["search"];

        var container = Citations();
        var items = new List<Citation>();

        if (!string.IsNullOrWhiteSpace(status) && Statuses.Contains(status))
        {
            // Single-partition query
            var query = new QueryDefinition("SELECT * FROM c WHERE c.status = @status")
                .WithParameter("@status", status);
            var options = new QueryRequestOptions { PartitionKey = new PartitionKey(status) };
            using var feed = container.GetItemQueryIterator<Citation>(query, requestOptions: options);
            while (feed.HasMoreResults)
            {
                var batch = await feed.ReadNextAsync();
                items.AddRange(batch);
            }
        }
        else
        {
            // Cross-partition query
            var query = new QueryDefinition("SELECT * FROM c ORDER BY c.createdAt DESC");
            using var feed = container.GetItemQueryIterator<Citation>(query);
            while (feed.HasMoreResults)
            {
                var batch = await feed.ReadNextAsync();
                items.AddRange(batch);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLowerInvariant();
            items = items.Where(c =>
                (c.CitationNumber?.ToLowerInvariant().Contains(s) ?? false) ||
                (c.LastName?.ToLowerInvariant().Contains(s) ?? false) ||
                (c.FirstName?.ToLowerInvariant().Contains(s) ?? false)
            ).ToList();
        }

        return await OkJson(req, new { items, total = items.Count });
    }

    // ── POST /api/pd-citations (admin) ────────────────────────────────────────
    [Function("CreatePdCitation")]
    public async Task<HttpResponseData> CreateCitation(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "pd-citations")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var body = await ReadBodyAsync<Citation>(req);
        if (body == null) return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid body");

        body.Id = Guid.NewGuid().ToString();
        body.Status = "unpaid";
        body.Balance = body.FineAmount;
        body.CreatedAt = DateTime.UtcNow.ToString("o");

        var container = Citations();
        var res = await container.CreateItemAsync(body, new PartitionKey(body.Status));
        return await CreatedJson(req, res.Resource);
    }

    // ── PUT /api/pd-citations?id= (admin) ─────────────────────────────────────
    [Function("UpdatePdCitation")]
    public async Task<HttpResponseData> UpdateCitation(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "pd-citations")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var qs = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var id = qs["id"];
        if (string.IsNullOrWhiteSpace(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        var body = await ReadBodyAsync<Citation>(req);
        if (body == null) return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid body");

        var container = Citations();

        // Find the existing citation across all partitions to detect status change
        Citation? existing = null;
        foreach (var s in Statuses)
        {
            try
            {
                var r = await container.ReadItemAsync<Citation>(id, new PartitionKey(s));
                existing = r.Resource;
                break;
            }
            catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound) { }
        }

        if (existing == null) return await ErrorJson(req, HttpStatusCode.NotFound, "Citation not found");

        body.Id = id;
        body.CreatedAt = existing.CreatedAt;

        if (existing.Status != body.Status)
        {
            // Delete from old partition, create in new partition
            await container.DeleteItemAsync<Citation>(id, new PartitionKey(existing.Status));
            var created = await container.CreateItemAsync(body, new PartitionKey(body.Status));
            return await OkJson(req, created.Resource);
        }
        else
        {
            var replaced = await container.ReplaceItemAsync(body, id, new PartitionKey(body.Status));
            return await OkJson(req, replaced.Resource);
        }
    }

    // ── DELETE /api/pd-citations?id=&status= (admin) ─────────────────────────
    [Function("DeletePdCitation")]
    public async Task<HttpResponseData> DeleteCitation(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "pd-citations")] HttpRequestData req)
    {
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var qs = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var id = qs["id"];
        var status = qs["status"];
        if (string.IsNullOrWhiteSpace(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");

        var container = Citations();

        if (!string.IsNullOrWhiteSpace(status))
        {
            await container.DeleteItemAsync<Citation>(id, new PartitionKey(status));
        }
        else
        {
            // Search all partitions
            bool found = false;
            foreach (var s in Statuses)
            {
                try
                {
                    await container.DeleteItemAsync<Citation>(id, new PartitionKey(s));
                    found = true;
                    break;
                }
                catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound) { }
            }
            if (!found) return await ErrorJson(req, HttpStatusCode.NotFound, "Citation not found");
        }

        return await OkJson(req, new { success = true });
    }

    // ── POST /api/pd-fine-lookup (public) ─────────────────────────────────────
    [Function("PdFineLookup")]
    public async Task<HttpResponseData> FineLookup(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options", Route = "pd-fine-lookup")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);

        // Rate limiting by IP
        var ip = req.Headers.TryGetValues("x-forwarded-for", out var fwdVals)
            ? fwdVals.FirstOrDefault()?.Split(',')[0].Trim() ?? "unknown"
            : "unknown";

        var now = DateTimeOffset.UtcNow;
        var timestamps = _rateLimitMap.GetOrAdd(ip, _ => new List<DateTimeOffset>());
        lock (timestamps)
        {
            timestamps.RemoveAll(t => now - t > RateWindow);
            if (timestamps.Count >= RateLimit)
                return ErrorJson(req, HttpStatusCode.TooManyRequests, "Too many requests. Please wait before trying again.").GetAwaiter().GetResult();
            timestamps.Add(now);
        }

        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var body = await ReadBodyAsync<FineLookupRequest>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.CitationNumber) || string.IsNullOrWhiteSpace(body.LastName))
            return await ErrorJson(req, HttpStatusCode.BadRequest, "citationNumber and lastName are required");

        var container = Citations();
        Citation? found = null;

        // Search all partitions
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE c.citationNumber = @num AND LOWER(c.lastName) = @ln")
            .WithParameter("@num", body.CitationNumber.Trim().ToUpperInvariant())
            .WithParameter("@ln", body.LastName.Trim().ToLowerInvariant());

        using var feed = container.GetItemQueryIterator<Citation>(query);
        while (feed.HasMoreResults && found == null)
        {
            var batch = await feed.ReadNextAsync();
            found = batch.FirstOrDefault();
        }

        if (found == null) return await ErrorJson(req, HttpStatusCode.NotFound, "Citation not found. Please check your citation number and last name.");
        if (found.Status == "dismissed") return await ErrorJson(req, HttpStatusCode.BadRequest, "This citation has been dismissed. No payment is required.");

        // Return sanitized citation (no dob, notes, officer)
        return await OkJson(req, new
        {
            id = found.Id,
            citationNumber = found.CitationNumber,
            firstName = found.FirstName,
            lastName = found.LastName,
            address = found.Address,
            vehicleInfo = found.VehicleInfo,
            violationDate = found.ViolationDate,
            violationType = found.ViolationType,
            violationDescription = found.ViolationDescription,
            fineAmount = found.FineAmount,
            balance = found.Balance,
            status = found.Status,
            courtDate = found.CourtDate,
        });
    }

    // ── POST /api/pd-fine-payment (public) ────────────────────────────────────
    [Function("PdFinePayment")]
    public async Task<HttpResponseData> FinePayment(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options", Route = "pd-fine-payment")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database unavailable");

        var body = await ReadBodyAsync<FinePaymentRequest>(req);
        if (body == null || string.IsNullOrWhiteSpace(body.CitationId) || body.Amount <= 0)
            return await ErrorJson(req, HttpStatusCode.BadRequest, "citationId and amount are required");

        var container = Citations();

        // Find citation across all partitions
        Citation? citation = null;
        foreach (var s in Statuses)
        {
            try
            {
                var r = await container.ReadItemAsync<Citation>(body.CitationId, new PartitionKey(s));
                citation = r.Resource;
                break;
            }
            catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound) { }
        }

        if (citation == null) return await ErrorJson(req, HttpStatusCode.NotFound, "Citation not found");
        if (citation.Status == "paid") return await ErrorJson(req, HttpStatusCode.BadRequest, "Citation has already been paid");
        if (citation.Status == "dismissed") return await ErrorJson(req, HttpStatusCode.BadRequest, "Citation has been dismissed");

        var confirmationNumber = $"CONF-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpperInvariant()}";

        // TODO: Integrate Stripe/PaySimple payment processing here

        var oldStatus = citation.Status;
        citation.Balance = Math.Max(0, citation.Balance - body.Amount);
        if (citation.Balance == 0)
            citation.Status = "paid";

        if (citation.Status != oldStatus)
        {
            // Delete from old partition, recreate in new partition
            await container.DeleteItemAsync<Citation>(citation.Id, new PartitionKey(oldStatus));
            await container.CreateItemAsync(citation, new PartitionKey(citation.Status));
        }
        else
        {
            await container.ReplaceItemAsync(citation, citation.Id, new PartitionKey(citation.Status));
        }

        return await OkJson(req, new
        {
            success = true,
            confirmationNumber,
            balance = citation.Balance,
            status = citation.Status,
            citationNumber = citation.CitationNumber,
            amountPaid = body.Amount,
        });
    }
}
