using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Data;
using RescueFlow.API.DTOs;
using RescueFlow.API.Models;
using RescueFlow.API.Services;
using Microsoft.AspNetCore.RateLimiting;

namespace RescueFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly RescueFlowDbContext _context;
    private readonly JwtTokenService _jwtTokenService;

    public AuthController(RescueFlowDbContext context, JwtTokenService jwtTokenService)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("register")]
    [EnableRateLimiting("AuthPolicy")]
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

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var normalizedRole = request.Role.Trim();

        normalizedRole = normalizedRole.ToLowerInvariant() switch
        {
            "donor" => "Donor", "volunteer" => "Volunteer", "ngo" => "NGO", _ => ""
        };
        if (normalizedRole == "") return BadRequest(new { message = "Invalid registration role." });
        if (System.Text.Encoding.UTF8.GetByteCount(request.Password) > 72)
            return BadRequest(new { message = "Password exceeds 72 bytes." });
        if (normalizedRole == "NGO" && (string.IsNullOrWhiteSpace(request.OrganizationName) ||
            string.IsNullOrWhiteSpace(request.CapacityUnit) || string.IsNullOrWhiteSpace(request.Location) ||
            request.MaximumCapacity is not decimal capacity || capacity <= 0 || capacity > 99999999.99m || decimal.Round(capacity, 2) != capacity))
            return BadRequest(new { message = "Valid organization, capacity, unit and location are required." });

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
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = normalizedRole,
            Phone = string.IsNullOrWhiteSpace(request.Phone)
                ? null
                : request.Phone.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        if (normalizedRole == "NGO")
            _context.NGOProfiles.Add(new NGOProfile {
                User = user, OrganizationName = request.OrganizationName!.Trim(),
                MaximumCapacity = request.MaximumCapacity!.Value, CapacityUnit = request.CapacityUnit!.Trim(),
                Location = request.Location!.Trim(), VerificationStatus = "Pending", IsVerified = false
            });
        if (normalizedRole == "NGO") await NotificationService.Admins(_context, "A new NGO has submitted a profile for review.");
        try { await _context.SaveChangesAsync(); }
        catch (DbUpdateException ex) when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sql && (sql.Number == 2601 || sql.Number == 2627))
        { return Conflict(new { message = "An account or profile already exists." }); }

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
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new { message = "This account is deactivated." });
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

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<object>> GetCurrentUser()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                          ?? User.FindFirstValue("sub");

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Invalid token claims." });
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user is null || !user.IsActive)
        {
            return Unauthorized(new { message = "User not found or inactive." });
        }

        return Ok(new
        {
            user.UserId,
            user.FullName,
            user.Email,
            user.Role,
            user.Phone,
            user.IsActive
        });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileRequestDto request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                          ?? User.FindFirstValue("sub");

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);

        if (user == null || !user.IsActive)
        {
            return Unauthorized(new
            {
                message = "User not found or inactive."
            });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var emailExists = await _context.Users.AnyAsync(u =>
            u.Email.ToLower() == normalizedEmail &&
            u.UserId != userId);

        if (emailExists)
        {
            return Conflict(new
            {
                message = "Email is already used by another account."
            });
        }

        user.FullName = request.FullName.Trim();
        user.Email = normalizedEmail;
        user.Phone = string.IsNullOrWhiteSpace(request.Phone)
            ? null
            : request.Phone.Trim();

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Profile updated successfully.",
            user.UserId,
            user.FullName,
            user.Email,
            user.Role,
            user.Phone,
            user.IsActive
        });
    }


    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequestDto request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                          ?? User.FindFirstValue("sub");

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);

        if (user == null || !user.IsActive)
        {
            return Unauthorized(new
            {
                message = "User not found or inactive."
            });
        }

        if (!BCrypt.Net.BCrypt.Verify(
            request.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new
            {
                message = "Current password is incorrect."
            });
        }

        if (System.Text.Encoding.UTF8.GetByteCount(
            request.NewPassword) > 72)
        {
            return BadRequest(new
            {
                message = "New password exceeds the supported length."
            });
        }

        if (request.CurrentPassword == request.NewPassword)
        {
            return BadRequest(new
            {
                message = "New password must differ from the current password."
            });
        }

        user.PasswordHash =
            BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Password changed successfully."
        });
    }


}