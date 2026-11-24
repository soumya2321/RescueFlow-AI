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

        public DbSet<NGOProfile> NGOProfiles
            => Set<NGOProfile>();

        public DbSet<Notification> Notifications => Set<Notification>();

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Notification>(e => {
                e.ToTable("Notifications", "dbo");
                e.HasOne<User>().WithMany().HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(n => new { n.UserId, n.IsRead, n.NotificationId });
                e.HasIndex(n => new { n.UserId, n.NotificationId });
            });

            // User configuration
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Donation configuration
            modelBuilder.Entity<Donation>(entity =>
            {
                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(d => d.AcceptedByNgoId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_Donations_AcceptedByNgo");

                entity.HasIndex(d => d.AcceptedByNgoId)
                    .HasDatabaseName("IX_Donations_AcceptedByNgoId");

                entity.Property(d => d.Status)
                    .IsConcurrencyToken();

                entity.Property(d => d.AcceptedByNgoId)
                    .IsConcurrencyToken();
            });

            // Volunteer assignment configuration
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

            // NGO profile configuration
            modelBuilder.Entity<NGOProfile>(entity =>
            {
                entity.ToTable("NGOProfiles", "dbo");

                entity.HasKey(n => n.NGOProfileId)
                    .HasName("PK_NGOProfiles");

                entity.Property(n => n.NGOProfileId)
                    .ValueGeneratedOnAdd();

                entity.HasOne(n => n.User)
                    .WithOne()
                    .HasForeignKey<NGOProfile>(n => n.UserId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_NGOProfiles_Users");

                entity.HasIndex(n => n.UserId)
                    .IsUnique()
                    .HasDatabaseName("UQ_NGOProfiles_UserId");

                entity.Property(n => n.OrganizationName)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(n => n.MaximumCapacity)
                    .HasPrecision(10, 2);

                entity.Property(n => n.CapacityUnit)
                    .HasMaxLength(20)
                    .IsRequired();

                entity.Property(n => n.Location)
                    .HasMaxLength(500)
                    .IsRequired();

                entity.Property(n => n.VerificationStatus).IsConcurrencyToken();

                entity.Property(n => n.IsVerified)
                    .HasDefaultValue(false)
                    .IsConcurrencyToken();
            });
        }
    }
}