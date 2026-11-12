using System.Net;
using System.Text;
using MadaAcademy.Api.Storage;
using Microsoft.Extensions.Configuration;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class SupabaseStorageTests
{
    [Fact]
    public async Task SupabasePrivateObjectStorage_PutOpenDelete_SendsExpectedAuthAndBucketRequests()
    {
        var recorded = new List<(HttpMethod Method, string Uri, string? ApiKey, string? AuthScheme, byte[]? Body)>();
        var storedBytes = Array.Empty<byte>();

        var handler = new StubHttpMessageHandler(async request =>
        {
            byte[]? body = request.Content is not null ? await request.Content.ReadAsByteArrayAsync() : null;
            var apiKey = request.Headers.TryGetValues("apikey", out var keys) ? keys.FirstOrDefault() : null;
            recorded.Add((request.Method, request.RequestUri!.ToString(), apiKey, request.Headers.Authorization?.Scheme, body));

            if (request.Method == HttpMethod.Post)
            {
                storedBytes = body ?? [];
                return new HttpResponseMessage(HttpStatusCode.OK);
            }
            if (request.Method == HttpMethod.Get)
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent(storedBytes)
                };
            }
            if (request.Method == HttpMethod.Delete)
            {
                return new HttpResponseMessage(HttpStatusCode.OK);
            }
            return new HttpResponseMessage(HttpStatusCode.BadRequest);
        });

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Supabase:Url"] = "https://demo-proj.supabase.co",
                ["Supabase:ServiceRoleKey"] = "test-service-role-key",
                ["Supabase:StorageBucket"] = "private-evidence",
                ["Mada:PrivateStorageMaxBytes"] = "1024"
            })
            .Build();

        using var httpClient = new HttpClient(handler);
        var storage = new SupabasePrivateObjectStorage(config, httpClient);

        var payload = Encoding.UTF8.GetBytes("%PDF-1.4 sample receipt");
        await using var stream = new MemoryStream(payload);
        var stored = await storage.PutAsync(stream, "application/pdf", payload.Length, CancellationToken.None);

        Assert.Equal("application/pdf", stored.ContentType);
        Assert.Equal(payload.Length, stored.SizeBytes);
        Assert.False(string.IsNullOrWhiteSpace(stored.Key));

        await using var downloaded = await storage.OpenReadAsync(stored.Key, CancellationToken.None);
        Assert.NotNull(downloaded);
        using var ms = new MemoryStream();
        await downloaded!.CopyToAsync(ms);
        Assert.Equal(payload, ms.ToArray());

        await storage.DeleteAsync(stored.Key, CancellationToken.None);

        Assert.Equal(3, recorded.Count);
        Assert.All(recorded, req =>
        {
            Assert.StartsWith("https://demo-proj.supabase.co/storage/v1/object/private-evidence/", req.Uri);
            Assert.Equal("test-service-role-key", req.ApiKey);
            Assert.Equal("Bearer", req.AuthScheme);
        });
    }

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> responder)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => responder(request);
    }
}
