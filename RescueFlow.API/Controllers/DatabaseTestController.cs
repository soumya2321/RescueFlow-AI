using Microsoft.AspNetCore.Mvc;
using RescueFlow.API.Data;

namespace RescueFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DatabaseTestController : ControllerBase
{
    private readonly RescueFlowDbContext _context;
    private readonly ILogger<DatabaseTestController> _logger;

    public DatabaseTestController(RescueFlowDbContext context, ILogger<DatabaseTestController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("connection")]
    public async Task<IActionResult> TestConnection()
    {
        try
        {
            bool canConnect = await _context.Database.CanConnectAsync();

            if (canConnect)
            {
                return Ok(new
                {
                    success = true,
                    message = "Successfully connected to the RescueFlowDB database."
                });
            }

            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                success = false,
                message = "Unable to establish a connection to the database."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while testing the database connection.");

            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                success = false,
                message = "A database connection error occurred while processing the request."
            });
        }
    }
}
