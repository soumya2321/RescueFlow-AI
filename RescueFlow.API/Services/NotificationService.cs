using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Data;
using RescueFlow.API.Models;
namespace RescueFlow.API.Services;
public static class NotificationService {
    // Stage notifications in the same DbContext; caller saves business changes and notifications atomically.
    public static void Add(RescueFlowDbContext db, string title, string message, params int?[] recipients) {
        foreach (var id in recipients.Where(x => x.HasValue && x.Value > 0).Distinct())
            db.Notifications.Add(new Notification { UserId = id!.Value, Title = title, Message = message });
    }
    public static async Task Admins(RescueFlowDbContext db, string message) {
        var ids = await db.Users.Where(u => u.Role == "Admin" && u.IsActive).Select(u => (int?)u.UserId).ToArrayAsync();
        Add(db, "NGO review requested", message, ids);
    }
    public static async Task NGOs(RescueFlowDbContext db, string message) {
        var ids = await db.NGOProfiles.Where(n => n.IsVerified && n.VerificationStatus == "Approved" && n.User.IsActive && n.User.Role == "NGO").Select(n => (int?)n.UserId).ToArrayAsync();
        Add(db, "New food donation", message, ids);
    }
}
