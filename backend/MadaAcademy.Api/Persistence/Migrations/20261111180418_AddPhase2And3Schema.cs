using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadaAcademy.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPhase2And3Schema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FeatureOverridesJson",
                table: "Tenants",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BonusPoints",
                table: "SessionEvaluations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "GamificationBadge",
                table: "SessionEvaluations",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "Leads",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "EvaluationRubrics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    TrackKey = table.Column<string>(type: "character varying(48)", maxLength: 48, nullable: false),
                    TrackLabel = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ScaleMax = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    CriteriaJson = table.Column<string>(type: "text", nullable: false),
                    AuthorName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    UpdatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationRubrics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InstructorPayrollRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    InstructorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Month = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    CompletedSessionsCountSnapshot = table.Column<int>(type: "integer", nullable: false),
                    SubstituteSessionsCountSnapshot = table.Column<int>(type: "integer", nullable: false),
                    RatePerSessionPiastresSnapshot = table.Column<long>(type: "bigint", nullable: false),
                    BaseSalaryPiastres = table.Column<long>(type: "bigint", nullable: false),
                    BonusPiastres = table.Column<long>(type: "bigint", nullable: false),
                    BonusReason = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    DeductionPiastres = table.Column<long>(type: "bigint", nullable: false),
                    DeductionReason = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    NetPayablePiastres = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    ApprovedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ApprovedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    PaidByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    PaidAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    PaymentMethod = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    PaymentReference = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    LinkedExpenseId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InstructorPayrollRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlatformSubscriptionPayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    AmountEgp = table.Column<long>(type: "bigint", nullable: false),
                    Method = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ReferenceNumber = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    RecordedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    RecordedByName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    ReceivedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformSubscriptionPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformSubscriptionPayments_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlatformSupportTickets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: true),
                    RequesterUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequesterName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    RequesterPhone = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    RequesterRole = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Subject = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Category = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Priority = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    MeetingUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MeetingScheduledAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    InternalAdminNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ResolvedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ResolvedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformSupportTickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformSupportTickets_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PlatformSupportTickets_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationRubrics_TenantId_TrackKey",
                table: "EvaluationRubrics",
                columns: new[] { "TenantId", "TrackKey" });

            migrationBuilder.CreateIndex(
                name: "IX_InstructorPayrollRecords_TenantId_BranchId_InstructorId_Mon~",
                table: "InstructorPayrollRecords",
                columns: new[] { "TenantId", "BranchId", "InstructorId", "Month" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlatformSubscriptionPayments_TenantId_ReceivedAt",
                table: "PlatformSubscriptionPayments",
                columns: new[] { "TenantId", "ReceivedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PlatformSupportTickets_BranchId",
                table: "PlatformSupportTickets",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformSupportTickets_TenantId_Status",
                table: "PlatformSupportTickets",
                columns: new[] { "TenantId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EvaluationRubrics");

            migrationBuilder.DropTable(
                name: "InstructorPayrollRecords");

            migrationBuilder.DropTable(
                name: "PlatformSubscriptionPayments");

            migrationBuilder.DropTable(
                name: "PlatformSupportTickets");

            migrationBuilder.DropColumn(
                name: "FeatureOverridesJson",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "BonusPoints",
                table: "SessionEvaluations");

            migrationBuilder.DropColumn(
                name: "GamificationBadge",
                table: "SessionEvaluations");

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "Leads",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000,
                oldNullable: true);
        }
    }
}
