
using Microsoft.AspNetCore.Mvc;
using RescueFlow.API.Models;
using RescueFlow.API.Services;

namespace RescueFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DonationsController : ControllerBase
    {
        private static readonly List<Donation> donations = new();
        private static int nextId = 1;

        private readonly UrgencyService urgencyService = new();

        private static readonly string[] ValidStatuses =
        {
            "Available",
            "Accepted",
            "PickedUp",
            "Delivered",
            "Expired",
            "Cancelled"
        };

        // GET: api/donations
        [HttpGet]
        public ActionResult<IEnumerable<Donation>> GetDonations()
        {
            return Ok(donations);
        }

        // GET: api/donations/1
        [HttpGet("{id}")]
        public ActionResult<Donation> GetDonationById(int id)
        {
            var donation = donations.FirstOrDefault(d => d.Id == id);

            if (donation == null)
                return NotFound("Donation not found.");

            return Ok(donation);
        }

        // POST: api/donations
        [HttpPost]
        public ActionResult<Donation> CreateDonation(
            [FromBody] Donation donation)
        {
            if (string.IsNullOrWhiteSpace(donation.FoodName))
                return BadRequest("Food name is required.");

            if (donation.Quantity <= 0)
                return BadRequest("Quantity must be greater than zero.");

            if (donation.AvailableUntil <= donation.PreparedAt)
                return BadRequest(
                    "AvailableUntil must be after PreparedAt.");

            donation.Id = nextId++;
            donation.Status = "Available";
            donation.CreatedAt = DateTime.UtcNow;

            donations.Add(donation);

            return StatusCode(201, donation);
        }

        // PUT: api/donations/1
        [HttpPut("{id}")]
        public IActionResult UpdateDonation(
            int id, [FromBody] Donation updatedDonation)
        {
            var donation = donations.FirstOrDefault(d => d.Id == id);

            if (donation == null)
                return NotFound("Donation not found.");

            if (string.IsNullOrWhiteSpace(updatedDonation.FoodName))
                return BadRequest("Food name is required.");

            if (updatedDonation.Quantity <= 0)
                return BadRequest("Quantity must be greater than zero.");

            if (updatedDonation.AvailableUntil <= updatedDonation.PreparedAt)
                return BadRequest(
                    "AvailableUntil must be after PreparedAt.");

            donation.DonorId = updatedDonation.DonorId;
            donation.FoodName = updatedDonation.FoodName;
            donation.FoodCategory = updatedDonation.FoodCategory;
            donation.Quantity = updatedDonation.Quantity;
            donation.Unit = updatedDonation.Unit;
            donation.FoodCondition = updatedDonation.FoodCondition;
            donation.StorageDetails = updatedDonation.StorageDetails;
            donation.PreparedAt = updatedDonation.PreparedAt;
            donation.AvailableUntil = updatedDonation.AvailableUntil;
            donation.PickupDeadline = updatedDonation.PickupDeadline;

            return Ok(donation);
        }

        // DELETE: api/donations/1
        [HttpDelete("{id}")]
        public IActionResult DeleteDonation(int id)
        {
            var donation = donations.FirstOrDefault(d => d.Id == id);

            if (donation == null)
                return NotFound("Donation not found.");

            donations.Remove(donation);

            return NoContent();
        }

        // PATCH: api/donations/1/status
        [HttpPatch("{id}/status")]
        public IActionResult UpdateDonationStatus(
            int id, [FromBody] DonationStatusRequest request)
        {
            var donation = donations.FirstOrDefault(d => d.Id == id);

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

            return Ok(donation);
        }

        // GET: api/donations/1/urgency
        [HttpGet("{id}/urgency")]
        public IActionResult GetDonationUrgency(int id)
        {
            var donation = donations.FirstOrDefault(d => d.Id == id);

            if (donation == null)
                return NotFound("Donation not found.");

            var urgency = urgencyService.CalculateUrgency(donation);

            return Ok(urgency);
        }

        // GET: api/donations/urgency-ranking
        [HttpGet("urgency-ranking")]
        public IActionResult GetUrgencyRanking()
        {
            var ranking = donations
                .Where(d => d.Status == "Available")
                .Select(d => urgencyService.CalculateUrgency(d))
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
