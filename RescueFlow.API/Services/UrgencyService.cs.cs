
using RescueFlow.API.Models;

namespace RescueFlow.API.Services
{
    public class UrgencyService
    {
        public UrgencyResult CalculateUrgency(Donation donation)
        {
            DateTime now = DateTime.UtcNow;

            DateTime pickup = donation.PickupDeadline.Kind switch
            {
                DateTimeKind.Utc => donation.PickupDeadline,
                DateTimeKind.Local => donation.PickupDeadline.ToUniversalTime(),
                _ => DateTime.SpecifyKind(
                    donation.PickupDeadline,
                    DateTimeKind.Utc)
            };

            double pickupHours = (pickup - now).TotalHours;

            int score = 0;

            // Rule 1: Pickup deadline urgency (maximum 80 points)
            if (pickupHours <= 0)
            {
                score += 80;
            }
            else if (pickupHours <= 1)
            {
                score += 75;
            }
            else if (pickupHours <= 3)
            {
                score += 65;
            }
            else if (pickupHours <= 6)
            {
                score += 50;
            }
            else if (pickupHours <= 12)
            {
                score += 35;
            }
            else if (pickupHours <= 24)
            {
                score += 20;
            }
            else
            {
                score += 5;
            }

            // Rule 2: Food condition (maximum 20 points)
            string condition = (donation.FoodCondition ?? "")
                .Trim()
                .ToLowerInvariant();

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
                DonationId = donation.DonationId,
                Score = score,
                Level = level,
                HoursUntilPickupDeadline = Math.Round(pickupHours, 2)
            };
        }
    }

    public class UrgencyResult
    {
        public int DonationId { get; set; }

        public int Score { get; set; }

        public string Level { get; set; } = string.Empty;

        public double HoursUntilPickupDeadline { get; set; }
    }
}
