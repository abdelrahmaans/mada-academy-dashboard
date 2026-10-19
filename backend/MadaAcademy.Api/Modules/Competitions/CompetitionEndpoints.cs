using System.Security.Claims;
using MadaAcademy.Api.Modules.Operations;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Competitions;

public static class CompetitionEndpoints
{
    public static IEndpointRouteBuilder MapMadaCompetitionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/competitions").RequireAuthorization("staff");

        // 1. List competitions
        group.MapGet("", async Task<Results<Ok<ApiEnvelope<IReadOnlyList<CompetitionSummaryItem>>>, ProblemHttpResult>> (
            string? status, string? track, string? season,
            ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var error)) return error;

            var query = db.Competitions.AsNoTracking().Where(x => x.TenantId == scope.TenantId);
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(x => x.Status == status.Trim().ToUpperInvariant());
            if (!string.IsNullOrWhiteSpace(track))
                query = query.Where(x => x.Track == track.Trim().ToLowerInvariant());
            if (!string.IsNullOrWhiteSpace(season))
                query = query.Where(x => x.Season == season.Trim());

            var items = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
            var compIds = items.Select(x => x.Id).ToArray();

            var teamCounts = await db.CompetitionTeams.AsNoTracking()
                .Where(x => compIds.Contains(x.CompetitionId) && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value))
                .GroupBy(x => x.CompetitionId)
                .Select(g => new { CompetitionId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CompetitionId, x => x.Count, cancellationToken);

            var awardCounts = await db.CompetitionAwards.AsNoTracking()
                .Where(x => compIds.Contains(x.CompetitionId) && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value))
                .GroupBy(x => x.CompetitionId)
                .Select(g => new { CompetitionId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CompetitionId, x => x.Count, cancellationToken);

            var summaries = items.Select(c => new CompetitionSummaryItem(
                c.Id,
                c.Name,
                c.Organizer,
                c.Season,
                c.Track,
                c.AgeMin,
                c.AgeMax,
                c.RegistrationDeadline,
                c.EventDate,
                c.Location,
                c.Status,
                teamCounts.GetValueOrDefault(c.Id, 0),
                awardCounts.GetValueOrDefault(c.Id, 0),
                c.CreatedAt
            )).ToArray();

            return TypedResults.Ok(new ApiEnvelope<IReadOnlyList<CompetitionSummaryItem>>(summaries));
        });

        // 2. Create competition
        group.MapPost("", async Task<Results<Ok<ApiEnvelope<CompetitionDetailItem>>, ProblemHttpResult>> (
            CreateCompetitionRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!CanManageCompetition(user))
                return Problem(403, "COMPETITION_FORBIDDEN", "Only administrators, supervisors, and coaches can create competitions.");
            if (!TryGetScope(user, out var scope, out var error)) return error;

            if (string.IsNullOrWhiteSpace(request.Name))
                return Problem(400, "INVALID_NAME", "Competition name is required.");
            if (string.IsNullOrWhiteSpace(request.Organizer))
                return Problem(400, "INVALID_ORGANIZER", "Competition organizer is required.");

            var competition = new Competition
            {
                TenantId = scope.TenantId,
                Name = request.Name.Trim(),
                Organizer = request.Organizer.Trim(),
                Season = string.IsNullOrWhiteSpace(request.Season) ? "2026/2027" : request.Season.Trim(),
                Track = string.IsNullOrWhiteSpace(request.Track) ? "robotics" : request.Track.Trim().ToLowerInvariant(),
                AgeMin = request.AgeMin > 0 ? request.AgeMin : 8,
                AgeMax = request.AgeMax >= request.AgeMin ? request.AgeMax : 18,
                RegistrationDeadline = request.RegistrationDeadline,
                EventDate = request.EventDate,
                Location = request.Location?.Trim(),
                Status = "ACTIVE",
                Notes = request.Notes?.Trim(),
                CreatedByUserId = Actor(user)
            };

            db.Competitions.Add(competition);
            await db.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(new ApiEnvelope<CompetitionDetailItem>(new CompetitionDetailItem(
                competition.Id, competition.Name, competition.Organizer, competition.Season,
                competition.Track, competition.AgeMin, competition.AgeMax, competition.RegistrationDeadline,
                competition.EventDate, competition.Location, competition.Status, competition.Notes,
                0, 0, competition.CreatedAt)));
        });

        // 3. Get competition details with teams
        group.MapGet("/{id:guid}", async Task<Results<Ok<ApiEnvelope<CompetitionDetailItem>>, ProblemHttpResult>> (
            Guid id, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var error)) return error;

            var comp = await db.Competitions.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == scope.TenantId, cancellationToken);
            if (comp is null)
                return Problem(404, "COMPETITION_NOT_FOUND", "Competition not found in current tenant.");

            var teamsCount = await db.CompetitionTeams.CountAsync(x => x.CompetitionId == id && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
            var awardsCount = await db.CompetitionAwards.CountAsync(x => x.CompetitionId == id && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);

            return TypedResults.Ok(new ApiEnvelope<CompetitionDetailItem>(new CompetitionDetailItem(
                comp.Id, comp.Name, comp.Organizer, comp.Season, comp.Track, comp.AgeMin, comp.AgeMax,
                comp.RegistrationDeadline, comp.EventDate, comp.Location, comp.Status, comp.Notes,
                teamsCount, awardsCount, comp.CreatedAt)));
        });

        // 4. List teams for competition
        group.MapGet("/{id:guid}/teams", async Task<Results<Ok<ApiEnvelope<IReadOnlyList<CompetitionTeamItem>>>, ProblemHttpResult>> (
            Guid id, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var error)) return error;

            var teams = await db.CompetitionTeams.AsNoTracking()
                .Where(x => x.CompetitionId == id && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value))
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync(cancellationToken);

            var teamIds = teams.Select(x => x.Id).ToArray();
            var coachIds = teams.Select(x => x.CoachInstructorId).Distinct().ToArray();
            var branchIds = teams.Select(x => x.BranchId).Distinct().ToArray();
            var kitIds = teams.Where(x => x.KitId.HasValue).Select(x => x.KitId!.Value).Distinct().ToArray();

            var coaches = await db.UserAccounts.AsNoTracking()
                .Where(x => coachIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x.DisplayName ?? "Coach", cancellationToken);

            var branches = await db.Branches.AsNoTracking()
                .Where(x => branchIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken);

            var kits = await db.Kits.AsNoTracking()
                .Where(x => kitIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken);

            var membersRaw = await db.CompetitionTeamMembers.AsNoTracking()
                .Where(x => teamIds.Contains(x.TeamId))
                .Join(db.Students.AsNoTracking(), m => m.StudentId, s => s.Id, (m, s) => new {
                    m.Id, m.TeamId, StudentId = s.Id, s.FullName, m.RoleInTeam, m.JoinedAt, m.Status
                })
                .ToListAsync(cancellationToken);

            var members = membersRaw.Select(m => new TeamMemberDto(
                m.Id, m.TeamId, m.StudentId, m.FullName, m.StudentId.ToString("N")[..8].ToUpperInvariant(),
                m.RoleInTeam, m.JoinedAt, m.Status
            )).ToList();

            var membersByTeam = members.GroupBy(x => x.TeamId).ToDictionary(g => g.Key, g => g.ToList());

            var dtos = teams.Select(t => new CompetitionTeamItem(
                t.Id,
                t.CompetitionId,
                t.BranchId,
                branches.GetValueOrDefault(t.BranchId, "Unknown Branch"),
                t.Name,
                t.CoachInstructorId,
                coaches.GetValueOrDefault(t.CoachInstructorId, "Unknown Coach"),
                t.ClassroomId,
                t.KitId,
                t.KitId.HasValue && kits.TryGetValue(t.KitId.Value, out var kName) ? kName : null,
                t.ProjectTitle,
                t.ProjectDescription,
                t.Status,
                membersByTeam.GetValueOrDefault(t.Id, new List<TeamMemberDto>()),
                t.CreatedAt
            )).ToArray();

            return TypedResults.Ok(new ApiEnvelope<IReadOnlyList<CompetitionTeamItem>>(dtos));
        });

        // 5. Create team for competition
        group.MapPost("/{id:guid}/teams", async Task<Results<Ok<ApiEnvelope<CompetitionTeamItem>>, ProblemHttpResult>> (
            Guid id, CreateCompetitionTeamRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var error)) return error;

            var comp = await db.Competitions.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == scope.TenantId, cancellationToken);
            if (comp is null)
                return Problem(404, "COMPETITION_NOT_FOUND", "Competition not found.");

            if (string.IsNullOrWhiteSpace(request.Name))
                return Problem(400, "INVALID_TEAM_NAME", "Team name is required.");

            var branchId = request.BranchId ?? scope.BranchId;
            if (!branchId.HasValue || !await db.Branches.AnyAsync(x => x.Id == branchId.Value && x.TenantId == scope.TenantId && x.Status == "ACTIVE", cancellationToken))
                return Problem(400, "BRANCH_REQUIRED", "A valid active branch is required.");

            var coachId = request.CoachInstructorId;
            if (coachId == Guid.Empty)
            {
                if (Guid.TryParse(user.FindFirstValue("sub"), out var currentUserId))
                    coachId = currentUserId;
                else
                    return Problem(400, "COACH_REQUIRED", "Coach instructor ID is required.");
            }

            var team = new CompetitionTeam
            {
                TenantId = scope.TenantId,
                BranchId = branchId.Value,
                CompetitionId = id,
                Name = request.Name.Trim(),
                CoachInstructorId = coachId,
                ClassroomId = request.ClassroomId,
                KitId = request.KitId,
                ProjectTitle = request.ProjectTitle?.Trim(),
                ProjectDescription = request.ProjectDescription?.Trim(),
                Status = "FORMING",
                CreatedByUserId = Actor(user)
            };

            db.CompetitionTeams.Add(team);
            await db.SaveChangesAsync(cancellationToken);

            var coachName = await db.UserAccounts.Where(x => x.Id == coachId).Select(x => x.DisplayName).FirstOrDefaultAsync(cancellationToken) ?? "Coach";
            var branchName = await db.Branches.Where(x => x.Id == branchId.Value).Select(x => x.Name).FirstOrDefaultAsync(cancellationToken) ?? "Branch";
            string? kitCode = null;
            if (request.KitId.HasValue)
                kitCode = await db.Kits.Where(x => x.Id == request.KitId.Value).Select(x => x.Name).FirstOrDefaultAsync(cancellationToken);

            var dto = new CompetitionTeamItem(
                team.Id, team.CompetitionId, team.BranchId, branchName, team.Name, team.CoachInstructorId,
                coachName, team.ClassroomId, team.KitId, kitCode, team.ProjectTitle, team.ProjectDescription,
                team.Status, Array.Empty<TeamMemberDto>(), team.CreatedAt);

            return TypedResults.Ok(new ApiEnvelope<CompetitionTeamItem>(dto));
        });

        // 6. Update team status
        group.MapPatch("/teams/{teamId:guid}/status", async Task<Results<Ok<ApiEnvelope<string>>, ProblemHttpResult>> (
            Guid teamId, UpdateTeamStatusRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var error)) return error;

            var team = await db.CompetitionTeams.FirstOrDefaultAsync(x => x.Id == teamId && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
            if (team is null)
                return Problem(404, "TEAM_NOT_FOUND", "Competition team not found.");

            var allowed = new[] { "FORMING", "BOOTCAMP", "READY", "COMPETING", "AWARDED", "COMPLETED", "ARCHIVED" };
            var status = request.Status?.Trim().ToUpperInvariant();
            if (status is null || !allowed.Contains(status))
                return Problem(400, "INVALID_TEAM_STATUS", "Invalid team status.");

            team.Status = status;
            await db.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(new ApiEnvelope<string>(team.Status));
        });

        // 7. Add student member to team
        group.MapPost("/teams/{teamId:guid}/members", async Task<Results<Ok<ApiEnvelope<TeamMemberDto>>, ProblemHttpResult>> (
            Guid teamId, AddTeamMemberRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var error)) return error;

            var team = await db.CompetitionTeams.FirstOrDefaultAsync(x => x.Id == teamId && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
            if (team is null)
                return Problem(404, "TEAM_NOT_FOUND", "Team not found.");

            var student = await db.Students.FirstOrDefaultAsync(x => x.Id == request.StudentId && x.TenantId == scope.TenantId && x.Status == "ACTIVE", cancellationToken);
            if (student is null)
                return Problem(404, "STUDENT_NOT_FOUND", "Active student not found.");

            var already = await db.CompetitionTeamMembers.AnyAsync(x => x.TeamId == teamId && x.StudentId == request.StudentId, cancellationToken);
            if (already)
                return Problem(409, "STUDENT_ALREADY_IN_TEAM", "Student is already registered in this team.");

            var member = new CompetitionTeamMember
            {
                TeamId = teamId,
                StudentId = student.Id,
                RoleInTeam = string.IsNullOrWhiteSpace(request.RoleInTeam) ? "MEMBER" : request.RoleInTeam.Trim().ToUpperInvariant(),
                JoinedAt = DateTimeOffset.UtcNow,
                Status = "ACTIVE",
                CreatedByUserId = Actor(user)
            };

            db.CompetitionTeamMembers.Add(member);
            await db.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(new ApiEnvelope<TeamMemberDto>(new TeamMemberDto(
                member.Id, member.TeamId, student.Id, student.FullName, student.Id.ToString()[..8].ToUpperInvariant(),
                member.RoleInTeam, member.JoinedAt, member.Status)));
        });

        // 8. Remove student from team
        group.MapDelete("/teams/{teamId:guid}/members/{studentId:guid}", async Task<Results<Ok<ApiEnvelope<bool>>, ProblemHttpResult>> (
            Guid teamId, Guid studentId, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var error)) return error;

            var team = await db.CompetitionTeams.FirstOrDefaultAsync(x => x.Id == teamId && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
            if (team is null)
                return Problem(404, "TEAM_NOT_FOUND", "Team not found.");

            var member = await db.CompetitionTeamMembers.FirstOrDefaultAsync(x => x.TeamId == teamId && x.StudentId == studentId, cancellationToken);
            if (member is null)
                return Problem(404, "MEMBER_NOT_FOUND", "Student is not a member of this team.");

            db.CompetitionTeamMembers.Remove(member);
            await db.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(new ApiEnvelope<bool>(true));
        });

        // 9. Register award
        group.MapPost("/awards", async Task<Results<Ok<ApiEnvelope<CompetitionAwardItem>>, ProblemHttpResult>> (
            CreateAwardRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!CanManageCompetition(user))
                return Problem(403, "COMPETITION_FORBIDDEN", "Only administrators and supervisors can record official awards.");
            if (!TryGetScope(user, out var scope, out var error)) return error;

            var team = await db.CompetitionTeams.FirstOrDefaultAsync(x => x.Id == request.TeamId && x.TenantId == scope.TenantId, cancellationToken);
            if (team is null)
                return Problem(404, "TEAM_NOT_FOUND", "Competition team not found.");

            var comp = await db.Competitions.FirstOrDefaultAsync(x => x.Id == team.CompetitionId && x.TenantId == scope.TenantId, cancellationToken);
            if (comp is null)
                return Problem(404, "COMPETITION_NOT_FOUND", "Competition not found.");

            if (string.IsNullOrWhiteSpace(request.Title))
                return Problem(400, "INVALID_AWARD_TITLE", "Award title is required.");

            var award = new CompetitionAward
            {
                TenantId = scope.TenantId,
                BranchId = team.BranchId,
                CompetitionId = comp.Id,
                TeamId = team.Id,
                Title = request.Title.Trim(),
                Rank = request.Rank,
                AwardDate = request.AwardDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
                CertificateUrl = request.CertificateUrl?.Trim(),
                PhotosJson = request.PhotosJson?.Trim(),
                IsPublishedToHallOfFame = request.IsPublishedToHallOfFame,
                CreatedByUserId = Actor(user)
            };

            team.Status = "AWARDED";

            db.CompetitionAwards.Add(award);
            await db.SaveChangesAsync(cancellationToken);

            var item = new CompetitionAwardItem(
                award.Id, award.CompetitionId, comp.Name, award.TeamId, team.Name,
                award.BranchId, award.Title, award.Rank, award.AwardDate,
                award.CertificateUrl, award.PhotosJson, award.IsPublishedToHallOfFame, award.CreatedAt);

            return TypedResults.Ok(new ApiEnvelope<CompetitionAwardItem>(item));
        });

        // 10. Hall of Fame (Published awards and accomplishments)
        group.MapGet("/hall-of-fame", async Task<Results<Ok<ApiEnvelope<IReadOnlyList<HallOfFameCardItem>>>, ProblemHttpResult>> (
            ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var error)) return error;

            var awards = await db.CompetitionAwards.AsNoTracking()
                .Where(x => x.TenantId == scope.TenantId && x.IsPublishedToHallOfFame && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value))
                .OrderBy(x => x.Rank ?? 99)
                .ThenByDescending(x => x.AwardDate)
                .ToListAsync(cancellationToken);

            var compIds = awards.Select(x => x.CompetitionId).Distinct().ToArray();
            var teamIds = awards.Select(x => x.TeamId).Distinct().ToArray();
            var branchIds = awards.Select(x => x.BranchId).Distinct().ToArray();

            var comps = await db.Competitions.AsNoTracking()
                .Where(x => compIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, cancellationToken);

            var teams = await db.CompetitionTeams.AsNoTracking()
                .Where(x => teamIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, cancellationToken);

            var branches = await db.Branches.AsNoTracking()
                .Where(x => branchIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken);

            var coachIds = teams.Values.Select(x => x.CoachInstructorId).Distinct().ToArray();
            var coaches = await db.UserAccounts.AsNoTracking()
                .Where(x => coachIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x.DisplayName ?? "Coach", cancellationToken);

            var members = await db.CompetitionTeamMembers.AsNoTracking()
                .Where(x => teamIds.Contains(x.TeamId))
                .Join(db.Students.AsNoTracking(), m => m.StudentId, s => s.Id, (m, s) => new { m.TeamId, s.FullName, m.RoleInTeam })
                .ToListAsync(cancellationToken);

            var membersByTeam = members.GroupBy(x => x.TeamId)
                .ToDictionary(g => g.Key, g => g.Select(m => $"{m.FullName} ({m.RoleInTeam})").ToList());

            var cards = awards.Select(a =>
            {
                var team = teams.GetValueOrDefault(a.TeamId);
                var comp = comps.GetValueOrDefault(a.CompetitionId);
                var coachName = team is not null ? coaches.GetValueOrDefault(team.CoachInstructorId, "Coach") : "Coach";
                var studentList = membersByTeam.GetValueOrDefault(a.TeamId, new List<string>());

                return new HallOfFameCardItem(
                    a.Id,
                    a.Title,
                    a.Rank,
                    a.AwardDate,
                    comp?.Name ?? "Competition",
                    comp?.Organizer ?? "Organizer",
                    comp?.Season ?? "2026/2027",
                    comp?.Track ?? "robotics",
                    team?.Name ?? "Team",
                    team?.ProjectTitle,
                    coachName,
                    branches.GetValueOrDefault(a.BranchId, "Branch"),
                    studentList,
                    a.CertificateUrl,
                    a.PhotosJson
                );
            }).ToArray();

            return TypedResults.Ok(new ApiEnvelope<IReadOnlyList<HallOfFameCardItem>>(cards));
        });

        return endpoints;
    }

    private static bool CanManageCompetition(ClaimsPrincipal user) =>
        user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER") ||
        user.IsInRole("R03_HEAD_INSTRUCTORS") || user.IsInRole("R04_INSTRUCTOR");

    private static Guid? Actor(ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue("sub"), out var id) ? id : null;

    private static bool TryGetScope(ClaimsPrincipal user, out Scope scope, out ProblemHttpResult error)
    {
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId))
        {
            scope = default;
            error = Problem(403, "TENANT_SCOPE_REQUIRED", "The authenticated account has no tenant scope.");
            return false;
        }

        var isTenantWide = user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R00_PLATFORM_ADMIN") ||
                           string.Equals(user.FindFirstValue("scopeLevel"), "TENANT", StringComparison.OrdinalIgnoreCase);

        var branchClaim = user.FindFirstValue("branchId");
        Guid? branchId = isTenantWide ? null : (Guid.TryParse(branchClaim, out var bId) ? bId : null);
        scope = new Scope(tenantId, branchId);
        error = default!;
        return true;
    }

    private static ProblemHttpResult Problem(int status, string code, string detail) =>
        TypedResults.Problem(statusCode: status, title: code, detail: detail, extensions: new Dictionary<string, object?> { ["code"] = code });

    private readonly record struct Scope(Guid TenantId, Guid? BranchId);
}

