using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Data;
using RescueFlow.API.Models;
using RescueFlow.API.Services;
using System.Security.Claims;

namespace RescueFlow.API.Controllers
{
    [ApiController]
    [Route("api/volunteer-assignments")]
    [Authorize]
    public class VolunteerAssignmentsController : ControllerBase
    {
        private readonly RescueFlowDbContext _context;

        public VolunteerAssignmentsController(RescueFlowDbContext context)
        {
            _context = context;
        }

        public class AssignVolunteerRequest
        {
            public int DonationId { get; set; }
            public int VolunteerId { get; set; }
        }

        private int CurrentUserId()
        {
            return int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier),
                out int userId) && userId > 0 ? userId : 0;
        }

        [HttpPost]
        [Authorize(Roles = "NGO")]
        public async Task<IActionResult> AssignVolunteer(
            [FromBody] AssignVolunteerRequest request)
        {
            int ngoId = CurrentUserId();
            if (ngoId == 0) return Unauthorized();
            if (request.DonationId <= 0 || request.VolunteerId <= 0)
                return BadRequest("Invalid assignment details.");

            var donation = await _context.Donations.FindAsync(request.DonationId);
            if (donation == null) return NotFound("Donation not found.");
            if (donation.AcceptedByNgoId != ngoId) return Forbid();
            if (donation.Status != "Accepted")
                return BadRequest("Donation must be Accepted before assignment.");
            if (donation.PickupDeadline <= DateTime.UtcNow)
                return BadRequest(new { message = "The pickup deadline has expired." });

            var volunteer = await _context.Users.FindAsync(request.VolunteerId);
            if (volunteer == null || volunteer.Role != "Volunteer" || !volunteer.IsActive)
                return BadRequest("Volunteer not found or inactive.");

            if (await _context.VolunteerAssignments.AnyAsync(a => a.DonationId == request.DonationId))
                return Conflict("This donation already has an assignment.");

            var assignment = new VolunteerAssignment
            {
                DonationId = request.DonationId,
                VolunteerId = request.VolunteerId,
                AssignedByNgoId = ngoId,
                AssignedAt = DateTime.UtcNow,
                Status = "Assigned"
            };
            _context.VolunteerAssignments.Add(assignment);
            NotificationService.Add(_context, "Volunteer assigned", "A pickup has been assigned for " + donation.FoodName, volunteer.UserId, donation.DonorId);
            donation.Status = "Assigned";
            donation.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict(new { message = "The donation status has changed. Please refresh and try again." });
            }
            catch (DbUpdateException)
            {
                if (await _context.VolunteerAssignments.AsNoTracking().AnyAsync(a => a.DonationId == request.DonationId))
                    return Conflict(new { message = "This donation already has an assignment." });
                throw;
            }
            return Ok(assignment);
        }

        [HttpGet("donation/{donationId:int}")]
        [Authorize(Roles = "NGO,Volunteer")]
        public async Task<IActionResult> GetByDonation(int donationId)
        {
            int userId = CurrentUserId();
            if (userId == 0) return Unauthorized();
            var assignment = await _context.VolunteerAssignments.AsNoTracking()
                .FirstOrDefaultAsync(a => a.DonationId == donationId);
            if (assignment == null) return NotFound("Assignment not found.");
            if (User.IsInRole("Volunteer") && assignment.VolunteerId != userId)
                return Forbid();
            if (User.IsInRole("NGO") && assignment.AssignedByNgoId != userId)
                return Forbid();
            return Ok(assignment);
        }

        [HttpGet("my-assignments")]
        [Authorize(Roles = "Volunteer")]
        public async Task<IActionResult> MyAssignments()
        {
            int volunteerId = CurrentUserId();
            if (volunteerId == 0) return Unauthorized();
            var assignments = await _context.VolunteerAssignments.AsNoTracking()
                .Where(a => a.VolunteerId == volunteerId).ToListAsync();
            return Ok(assignments);
        }

        [HttpPatch("{assignmentId:int}/pickup")]
        [Authorize(Roles = "Volunteer")]
        public Task<IActionResult> ConfirmPickup(int assignmentId)
        {
            return TransitionAssignment(assignmentId, "Assigned", "PickedUp", false);
        }

        [HttpPatch("{assignmentId:int}/deliver")]
        [Authorize(Roles = "Volunteer")]
        public Task<IActionResult> ConfirmDelivery(int assignmentId)
        {
            return TransitionAssignment(assignmentId, "PickedUp", "Delivered", false);
        }

        [HttpPatch("{assignmentId:int}/complete")]
        [Authorize(Roles = "NGO")]
        public Task<IActionResult> CompleteAssignment(int assignmentId)
        {
            return TransitionAssignment(assignmentId, "Delivered", "Completed", true);
        }

        private async Task<IActionResult> TransitionAssignment(
            int assignmentId, string expectedStatus, string nextStatus, bool ngoAction)
        {
            int userId = CurrentUserId();
            if (userId == 0) return Unauthorized();
            var assignment = await _context.VolunteerAssignments.FindAsync(assignmentId);
            if (assignment == null) return NotFound("Assignment not found.");
            if (ngoAction ? assignment.AssignedByNgoId != userId : assignment.VolunteerId != userId)
                return Forbid();

            var donation = await _context.Donations.FindAsync(assignment.DonationId);
            if (donation == null) return NotFound("Donation not found.");
            if (assignment.Status != expectedStatus || donation.Status != expectedStatus)
                return BadRequest(new { message = $"Donation and assignment must be {expectedStatus} before changing to {nextStatus}." });

            NotificationService.Add(_context, "Rescue status updated", donation.FoodName + " is " + nextStatus + ".", donation.DonorId, ngoAction ? assignment.VolunteerId : assignment.AssignedByNgoId);
            assignment.Status = nextStatus;
            donation.Status = nextStatus;
            donation.UpdatedAt = DateTime.UtcNow;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict(new { message = "The donation status has changed. Please refresh and try again." });
            }
            return Ok(assignment);
        }
    }
}
