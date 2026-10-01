using System.Security.Cryptography;

namespace MadaAcademy.Api.Storage;

public sealed record StoredPrivateObject(string Key, string ContentType, long SizeBytes, string Sha256);

public interface IPrivateObjectStorage
{
    Task<StoredPrivateObject> PutAsync(Stream content, string contentType, long sizeBytes, CancellationToken cancellationToken);
    Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken);
    Task DeleteAsync(string key, CancellationToken cancellationToken);
}

public sealed class LocalPrivateObjectStorage(IConfiguration configuration) : IPrivateObjectStorage
{
    private readonly string root = Path.GetFullPath(ValidateRoot(configuration));
    private readonly long maxObjectBytes = long.TryParse(configuration["Mada:PrivateStorageMaxBytes"] ?? Environment.GetEnvironmentVariable("MADA_PRIVATE_STORAGE_MAX_BYTES"), out var configured) && configured > 0 ? configured : 10 * 1024 * 1024;

    public async Task<StoredPrivateObject> PutAsync(Stream content, string contentType, long sizeBytes, CancellationToken cancellationToken)
    {
        if (sizeBytes <= 0 || sizeBytes > maxObjectBytes) throw new InvalidDataException("Private object exceeds the configured size limit.");
        var key = $"{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid():N}";
        var path = Resolve(key);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, 64 * 1024, useAsync: true);
        using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        var buffer = new byte[64 * 1024];
        long written = 0;
        int read;
        while ((read = await content.ReadAsync(buffer, cancellationToken)) > 0)
        {
            written += read;
            if (written > maxObjectBytes) throw new InvalidDataException("Private object exceeds the configured size limit.");
            await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
            hash.AppendData(buffer, 0, read);
        }
        await output.FlushAsync(cancellationToken);
        return new StoredPrivateObject(key, contentType, written, Convert.ToHexString(hash.GetHashAndReset()).ToLowerInvariant());
    }

    private static string ValidateRoot(IConfiguration configuration)
    {
        var root = configuration["Mada:PrivateStorageRoot"] ?? Environment.GetEnvironmentVariable("MADA_PRIVATE_STORAGE_ROOT") ?? Path.Combine(AppContext.BaseDirectory, "private-storage");
        var fullRoot = Path.GetFullPath(root);
        var webRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "wwwroot"));
        if (fullRoot.Equals(webRoot, StringComparison.OrdinalIgnoreCase) || fullRoot.StartsWith(webRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Private storage cannot be located under wwwroot.");
        return fullRoot;
    }

    public Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken)
    {
        var path = Resolve(key);
        if (!File.Exists(path)) return Task.FromResult<Stream?>(null);
        Stream stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 64 * 1024, useAsync: true);
        return Task.FromResult<Stream?>(stream);
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken)
    {
        var path = Resolve(key);
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    private string Resolve(string key)
    {
        if (string.IsNullOrWhiteSpace(key) || key.Contains("..", StringComparison.Ordinal) || Path.IsPathRooted(key))
            throw new ArgumentException("Invalid private object key.", nameof(key));
        var path = Path.GetFullPath(Path.Combine(root, key.Replace('/', Path.DirectorySeparatorChar)));
        if (!path.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            throw new ArgumentException("Invalid private object key.", nameof(key));
        return path;
    }
}
