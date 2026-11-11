// Functions/SurveyFunctions.cs
// Community survey: public submit (saved to Cosmos, then emailed), admin results + delete.
using System.Collections.Concurrent;
using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using SaintLouisvilleApi.Models;
using SaintLouisvilleApi.Services;

namespace SaintLouisvilleApi.Functions;

public class SurveyFunctions : FunctionBase
{
    private readonly CosmosService _cosmos;
    private readonly SurveyMailer _mailer;

    private const string Container = "surveyResponses";
    // Bump this (and the matching id in the village site) to start a new survey without mixing results.
    public const string CurrentSurveyId = "community-2026";

    private const int MaxBodyChars = 200_000;
    private const int MaxAnswers = 60;
    private const int MaxTotalChars = 40_000;
    private const int MaxPerWindow = 6;
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(10);
    private static readonly HashSet<string> Types = new() { "single", "multi", "grid", "scale", "text" };
    private static readonly ConcurrentDictionary<string, Queue<DateTime>> Hits = new();
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public SurveyFunctions(CosmosService cosmos, SurveyMailer mailer, ILogger<SurveyFunctions> logger)
        : base(logger)
    {
        _cosmos = cosmos;
        _mailer = mailer;
    }

    [Function("SubmitSurvey")]
    public async Task<HttpResponseData> Submit(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options", Route = "survey")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!_cosmos.IsAvailable)
            return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "The survey is temporarily unavailable. Please try again later.");

        string? raw;
        using (var reader = new StreamReader(req.Body))
        {
            var buf = new char[MaxBodyChars + 1];
            var n = await reader.ReadBlockAsync(buf, 0, buf.Length);
            raw = n > MaxBodyChars ? null : new string(buf, 0, n);
        }
        if (raw == null) return await ErrorJson(req, HttpStatusCode.RequestEntityTooLarge, "That submission is too large.");

        SurveySubmission? sub;
        try { sub = JsonSerializer.Deserialize<SurveySubmission>(raw, JsonOpts); }
        catch { sub = null; }
        if (sub == null) return await ErrorJson(req, HttpStatusCode.BadRequest, "Invalid submission.");

        // Honeypot: a bot filled the hidden field. Pretend success and store nothing.
        if (!string.IsNullOrWhiteSpace(sub.Website)) return await OkJson(req, new { success = true });

        if (sub.SurveyId != CurrentSurveyId)
            return await ErrorJson(req, HttpStatusCode.BadRequest, "This survey is no longer accepting responses.");
        if (sub.Version != "full" && sub.Version != "quick")
            return await ErrorJson(req, HttpStatusCode.BadRequest, "Unknown survey version.");
        if (RateLimited(ClientKey(req)))
            return await ErrorJson(req, HttpStatusCode.TooManyRequests, "Too many submissions from this connection. Please wait a few minutes and try again.");

        var answers = Sanitize(sub.Answers);
        if (answers == null)
            return await ErrorJson(req, HttpStatusCode.BadRequest, "That submission was too large.");
        if (answers.Count == 0)
            return await ErrorJson(req, HttpStatusCode.BadRequest, "Please answer at least one question before submitting.");

        var item = new SurveyResponse
        {
            Id = Guid.NewGuid().ToString(),
            SurveyId = CurrentSurveyId,
            Version = sub.Version,
            Answers = answers,
            CreatedAt = DateTime.UtcNow.ToString("o"),
        };

        await _cosmos.CreateAsync(Container, item, new PartitionKey(item.SurveyId));

        // Email right away while there is room under the sender's rate limit; anything else goes out in the hourly digest.
        var emailed = false;
        if (TryTakeInstantEmailSlot() && await _mailer.SendResponseAsync(item))
        {
            emailed = true;
            await MarkEmailedAsync(item);
        }
        _logger.LogInformation("Survey response {id} ({ver}) saved; emailed={emailed}", item.Id, item.Version, emailed);

