using RescueFlow.API.Models;

namespace RescueFlow.API.Services
{
    public class UrgencyService
    {
        public UrgencyResult CalculateUrgency(Donation donation)
        {
            DateTime now = DateTime.UtcNow;

            // Convert pickup deadline to UTC
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

            if (hoursRemaining <= 0)
                timeScore = 0;
            else if (hoursRemaining <= 2)
                timeScore = 50;
            else if (hoursRemaining <= 6)
                timeScore = 40;
            else if (hoursRemaining <= 12)
                timeScore = 30;
            else if (hoursRemaining <= 24)
                timeScore = 20;
            else if (hoursRemaining <= 48)
                timeScore = 10;
            else
                timeScore = 0;

            // RULE 2: Food condition (maximum 30 points)
            string condition = (donation.FoodCondition ?? "")
                .Trim()
                .ToLowerInvariant();

            int conditionScore;
            bool safeToDonate = true;

            switch (condition)
            {
                case "highly perishable":
                case "near expiry":
                case "near-expiry":
                    conditionScore = 30;
                    break;

                case "perishable":
                case "leftover":
                    conditionScore = 25;
                    break;

                case "cooked":
                    conditionScore = 20;
                    break;

                case "fresh":
                    conditionScore = 15;
                    break;

                case "packed":
                case "long shelf life":
                    conditionScore = 5;
                    break;

                case "expired":
                case "unsafe":
                case "spoiled":
                    conditionScore = 0;
                    safeToDonate = false;
                    break;

                default:
                    conditionScore = 10;
                    break;
            }

            // RULE 3: Quantity (maximum 20 points)
            // Quantity thresholds apply to kilograms only.
            string unit = (donation.Unit ?? "")
                .Trim()
                .ToLowerInvariant();

            int quantityScore;

            if (unit == "kg" ||
                unit == "kilogram" ||
                unit == "kilograms")
            {
                if (donation.Quantity > 20)
                    quantityScore = 20;
                else if (donation.Quantity > 10)
                    quantityScore = 15;
                else if (donation.Quantity > 5)
                    quantityScore = 10;
                else
                    quantityScore = 5;
            }
            else
            {
                // Neutral score for other units
                quantityScore = 10;
            }

            // Eligibility
            bool isEligible =
                hoursRemaining > 0 && safeToDonate;

            // Total score (maximum 100)
            int score = isEligible
                ? Math.Clamp(
                    timeScore + conditionScore + quantityScore,
                    0,
                    100)
                : 0;

            // Urgency level
            string level;

            if (!isEligible && hoursRemaining <= 0)
                level = "Expired";
            else if (!isEligible)
                level = "Ineligible";
            else if (score >= 80)
                level = "Critical";
            else if (score >= 60)
                level = "High";
            else if (score >= 35)
                level = "Medium";
            else
                level = "Low";

            return new UrgencyResult
            {
                DonationId = donation.DonationId,
                Score = score,
                Level = level,
                Eligible = isEligible,
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

        public bool Eligible { get; set; }

        public double HoursUntilPickupDeadline { get; set; }
    }
}