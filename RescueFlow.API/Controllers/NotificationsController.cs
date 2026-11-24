using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Data;
namespace RescueFlow.API.Controllers;
[ApiController, Authorize, Route("api/notifications")]
public class NotificationsController(RescueFlowDbContext db) : ControllerBase {
    private int Id => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? beforeId) {
        if (Id <= 0) return Unauthorized();
        var query = db.Notifications.AsNoTracking().Where(n => n.UserId == Id);
        if (beforeId.HasValue) query = query.Where(n => n.NotificationId < beforeId.Value);
        return Ok(await query.OrderByDescending(n => n.NotificationId).Take(50).ToListAsync());
    }
    [HttpGet("unread-count")]
    public async Task<IActionResult> Count() {
        if (Id <= 0) return Unauthorized();
        return Ok(new { count = await db.Notifications.CountAsync(n => n.UserId == Id && !n.IsRead) });
    }
    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> Read(int id) {
        if (Id <= 0) return Unauthorized();
        var n = await db.Notifications.SingleOrDefaultAsync(n => n.NotificationId == id && n.UserId == Id);
        if (n == null) return NotFound();
        n.IsRead = true; await db.SaveChangesAsync(); return NoContent();
    }
    [HttpPatch("read-all")]
    public async Task<IActionResult> ReadAll() {
        if (Id <= 0) return Unauthorized();
        await db.Notifications.Where(n => n.UserId == Id && !n.IsRead).ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        return NoContent();
    }
}
