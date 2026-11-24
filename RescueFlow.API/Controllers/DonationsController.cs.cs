using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Data;
using RescueFlow.API.Models;
using RescueFlow.API.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace RescueFlow.API.Controllers
{
    [ApiController]
    [Authorize(Roles = "Donor,NGO,Volunteer,Admin")]
    [Route("api/[controller]")]
    public class DonationsController : ControllerBase
    {
        private readonly RescueFlowDbContext _context;
        private readonly UrgencyService _urgencyService = new();

private static readonly string[] ValidFoodConditions =
{
    "Fresh",
    "Packed",
    "Leftover",
    "Near Expiry"
};

private static readonly string[] ValidStorageTypes =
{
    "Room Temperature",
    "Refrigerated",
    "Frozen"
};


        public DonationsController(RescueFlowDbContext context)
        {
            _context = context;
        }

        private static readonly string[] ValidStatuses =
        {
            "Available",
            "Accepted",
            "Assigned",
            "PickedUp",
            "Delivered",
            "Completed",
            "Cancelled",
            "Expired",
            "Rejected",
            "Failed"
        };

        private IQueryable<Donation> VisibleDonations(int userId)
        {
            var query = _context.Donations.AsNoTracking();
            if (User.IsInRole("Admin")) return query;
            if (User.IsInRole("Donor"))
                return query.Where(d => d.DonorId == userId);
            if (User.IsInRole("NGO"))
                return query.Where(d => d.Status == "Available" || d.AcceptedByNgoId == userId);
            if (User.IsInRole("Volunteer"))
                return query.Where(d => _context.VolunteerAssignments.Any(a =>
                    a.DonationId == d.DonationId && a.VolunteerId == userId));
            return query.Where(d => false);
        }

        // GET: api/donations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Donation>>> GetDonations()
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                return Unauthorized("Invalid user identity.");

            var donations = await VisibleDonations(userId)
                .ToListAsync();

            foreach (var donation in donations)
            {
                var urgency = _urgencyService.CalculateUrgency(donation);

                donation.UrgencyScore = urgency.Score;
                donation.UrgencyLevel = urgency.Level;
            }

            return Ok(donations);
        }

        // GET: api/donations/1
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Donation>> GetDonationById(int id)
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                return Unauthorized("Invalid user identity.");

            var donation = await VisibleDonations(userId)
                .FirstOrDefaultAsync(d => d.DonationId == id);

            if (donation == null)
                return NotFound("Donation not found.");

            var urgency = _urgencyService.CalculateUrgency(donation);

            donation.UrgencyScore = urgency.Score;
            donation.UrgencyLevel = urgency.Level;

            return Ok(donation);
        }

        // POST: api/donations
        [HttpPost]
        [Authorize(Roles = "Donor")]
        public async Task<ActionResult<Donation>> CreateDonation(
            [FromBody] Donation donation)
        {
            if (string.IsNullOrWhiteSpace(donation.FoodName))
                return BadRequest("Food name is required.");

            if (donation.Quantity <= 0)
                return BadRequest("Quantity must be greater than zero.");

            if (donation.PickupDeadline <= DateTime.UtcNow)
                return BadRequest(
                    "Pickup deadline must be in the future (UTC).");

            if (string.IsNullOrWhiteSpace(donation.PickupAddress))
                return BadRequest("Pickup address is required.");


if (!ValidFoodConditions.Contains(donation.FoodCondition))
{
    return BadRequest(new
    {
        message = "Invalid food condition. Allowed values: Fresh, Packed, Leftover, Near Expiry."
    });
}

if (!ValidStorageTypes.Contains(donation.StorageType))
{
    return BadRequest(new
    {
        message = "Invalid storage type. Allowed values: Room Temperature, Refrigerated, Frozen."
    });
}

if (donation.Quantity > 99999999.99m ||
    decimal.Round(donation.Quantity, 2) != donation.Quantity)
{
    return BadRequest(new
    {
        message = "Quantity exceeds the supported range or decimal precision."
    });
}

            // DonorId must reference an existing Users.UserId.
            // The database enforces this foreign key.
            // Donor role validation should be added with authentication.

            // Get the logged-in donor's UserId from the JWT.
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out int donorId))
            {
                return Unauthorized("Invalid user identity.");
            }

            // Never trust DonorId supplied by the client.
            donation.DonorId = donorId;

            donation.DonationId = 0;
            donation.Status = "Available";
