using MadaAcademy.Api.Auth;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class DevelopmentSecurityPolicyTests
{
    [Fact]
    public void DevelopmentEndpoints_AreEnabledOnlyWhenDevelopmentAndNotExplicitlyDisabled()
    {
        Assert.True(DevelopmentEndpointPolicy.ShouldEnable(isDevelopment: true, configuredValue: null));
        Assert.True(DevelopmentEndpointPolicy.ShouldEnable(isDevelopment: true, configuredValue: "true"));
        Assert.False(DevelopmentEndpointPolicy.ShouldEnable(isDevelopment: true, configuredValue: "false"));
        Assert.False(DevelopmentEndpointPolicy.ShouldEnable(isDevelopment: false, configuredValue: null));
        Assert.False(DevelopmentEndpointPolicy.ShouldEnable(isDevelopment: false, configuredValue: "false"));
    }

    [Fact]
    public void DevelopmentEndpointOverride_CannotEnableEndpointsOutsideDevelopment()
    {
        Assert.Throws<InvalidOperationException>(() =>
            DevelopmentEndpointPolicy.ShouldEnable(isDevelopment: false, configuredValue: "true"));
        Assert.Throws<InvalidOperationException>(() =>
            DevelopmentEndpointPolicy.ShouldEnable(isDevelopment: true, configuredValue: "enabled"));
    }

    [Fact]
    public void TestOtpCode_IsRejectedOutsideDevelopment()
    {
        Assert.Throws<InvalidOperationException>(() =>
            DevelopmentOtpPolicy.EnsureTestOtpOnlyInDevelopment(isDevelopment: false, testOtpCode: "000000"));
        DevelopmentOtpPolicy.EnsureTestOtpOnlyInDevelopment(isDevelopment: false, testOtpCode: null);
        DevelopmentOtpPolicy.EnsureTestOtpOnlyInDevelopment(isDevelopment: true, testOtpCode: "000000");
    }
}
