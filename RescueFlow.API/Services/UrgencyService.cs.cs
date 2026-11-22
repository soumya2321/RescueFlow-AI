
using RescueFlow.API.Models;

namespace RescueFlow.API.Services
{
    public class UrgencyService
    {
        public UrgencyResult CalculateUrgency(Donation donation)
        {
            DateTime now = DateTime.UtcNow;

            // SQL Server DATETIME2 does not preserve timezone information.
            // Our application treats pickup deadlines as UTC.
            DateTime pickup = donation.PickupDeadline.Kind switch
            {
                DateTimeKind.Utc => donation.PickupDeadline,
                DateTimeKind.Local =>
                    donation.PickupDeadline.ToUniversalTime(),
                _ => DateTime.SpecifyKind(
                    donation.PickupDeadline, DateTimeKind.Utc)
            };

            double hoursRemaining = (pickup - now).TotalHours;

            // RULE 1: Time remaining (maximum 50 points)
            int timeScore;

            if (hoursRemaining <= 1)
                timeScore = 50;
            else if (hoursRemaining <= 2)
                timeScore = 45;
            else if (hoursRemaining <= 4)
                timeScore = 35;
            else if (hoursRemaining <= 6)
                timeScore = 25;
            else if (hoursRemaining <= 12)
                timeScore = 15;
            else
                timeScore = 5;

            // RULE 2: Food condition (maximum 30 points)
            string condition = (donation.FoodCondition ?? "")
                .Trim()
                .ToLowerInvariant();

            int conditionScore;

            switch (condition)
            {
                case "highly perishable":
                    conditionScore = 30;
                    break;

                case "perishable":
                    conditionScore = 25;
                    break;

                case "cooked":
                    conditionScore = 20;
                    break;

                case "fresh":
                    conditionScore = 15;
                    break;

                case "packed":
                    conditionScore = 5;
                    break;

                default:
                    conditionScore = 10;
                    break;
            }

            // RULE 3: Quantity (maximum 20 points)
            // Thresholds apply to kilograms only.
            // Other units receive a neutral baseline until
            // unit-specific scoring rules are defined.
            string unit = (donation.Unit ?? "")
                .Trim()
                .ToLowerInvariant();

            int quantityScore;

            if (unit == "kg" || unit == "kilogram" ||
                unit == "kilograms")
            {
                if (donation.Quantity >= 50)
                    quantityScore = 20;
                else if (donation.Quantity >= 20)
                    quantityScore = 15;
                else if (donation.Quantity >= 10)
                    quantityScore = 10;
                else
                    quantityScore = 5;
            }
            else
            {
                quantityScore = 10;
            }

            // TOTAL: Maximum 100 points
            int score = Math.Clamp(
                timeScore + conditionScore + quantityScore,
                0,
                100);

            string level;

            if (score >= 75)
                level = "Critical";
            else if (score >= 50)
                level = "High";
            else if (score >= 25)
                level = "Medium";
            else
                level = "Low";

            return new UrgencyResult
            {
                DonationId = donation.DonationId,
                Score = score,
                Level = level,
                HoursUntilPickupDeadline =
                    Math.Round(hoursRemaining, 2)
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
