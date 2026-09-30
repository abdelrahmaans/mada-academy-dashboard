using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadaAcademy.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddConsumerPhoneOnboarding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "UserAccounts",
                type: "character varying(320)",
                maxLength: 320,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(320)",
                oldMaxLength: 320);

            migrationBuilder.CreateTable(
                name: "ConsumerInvitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Phone = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    AccountType = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Relationship = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    TokenHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    OtpHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    OtpExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    OtpLastSentAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    OtpAttempts = table.Column<int>(type: "integer", nullable: false),
                    OtpSendCount = table.Column<int>(type: "integer", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    InvitedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    AcceptedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsumerInvitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConsumerInvitations_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ConsumerInvitations_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ConsumerInvitations_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ConsumerInvitations_UserAccounts_AcceptedByUserId",
                        column: x => x.AcceptedByUserId,
                        principalTable: "UserAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ConsumerInvitations_UserAccounts_InvitedByUserId",
                        column: x => x.InvitedByUserId,
                        principalTable: "UserAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConsumerInvitations_AcceptedByUserId",
                table: "ConsumerInvitations",
                column: "AcceptedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsumerInvitations_BranchId",
                table: "ConsumerInvitations",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsumerInvitations_InvitedByUserId",
                table: "ConsumerInvitations",
                column: "InvitedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsumerInvitations_Phone_AccountType",
                table: "ConsumerInvitations",
                columns: new[] { "Phone", "AccountType" },
                unique: true,
                filter: "\"Status\" = 'PENDING'");

            migrationBuilder.CreateIndex(
                name: "IX_ConsumerInvitations_Phone_AccountType_Status",
                table: "ConsumerInvitations",
                columns: new[] { "Phone", "AccountType", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ConsumerInvitations_StudentId_AccountType_Status",
                table: "ConsumerInvitations",
                columns: new[] { "StudentId", "AccountType", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ConsumerInvitations_TenantId",
                table: "ConsumerInvitations",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsumerInvitations_TokenHash",
                table: "ConsumerInvitations",
                column: "TokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConsumerInvitations");

            migrationBuilder.Sql("UPDATE \"UserAccounts\" SET \"Email\" = 'no-email-' || \"Id\"::text || '@invalid.invalid' WHERE \"Email\" IS NULL;");
            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "UserAccounts",
                type: "character varying(320)",
                maxLength: 320,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(320)",
                oldMaxLength: 320,
                oldNullable: true);
        }
    }
}
