
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Data;
using System.Security.Claims;

namespace RescueFlow.API.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly RescueFlowDbContext _context;

        public AdminController(RescueFlowDbContext context)
        {
            _context = context;
        }

        private int CurrentUserId()
        {
            return int.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out int userId) ? userId : 0;
        }

        public class UpdateUserStatusRequest
        {
            public bool? IsActive { get; set; }
        }

        // GET: api/admin/dashboard
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var statistics = new
            {
                TotalUsers = await _context.Users.CountAsync(),

                ActiveUsers = await _context.Users
                    .CountAsync(u => u.IsActive),

                InactiveUsers = await _context.Users
                    .CountAsync(u => !u.IsActive),

                TotalDonors = await _context.Users
                    .CountAsync(u => u.Role == "Donor"),

                TotalNGOs = await _context.Users
                    .CountAsync(u => u.Role == "NGO"),

                TotalVolunteers = await _context.Users
                    .CountAsync(u => u.Role == "Volunteer"),

                TotalAdmins = await _context.Users
                    .CountAsync(u => u.Role == "Admin"),

                TotalDonations = await _context.Donations
                    .CountAsync(),

                AvailableDonations = await _context.Donations
                    .CountAsync(d => d.Status == "Available"),

                AcceptedDonations = await _context.Donations
                    .CountAsync(d => d.Status == "Accepted"),

                AssignedDonations = await _context.Donations
                    .CountAsync(d => d.Status == "Assigned"),

                PickedUpDonations = await _context.Donations
                    .CountAsync(d => d.Status == "PickedUp"),

                DeliveredDonations = await _context.Donations
                    .CountAsync(d => d.Status == "Delivered"),

                CompletedDonations = await _context.Donations
                    .CountAsync(d => d.Status == "Completed"),

                CancelledDonations = await _context.Donations
                    .CountAsync(d => d.Status == "Cancelled"),

                ExpiredDonations = await _context.Donations
                    .CountAsync(d => d.Status == "Expired"),

                RejectedDonations = await _context.Donations
                    .CountAsync(d => d.Status == "Rejected"),

                FailedDonations = await _context.Donations
                    .CountAsync(d => d.Status == "Failed"),

                TotalAssignments = await _context
                    .VolunteerAssignments.CountAsync(),

                ActiveAssignments = await _context
                    .VolunteerAssignments.CountAsync(a =>
                        a.Status == "Assigned" ||
                        a.Status == "PickedUp" ||
                        a.Status == "Delivered"),

                CompletedAssignments = await _context
                    .VolunteerAssignments.CountAsync(a =>
                        a.Status == "Completed")
            };

            return Ok(statistics);
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? role,
            [FromQuery] bool? isActive,
            [FromQuery] string? search)
        {
            var query = _context.Users.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(role))
            {
                role = role.Trim();
                query = query.Where(u => u.Role == role);
            }

            if (isActive.HasValue)
            {
                query = query.Where(
                    u => u.IsActive == isActive.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();

                query = query.Where(u =>
                    u.FullName.Contains(search) ||
                    u.Email.Contains(search));
            }

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.Role,
                    u.Phone,
                    u.IsActive,
                    u.CreatedAt,
                    u.UpdatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/admin/users/1
        [HttpGet("users/{id:int}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _context.Users
                .AsNoTracking()
                .Where(u => u.UserId == id)
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.Role,
                    u.Phone,
                    u.IsActive,
                    u.CreatedAt,
                    u.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            return Ok(user);
        }

        // PATCH: api/admin/users/1/status
        [HttpPatch("users/{id:int}/status")]
        public async Task<IActionResult> UpdateUserStatus(
            int id,
            [FromBody] UpdateUserStatusRequest request)
        {
            int adminId = CurrentUserId();

            if (adminId <= 0)
                return Unauthorized();

            if (request == null || !request.IsActive.HasValue)
            {
                return BadRequest(new
                {
                    message = "Account status is required."
                });
            }

            bool isActive = request.IsActive.Value;

            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            // Prevent administrators from deactivating themselves.
            if (user.UserId == adminId && !isActive)
            {
                return BadRequest(new
                {
                    message = "You cannot deactivate your own account."
                });
            }

            // Protect administrator accounts.
            if (user.Role == "Admin" && !isActive)
            {
                return BadRequest(new
                {
                    message = "Administrator accounts cannot be deactivated."
                });
            }

            
 
           // Prevent deactivation during ongoing rescue operations.
if (!isActive && user.IsActive)
{
    bool hasOngoingWork = false;

    if (user.Role == "Donor")
    {
        hasOngoingWork = await _context.Donations
            .AnyAsync(d => d.DonorId == id &&
                (d.Status == "Available" ||
                 d.Status == "Accepted" ||
                 d.Status == "Assigned" ||
                 d.Status == "PickedUp" ||
                 d.Status == "Delivered"));
    }
    else if (user.Role == "NGO")
    {
        hasOngoingWork = await _context.Donations
            .AnyAsync(d => d.AcceptedByNgoId == id &&
                (d.Status == "Accepted" ||
                 d.Status == "Assigned" ||
                 d.Status == "PickedUp" ||
                 d.Status == "Delivered"));

        hasOngoingWork = hasOngoingWork ||
            await _context.VolunteerAssignments
                .AnyAsync(a => a.AssignedByNgoId == id &&
                    (a.Status == "Assigned" ||
                     a.Status == "PickedUp" ||
                     a.Status == "Delivered"));
    }
    else if (user.Role == "Volunteer")
    {
        hasOngoingWork = await _context.VolunteerAssignments
            .AnyAsync(a => a.VolunteerId == id &&
                (a.Status == "Assigned" ||
                 a.Status == "PickedUp" ||
                 a.Status == "Delivered"));
    }

    if (hasOngoingWork)
    {
        return Conflict(new
        {
            message = "Cannot deactivate this account because the user has ongoing rescue operations."
        });
    }
}

user.IsActive = isActive;
user.UpdatedAt = DateTime.UtcNow;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict(new
                {
                    message = "User account has changed. Please refresh and try again."
                });
            }

            return Ok(new
            {
                message = isActive
                    ? "User account activated successfully."
                    : "User account deactivated successfully.",

                user.UserId,
                user.FullName,
                user.Email,
                user.Role,
                user.IsActive,
                user.UpdatedAt
            });
        }
    }
}
