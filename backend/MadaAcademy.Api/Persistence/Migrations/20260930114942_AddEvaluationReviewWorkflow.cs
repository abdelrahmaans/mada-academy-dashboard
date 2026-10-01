using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadaAcademy.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEvaluationReviewWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "PublishedAt",
                table: "SessionEvaluations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewNote",
                table: "SessionEvaluations",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ReviewedAt",
                table: "SessionEvaluations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedByUserId",
                table: "SessionEvaluations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "SessionEvaluations",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "DRAFT");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "SubmittedAt",
                table: "SessionEvaluations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionEvaluations_Status",
                table: "SessionEvaluations",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SessionEvaluations_Status",
                table: "SessionEvaluations");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "SessionEvaluations");

            migrationBuilder.DropColumn(
                name: "ReviewNote",
                table: "SessionEvaluations");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "SessionEvaluations");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "SessionEvaluations");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "SessionEvaluations");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "SessionEvaluations");
        }
    }
}
