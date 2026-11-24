
using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Models;

namespace RescueFlow.API.Data;

public static class DemoDataSeeder
{
    public static async Task SeedAsync(RescueFlowDbContext context)
    {
        var accounts = new[]
        {
            new { Name = "Demo Donor", Email = "donor@demo.com", Role = "Donor" },
            new { Name = "Demo Volunteer", Email = "volunteer@demo.com", Role = "Volunteer" },
            new { Name = "Demo NGO", Email = "ngo@demo.com", Role = "NGO" },
            new { Name = "Demo Admin", Email = "admin@demo.com", Role = "Admin" }
        };

        foreach (var account in accounts)
        {
            var exists = await context.Users.AnyAsync(
                u => u.Email.ToLower() == account.Email);

            if (!exists)
            {
                context.Users.Add(new User
                {
                    FullName = account.Name,
                    Email = account.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                    Role = account.Role,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        await context.SaveChangesAsync();
    }
}
