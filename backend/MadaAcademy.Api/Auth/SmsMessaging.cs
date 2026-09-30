namespace MadaAcademy.Api.Auth;

public sealed record SmsDeliveryResult(bool Delivered, string Delivery, string? DevelopmentCode = null);

public interface ISmsMessageSender
{
    Task<SmsDeliveryResult> SendAsync(string phone, string message, string developmentCode, CancellationToken cancellationToken);
}

public sealed class DevelopmentSmsMessageSender : ISmsMessageSender
{
    public Task<SmsDeliveryResult> SendAsync(string phone, string message, string developmentCode, CancellationToken cancellationToken)
        => Task.FromResult(new SmsDeliveryResult(true, "development://sms", developmentCode));
}

public sealed class UnconfiguredSmsMessageSender : ISmsMessageSender
{
    public Task<SmsDeliveryResult> SendAsync(string phone, string message, string developmentCode, CancellationToken cancellationToken)
        => Task.FromResult(new SmsDeliveryResult(false, "unconfigured://sms"));
}