donation.AcceptedByNgoId = null;
            donation.CreatedAt = DateTime.UtcNow;
            donation.UpdatedAt = DateTime.UtcNow;

            var urgency = _urgencyService.CalculateUrgency(donation);
            if (!urgency.Eligible)
                return BadRequest(new { message = "This donation is not eligible for food rescue. Please check the food condition and pickup deadline." });

            donation.UrgencyScore = urgency.Score;
            donation.UrgencyLevel = urgency.Level;

            _context.Donations.Add(donation);
            await NotificationService.NGOs(_context, "A new food donation is available: " + donation.FoodName);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetDonationById),
                new { id = donation.DonationId },
                donation);
        }

        // PUT: api/donations/1
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Donor")]
        public async Task<IActionResult> UpdateDonation(
            int id, [FromBody] Donation updatedDonation)
        {
            var donation = await _context.Donations
                .FirstOrDefaultAsync(d => d.DonationId == id);

            if (donation == null)
                return NotFound("Donation not found.");

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("Invalid user identity.");
            }
            // Only the donation owner can update this donation.
            if (donation.DonorId != userId)
            {
                return Forbid();
            }

            if (donation.Status != "Available")
                return BadRequest(new { message = "Only available donations can be edited." });

            if (string.IsNullOrWhiteSpace(updatedDonation.FoodName))
                return BadRequest("Food name is required.");

            if (updatedDonation.Quantity <= 0)
                return BadRequest("Quantity must be greater than zero.");

            if (updatedDonation.PickupDeadline <= DateTime.UtcNow)
                return BadRequest(
                    "Pickup deadline must be in the future (UTC).");

            if (string.IsNullOrWhiteSpace(updatedDonation.PickupAddress))
                return BadRequest("Pickup address is required.");


if (!ValidFoodConditions.Contains(updatedDonation.FoodCondition))
{
    return BadRequest(new
    {
        message = "Invalid food condition. Allowed values: Fresh, Packed, Leftover, Near Expiry."
    });
}

if (!ValidStorageTypes.Contains(updatedDonation.StorageType))
{
    return BadRequest(new
    {
        message = "Invalid storage type. Allowed values: Room Temperature, Refrigerated, Frozen."
    });
}

if (updatedDonation.Quantity > 99999999.99m ||
    decimal.Round(updatedDonation.Quantity, 2) != updatedDonation.Quantity)
{
    return BadRequest(new
    {
        message = "Quantity exceeds the supported range or decimal precision."
    });
}

            donation.FoodName = updatedDonation.FoodName;
            donation.FoodCategory = updatedDonation.FoodCategory;
            donation.Quantity = updatedDonation.Quantity;
            donation.Unit = updatedDonation.Unit;
            donation.FoodCondition = updatedDonation.FoodCondition;
            donation.StorageType = updatedDonation.StorageType;
            donation.PickupDeadline = updatedDonation.PickupDeadline;
            donation.PickupAddress = updatedDonation.PickupAddress;
            donation.Description = updatedDonation.Description;
            donation.UpdatedAt = DateTime.UtcNow;

            // Preserve DonorId, Status, and CreatedAt.
            // Status is managed through the PATCH endpoint.

var urgency = _urgencyService.CalculateUrgency(donation);

if (!urgency.Eligible)
{
    return BadRequest(new
    {
        message = "This donation is not eligible for food rescue. Please check the food condition and pickup deadline."
    });
}

donation.UrgencyScore = urgency.Score;
donation.UrgencyLevel = urgency.Level;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict(new
                {
                    message = "This donation has already been modified or deleted. Please refresh and try again."
                });
            }

            return Ok(donation);
        }

        // DELETE: api/donations/1
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Donor")]
        public async Task<IActionResult> DeleteDonation(int id)
        {
            var donation = await _context.Donations
                .FirstOrDefaultAsync(d => d.DonationId == id);

            if (donation == null)
                return NotFound("Donation not found.");


            // Get logged-in user's ID from JWT.
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("Invalid user identity.");
            }

            // Only the donation owner can delete it.
            if (donation.DonorId != userId)
            {
                return Forbid();
            }


