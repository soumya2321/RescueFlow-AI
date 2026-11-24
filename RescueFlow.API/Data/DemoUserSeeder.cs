using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Data;
using RescueFlow.API.Models;

namespace RescueFlow.API.Services;

public static class DemoUserSeeder
{
    public static async Task SeedAsync(RescueFlowDbContext context)
    {
        var demoUsers = new[]
        {
            new { FullName = "Demo Donor", Email = "donor@demo.com", Role = "Donor" },
            new { FullName = "Demo Volunteer", Email = "volunteer@demo.com", Role = "Volunteer" },
            new { FullName = "Demo NGO", Email = "ngo@demo.com", Role = "NGO" },
            new { FullName = "Demo Admin", Email = "admin@demo.com", Role = "Admin" }
        };

        foreach (var demoUser in demoUsers)
        {
            var exists = await context.Users.AnyAsync(
                u => u.Email.ToLower() == demoUser.Email.ToLower());

            if (exists)
                continue;

            var user = new User
            {
                FullName = demoUser.FullName,
                Email = demoUser.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                Role = demoUser.Role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Users.Add(user);
        }

        await context.SaveChangesAsync();
    }
}