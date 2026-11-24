
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<VolunteerAssignmentsController> _logger;

        public VolunteerAssignmentsController(
            RescueFlowDbContext context,
            ILogger<VolunteerAssignmentsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        public class AssignVolunteerRequest
        {
            public int DonationId { get; set; }
            public int VolunteerId { get; set; }
        }

        public class TakeTaskRequest
        {
            public int DonationId { get; set; }
        }

        private int CurrentUserId()
        {
            return int.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out int userId) ? userId : 0;
        }

        // Get active volunteers for NGO dropdown assignment
        [HttpGet("volunteers")]
        [Authorize(Roles = "NGO,Admin")]
        public async Task<IActionResult> GetActiveVolunteers()
        {
            try
            {
                var volunteers = await _context.Users
                    .AsNoTracking()
                    .Where(u => u.Role == "Volunteer" && u.IsActive)
                    .Select(u => new
                    {
                        userId = u.UserId,
                        fullName = u.FullName,
                        email = u.Email,
                        phone = u.Phone
                    })
                    .OrderBy(u => u.fullName)
                    .ToListAsync();

                return Ok(volunteers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load active volunteers list.");
                return StatusCode(500, new { message = "Unable to load active volunteers at this time." });
            }
        }

        // Volunteer Marketplace: Browse eligible, unassigned food rescue pickup tasks
        [HttpGet("available-tasks")]
        [Authorize(Roles = "Volunteer,Admin")]
        public async Task<IActionResult> GetAvailableTasks()
        {
            try
            {
                var assignedDonationIds = await _context.VolunteerAssignments
                    .AsNoTracking()
                    .Select(a => a.DonationId)
                    .ToListAsync();

                var eligibleDonations = await _context.Donations
                    .AsNoTracking()
                    .Where(d => d.Status == "Accepted" &&
                                d.RecipientNgoId != null &&
                                !assignedDonationIds.Contains(d.DonationId) &&
                                d.PickupDeadline > DateTime.UtcNow)
                    .OrderByDescending(d => d.UrgencyScore)
                    .ThenBy(d => d.PickupDeadline)
                    .ToListAsync();

                var ngoUserIds = eligibleDonations
                    .Where(d => d.RecipientNgoId.HasValue)
                    .Select(d => d.RecipientNgoId!.Value)
                    .Distinct()
                    .ToList();

                var ngoUsers = await _context.Users
                    .AsNoTracking()
                    .Where(u => ngoUserIds.Contains(u.UserId))
                    .ToDictionaryAsync(u => u.UserId);

                var profiles = await _context.NGOProfiles
                    .AsNoTracking()
                    .Where(p => ngoUserIds.Contains(p.UserId))
                    .ToListAsync();
                var profileMap = profiles.ToDictionary(p => p.UserId);

                var tasks = eligibleDonations.Select(d =>
                {
                    int ngoId = d.RecipientNgoId!.Value;
                    profileMap.TryGetValue(ngoId, out var profile);
                    ngoUsers.TryGetValue(ngoId, out var ngoUser);

                    string ngoName = !string.IsNullOrWhiteSpace(profile?.OrganizationName)
                        ? profile!.OrganizationName
                        : (ngoUser != null ? ngoUser.FullName : $"NGO #{ngoId}");

                    string ngoAddress = !string.IsNullOrWhiteSpace(profile?.Location)
                        ? profile!.Location!
                        : (ngoUser != null && !string.IsNullOrWhiteSpace(ngoUser.Phone) ? $"Contact: {ngoUser.Phone}" : "Address on file");

                    return new
                    {
                        donationId = d.DonationId,
                        foodName = d.FoodName,
                        foodCategory = d.FoodCategory,
                        quantity = d.Quantity,
                        unit = d.Unit,
                        foodCondition = d.FoodCondition,
                        storageType = d.StorageType,
                        pickupDeadline = d.PickupDeadline,
                        pickupAddress = d.PickupAddress,
                        description = d.Description,
                        urgencyScore = d.UrgencyScore,
                        urgencyLevel = d.UrgencyLevel,
                        status = d.Status,
                        recipientNgoId = ngoId,
                        recipientNgoName = ngoName,
                        recipientNgoAddress = ngoAddress
                    };
                });

                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load available pickup tasks marketplace.");
                return StatusCode(500, new { message = "Unable to load pickup tasks marketplace." });
            }
        }

        // Volunteer self-claims an eligible pickup task from the marketplace
        [HttpPost("take-task")]
        [Authorize(Roles = "Volunteer")]
        public async Task<IActionResult> TakeTask([FromBody] TakeTaskRequest request)
        {
            try
            {
                int volunteerId = CurrentUserId();
                if (volunteerId <= 0 || request == null || request.DonationId <= 0)
                    return BadRequest(new { message = "Invalid request details." });

                var volunteer = await _context.Users.FindAsync(volunteerId);
                if (volunteer == null || volunteer.Role != "Volunteer" || !volunteer.IsActive)
                    return BadRequest(new { message = "Volunteer profile is not active or authorized." });

                VolunteerAssignment? assignment = null;

                var strategy = _context.Database.CreateExecutionStrategy();
                await strategy.ExecuteAsync(async () =>
                {
                    using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

                    var donation = await _context.Donations.FindAsync(request.DonationId);
                    if (donation == null)
                        throw new KeyNotFoundException("Donation not found.");

                    if (donation.Status != "Accepted" || !donation.RecipientNgoId.HasValue)
                        throw new InvalidOperationException("Donation is not eligible for pickup or has no confirmed recipient NGO destination.");

                    if (donation.PickupDeadline <= DateTime.UtcNow)
                        throw new InvalidOperationException("This food donation has expired and cannot be picked up.");

                    bool exists = await _context.VolunteerAssignments
                        .AnyAsync(a => a.DonationId == request.DonationId);

                    if (exists)
                        throw new InvalidOperationException("This pickup task has already been claimed by another volunteer.");

                    assignment = new VolunteerAssignment
                    {
                        DonationId = donation.DonationId,
                        VolunteerId = volunteerId,
                        AssignedByNgoId = donation.RecipientNgoId.Value,
                        AssignedAt = DateTime.UtcNow,
                        Status = "Assigned"
                    };

                    _context.VolunteerAssignments.Add(assignment);

                    donation.Status = "Assigned";
                    donation.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                });

                return Ok(assignment);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(ex, "Concurrency conflict claiming donation #{DonationId}", request?.DonationId);
                return Conflict(new { message = "This task has already been claimed by another volunteer." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in TakeTask for donation #{DonationId}", request?.DonationId);
                return StatusCode(500, new { message = "An error occurred while claiming the task. Please try again." });
            }
        }

        // NGO assigns a volunteer to an accepted donation
        [HttpPost]
        [Authorize(Roles = "NGO")]
        public async Task<IActionResult> AssignVolunteer(
            [FromBody] AssignVolunteerRequest request)
        {
            try
            {
                int ngoId = CurrentUserId();

                if (ngoId == 0 ||
                    request.DonationId <= 0 ||
                    request.VolunteerId <= 0)
                    return BadRequest(new { message = "Invalid assignment details." });

                var donation = await _context.Donations
                    .FindAsync(request.DonationId);

                if (donation == null)
                    return NotFound(new { message = "Donation not found." });

                if (donation.Status != "Accepted")
                    return BadRequest(new { message = "Donation must be Accepted before assignment." });

                var volunteer = await _context.Users
                    .FindAsync(request.VolunteerId);

                if (volunteer == null ||
                    volunteer.Role != "Volunteer" ||
                    !volunteer.IsActive)
                    return BadRequest(new { message = "Volunteer not found or inactive." });

                bool exists = await _context.VolunteerAssignments
                    .AnyAsync(a => a.DonationId == request.DonationId);

                if (exists)
                    return Conflict(new { message = "This donation already has an assignment." });

                var assignment = new VolunteerAssignment
                {
                    DonationId = request.DonationId,
                    VolunteerId = request.VolunteerId,
                    AssignedByNgoId = ngoId,
                    AssignedAt = DateTime.UtcNow,
                    Status = "Assigned"
                };

                _context.VolunteerAssignments.Add(assignment);

                if (!donation.RecipientNgoId.HasValue)
                {
                    donation.RecipientNgoId = ngoId;
                }

                donation.Status = "Assigned";
                donation.UpdatedAt = DateTime.UtcNow;

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException ex)
                {
                    _logger.LogWarning(ex, "Conflict saving volunteer assignment for Donation #{DonationId}", request.DonationId);
                    return Conflict(new { message = "Unable to create assignment. It may already exist." });
                }

                return Ok(assignment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in AssignVolunteer for Donation #{DonationId}", request?.DonationId);
                return StatusCode(500, new { message = "An error occurred while creating the assignment. Please try again." });
            }
        }

        // View assignment for a donation
        [HttpGet("donation/{donationId:int}")]
        [Authorize(Roles = "NGO,Volunteer")]
        public async Task<IActionResult> GetByDonation(
            int donationId)
        {
            try
            {
                var assignment = await _context.VolunteerAssignments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        a => a.DonationId == donationId);

                if (assignment == null)
                    return NotFound(new { message = "Assignment not found." });

                if (User.IsInRole("Volunteer") &&
                    assignment.VolunteerId != CurrentUserId())
                    return Forbid();

                return Ok(assignment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetByDonation for Donation #{DonationId}", donationId);
                return StatusCode(500, new { message = "Unable to load assignment details." });
            }
        }

        // Volunteer views their assigned donations
        [HttpGet("my-assignments")]
        [Authorize(Roles = "Volunteer")]
        public async Task<IActionResult> MyAssignments()
        {
            try
            {
                int volunteerId = CurrentUserId();

                var assignments = await _context.VolunteerAssignments
                    .AsNoTracking()
                    .Where(a => a.VolunteerId == volunteerId)
                    .ToListAsync();

                return Ok(assignments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in MyAssignments for volunteer");
                return StatusCode(500, new { message = "Unable to load assigned pickup tasks at this time. Please ensure database tables are up to date." });
            }
        }

        // Assigned volunteer confirms pickup
        [HttpPatch("{assignmentId:int}/pickup")]
        [Authorize(Roles = "Volunteer")]
        public async Task<IActionResult> ConfirmPickup(
            int assignmentId)
        {
            try
            {
                var assignment = await _context.VolunteerAssignments
                    .FindAsync(assignmentId);

                if (assignment == null)
                    return NotFound(new { message = "Assignment not found." });

                if (assignment.VolunteerId != CurrentUserId())
                    return Forbid();

                var donation = await _context.Donations
                    .FindAsync(assignment.DonationId);

                if (donation == null)
                    return NotFound(new { message = "Donation not found." });

                if (assignment.Status != "Assigned" ||
                    donation.Status != "Assigned")
                    return BadRequest(new { message = "Donation is not ready for pickup." });

                assignment.Status = "PickedUp";
                donation.Status = "PickedUp";
                donation.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(assignment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in ConfirmPickup for Assignment #{AssignmentId}", assignmentId);
                return StatusCode(500, new { message = "Unable to confirm pickup. Please try again." });
            }
        }

        // Assigned volunteer confirms delivery
        [HttpPatch("{assignmentId:int}/deliver")]
        [Authorize(Roles = "Volunteer")]
        public async Task<IActionResult> ConfirmDelivery(
            int assignmentId)
        {
            try
            {
                var assignment = await _context.VolunteerAssignments
                    .FindAsync(assignmentId);

                if (assignment == null)
                    return NotFound(new { message = "Assignment not found." });

                if (assignment.VolunteerId != CurrentUserId())
                    return Forbid();

                var donation = await _context.Donations
                    .FindAsync(assignment.DonationId);

                if (donation == null)
                    return NotFound(new { message = "Donation not found." });

                if (assignment.Status != "PickedUp" ||
                    donation.Status != "PickedUp")
                    return BadRequest(new { message = "Donation must be picked up first." });

                assignment.Status = "Delivered";
                donation.Status = "Delivered";
                donation.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(assignment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in ConfirmDelivery for Assignment #{AssignmentId}", assignmentId);
                return StatusCode(500, new { message = "Unable to confirm delivery. Please try again." });
            }
        }

        // NGO confirms completed delivery
        [HttpPatch("{assignmentId:int}/complete")]
        [Authorize(Roles = "NGO")]
        public async Task<IActionResult> CompleteAssignment(
            int assignmentId)
        {
            try
            {
                var assignment = await _context.VolunteerAssignments
                    .FindAsync(assignmentId);

                if (assignment == null)
                    return NotFound(new { message = "Assignment not found." });

                var donation = await _context.Donations
                    .FindAsync(assignment.DonationId);

                if (donation == null)
                    return NotFound(new { message = "Donation not found." });

                if (assignment.Status != "Delivered" ||
                    donation.Status != "Delivered")
                    return BadRequest(new { message = "Donation must be delivered first." });

                assignment.Status = "Completed";
                donation.Status = "Completed";
                donation.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(assignment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in CompleteAssignment for Assignment #{AssignmentId}", assignmentId);
                return StatusCode(500, new { message = "Unable to complete assignment. Please try again." });
            }
        }
    }
}
