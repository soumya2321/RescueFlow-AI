using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Data;
using RescueFlow.API.DTOs;
using RescueFlow.API.Models;
using RescueFlow.API.Services;

namespace RescueFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private static readonly string[] AllowedRoles = ["Donor", "NGO", "Volunteer", "Admin"];

    private readonly RescueFlowDbContext _context;
    private readonly JwtTokenService _jwtTokenService;

    public AuthController(RescueFlowDbContext context, JwtTokenService jwtTokenService)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
    }


    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(
        [FromBody] RegisterRequestDto request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.Role))
        {
            return BadRequest(new
            {
                message = "All required fields must be provided."
            });
        }

        var normalizedEmail =
            request.Email.Trim().ToLowerInvariant();

        var normalizedRole = request.Role.Trim();

        // Public registration is restricted to Donors and Volunteers.
        // NGO and Admin accounts must be provisioned securely.
        if (!normalizedRole.Equals(
                "Donor", StringComparison.OrdinalIgnoreCase) &&
            !normalizedRole.Equals(
                "Volunteer", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message =
                    "Public registration allows only Donor and Volunteer roles."
            });
        }

        normalizedRole = normalizedRole.Equals(
            "Donor", StringComparison.OrdinalIgnoreCase)
            ? "Donor"
            : "Volunteer";

        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == normalizedEmail);

        if (emailExists)
        {
            return Conflict(new
            {
                message = "An account with this email already exists."
            });
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = normalizedRole,
            Phone = string.IsNullOrWhiteSpace(request.Phone)
                ? null
                : request.Phone.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwtTokenService.GenerateToken(user);

        return Ok(new AuthResponseDto
        {
            Token = token,
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        });
    }


    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new { message = "This account is inactive." });
        }

        var token = _jwtTokenService.GenerateToken(user);

        return Ok(new AuthResponseDto
        {
            Token = token,
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        });
    }
}