namespace RescueFlow.API.Models
{
    public class Donation
    {
        public int Id { get; set; }

        public int DonorId { get; set; }

        public string FoodName { get; set; } = string.Empty;

        public string FoodCategory { get; set; } = string.Empty;

        public decimal Quantity { get; set; }

        public string Unit { get; set; } = string.Empty;

        public string FoodCondition { get; set; } = string.Empty;

        public string StorageDetails { get; set; } = string.Empty;

        public DateTime PreparedAt { get; set; }

        public DateTime AvailableUntil { get; set; }

        public DateTime PickupDeadline { get; set; }

        public string Status { get; set; } = "Available";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}