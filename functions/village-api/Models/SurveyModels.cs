// Models/SurveyModels.cs
using System.Text.Json.Serialization;

namespace SaintLouisvilleApi.Models;

public class SurveyRating
{
    [JsonPropertyName("item")]
    public string Item { get; set; } = string.Empty;
    [JsonPropertyName("score")]
    public int Score { get; set; }
}

// One answered question. Question text travels with the answer so results can be read
// without needing a copy of the survey definition.
public class SurveyAnswer
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    [JsonPropertyName("q")]
    public string Question { get; set; } = string.Empty;
    // single | multi | grid | scale | text
    [JsonPropertyName("type")]
    public string Type { get; set; } = "text";
    [JsonPropertyName("text")]
    public string? Text { get; set; }
    [JsonPropertyName("choices")]
    public List<string>? Choices { get; set; }
    [JsonPropertyName("ratings")]
    public List<SurveyRating>? Ratings { get; set; }
    [JsonPropertyName("rating")]
    public int? Rating { get; set; }
}

public class SurveySubmission
{
    [JsonPropertyName("surveyId")]
    public string SurveyId { get; set; } = string.Empty;
    // full | quick
    [JsonPropertyName("version")]
    public string Version { get; set; } = string.Empty;
    [JsonPropertyName("answers")]
    public List<SurveyAnswer> Answers { get; set; } = new();
    // Honeypot: real visitors never see or fill this field
    [JsonPropertyName("website")]
    public string? Website { get; set; }
}

public class SurveyResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [JsonPropertyName("surveyId")]
    public string SurveyId { get; set; } = string.Empty;
    [JsonPropertyName("version")]
    public string Version { get; set; } = string.Empty;
    [JsonPropertyName("answers")]
    public List<SurveyAnswer> Answers { get; set; } = new();
    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    // Set once the response has gone out in an email (instantly or in the hourly digest)
    [JsonPropertyName("emailedAt")]
    public string? EmailedAt { get; set; }
}