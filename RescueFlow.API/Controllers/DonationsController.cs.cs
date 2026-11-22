
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Data;
using RescueFlow.API.Models;
using RescueFlow.API.Services;

namespace RescueFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DonationsController : ControllerBase
    {
        private readonly RescueFlowDbContext _context;
        private readonly UrgencyService _urgencyService = new();

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

        // GET: api/donations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Donation>>> GetDonations()
        {
            var donations = await _context.Donations
                .AsNoTracking()
                .ToListAsync();

            return Ok(donations);
        }

        // GET: api/donations/1
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Donation>> GetDonationById(int id)
        {
            var donation = await _context.Donations
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.DonationId == id);

            if (donation == null)
                return NotFound("Donation not found.");

            return Ok(donation);
        }

        // POST: api/donations
        [HttpPost]
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

            if (string.IsNullOrWhiteSpace(donation.StorageType))
                return BadRequest("Storage type is required.");

            // DonorId must reference an existing Users.UserId.
            // The database enforces this foreign key.
            // Donor role validation should be added with authentication.

            donation.DonationId = 0;
            donation.Status = "Available";
            donation.CreatedAt = DateTime.UtcNow;
            donation.UpdatedAt = DateTime.UtcNow;

            var urgency = _urgencyService.CalculateUrgency(donation);
            donation.UrgencyScore = urgency.Score;
            donation.UrgencyLevel = urgency.Level;

            _context.Donations.Add(donation);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetDonationById),
                new { id = donation.DonationId },
                donation);
        }

        // PUT: api/donations/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateDonation(
            int id, [FromBody] Donation updatedDonation)
        {
            var donation = await _context.Donations
                .FirstOrDefaultAsync(d => d.DonationId == id);

            if (donation == null)
                return NotFound("Donation not found.");

            if (string.IsNullOrWhiteSpace(updatedDonation.FoodName))
                return BadRequest("Food name is required.");

            if (updatedDonation.Quantity <= 0)
                return BadRequest("Quantity must be greater than zero.");

            if (updatedDonation.PickupDeadline <= DateTime.UtcNow)
                return BadRequest(
                    "Pickup deadline must be in the future (UTC).");

            if (string.IsNullOrWhiteSpace(updatedDonation.PickupAddress))
                return BadRequest("Pickup address is required.");

            if (string.IsNullOrWhiteSpace(updatedDonation.StorageType))
                return BadRequest("Storage type is required.");

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
            donation.UrgencyScore = urgency.Score;
            donation.UrgencyLevel = urgency.Level;

            await _context.SaveChangesAsync();

            return Ok(donation);
        }

        // DELETE: api/donations/1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDonation(int id)
        {
            var donation = await _context.Donations
                .FirstOrDefaultAsync(d => d.DonationId == id);

            if (donation == null)
                return NotFound("Donation not found.");

            _context.Donations.Remove(donation);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PATCH: api/donations/1/status
        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateDonationStatus(
            int id, [FromBody] DonationStatusRequest request)
        {
            var donation = await _context.Donations
                .FirstOrDefaultAsync(d => d.DonationId == id);

            if (donation == null)
                return NotFound("Donation not found.");

            if (request == null ||
                string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest("Status is required.");
            }

            string newStatus = request.Status.Trim();

            var validStatus = ValidStatuses.FirstOrDefault(
                s => s.Equals(
                    newStatus,
                    StringComparison.OrdinalIgnoreCase));

            if (validStatus == null)
            {
                return BadRequest(
                    "Invalid status. Allowed statuses: " +
                    string.Join(", ", ValidStatuses));
            }

            donation.Status = validStatus;
            donation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(donation);
        }

        // GET: api/donations/1/urgency
        [HttpGet("{id:int}/urgency")]
        public async Task<IActionResult> GetDonationUrgency(int id)
        {
            var donation = await _context.Donations
                .AsNoTracking()
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
            var donations = await _context.Donations
                .AsNoTracking()
                .Where(d => d.Status == "Available")
                .ToListAsync();

            var ranking = donations
                .Select(d => _urgencyService.CalculateUrgency(d))
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
