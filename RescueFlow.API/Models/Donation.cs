
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RescueFlow.API.Models
{
    [Table("Donations")]
    public class Donation
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int DonationId { get; set; }

        public int DonorId { get; set; }
public int? AcceptedByNgoId { get; set; }
        [Required]
        [MaxLength(200)]
        public string FoodName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string FoodCategory { get; set; } = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Quantity { get; set; }

        [Required]
        [MaxLength(20)]
        public string Unit { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string FoodCondition { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string StorageType { get; set; } = string.Empty;

        public DateTime PickupDeadline { get; set; }

        [Required]
        [MaxLength(500)]
        public string PickupAddress { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Available";

        [Column(TypeName = "decimal(5,2)")]
        public decimal UrgencyScore { get; set; } = 0;

        [Required]
        [MaxLength(10)]
        public string UrgencyLevel { get; set; } = "Low";

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}
