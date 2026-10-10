using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadaAcademy.Api.Persistence.Migrations;

public partial class AddMarketingWorkflow : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>("CampaignId", "Leads", nullable: true);
        migrationBuilder.CreateTable(
            name: "MarketingCampaigns",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                Channel = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                BudgetPiastres = table.Column<long>(type: "bigint", nullable: false),
                Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            }, constraints: table => table.PrimaryKey("PK_MarketingCampaigns", x => x.Id));
        migrationBuilder.CreateTable(
            name: "MarketingContentItems",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                CampaignId = table.Column<Guid>(type: "uuid", nullable: true),
                Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                ContentType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                Platform = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                DueDate = table.Column<DateOnly>(type: "date", nullable: true),
                Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            }, constraints: table => table.PrimaryKey("PK_MarketingContentItems", x => x.Id));
        migrationBuilder.CreateIndex("IX_Leads_TenantId_CampaignId", "Leads", new[] { "TenantId", "CampaignId" });
        migrationBuilder.CreateIndex("IX_MarketingCampaigns_TenantId_BranchId_Status", "MarketingCampaigns", new[] { "TenantId", "BranchId", "Status" });
        migrationBuilder.CreateIndex("IX_MarketingContentItems_TenantId_BranchId_Status_DueDate", "MarketingContentItems", new[] { "TenantId", "BranchId", "Status", "DueDate" });
        migrationBuilder.AddForeignKey("MarketingContentItems", "CampaignId", "MarketingCampaigns", "Id", onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey("MarketingContentItems", "CampaignId", "MarketingCampaigns");
        migrationBuilder.DropTable("MarketingContentItems");
        migrationBuilder.DropTable("MarketingCampaigns");
        migrationBuilder.DropIndex("IX_Leads_TenantId_CampaignId", "Leads");
        migrationBuilder.DropColumn("CampaignId", "Leads");
    }
}
