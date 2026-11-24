using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RescueFlow.API.Models
{
    [Table("NGOProfiles")]
    public class NGOProfile
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int NGOProfileId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(200)]
        public string OrganizationName { get; set; } = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal MaximumCapacity { get; set; }

        [Required]
        [MaxLength(20)]
        public string CapacityUnit { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Location { get; set; } = string.Empty;

        [MaxLength(20)]
        public string VerificationStatus { get; set; } = "Pending";

        public bool IsVerified { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
    }
}