        return await CreatedJson(req, new { success = true, id = item.Id });
    }

    [Function("GetSurveyResponses")]
    public async Task<HttpResponseData> GetAll(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "delete", "options", Route = "survey-responses")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS") return Cors(req);
        if (!IsAdmin(req)) return await ErrorJson(req, HttpStatusCode.Unauthorized, "Unauthorized");
        if (!_cosmos.IsAvailable) return await ErrorJson(req, HttpStatusCode.ServiceUnavailable, "Database not available");

        var surveyId = string.IsNullOrWhiteSpace(req.Query["surveyId"]) ? CurrentSurveyId : req.Query["surveyId"]!;

        if (req.Method == "DELETE")
        {
            var id = req.Query["id"];
            if (string.IsNullOrWhiteSpace(id)) return await ErrorJson(req, HttpStatusCode.BadRequest, "id required");
            try { await _cosmos.DeleteAsync(Container, id, new PartitionKey(surveyId)); }
            catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound) { /* already gone */ }
            return await OkJson(req, new { success = true });
        }

        var items = await _cosmos.QueryAsync<SurveyResponse>(Container,
            new QueryDefinition("SELECT * FROM c WHERE c.surveyId = @sid ORDER BY c.createdAt DESC")
                .WithParameter("@sid", surveyId));
        return await OkJson(req, new { items, total = items.Count, mailConfigured = _mailer.IsConfigured });
    }

    // Runs at 5 minutes past every hour: emails anything that has not been emailed yet, in one message.
    [Function("SurveyDigest")]
    public async Task Digest([TimerTrigger("0 5 * * * *")] TimerInfo timer)
    {
        if (!_cosmos.IsAvailable || !_mailer.IsConfigured) return;

        var pending = await _cosmos.QueryAsync<SurveyResponse>(Container,
            new QueryDefinition("SELECT * FROM c WHERE c.surveyId = @sid AND (NOT IS_DEFINED(c.emailedAt) OR IS_NULL(c.emailedAt)) ORDER BY c.createdAt ASC")
                .WithParameter("@sid", CurrentSurveyId));
        if (pending.Count == 0) return;

        var batch = pending.Take(25).ToList();
        if (!await _mailer.SendDigestAsync(batch, pending.Count))
        {
            _logger.LogWarning("Survey digest could not be sent; {n} responses still waiting", pending.Count);
            return;
        }
        foreach (var r in batch) await MarkEmailedAsync(r);
        _logger.LogInformation("Survey digest sent with {n} responses ({left} still waiting)", batch.Count, pending.Count - batch.Count);
    }

    private async Task MarkEmailedAsync(SurveyResponse r)
    {
        try
        {
            r.EmailedAt = DateTime.UtcNow.ToString("o");
            await _cosmos.ReplaceAsync(Container, r.Id, r, new PartitionKey(r.SurveyId));
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Could not mark survey response {id} as emailed", r.Id); }
    }

    // The free sender domain allows 10 emails an hour; keep most of that in reserve for the digest.
    private static readonly Queue<DateTime> InstantSends = new();
    private const int MaxInstantPerHour = 4;
    private static bool TryTakeInstantEmailSlot()
    {
        lock (InstantSends)
        {
            var now = DateTime.UtcNow;
            while (InstantSends.Count > 0 && now - InstantSends.Peek() > TimeSpan.FromHours(1)) InstantSends.Dequeue();
            if (InstantSends.Count >= MaxInstantPerHour) return false;
            InstantSends.Enqueue(now);
            return true;
        }
    }
    // ── helpers ──────────────────────────────────────────────────────────────

    private static string ClientKey(HttpRequestData req)
    {
        if (req.Headers.TryGetValues("X-Forwarded-For", out var v))
        {
            var first = v.FirstOrDefault()?.Split(',')[0].Trim();
            if (!string.IsNullOrEmpty(first)) return first.Split(':')[0];
        }
        return "unknown";
    }

    private static bool RateLimited(string key)
    {
        if (Hits.Count > 5000) Hits.Clear();
        var q = Hits.GetOrAdd(key, _ => new Queue<DateTime>());
        lock (q)
        {
            var now = DateTime.UtcNow;
            while (q.Count > 0 && now - q.Peek() > Window) q.Dequeue();
            if (q.Count >= MaxPerWindow) return true;
            q.Enqueue(now);
            return false;
        }
    }

    private static string Clean(string? s, int max)
    {
        if (string.IsNullOrWhiteSpace(s)) return string.Empty;
        var sb = new StringBuilder(Math.Min(s.Length, max));
        foreach (var ch in s.Trim())
        {
            if (sb.Length >= max) break;
            if (ch == '\n' || ch == '\t' || !char.IsControl(ch)) sb.Append(ch);
        }
        return sb.ToString().Trim();
    }

    // Returns null when the submission is too large overall; otherwise only answers that contain something.
    private static List<SurveyAnswer>? Sanitize(List<SurveyAnswer>? input)
    {
        var result = new List<SurveyAnswer>();
        if (input == null) return result;
        if (input.Count > MaxAnswers) return null;
        var total = 0;

        foreach (var a in input)
        {
            var id = Clean(a.Id, 40);
            var q = Clean(a.Question, 400);
            var type = (a.Type ?? string.Empty).Trim().ToLowerInvariant();
            if (id.Length == 0 || q.Length == 0 || !Types.Contains(type)) continue;

            var clean = new SurveyAnswer { Id = id, Question = q, Type = type };
            switch (type)
            {
                case "single":
                case "text":
                    clean.Text = Clean(a.Text, type == "single" ? 300 : 4000);
                    if (clean.Text.Length == 0) continue;
                    total += clean.Text.Length;
                    break;
                case "multi":
                    clean.Choices = (a.Choices ?? new()).Select(c => Clean(c, 200)).Where(c => c.Length > 0).Distinct().Take(20).ToList();
                    if (clean.Choices.Count == 0) continue;
                    total += clean.Choices.Sum(c => c.Length);
                    break;
                case "grid":
                    clean.Ratings = (a.Ratings ?? new())
                        .Where(r => r.Score >= 1 && r.Score <= 5)
                        .Select(r => new SurveyRating { Item = Clean(r.Item, 200), Score = r.Score })
                        .Where(r => r.Item.Length > 0).Take(20).ToList();
                    if (clean.Ratings.Count == 0) continue;
                    total += clean.Ratings.Sum(r => r.Item.Length + 1);
                    break;
                case "scale":
                    if (a.Rating is null or < 1 or > 5) continue;
                    clean.Rating = a.Rating;
                    break;
            }
            total += q.Length;
            if (total > MaxTotalChars) return null;
            result.Add(clean);
        }
        return result;
    }
}