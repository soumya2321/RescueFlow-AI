
using RescueFlow.API.Models;

namespace RescueFlow.API.Services
{
    public class UrgencyService
    {
        public UrgencyResult CalculateUrgency(Donation donation)
        {
            DateTime now = DateTime.UtcNow;

            DateTime expiry = donation.AvailableUntil.ToUniversalTime();
            DateTime pickup = donation.PickupDeadline.ToUniversalTime();

            double expiryHours = (expiry - now).TotalHours;
            double pickupHours = (pickup - now).TotalHours;

            int score = 0;

            // Rule 1: Food expiry urgency (maximum 50 points)
            if (expiryHours <= 0)
            {
                score += 50;
            }
            else if (expiryHours <= 2)
            {
                score += 45;
            }
            else if (expiryHours <= 6)
            {
                score += 35;
            }
            else if (expiryHours <= 12)
            {
                score += 25;
            }
            else if (expiryHours <= 24)
            {
                score += 15;
            }
            else
            {
                score += 5;
            }

            // Rule 2: Pickup deadline urgency (maximum 30 points)
            if (pickupHours <= 0)
            {
                score += 30;
            }
            else if (pickupHours <= 1)
            {
                score += 25;
            }
            else if (pickupHours <= 3)
            {
                score += 20;
            }
            else if (pickupHours <= 6)
            {
                score += 15;
            }
            else
            {
                score += 5;
            }

            // Rule 3: Food condition (maximum 20 points)
            string condition = donation.FoodCondition.Trim().ToLowerInvariant();

            if (condition == "perishable" ||
                condition == "highly perishable")
            {
                score += 20;
            }
            else if (condition == "fresh")
            {
                score += 15;
            }
            else if (condition == "cooked")
            {
                score += 10;
            }
            else
            {
                score += 5;
            }

            score = Math.Clamp(score, 0, 100);

            string level;

            if (score >= 75)
            {
                level = "Critical";
            }
            else if (score >= 50)
            {
                level = "High";
            }
            else if (score >= 25)
            {
                level = "Medium";
            }
            else
            {
                level = "Low";
            }

            return new UrgencyResult
            {
                DonationId = donation.Id,
                Score = score,
                Level = level,
                HoursUntilExpiry = Math.Round(expiryHours, 2),
                HoursUntilPickupDeadline = Math.Round(pickupHours, 2)
            };
        }
    }

    public class UrgencyResult
    {
        public int DonationId { get; set; }

        public int Score { get; set; }

        public string Level { get; set; } = string.Empty;

        public double HoursUntilExpiry { get; set; }

        public double HoursUntilPickupDeadline { get; set; }
    }
}
