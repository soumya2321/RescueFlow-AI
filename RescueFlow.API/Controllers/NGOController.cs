using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Data;
using RescueFlow.API.Models;
using RescueFlow.API.Services;
namespace RescueFlow.API.Controllers;
[ApiController, Route("api/ngo"), Authorize]
public class NGOController(RescueFlowDbContext db) : ControllerBase
{
    private int Id => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    public record ProfileRequest(string OrganizationName, decimal MaximumCapacity, string CapacityUnit, string Location);
    public record ReviewRequest(string Status);
    [HttpGet("me"), Authorize(Roles="NGO")]
    public async Task<IActionResult> Me() => Ok(await db.NGOProfiles.AsNoTracking().Where(n => n.UserId == Id).Select(n => new { n.OrganizationName,n.MaximumCapacity,n.CapacityUnit,n.Location,n.VerificationStatus }).FirstOrDefaultAsync());
    [HttpPut("me"), Authorize(Roles="NGO")]
    public async Task<IActionResult> Save(ProfileRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.OrganizationName) || r.OrganizationName.Length > 200 || string.IsNullOrWhiteSpace(r.CapacityUnit) || r.CapacityUnit.Length > 20 || string.IsNullOrWhiteSpace(r.Location) || r.Location.Length > 500 || r.MaximumCapacity <= 0 || r.MaximumCapacity > 99999999.99m || decimal.Round(r.MaximumCapacity,2) != r.MaximumCapacity) return BadRequest(new { message="Invalid profile details." });
        var n = await db.NGOProfiles.SingleOrDefaultAsync(n => n.UserId == Id);
        if (n?.IsVerified == true) return Conflict(new { message="Approved profiles cannot be edited. Contact an administrator." });
        if (n == null) { n = new NGOProfile { UserId=Id }; db.NGOProfiles.Add(n); }
        n.OrganizationName=r.OrganizationName.Trim(); n.MaximumCapacity=r.MaximumCapacity; n.CapacityUnit=r.CapacityUnit.Trim(); n.Location=r.Location.Trim(); n.VerificationStatus="Pending"; n.IsVerified=false; n.UpdatedAt=DateTime.UtcNow;
        await NotificationService.Admins(db, "An NGO has submitted organization details for review.");
        try { await db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { return Conflict(new { message="Profile changed. Refresh and retry." }); }
        return Ok(new { message="Profile submitted for review." });
    }
    [HttpGet("admin"), Authorize(Roles="Admin")]
    public async Task<IActionResult> List() => Ok(await db.Users.AsNoTracking().Where(u=>u.Role=="NGO").Select(u=>new { u.UserId,u.FullName,u.Email,u.IsActive, Profile=db.NGOProfiles.Where(n=>n.UserId==u.UserId).Select(n=>new { n.OrganizationName,n.MaximumCapacity,n.CapacityUnit,n.Location,n.VerificationStatus }).FirstOrDefault() }).ToListAsync());
    [HttpPatch("admin/{id:int}"), Authorize(Roles="Admin")]
    public async Task<IActionResult> Review(int id, ReviewRequest r)
    {
        if (r.Status != "Approved" && r.Status != "Rejected") return BadRequest(new { message="Invalid review status." });
        await using var tx = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var n=await db.NGOProfiles.Include(n=>n.User).SingleOrDefaultAsync(n=>n.UserId==id && n.User.Role=="NGO");
        if(n==null) return NotFound(new { message="NGO must submit a profile first." });
        if(r.Status=="Approved" && !n.User.IsActive) return Conflict(new { message="Account is inactive." });
        if(r.Status=="Rejected" && (await db.Donations.AnyAsync(d=>d.AcceptedByNgoId==id && (d.Status=="Accepted" || d.Status=="Assigned" || d.Status=="PickedUp" || d.Status=="Delivered")) || await db.VolunteerAssignments.AnyAsync(a=>a.AssignedByNgoId==id && (a.Status=="Assigned" || a.Status=="PickedUp" || a.Status=="Delivered")))) return Conflict(new { message="NGO has ongoing rescue work." });
        if (n.VerificationStatus != r.Status) NotificationService.Add(db, "NGO verification updated", "Your NGO verification status is " + r.Status + ".", id);
        n.VerificationStatus=r.Status; n.IsVerified=r.Status=="Approved"; n.UpdatedAt=DateTime.UtcNow;
        try { await db.SaveChangesAsync(); await tx.CommitAsync(); } catch(DbUpdateConcurrencyException) { return Conflict(new { message="Review changed. Refresh and retry." }); }
        return Ok(new { message="Verification updated." });
    }
}
