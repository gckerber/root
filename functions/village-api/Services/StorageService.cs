// Services/StorageService.cs
using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Microsoft.Extensions.Logging;

namespace SaintLouisvilleApi.Services;

public class StorageService
{
    private readonly BlobServiceClient? _client;
    private readonly ILogger<StorageService> _logger;
    public readonly bool IsAvailable;

    // All allowed upload containers
    private static readonly HashSet<string> AllowedContainers =
        new() { "minutes", "ordinances", "photos", "hero", "officials", "events", "pd-hero" };

    public StorageService(ILogger<StorageService> logger)
    {
        _logger = logger;
        var connString = Environment.GetEnvironmentVariable("STORAGE_CONNECTION_STRING");

        if (string.IsNullOrWhiteSpace(connString))
        {
            _logger.LogWarning("STORAGE_CONNECTION_STRING not set");
            IsAvailable = false;
            return;
        }

        try
        {
            _client = new BlobServiceClient(connString);
            IsAvailable = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Storage client");
            IsAvailable = false;
        }
    }

    public async Task<(string UploadUrl, string PublicUrl, string BlobName)> GenerateSasUploadUrlAsync(
        string container, string filename, string contentType)
    {
        if (_client == null) throw new InvalidOperationException("Storage not available");
        if (!AllowedContainers.Contains(container))
            throw new ArgumentException($"Container '{container}' is not allowed");

        // Sanitize filename
        var safeName = new string(filename
            .Select(c => char.IsLetterOrDigit(c) || c == '.' || c == '-' ? c : '_')
            .ToArray())
            .TrimStart('_');

        safeName = safeName[..Math.Min(safeName.Length, 200)];

        // Hero always overwrites same file; others get timestamp prefix
        var blobName = container == "hero" ? "hero.jpg" : $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{safeName}";

        var containerClient = _client.GetBlobContainerClient(container);

        // Ensure container exists with public blob access.
        // SetAccessPolicyAsync is called after CreateIfNotExistsAsync so that
        // pre-existing containers (created without public access) are also corrected.
        await containerClient.CreateIfNotExistsAsync(
            Azure.Storage.Blobs.Models.PublicAccessType.Blob);
        try
        {
            await containerClient.SetAccessPolicyAsync(
                Azure.Storage.Blobs.Models.PublicAccessType.Blob);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not set public access on container '{container}' — images may not be publicly accessible", container);
        }

        var blobClient = containerClient.GetBlobClient(blobName);

        // Generate SAS URI valid for 15 minutes
        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = container,
            BlobName = blobName,
            Resource = "b",
            StartsOn = DateTimeOffset.UtcNow.AddMinutes(-1),
            ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(15),
            ContentType = contentType,
        };
        sasBuilder.SetPermissions(BlobSasPermissions.Create | BlobSasPermissions.Write);

        var sasUri = blobClient.GenerateSasUri(sasBuilder);

        return (sasUri.ToString(), blobClient.Uri.ToString(), blobName);
    }
}
