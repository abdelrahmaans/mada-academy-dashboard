using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadaAcademy.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSchedulingAndStudentCore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AcademySessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseOfferingId = table.Column<Guid>(type: "uuid", nullable: true),
                    SessionNumber = table.Column<int>(type: "integer", nullable: false),
                    StartAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EndAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    InstructorId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubstituteInstructorId = table.Column<Guid>(type: "uuid", nullable: true),
                    ClassroomId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AcademySessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Classrooms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Capacity = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Classrooms", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CourseOfferings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseTemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    InstructorId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassroomId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    WeeklyScheduleJson = table.Column<string>(type: "jsonb", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    MaxStudents = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseOfferings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CourseTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Track = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    AgeGroup = table.Column<string>(type: "text", nullable: false),
                    Level = table.Column<string>(type: "text", nullable: false),
                    TotalSessions = table.Column<int>(type: "integer", nullable: false),
                    SessionDurationHours = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    BasePricePiastres = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KitAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    KitId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuantityUsed = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KitAssignments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Kits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    QuantityAvailable = table.Column<int>(type: "integer", nullable: false),
                    TrackIndividually = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Kits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionAttendances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    LateMinutes = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionAttendances", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StudentEnrollments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseOfferingId = table.Column<Guid>(type: "uuid", nullable: false),
                    FinalPricePiastres = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentEnrollments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Students",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ReferredByStudentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Students", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AcademySessions_BranchId_StartAt_EndAt",
                table: "AcademySessions",
                columns: new[] { "BranchId", "StartAt", "EndAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AcademySessions_ClassroomId_StartAt_EndAt",
                table: "AcademySessions",
                columns: new[] { "ClassroomId", "StartAt", "EndAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AcademySessions_InstructorId_StartAt_EndAt",
                table: "AcademySessions",
                columns: new[] { "InstructorId", "StartAt", "EndAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Classrooms_BranchId_Name",
                table: "Classrooms",
                columns: new[] { "BranchId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferings_BranchId_Status",
                table: "CourseOfferings",
                columns: new[] { "BranchId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CourseTemplates_TenantId_Name",
                table: "CourseTemplates",
                columns: new[] { "TenantId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_KitAssignments_SessionId_KitId",
                table: "KitAssignments",
                columns: new[] { "SessionId", "KitId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Kits_BranchId_Name",
                table: "Kits",
                columns: new[] { "BranchId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionAttendances_SessionId_StudentId",
                table: "SessionAttendances",
                columns: new[] { "SessionId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentEnrollments_StudentId_CourseOfferingId",
                table: "StudentEnrollments",
                columns: new[] { "StudentId", "CourseOfferingId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Students_TenantId_BranchId_Status",
                table: "Students",
                columns: new[] { "TenantId", "BranchId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AcademySessions");

            migrationBuilder.DropTable(
                name: "Classrooms");

            migrationBuilder.DropTable(
                name: "CourseOfferings");

            migrationBuilder.DropTable(
                name: "CourseTemplates");

            migrationBuilder.DropTable(
                name: "KitAssignments");

            migrationBuilder.DropTable(
                name: "Kits");

            migrationBuilder.DropTable(
                name: "SessionAttendances");

            migrationBuilder.DropTable(
                name: "StudentEnrollments");

            migrationBuilder.DropTable(
                name: "Students");
        }
    }
}
