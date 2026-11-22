
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RescueFlow.API.Models
{
    [Table("VolunteerAssignments")]
    public class VolunteerAssignment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AssignmentId { get; set; }

        [Required]
        public int DonationId { get; set; }

        [Required]
        public int VolunteerId { get; set; }

        [Required]
        public int AssignedByNgoId { get; set; }

        [Required]
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Assigned";
    }
}
