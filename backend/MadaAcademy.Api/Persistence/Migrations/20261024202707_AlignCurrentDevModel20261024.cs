using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadaAcademy.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AlignCurrentDevModel20261024 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IdempotencyKey",
                table: "PaymentTransactions",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Competitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Organizer = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Season = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Track = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AgeMin = table.Column<int>(type: "integer", nullable: false),
                    AgeMax = table.Column<int>(type: "integer", nullable: false),
                    RegistrationDeadline = table.Column<DateOnly>(type: "date", nullable: true),
                    EventDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Competitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionFreezeRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseOfferingId = table.Column<Guid>(type: "uuid", nullable: true),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Reason = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ReasonText = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SubmittedByRole = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SubmittedByName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    AffectedSessionsCount = table.Column<int>(type: "integer", nullable: false),
                    MakeUpCreditsAwarded = table.Column<int>(type: "integer", nullable: false),
                    DecidedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    DecidedByName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    DecisionNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DecidedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionFreezeRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SubscriptionFreezeRequests_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SubscriptionFreezeRequests_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CompetitionTeams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompetitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    CoachInstructorId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassroomId = table.Column<Guid>(type: "uuid", nullable: true),
                    KitId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProjectTitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ProjectDescription = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompetitionTeams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompetitionTeams_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CompetitionTeams_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CompetitionAwards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompetitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: true),
                    AwardDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CertificateUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PhotosJson = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsPublishedToHallOfFame = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompetitionAwards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompetitionAwards_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CompetitionAwards_CompetitionTeams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "CompetitionTeams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompetitionAwards_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CompetitionTeamMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleInTeam = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    JoinedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompetitionTeamMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompetitionTeamMembers_CompetitionTeams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "CompetitionTeams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompetitionTeamMembers_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_TenantId_IdempotencyKey",
                table: "PaymentTransactions",
                columns: new[] { "TenantId", "IdempotencyKey" },
                unique: true,
                filter: "\"IdempotencyKey\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionAwards_BranchId",
                table: "CompetitionAwards",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionAwards_CompetitionId",
                table: "CompetitionAwards",
                column: "CompetitionId");

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionAwards_TeamId",
                table: "CompetitionAwards",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionAwards_TenantId_BranchId",
                table: "CompetitionAwards",
                columns: new[] { "TenantId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionAwards_TenantId_IsPublishedToHallOfFame",
                table: "CompetitionAwards",
                columns: new[] { "TenantId", "IsPublishedToHallOfFame" });

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionTeamMembers_StudentId",
                table: "CompetitionTeamMembers",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionTeamMembers_TeamId_StudentId",
                table: "CompetitionTeamMembers",
                columns: new[] { "TeamId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionTeams_BranchId",
                table: "CompetitionTeams",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionTeams_CompetitionId",
                table: "CompetitionTeams",
                column: "CompetitionId");

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionTeams_TenantId_BranchId_CompetitionId",
                table: "CompetitionTeams",
                columns: new[] { "TenantId", "BranchId", "CompetitionId" });

            migrationBuilder.CreateIndex(
                name: "IX_Competitions_TenantId_Status",
                table: "Competitions",
                columns: new[] { "TenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionFreezeRequests_BranchId",
                table: "SubscriptionFreezeRequests",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionFreezeRequests_StudentId",
                table: "SubscriptionFreezeRequests",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionFreezeRequests_TenantId_BranchId_Status",
                table: "SubscriptionFreezeRequests",
                columns: new[] { "TenantId", "BranchId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionFreezeRequests_TenantId_StudentId",
                table: "SubscriptionFreezeRequests",
                columns: new[] { "TenantId", "StudentId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompetitionAwards");

            migrationBuilder.DropTable(
                name: "CompetitionTeamMembers");

            migrationBuilder.DropTable(
                name: "SubscriptionFreezeRequests");

            migrationBuilder.DropTable(
                name: "CompetitionTeams");

            migrationBuilder.DropTable(
                name: "Competitions");

            migrationBuilder.DropIndex(
                name: "IX_PaymentTransactions_TenantId_IdempotencyKey",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "IdempotencyKey",
                table: "PaymentTransactions");
        }
    }
}
