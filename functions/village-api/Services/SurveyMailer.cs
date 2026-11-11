// Services/SurveyMailer.cs
// Emails survey responses to the configured recipients through Azure Communication Services.
// Best-effort: responses are always saved before any email is attempted.
using System.Net;
using System.Text;
using Azure;
using Azure.Communication.Email;
using Microsoft.Extensions.Logging;
using SaintLouisvilleApi.Models;

namespace SaintLouisvilleApi.Services;

public class SurveyMailer
{
    private readonly ILogger<SurveyMailer> _logger;
    private readonly EmailClient? _client;
    private readonly string? _sender;
    private readonly List<EmailAddress> _recipients = new();

    private const string DefaultAdminUrl = "https://nice-desert-09834300f.7.azurestaticapps.net";

    public bool IsConfigured => _client != null && !string.IsNullOrWhiteSpace(_sender) && _recipients.Count > 0;

    public SurveyMailer(ILogger<SurveyMailer> logger)
    {
        _logger = logger;
        var conn = Environment.GetEnvironmentVariable("COMMUNICATION_CONNECTION_STRING");
        _sender = Environment.GetEnvironmentVariable("SURVEY_SENDER");
        var recipients = Environment.GetEnvironmentVariable("SURVEY_RECIPIENTS") ?? string.Empty;

        foreach (var r in recipients.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            _recipients.Add(new EmailAddress(r));

        if (string.IsNullOrWhiteSpace(conn) || string.IsNullOrWhiteSpace(_sender) || _recipients.Count == 0)
        {
            _logger.LogWarning("Survey email not configured (need COMMUNICATION_CONNECTION_STRING, SURVEY_SENDER, SURVEY_RECIPIENTS). Responses are still saved.");
            return;
        }

        try { _client = new EmailClient(conn); }
        catch (Exception ex) { _logger.LogError(ex, "Could not create survey email client"); }
    }

    private static string Label(SurveyResponse r) => r.Version == "quick" ? "Quick survey" : "Full survey";

    // One response, sent right away.
    public Task<bool> SendResponseAsync(SurveyResponse r) =>
        SendAsync(
            $"New community survey response ({Label(r)})",
            BuildPlain(new[] { r }, null),
            BuildHtml(new[] { r }, null),
            r.Id);

    // Everything not yet emailed, in one message (keeps within the sender's per-hour limit).
    public Task<bool> SendDigestAsync(IReadOnlyList<SurveyResponse> batch, int totalPending)
    {
        var quick = batch.Count(r => r.Version == "quick");
        var full = batch.Count - quick;
        var subject = $"Community survey: {batch.Count} new response{(batch.Count == 1 ? "" : "s")} ({quick} quick, {full} full)";
        string? more = totalPending > batch.Count ? $"{totalPending - batch.Count} more will follow in the next digest." : null;
        return SendAsync(subject, BuildPlain(batch, more), BuildHtml(batch, more), "digest");
    }

    private async Task<bool> SendAsync(string subject, string plain, string html, string logId)
    {
        if (!IsConfigured) return false;
        try
        {
            var content = new EmailContent(subject) { PlainText = plain, Html = html };
            var message = new EmailMessage(_sender, new EmailRecipients(_recipients), content);
            await _client!.SendAsync(WaitUntil.Started, message);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Survey email failed ({id}): {msg}", logId, ex.Message);
            return false;
        }
    }

    private static string FormatEastern(string iso)
    {
        if (!DateTime.TryParse(iso, null, System.Globalization.DateTimeStyles.RoundtripKind, out var utc)) return iso;
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("America/New_York");
            return TimeZoneInfo.ConvertTimeFromUtc(utc.ToUniversalTime(), tz).ToString("MMMM d, yyyy 'at' h:mm tt") + " ET";
        }
        catch { return utc.ToString("u"); }
    }

    private static string H(string? s) => WebUtility.HtmlEncode(s ?? string.Empty);

