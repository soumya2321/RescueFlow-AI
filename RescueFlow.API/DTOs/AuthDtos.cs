using System.ComponentModel.DataAnnotations;

namespace RescueFlow.API.DTOs;

public class RegisterRequestDto
{
    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(72)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "Donor";

    [MaxLength(20)]
    public string? Phone { get; set; }

    // NGO-specific registration fields

    [MaxLength(200)]
    public string? OrganizationName { get; set; }

    [Range(typeof(decimal), "0.01", "99999999.99")]
    public decimal? MaximumCapacity { get; set; }

    [MaxLength(20)]
    public string? CapacityUnit { get; set; }

    [MaxLength(500)]
    public string? Location { get; set; }
}

public class LoginRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}