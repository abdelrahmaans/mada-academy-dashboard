using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Scheduling;

public sealed record KitRequest(Guid KitId, int Quantity);
public sealed record ConflictCheckRequest(Guid BranchId, Guid InstructorId, Guid ClassroomId, IReadOnlyList<KitRequest> Kits, IReadOnlyList<Guid> StudentIds, DateTimeOffset StartAt, DateTimeOffset EndAt);
public sealed record ConflictDetails(IReadOnlyList<Guid> InstructorSessions, IReadOnlyList<Guid> ClassroomSessions, IReadOnlyList<Guid> Students, IReadOnlyList<Guid> Kits, bool BranchHours);
public sealed record ConflictCheckResult(bool HasConflict, ConflictDetails Conflicts);

public sealed class ConflictService(MadaDbContext db)
{
    public async Task<ConflictCheckResult> CheckAsync(ConflictCheckRequest input, CancellationToken cancellationToken)
    {
        var overlapping = db.AcademySessions.Where(x => x.BranchId == input.BranchId && x.Status != "CANCELLED" && x.StartAt < input.EndAt && x.EndAt > input.StartAt);
        var instructorSessions = await overlapping.Where(x => x.InstructorId == input.InstructorId || x.SubstituteInstructorId == input.InstructorId).Select(x => x.Id).ToListAsync(cancellationToken);
        var classroomSessions = await overlapping.Where(x => x.ClassroomId == input.ClassroomId).Select(x => x.Id).ToListAsync(cancellationToken);
        var studentSessions = await db.SessionAttendances.Where(a => input.StudentIds.Contains(a.StudentId)).Join(overlapping, a => a.SessionId, s => s.Id, (_, s) => s.Id).Distinct().ToListAsync(cancellationToken);
        var kitConflicts = new List<Guid>();
        foreach (var kit in input.Kits)
        {
            var used = await db.KitAssignments.Where(a => a.KitId == kit.KitId).Join(overlapping, a => a.SessionId, s => s.Id, (a, _) => a.QuantityUsed).SumAsync(cancellationToken);
            var available = await db.Kits.Where(k => k.Id == kit.KitId).Select(k => (int?)k.QuantityAvailable).SingleOrDefaultAsync(cancellationToken) ?? 0;
            if (used + kit.Quantity > available) kitConflicts.Add(kit.KitId);
        }

        var details = new ConflictDetails(instructorSessions, classroomSessions, studentSessions, kitConflicts, false);
        return new ConflictCheckResult(instructorSessions.Count > 0 || classroomSessions.Count > 0 || studentSessions.Count > 0 || kitConflicts.Count > 0, details);
    }
}