    // ── plain text ───────────────────────────────────────────────────────────
    private static string BuildPlain(IReadOnlyList<SurveyResponse> rs, string? note)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Village of Saint Louisville: Community Survey");
        if (rs.Count > 1) sb.AppendLine($"{rs.Count} new responses");
        if (note != null) sb.AppendLine(note);
        foreach (var r in rs)
        {
            sb.AppendLine();
            sb.AppendLine(new string('=', 60));
            sb.AppendLine($"{Label(r)}  |  {FormatEastern(r.CreatedAt)}  |  {r.Id}");
            sb.AppendLine(new string('=', 60));
            foreach (var a in r.Answers)
            {
                sb.AppendLine();
                sb.AppendLine(a.Question);
                switch (a.Type)
                {
                    case "multi": foreach (var c in a.Choices ?? new()) sb.AppendLine($"  - {c}"); break;
                    case "grid": foreach (var g in a.Ratings ?? new()) sb.AppendLine($"  {g.Score}/5  {g.Item}"); break;
                    case "scale": sb.AppendLine($"  {a.Rating}/5"); break;
                    default: sb.AppendLine($"  {a.Text}"); break;
                }
            }
        }
        sb.AppendLine();
        sb.AppendLine(new string('-', 60));
        sb.AppendLine("Every response is saved and can be viewed or exported from the Village Admin site (Survey Results).");
        return sb.ToString();
    }

    // ── HTML ─────────────────────────────────────────────────────────────────
    private static string BuildHtml(IReadOnlyList<SurveyResponse> rs, string? note)
    {
        var adminUrl = Environment.GetEnvironmentVariable("ADMIN_SITE_URL") ?? DefaultAdminUrl;
        var sb = new StringBuilder();
        sb.Append("<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;background:#f8fafc;\">");
        sb.Append("<div style=\"background:#1e3a5f;color:#fff;padding:22px 24px;border-radius:8px 8px 0 0;\">");
        sb.Append("<div style=\"font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.75;\">Village of Saint Louisville</div>");
        sb.Append($"<div style=\"font-size:22px;font-weight:bold;margin-top:4px;\">{(rs.Count == 1 ? "New survey response" : $"{rs.Count} new survey responses")}</div>");
        if (note != null) sb.Append($"<div style=\"font-size:13px;opacity:.85;margin-top:6px;\">{H(note)}</div>");
        sb.Append("</div>");

        foreach (var r in rs)
        {
            sb.Append("<div style=\"background:#fff;padding:6px 24px 18px;border:1px solid #e2e8f0;border-top:none;\">");
            sb.Append($"<div style=\"padding:12px 0 4px;font-size:12px;font-weight:bold;color:#1e3a5f;letter-spacing:.04em;text-transform:uppercase;border-bottom:2px solid #1e3a5f;\">{H(Label(r))} &middot; {H(FormatEastern(r.CreatedAt))}</div>");
            foreach (var a in r.Answers)
            {
                sb.Append("<div style=\"padding:12px 0;border-bottom:1px solid #f1f5f9;\">");
                sb.Append($"<div style=\"font-size:12px;color:#64748b;font-weight:bold;margin-bottom:6px;\">{H(a.Question)}</div>");
                switch (a.Type)
                {
                    case "multi":
                        sb.Append("<ul style=\"margin:0;padding-left:18px;font-size:14px;color:#0f172a;\">");
                        foreach (var c in a.Choices ?? new()) sb.Append($"<li>{H(c)}</li>");
                        sb.Append("</ul>");
                        break;
                    case "grid":
                        sb.Append("<table style=\"width:100%;border-collapse:collapse;font-size:13px;\">");
                        foreach (var g in a.Ratings ?? new())
                            sb.Append($"<tr><td style=\"padding:3px 0;color:#0f172a;\">{H(g.Item)}</td><td style=\"padding:3px 0;text-align:right;font-weight:bold;color:#1e3a5f;white-space:nowrap;\">{g.Score} / 5</td></tr>");
                        sb.Append("</table>");
                        break;
                    case "scale":
                        sb.Append($"<div style=\"font-size:20px;font-weight:bold;color:#1e3a5f;\">{a.Rating} / 5</div>");
                        break;
                    default:
                        sb.Append($"<div style=\"font-size:14px;color:#0f172a;line-height:1.55;\">{H(a.Text).Replace("\n", "<br>")}</div>");
                        break;
                }
                sb.Append("</div>");
            }
            sb.Append("</div>");
        }

        sb.Append($"<div style=\"padding:12px 24px;font-size:12px;color:#94a3b8;\">Every response is saved. View totals or export everything in the <a href=\"{H(adminUrl)}\" style=\"color:#1e3a5f;\">Village Admin site</a> under Survey Results.</div>");
        sb.Append("</div>");
        return sb.ToString();
    }
}