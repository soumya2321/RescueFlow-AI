
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Data;
using System.Security.Claims;

namespace RescueFlow.API.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly RescueFlowDbContext _context;

        public DashboardController(RescueFlowDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var id = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.TryParse(id, out var userId)
                ? userId
                : null;
        }

        // DONOR DASHBOARD
        [HttpGet("donor")]
        [Authorize(Roles = "Donor")]
        public async Task<IActionResult> GetDonorDashboard()
        {
            var donorId = GetCurrentUserId();

            if (donorId == null)
                return Unauthorized("Invalid user token.");

            var donations = _context.Donations
                .AsNoTracking()
                .Where(d => d.DonorId == donorId.Value);

            var result = new
            {
                TotalDonations = await donations.CountAsync(),

                AvailableDonations = await donations
                    .CountAsync(d => d.Status == "Available"),

                AcceptedDonations = await donations
                    .CountAsync(d => d.Status == "Accepted"),

                AssignedDonations = await donations
                    .CountAsync(d => d.Status == "Assigned"),

                CompletedDonations = await donations
                    .CountAsync(d => d.Status == "Completed"),

                CancelledDonations = await donations
                    .CountAsync(d => d.Status == "Cancelled")
            };

            return Ok(result);
        }

        // NGO DASHBOARD
        [HttpGet("ngo")]
        [Authorize(Roles = "NGO")]
        public async Task<IActionResult> GetNgoDashboard()
        {
            var ngoId = GetCurrentUserId();

            if (ngoId == null)
                return Unauthorized("Invalid user token.");

            var donations = _context.Donations.AsNoTracking();

            var assignments = _context.VolunteerAssignments
                .AsNoTracking()
                .Where(a => a.AssignedByNgoId == ngoId.Value);

            var result = new
            {
                AvailableDonations = await donations
                    .CountAsync(d => d.Status == "Available"),

                AcceptedDonations = await donations
                    .CountAsync(d =>
                        d.Status == "Accepted" &&
                        d.AcceptedByNgoId == ngoId.Value),

                MyTotalAssignments = await assignments.CountAsync(),

                MyActiveAssignments = await assignments
                    .CountAsync(a =>
                        a.Status == "Assigned" ||
                        a.Status == "PickedUp" ||
                        a.Status == "Delivered"),

                MyCompletedAssignments = await assignments
                    .CountAsync(a => a.Status == "Completed")
            };

            return Ok(result);
        }

        // VOLUNTEER DASHBOARD
        [HttpGet("volunteer")]
        [Authorize(Roles = "Volunteer")]
        public async Task<IActionResult> GetVolunteerDashboard()
        {
            var volunteerId = GetCurrentUserId();

            if (volunteerId == null)
                return Unauthorized("Invalid user token.");

            var assignments = _context.VolunteerAssignments
                .AsNoTracking()
                .Where(a => a.VolunteerId == volunteerId.Value);

            var result = new
            {
                TotalAssignments = await assignments.CountAsync(),

                PendingPickups = await assignments
                    .CountAsync(a => a.Status == "Assigned"),

                PickedUpDonations = await assignments
                    .CountAsync(a => a.Status == "PickedUp"),

                DeliveredDonations = await assignments
                    .CountAsync(a => a.Status == "Delivered"),

                CompletedAssignments = await assignments
                    .CountAsync(a => a.Status == "Completed")
            };

            return Ok(result);
        }
    }
}
