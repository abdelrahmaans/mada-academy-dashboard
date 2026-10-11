using MadaAcademy.Api.Storage;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class PrivateObjectStorageTests
{
    [Fact]
    public async Task UnavailableStorage_FailsClosedForUploads()
    {
        var storage = new UnavailablePrivateObjectStorage();

        var exception = await Assert.ThrowsAsync<StorageUnavailableException>(() =>
            storage.PutAsync(new MemoryStream("private evidence"u8.ToArray()), "image/png", 15, CancellationToken.None));

        Assert.Contains("not configured", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Null(await storage.OpenReadAsync("2026/10/missing", CancellationToken.None));
    }
}
