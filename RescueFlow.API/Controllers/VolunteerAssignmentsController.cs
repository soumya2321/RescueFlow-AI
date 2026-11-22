
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Data;
using RescueFlow.API.Models;
using System.Security.Claims;

namespace RescueFlow.API.Controllers
{
    [ApiController]
    [Route("api/volunteer-assignments")]
    [Authorize]
    public class VolunteerAssignmentsController : ControllerBase
    {
        private readonly RescueFlowDbContext _context;

        public VolunteerAssignmentsController(
            RescueFlowDbContext context)
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
            return int.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out int userId) ? userId : 0;
        }

        // NGO assigns a volunteer to an accepted donation
        [HttpPost]
        [Authorize(Roles = "NGO")]
        public async Task<IActionResult> AssignVolunteer(
            [FromBody] AssignVolunteerRequest request)
        {
            int ngoId = CurrentUserId();

            if (ngoId == 0 ||
                request.DonationId <= 0 ||
                request.VolunteerId <= 0)
                return BadRequest("Invalid assignment details.");

            var donation = await _context.Donations
                .FindAsync(request.DonationId);

            if (donation == null)
                return NotFound("Donation not found.");

            if (donation.Status != "Accepted")
                return BadRequest(
                    "Donation must be Accepted before assignment.");

            var volunteer = await _context.Users
                .FindAsync(request.VolunteerId);

            if (volunteer == null ||
                volunteer.Role != "Volunteer" ||
                !volunteer.IsActive)
                return BadRequest(
                    "Volunteer not found or inactive.");

            bool exists = await _context.VolunteerAssignments
                .AnyAsync(a => a.DonationId == request.DonationId);

            if (exists)
                return Conflict(
                    "This donation already has an assignment.");

            var assignment = new VolunteerAssignment
            {
                DonationId = request.DonationId,
                VolunteerId = request.VolunteerId,
                AssignedByNgoId = ngoId,
                AssignedAt = DateTime.UtcNow,
                Status = "Assigned"
            };

            _context.VolunteerAssignments.Add(assignment);

            donation.Status = "Assigned";
            donation.UpdatedAt = DateTime.Now;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict(
                    "Unable to create assignment. It may already exist.");
            }

            return Ok(assignment);
        }

        // View assignment for a donation
        [HttpGet("donation/{donationId:int}")]
        [Authorize(Roles = "NGO,Volunteer")]
        public async Task<IActionResult> GetByDonation(
            int donationId)
        {
            var assignment = await _context.VolunteerAssignments
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    a => a.DonationId == donationId);

            if (assignment == null)
                return NotFound("Assignment not found.");

            if (User.IsInRole("Volunteer") &&
                assignment.VolunteerId != CurrentUserId())
                return Forbid();

            return Ok(assignment);
        }

        // Volunteer views their assigned donations
        [HttpGet("my-assignments")]
        [Authorize(Roles = "Volunteer")]
        public async Task<IActionResult> MyAssignments()
        {
            int volunteerId = CurrentUserId();

            var assignments = await _context.VolunteerAssignments
                .AsNoTracking()
                .Where(a => a.VolunteerId == volunteerId)
                .ToListAsync();

            return Ok(assignments);
        }

        // Assigned volunteer confirms pickup
        [HttpPatch("{assignmentId:int}/pickup")]
        [Authorize(Roles = "Volunteer")]
        public async Task<IActionResult> ConfirmPickup(
            int assignmentId)
        {
            var assignment = await _context.VolunteerAssignments
                .FindAsync(assignmentId);

            if (assignment == null)
                return NotFound("Assignment not found.");

            if (assignment.VolunteerId != CurrentUserId())
                return Forbid();

            var donation = await _context.Donations
                .FindAsync(assignment.DonationId);

            if (donation == null)
                return NotFound("Donation not found.");

            if (assignment.Status != "Assigned" ||
                donation.Status != "Assigned")
                return BadRequest("Donation is not ready for pickup.");

            assignment.Status = "PickedUp";
            donation.Status = "PickedUp";
            donation.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(assignment);
        }

        // Assigned volunteer confirms delivery
        [HttpPatch("{assignmentId:int}/deliver")]
        [Authorize(Roles = "Volunteer")]
        public async Task<IActionResult> ConfirmDelivery(
            int assignmentId)
        {
            var assignment = await _context.VolunteerAssignments
                .FindAsync(assignmentId);

            if (assignment == null)
                return NotFound("Assignment not found.");

            if (assignment.VolunteerId != CurrentUserId())
                return Forbid();

            var donation = await _context.Donations
                .FindAsync(assignment.DonationId);

            if (donation == null)
                return NotFound("Donation not found.");

            if (assignment.Status != "PickedUp" ||
                donation.Status != "PickedUp")
                return BadRequest("Donation must be picked up first.");

            assignment.Status = "Delivered";
            donation.Status = "Delivered";
            donation.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(assignment);
        }

        // NGO confirms completed delivery
        [HttpPatch("{assignmentId:int}/complete")]
        [Authorize(Roles = "NGO")]
        public async Task<IActionResult> CompleteAssignment(
            int assignmentId)
        {
            var assignment = await _context.VolunteerAssignments
                .FindAsync(assignmentId);

            if (assignment == null)
                return NotFound("Assignment not found.");

            var donation = await _context.Donations
                .FindAsync(assignment.DonationId);

            if (donation == null)
                return NotFound("Donation not found.");

            if (assignment.Status != "Delivered" ||
                donation.Status != "Delivered")
                return BadRequest("Donation must be delivered first.");

            assignment.Status = "Completed";
            donation.Status = "Completed";
            donation.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(assignment);
        }
    }
}
