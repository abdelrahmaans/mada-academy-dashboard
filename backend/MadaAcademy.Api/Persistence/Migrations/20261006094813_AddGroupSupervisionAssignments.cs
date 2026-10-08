using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadaAcademy.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupSupervisionAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GroupSupervisionAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupervisorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseOfferingId = table.Column<Guid>(type: "uuid", nullable: false),
                    CanReadAttendance = table.Column<bool>(type: "boolean", nullable: false),
                    CanReviewEvaluations = table.Column<bool>(type: "boolean", nullable: false),
                    StartsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    EndsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RevokedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    RevokedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupSupervisionAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupSupervisionAssignments_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GroupSupervisionAssignments_CourseOfferings_CourseOfferingId",
                        column: x => x.CourseOfferingId,
                        principalTable: "CourseOfferings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupSupervisionAssignments_UserAccounts_SupervisorUserId",
                        column: x => x.SupervisorUserId,
                        principalTable: "UserAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GroupSupervisionAssignments_BranchId",
                table: "GroupSupervisionAssignments",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupSupervisionAssignments_CourseOfferingId_SupervisorUser~",
                table: "GroupSupervisionAssignments",
                columns: new[] { "CourseOfferingId", "SupervisorUserId", "Status" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupSupervisionAssignments_SupervisorUserId",
                table: "GroupSupervisionAssignments",
                column: "SupervisorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupSupervisionAssignments_TenantId_BranchId_SupervisorUse~",
                table: "GroupSupervisionAssignments",
                columns: new[] { "TenantId", "BranchId", "SupervisorUserId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GroupSupervisionAssignments");
        }
    }
}