// Models & Requests
public sealed record CompetitionSummaryItem(
    Guid Id, string Name, string Organizer, string Season, string Track,
    int AgeMin, int AgeMax, DateOnly? RegistrationDeadline, DateOnly? EventDate,
    string? Location, string Status, int TeamsCount, int AwardsCount, DateTimeOffset CreatedAt);

public sealed record CompetitionDetailItem(
    Guid Id, string Name, string Organizer, string Season, string Track,
    int AgeMin, int AgeMax, DateOnly? RegistrationDeadline, DateOnly? EventDate,
    string? Location, string Status, string? Notes, int TeamsCount, int AwardsCount, DateTimeOffset CreatedAt);

public sealed record CompetitionTeamItem(
    Guid Id, Guid CompetitionId, Guid BranchId, string BranchName, string Name,
    Guid CoachInstructorId, string CoachName, Guid? ClassroomId, Guid? KitId, string? KitCode,
    string? ProjectTitle, string? ProjectDescription, string Status,
    IReadOnlyList<TeamMemberDto> Members, DateTimeOffset CreatedAt);

public sealed record TeamMemberDto(
    Guid Id, Guid TeamId, Guid StudentId, string StudentName, string StudentCode,
    string RoleInTeam, DateTimeOffset JoinedAt, string Status);

