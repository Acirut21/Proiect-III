using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiyStore.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProductDeliveryMethods : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DeliveryMethods",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryMethods",
                table: "Products");
        }
    }
}
