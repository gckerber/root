// Services/CosmosService.cs
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;

namespace SaintLouisvilleApi.Services;

public class CosmosService
{
    private readonly CosmosClient? _client;
    private readonly Database? _db;
    private readonly ILogger<CosmosService> _logger;
    public readonly bool IsAvailable;

    public CosmosService(ILogger<CosmosService> logger)
    {
        _logger = logger;
        var connString = Environment.GetEnvironmentVariable("COSMOS_CONNECTION_STRING");

        if (string.IsNullOrWhiteSpace(connString))
        {
            _logger.LogWarning("COSMOS_CONNECTION_STRING not set — running in demo mode");
            IsAvailable = false;
            return;
        }

        try
        {
            _client = new CosmosClient(connString, new CosmosClientOptions
            {
                SerializerOptions = new CosmosSerializationOptions
                {
                    PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
                }
            });
            _db = _client.GetDatabase("villagedb");
            IsAvailable = true;
            _logger.LogInformation("Cosmos DB connected successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Cosmos DB client");
            IsAvailable = false;
        }
    }

    public Container GetContainer(string name)
    {
        if (_db == null) throw new InvalidOperationException("Cosmos DB not available");
        return _db.GetContainer(name);
    }

    // ── Generic helpers ───────────────────────────────────

    public async Task<List<T>> QueryAsync<T>(string containerName, QueryDefinition query)
    {
        var container = GetContainer(containerName);
        var results = new List<T>();
        using var feed = container.GetItemQueryIterator<T>(query);
        while (feed.HasMoreResults)
        {
            var batch = await feed.ReadNextAsync();
            results.AddRange(batch);
        }
        return results;
    }

    public async Task<T> CreateAsync<T>(string containerName, T item, PartitionKey partitionKey)
    {
        var container = GetContainer(containerName);
        var response = await container.CreateItemAsync(item, partitionKey);
        return response.Resource;
    }

    public async Task<T> UpsertAsync<T>(string containerName, T item, PartitionKey partitionKey)
    {
        var container = GetContainer(containerName);
        var response = await container.UpsertItemAsync(item, partitionKey);
        return response.Resource;
    }

    public async Task<T?> ReadAsync<T>(string containerName, string id, PartitionKey partitionKey)
    {
        try
        {
            var container = GetContainer(containerName);
            var response = await container.ReadItemAsync<T>(id, partitionKey);
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return default;
        }
    }

    public async Task<T> ReplaceAsync<T>(string containerName, string id, T item, PartitionKey partitionKey)
    {
        var container = GetContainer(containerName);
        var response = await container.ReplaceItemAsync(item, id, partitionKey);
        return response.Resource;
    }

    public async Task DeleteAsync(string containerName, string id, PartitionKey partitionKey)
    {
        var container = GetContainer(containerName);
        await container.DeleteItemAsync<object>(id, partitionKey);
    }
}
