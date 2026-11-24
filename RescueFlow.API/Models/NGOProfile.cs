using System;
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
        public decimal? MaximumCapacity { get; set; }

        [MaxLength(50)]
        public string? CapacityUnit { get; set; }

        [MaxLength(500)]
        public string? Location { get; set; }

        public bool IsVerified { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
