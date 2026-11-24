
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Data;

namespace RescueFlow.API.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly RescueFlowDbContext _context;

        public UsersController(RescueFlowDbContext context)
        {
            _context = context;
        }

        // GET: api/users/volunteers
        [HttpGet("volunteers")]
        [Authorize(Roles = "NGO")]
        public async Task<IActionResult> GetVolunteers()
        {
            var volunteers = await _context.Users
                .AsNoTracking()
                .Where(u =>
                    u.Role == "Volunteer" &&
                    u.IsActive)
                .OrderBy(u => u.FullName)
                .Select(u => new
                {
                    u.UserId,
                    u.FullName
                })
                .ToListAsync();

            return Ok(volunteers);
        }
    }
}