public sealed record CompetitionAwardItem(
    Guid Id, Guid CompetitionId, string CompetitionName, Guid TeamId, string TeamName,
    Guid BranchId, string Title, int? Rank, DateOnly AwardDate,
    string? CertificateUrl, string? PhotosJson, bool IsPublishedToHallOfFame, DateTimeOffset CreatedAt);

public sealed record HallOfFameCardItem(
    Guid Id, string Title, int? Rank, DateOnly AwardDate, string CompetitionName,
    string Organizer, string Season, string Track, string TeamName, string? ProjectTitle,
    string CoachName, string BranchName, IReadOnlyList<string> StudentNames,
    string? CertificateUrl, string? PhotosJson);

public sealed record CreateCompetitionRequest(
    string Name, string Organizer, string? Season = null, string? Track = null,
    int AgeMin = 8, int AgeMax = 18, DateOnly? RegistrationDeadline = null,
    DateOnly? EventDate = null, string? Location = null, string? Notes = null);

public sealed record CreateCompetitionTeamRequest(
    string Name, Guid CoachInstructorId, Guid? BranchId = null, Guid? ClassroomId = null,
    Guid? KitId = null, string? ProjectTitle = null, string? ProjectDescription = null);

public sealed record UpdateTeamStatusRequest(string Status);

public sealed record AddTeamMemberRequest(Guid StudentId, string? RoleInTeam = null);

public sealed record CreateAwardRequest(
    Guid TeamId, string Title, int? Rank = null, DateOnly? AwardDate = null,
    string? CertificateUrl = null, string? PhotosJson = null, bool IsPublishedToHallOfFame = true);
