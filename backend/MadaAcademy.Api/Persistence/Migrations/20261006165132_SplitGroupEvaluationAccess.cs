using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadaAcademy.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SplitGroupEvaluationAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CanReviewEvaluations",
                table: "GroupSupervisionAssignments",
                newName: "CanReadEvaluations");

            migrationBuilder.AddColumn<bool>(
                name: "CanDecideEvaluations",
                table: "GroupSupervisionAssignments",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CanDecideEvaluations",
                table: "GroupSupervisionAssignments");

            migrationBuilder.RenameColumn(
                name: "CanReadEvaluations",
                table: "GroupSupervisionAssignments",
                newName: "CanReviewEvaluations");
        }
    }
}
