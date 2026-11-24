using System.ComponentModel.DataAnnotations;
namespace RescueFlow.API.Models;
public class Notification {
    public int NotificationId { get; set; }
    public int UserId { get; set; }
    [MaxLength(120)] public string Title { get; set; } = "";
    [MaxLength(500)] public string Message { get; set; } = "";
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
