using MadaAcademy.Api.Auth;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class CorsOriginResolverTests
{
    [Fact]
    public void Development_AllowsMissingOriginsForLocalBrowserUse()
    {
        Assert.Empty(CorsOriginResolver.Resolve(true, null));
    }

    [Fact]
    public void Production_RejectsMissingOrWildcardOrigins()
    {
        Assert.Throws<InvalidOperationException>(() => CorsOriginResolver.Resolve(false, null));
        Assert.Throws<InvalidOperationException>(() => CorsOriginResolver.Resolve(false, "*"));
    }

    [Fact]
    public void Production_ReturnsOnlyExplicitTrimmedOrigins()
    {
        var origins = CorsOriginResolver.Resolve(false, " https://academy.example ,https://admin.example ");

        Assert.Equal(new[] { "https://academy.example", "https://admin.example" }, origins);
    }
}
