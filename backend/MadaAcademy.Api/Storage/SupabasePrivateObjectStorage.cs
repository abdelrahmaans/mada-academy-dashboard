using System.Net.Http.Headers;
using System.Security.Cryptography;

namespace MadaAcademy.Api.Storage;

public sealed class StorageUnavailableException(string message) : Exception(message);

public sealed class UnavailablePrivateObjectStorage : IPrivateObjectStorage
{
    public Task<StoredPrivateObject> PutAsync(Stream content, string contentType, long sizeBytes, CancellationToken cancellationToken) =>
        throw new StorageUnavailableException("Private evidence storage is not configured for this environment.");

    public Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken) => Task.FromResult<Stream?>(null);
    public Task DeleteAsync(string key, CancellationToken cancellationToken) => Task.CompletedTask;
}

public sealed class SupabasePrivateObjectStorage(IConfiguration configuration, HttpClient httpClient) : IPrivateObjectStorage
{
    private readonly string baseUrl = Require(configuration["Supabase:Url"] ?? Environment.GetEnvironmentVariable("SUPABASE_URL"), "SUPABASE_URL").TrimEnd('/');
    private readonly string serviceRoleKey = Require(configuration["Supabase:ServiceRoleKey"] ?? Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY"), "SUPABASE_SERVICE_ROLE_KEY");
    private readonly string bucket = Require(configuration["Supabase:StorageBucket"] ?? Environment.GetEnvironmentVariable("SUPABASE_STORAGE_BUCKET"), "SUPABASE_STORAGE_BUCKET");
    private readonly long maxObjectBytes = long.TryParse(configuration["Mada:PrivateStorageMaxBytes"] ?? Environment.GetEnvironmentVariable("MADA_PRIVATE_STORAGE_MAX_BYTES"), out var configured) && configured > 0 ? configured : 10 * 1024 * 1024;

    public async Task<StoredPrivateObject> PutAsync(Stream content, string contentType, long sizeBytes, CancellationToken cancellationToken)
    {
        if (sizeBytes <= 0 || sizeBytes > maxObjectBytes) throw new InvalidDataException("Private object exceeds the configured size limit.");
        await using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);
        if (buffer.Length > maxObjectBytes) throw new InvalidDataException("Private object exceeds the configured size limit.");
        var bytes = buffer.ToArray();
        var key = $"{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid():N}";
        using var request = new HttpRequestMessage(HttpMethod.Post, ObjectUrl(key));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
        request.Headers.Add("apikey", serviceRoleKey);
        request.Headers.Add("x-upsert", "false");
        request.Content = new ByteArrayContent(bytes);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode) throw new StorageUnavailableException($"Supabase Storage upload failed with HTTP {(int)response.StatusCode}.");
        return new StoredPrivateObject(key, contentType, bytes.Length, Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant());
    }

    public async Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, ObjectUrl(key));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
        request.Headers.Add("apikey", serviceRoleKey);
        var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound) { response.Dispose(); return null; }
        if (!response.IsSuccessStatusCode) { response.Dispose(); throw new StorageUnavailableException($"Supabase Storage download failed with HTTP {(int)response.StatusCode}."); }
        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        response.Dispose();
        return new MemoryStream(bytes, writable: false);
    }

    public async Task DeleteAsync(string key, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, ObjectUrl(key));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
        request.Headers.Add("apikey", serviceRoleKey);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.NotFound) throw new StorageUnavailableException($"Supabase Storage delete failed with HTTP {(int)response.StatusCode}.");
    }

    private string ObjectUrl(string key) => $"{baseUrl}/storage/v1/object/{Uri.EscapeDataString(bucket)}/{string.Join('/', key.Split('/').Select(Uri.EscapeDataString))}";
    private static string Require(string? value, string name) => string.IsNullOrWhiteSpace(value) ? throw new InvalidOperationException($"{name} is required for Supabase private storage.") : value;
}
