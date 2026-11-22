
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

        // Donation API
        public DbSet<Donation> Donations { get; set; } = null!;

        // Authentication API
        public DbSet<User> Users => Set<User>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
        }
    }
}
