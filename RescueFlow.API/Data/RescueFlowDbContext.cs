
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

        public DbSet<Donation> Donations { get; set; } = null!;

        public DbSet<User> Users => Set<User>();

        public DbSet<VolunteerAssignment> VolunteerAssignments
            => Set<VolunteerAssignment>();

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<VolunteerAssignment>(entity =>
            {
                entity.HasOne<Donation>()
                    .WithMany()
                    .HasForeignKey(a => a.DonationId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(a => a.VolunteerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(a => a.AssignedByNgoId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(a => a.DonationId)
                    .IsUnique();
            });
        }
    }
}
