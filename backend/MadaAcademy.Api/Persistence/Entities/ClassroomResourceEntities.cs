namespace MadaAcademy.Api.Persistence.Entities;

public sealed class ClassroomResource : EntityBase
{
    public Guid ClassroomId { get; set; }
    public required string Kind { get; set; }
    public required string Name { get; set; }
    public int Quantity { get; set; }
    public string Status { get; set; } = "AVAILABLE";
    public string? Notes { get; set; }
}
