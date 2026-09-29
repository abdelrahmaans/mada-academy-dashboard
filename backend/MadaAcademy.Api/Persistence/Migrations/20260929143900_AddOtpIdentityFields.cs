using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadaAcademy.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOtpIdentityFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AccountType",
                table: "UserAccounts",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "UserAccounts",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_UserAccounts_Phone_AccountType",
                table: "UserAccounts",
                columns: new[] { "Phone", "AccountType" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserAccounts_Phone_AccountType",
                table: "UserAccounts");

            migrationBuilder.DropColumn(
                name: "AccountType",
                table: "UserAccounts");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "UserAccounts");
        }
    }
}