if (donation.Status != "Available")
{
    return BadRequest(new
    {
        message = "Only available donations can be deleted."
    });
}


            _context.Donations.Remove(donation);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict(new
                {
                    message = "This donation has already been modified or deleted. Please refresh and try again."
                });
            }

            return NoContent();
        }

        // PATCH: api/donations/1/status

        [HttpPatch("{id:int}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateDonationStatus(
            int id, [FromBody] DonationStatusRequest request)
        {
            var donation = await _context.Donations
                .FirstOrDefaultAsync(d => d.DonationId == id);

            if (donation == null)
                return NotFound("Donation not found.");

            if (request == null ||
                string.IsNullOrWhiteSpace(request.Status))
                return BadRequest("Status is required.");

            string newStatus = request.Status.Trim();

            var validStatus = ValidStatuses.FirstOrDefault(
                s => s.Equals(
                    newStatus,
                    StringComparison.OrdinalIgnoreCase));

            if (validStatus == null)
                return BadRequest("Invalid donation status.");

            var userIdClaim =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Invalid user identity.");

            if (User.IsInRole("NGO") && donation.Status != "Available" &&
                donation.AcceptedByNgoId != userId)
                return Forbid();

            // These statuses must be managed only through
            // VolunteerAssignmentsController.
            if (validStatus == "Assigned" ||
                validStatus == "PickedUp" ||
                validStatus == "Delivered" ||
                validStatus == "Completed")
            {
                return BadRequest(
                    "Use the Volunteer Assignment API for this status.");
            }

            // Only an NGO can accept or reject a donation.
            if (validStatus == "Accepted" ||
                validStatus == "Rejected")
            {
                if (!User.IsInRole("NGO"))
                    return Forbid();
            }

            // Only the donor who owns the donation can cancel it.
            if (validStatus == "Cancelled")
            {
                if (!User.IsInRole("Donor") ||
                    donation.DonorId != userId)
                    return Forbid();
            }

            // Only an NGO can mark a donation expired or failed.
            if (validStatus == "Expired" ||
                validStatus == "Failed")
            {
                if (!User.IsInRole("NGO"))
                    return Forbid();
            }

            var allowedTransitions =
                new Dictionary<string, string[]>(
                    StringComparer.OrdinalIgnoreCase)
                {
                    ["Available"] = new[]
                    {
                "Accepted", "Cancelled", "Expired", "Rejected"
                    },
                    ["Accepted"] = new[]
                    {
                "Cancelled", "Rejected"
                    }
                };

            if (!allowedTransitions.TryGetValue(
                    donation.Status, out var allowed) ||
                !allowed.Contains(
                    validStatus,
                    StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest(
                    $"Invalid status transition from " +
                    $"'{donation.Status}' to '{validStatus}'.");
            }

            // Do not allow generic status changes
            // to bypass an existing volunteer assignment.
            bool hasAssignment =
                await _context.VolunteerAssignments
                    .AnyAsync(a => a.DonationId == id);

            if (hasAssignment)
            {
                return BadRequest(
                    "Donation has a volunteer assignment. " +
                    "Use the Volunteer Assignment workflow.");
            }


// Record the NGO that accepts the donation.
if (validStatus == "Accepted")
{
    if (donation.PickupDeadline <= DateTime.UtcNow)
    {
        return BadRequest(new
        {
            message = "The pickup deadline has expired."
        });
    }

    donation.AcceptedByNgoId = userId;
}

if (validStatus == "Accepted")
    NotificationService.Add(_context, "Donation accepted", "Your donation was accepted: " + donation.FoodName, donation.DonorId);
else if (validStatus == "Cancelled" || validStatus == "Rejected" || validStatus == "Expired")
    NotificationService.Add(_context, "Donation status updated", donation.FoodName + " is " + validStatus + ".", donation.DonorId == userId ? null : donation.DonorId, donation.AcceptedByNgoId == userId ? null : donation.AcceptedByNgoId);
donation.Status = validStatus;
donation.UpdatedAt = DateTime.UtcNow;

try
{
    await _context.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException)
{
    return Conflict(new
    {
        message = "This donation has already been modified. Please refresh and try again."
    });
}

return Ok(donation);

        }


        // GET: api/donations/1/urgency
        [HttpGet("{id:int}/urgency")]
        public async Task<IActionResult> GetDonationUrgency(int id)
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                return Unauthorized("Invalid user identity.");

            var donation = await VisibleDonations(userId)
                .FirstOrDefaultAsync(d => d.DonationId == id);

            if (donation == null)
                return NotFound("Donation not found.");

            var urgency = _urgencyService.CalculateUrgency(donation);

            return Ok(urgency);
        }

        // GET: api/donations/urgency-ranking
        [HttpGet("urgency-ranking")]
        public async Task<IActionResult> GetUrgencyRanking()
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                return Unauthorized("Invalid user identity.");

            var donations = await VisibleDonations(userId)
                .Where(d => d.Status == "Available")
                .ToListAsync();

            var ranking = donations
                .Select(d => _urgencyService.CalculateUrgency(d))
                .Where(u => u.Eligible)
                .OrderByDescending(u => u.Score)
                .ToList();

            return Ok(ranking);
        }
    }

    public class DonationStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
