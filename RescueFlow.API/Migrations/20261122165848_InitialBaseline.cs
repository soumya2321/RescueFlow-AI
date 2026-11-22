
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RescueFlow.API.Migrations
{
    public partial class InitialBaseline : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Users and Donations already exist.
            // Do not recreate existing tables.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Preserve existing database tables.
        }
    }
}
