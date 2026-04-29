// Functions/FunctionBase.cs
using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace SaintLouisvilleApi.Functions;

public abstract class FunctionBase
{
    protected readonly ILogger _logger;

    protected FunctionBase(ILogger logger)
    {
        _logger = logger;
    }

    protected bool IsAdmin(HttpRequestData req)
    {
        var adminKey = Environment.GetEnvironmentVariable("ADMIN_API_KEY") ?? string.Empty;
        if (string.IsNullOrEmpty(adminKey)) return false;
        req.Headers.TryGetValues("x-admin-key", out var values);
        return values?.FirstOrDefault() == adminKey;
    }

    protected async Task<T?> ReadBodyAsync<T>(HttpRequestData req)
    {
        try
        {
            var body = await new StreamReader(req.Body).ReadToEndAsync();
            if (string.IsNullOrWhiteSpace(body)) return default;
            return JsonSerializer.Deserialize<T>(body, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch
        {
            return default;
        }
    }

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    protected async Task<HttpResponseData> OkJson(HttpRequestData req, object data)
    {
        var res = req.CreateResponse(HttpStatusCode.OK);
        res.Headers.Add("Content-Type", "application/json");
        res.Headers.Add("Access-Control-Allow-Origin", "*");
        await res.WriteStringAsync(JsonSerializer.Serialize(data, _jsonOptions));
        return res;
    }

    protected async Task<HttpResponseData> CreatedJson(HttpRequestData req, object data)
    {
        var res = req.CreateResponse(HttpStatusCode.Created);
        res.Headers.Add("Content-Type", "application/json");
        res.Headers.Add("Access-Control-Allow-Origin", "*");
        await res.WriteStringAsync(JsonSerializer.Serialize(data, _jsonOptions));
        return res;
    }

    protected async Task<HttpResponseData> ErrorJson(HttpRequestData req, HttpStatusCode status, string message)
    {
        var res = req.CreateResponse(status);
        res.Headers.Add("Content-Type", "application/json");
        res.Headers.Add("Access-Control-Allow-Origin", "*");
        await res.WriteStringAsync(JsonSerializer.Serialize(new { message }, _jsonOptions));
        return res;
    }

    protected HttpResponseData Cors(HttpRequestData req)
    {
        var res = req.CreateResponse(HttpStatusCode.NoContent);
        res.Headers.Add("Access-Control-Allow-Origin", "*");
        res.Headers.Add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        res.Headers.Add("Access-Control-Allow-Headers", "Content-Type,x-admin-key");
        return res;
    }
}
