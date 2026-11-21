using Microsoft.EntityFrameworkCore;

namespace RescueFlow.API.Data;

public class RescueFlowDbContext : DbContext
{
    public RescueFlowDbContext(DbContextOptions<RescueFlowDbContext> options)
        : base(options)
    {
    }
}
