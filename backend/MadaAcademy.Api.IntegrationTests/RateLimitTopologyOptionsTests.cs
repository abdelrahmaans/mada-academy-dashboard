using MadaAcademy.Api.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class RateLimitTopologyOptionsTests
{
    [Fact]
    public void DevelopmentDefaultsToSingleInstance()
    {
        var options = RateLimitTopologyOptions.Load(new ConfigurationBuilder().Build(), new TestHostEnvironment("Development"));

        Assert.Equal(RateLimitTopologyOptions.SingleInstanceMode, options.Mode);
        Assert.Equal(1, options.ExpectedInstanceCount);
    }

    [Fact]
    public void ProductionRejectsDistributedMode()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["MADA_RATE_LIMIT_MODE"] = "distributed"
        }).Build();

        var exception = Assert.Throws<InvalidOperationException>(() => RateLimitTopologyOptions.Load(configuration, new TestHostEnvironment("Production")));
        Assert.Contains("single-instance", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void ProductionRejectsMoreThanOneExpectedInstance()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["MADA_RATE_LIMIT_EXPECTED_INSTANCES"] = "2"
        }).Build();

        var exception = Assert.Throws<InvalidOperationException>(() => RateLimitTopologyOptions.Load(configuration, new TestHostEnvironment("Production")));
        Assert.Contains("one production instance", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void RejectsMalformedExpectedInstanceCount()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["MADA_RATE_LIMIT_EXPECTED_INSTANCES"] = "many"
        }).Build();

        var exception = Assert.Throws<InvalidOperationException>(() => RateLimitTopologyOptions.Load(configuration, new TestHostEnvironment("Development")));
        Assert.Contains("whole number", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void ProductionAcceptsExplicitSingleInstance()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["MADA_RATE_LIMIT_MODE"] = "single-instance",
            ["MADA_RATE_LIMIT_EXPECTED_INSTANCES"] = "1"
        }).Build();

        var options = RateLimitTopologyOptions.Load(configuration, new TestHostEnvironment("Production"));

        Assert.Equal(RateLimitTopologyOptions.SingleInstanceMode, options.Mode);
        Assert.Equal(1, options.ExpectedInstanceCount);
    }

    private sealed class TestHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "MadaAcademy.Api.IntegrationTests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = new Microsoft.Extensions.FileProviders.NullFileProvider();
    }
}
