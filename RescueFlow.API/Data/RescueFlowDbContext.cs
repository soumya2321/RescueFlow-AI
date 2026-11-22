
using Microsoft.EntityFrameworkCore;
using RescueFlow.API.Models;

namespace RescueFlow.API.Data
{
    public class RescueFlowDbContext : DbContext
    {
        public RescueFlowDbContext(
            DbContextOptions<RescueFlowDbContext> options)
            : base(options)
        {
        }

        public DbSet<Donation> Donations { get; set; }
            = null!;
    }
}
