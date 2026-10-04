using System;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace MadaAcademy.Api.Persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(MadaDbContext))]
[Migration("20261004110000_AddPasswordLoginLockout")]
public partial class AddPasswordLoginLockout : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "FailedPasswordAttempts",
            table: "UserAccounts",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "PasswordLockedUntil",
            table: "UserAccounts",
            type: "timestamp with time zone",
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "FailedPasswordAttempts",
            table: "UserAccounts");

        migrationBuilder.DropColumn(
            name: "PasswordLockedUntil",
            table: "UserAccounts");
    }
}
