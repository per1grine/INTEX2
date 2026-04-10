using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IntexApi.Data.Migrations
{
    public partial class AddUserMfa : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "MfaEnabled",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MfaPendingSecretProtected",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MfaRecoveryCodesJson",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MfaSecretProtected",
                table: "users",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "MfaEnabled", table: "users");
            migrationBuilder.DropColumn(name: "MfaPendingSecretProtected", table: "users");
            migrationBuilder.DropColumn(name: "MfaRecoveryCodesJson", table: "users");
            migrationBuilder.DropColumn(name: "MfaSecretProtected", table: "users");
        }
    }
}
