# RescueFlow AI — Database Design Document

> Comprehensive database architecture, design rationale, and backend integration guide.

---

## Table of Contents

- [1. Database Overview](#1-database-overview)
- [2. Architecture](#2-architecture)
- [3. Design Rationale](#3-design-rationale)
- [4. Table Relationships](#4-table-relationships)
- [5. Status Workflows](#5-status-workflows)
- [6. Normalization](#6-normalization)
- [7. How to Create the Database](#7-how-to-create-the-database)
- [8. ASP.NET Core Integration Guide](#8-aspnet-core-integration-guide)
- [9. Database Testing](#9-database-testing)
- [10. Presenting to Your Mentor](#10-presenting-to-your-mentor)

---

## 1. Database Overview

| Property | Value |
|---|---|
| **Database Name** | RescueFlowDB |
| **Database Engine** | Microsoft SQL Server 2025 |
| **Management Tool** | SQL Server Management Studio (SSMS) |
| **ORM** | Entity Framework Core (EF Core) |
| **Backend** | C# ASP.NET Core Web API (.NET 10) |
| **Number of Tables** | 5 |
| **Total Columns** | 50 |
| **Foreign Keys** | 6 |
| **Check Constraints** | 9 |
| **Indexes** | 11 |

**Purpose:** RescueFlowDB stores all data for the RescueFlow AI food waste prevention system — user accounts, NGO profiles, food donations, and pickup/delivery tracking.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Browser)                     │
│              HTML, CSS, JavaScript, Bootstrap             │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP (REST API calls)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              ASP.NET Core Web API (.NET 10)               │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Controllers  │  │  Services    │  │  EF Core       │  │
│  │ (API layer)  │→ │ (Business    │→ │ (DbContext,    │  │
│  │              │  │  logic,      │  │  Entity models,│  │
│  │              │  │  validation) │  │  migrations)   │  │
│  └─────────────┘  └──────────────┘  └───────┬────────┘  │
└──────────────────────────────────────────────┼──────────┘
                                               │  SQL queries
                                               ▼
                       ┌──────────────────────────────────┐
                       │     SQL Server 2025               │
                       │     Database: RescueFlowDB        │
                       │                                    │
                       │  ┌────────┐  ┌──────────────┐    │
                       │  │ Users  │  │ NGOProfiles   │    │
                       │  └────────┘  └──────────────┘    │
                       │  ┌───────────────────────────┐    │
                       │  │ NGOAcceptedCategories      │    │
                       │  └───────────────────────────┘    │
                       │  ┌────────────┐  ┌────────────┐  │
                       │  │ Donations  │  │ PickupTasks │  │
                       │  └────────────┘  └────────────┘  │
                       └──────────────────────────────────┘
```

### Data Flow

1. **Donor** registers → row inserted in `Users` (Role = 'Donor').
2. **NGO** registers → row in `Users` (Role = 'NGO') + row in `NGOProfiles` + rows in `NGOAcceptedCategories`.
3. **Donor creates donation** → row in `Donations` (Status = 'Available').
4. **Backend calculates urgency** → `UrgencyScore` and `UrgencyLevel` updated.
5. **NGO accepts donation** → row in `PickupTasks` (Status = 'Pending'), Donation status → 'Accepted'.
6. **Volunteer assigned** → `PickupTasks.VolunteerId` set, status → 'Assigned'.
7. **Volunteer picks up** → `ActualPickupTime` set, status → 'PickedUp'.
8. **Volunteer delivers** → `ActualDeliveryTime` set, status → 'Delivered'.
9. **Confirmed** → Donation status → 'Completed'.

---

## 3. Design Rationale

### Why a single Users table?

All user types share the same authentication fields (email, password, role). Instead of creating separate `Donors`, `NGOs`, `Volunteers`, and `Admins` tables with duplicated columns, we use one `Users` table with a `Role` column. Role-specific data (like NGO capacity) goes in separate profile tables.

**Benefit:** Simpler authentication, single login endpoint, no code duplication.

### Why NVARCHAR instead of VARCHAR?

NVARCHAR stores Unicode characters (UTF-16). Indian names, addresses, and food items may contain characters outside the ASCII range. NVARCHAR ensures they're stored correctly.

**Example:** `N'राजेश पटेल'` works with NVARCHAR but may corrupt with VARCHAR.

### Why DECIMAL instead of FLOAT?

FLOAT uses binary floating-point, which can't represent some decimal values exactly:
- `0.1 + 0.2` in FLOAT might equal `0.30000000000000004`
- In DECIMAL, `0.1 + 0.2 = 0.3` exactly

For quantities (food weight, NGO capacity), we need exact values. DECIMAL(10,2) stores up to 99,999,999.99 with exactly 2 decimal places.

### Why DATETIME2 instead of DATETIME?

| Feature | DATETIME | DATETIME2 |
|---|---|---|
| Range | 1753–9999 | 0001–9999 |
| Precision | 3.33 ms | 100 nanoseconds |
| Storage | 8 bytes | 6–8 bytes |
| SQL standard | No | Yes |
| EF Core default | No | Yes |

DATETIME2 is the modern standard for SQL Server and is what EF Core maps `DateTime` to by default.

### Why INT IDENTITY primary keys?

- **Simple**: Auto-incremented by SQL Server, no code needed.
- **Fast**: Integer comparisons are faster than string comparisons.
- **EF Core compatible**: EF Core auto-detects IDENTITY columns.
- **Compact**: 4 bytes per key, efficient for joins and indexes.

For a production system at scale, you might consider GUIDs. For a college MVP, INT is perfect.

### Why soft-delete with IsActive?

Deleting a donor who has completed donations would break the impact dashboard. Instead, we set `IsActive = 0` to deactivate them while preserving all their historical data.

---

## 4. Table Relationships

See [RescueFlow_ERD.md](../diagrams/RescueFlow_ERD.md) for the visual ER diagram.

### FK Delete/Update Behavior

| FK | ON DELETE | ON UPDATE | Rationale |
|---|---|---|---|
| NGOProfiles → Users | CASCADE | CASCADE | Profile is meaningless without its user |
| NGOAcceptedCategories → NGOProfiles | CASCADE | CASCADE | Categories belong to the profile |
| Donations → Users | NO ACTION | CASCADE | Preserve donation history even if donor account is removed |
| PickupTasks → Donations | CASCADE | CASCADE | Task is meaningless without its donation |
| PickupTasks → Users (NGO) | NO ACTION | NO ACTION | Preserve task history; can't cascade (multiple FK paths) |
| PickupTasks → Users (Volunteer) | SET NULL | NO ACTION | Unassign volunteer if their account is removed |

> **Note on NO ACTION for PickupTasks → Users:** SQL Server doesn't allow multiple CASCADE paths from the same table. Since Users is referenced by both NGOId and VolunteerId in PickupTasks, we use NO ACTION for NGOId and SET NULL for VolunteerId. The backend enforces that you cannot delete a user who has active tasks.

---

## 5. Status Workflows

### Donation Status Transitions

| Current Status | Allowed Next Statuses | Who Triggers It |
|---|---|---|
| Available | Accepted, Cancelled, Expired, Rejected | NGO, Donor, System |
| Accepted | Assigned, Cancelled | System, NGO/Donor |
| Assigned | PickedUp, Failed, Cancelled | Volunteer, System |
| PickedUp | Delivered, Failed | Volunteer, System |
| Delivered | Completed | NGO, Admin |
| Completed | *(terminal)* | — |
| Rejected | *(terminal)* | — |
| Cancelled | *(terminal)* | — |
| Expired | *(terminal)* | — |
| Failed | *(terminal)* | — |

### Where are transitions validated?

**In the backend C# code, NOT in SQL triggers.** The database CHECK constraint ensures only valid status *values* are stored (e.g., you can't set Status = 'InvalidStatus'). But the *transition logic* (e.g., "Available can go to Accepted but not directly to Completed") is enforced by the service layer in C#.

**Why?** SQL triggers are:
- Hard to debug and test
- Invisible to developers reading the code
- Difficult to explain during project viva
- Not recommended with EF Core

---

## 6. Normalization

### First Normal Form (1NF) ✅

All columns contain atomic (single) values. Food categories for NGOs are stored as separate rows in `NGOAcceptedCategories`, not as comma-separated strings.

**Bad (violates 1NF):**

```
NGOProfiles: AcceptedCategories = "Cooked Food, Raw Vegetables, Bakery Items"
```

**Good (follows 1NF):**

```
NGOAcceptedCategories:
  Row 1: NGOProfileId=1, FoodCategory="Cooked Food"
  Row 2: NGOProfileId=1, FoodCategory="Raw Vegetables"
  Row 3: NGOProfileId=1, FoodCategory="Bakery Items"
```

### Second Normal Form (2NF) ✅

Every non-key column depends on the entire primary key. Since all our primary keys are single columns, 2NF is automatically satisfied.

### Third Normal Form (3NF) ✅

No transitive dependencies:
- NGO details → `NGOProfiles` (not duplicated in `PickupTasks`)
- Donor details → `Users` (not duplicated in `Donations`)

**Deliberate denormalization:** `UrgencyLevel` could theoretically be derived from `UrgencyScore` using a CASE expression. We store both because:
1. It avoids recalculating on every query.
2. The backend may use a complex algorithm that changes over time.
3. It simplifies frontend display.

This is a documented, intentional decision — not a normalization error.

---

## 7. How to Create the Database

### Prerequisites

1. **SQL Server 2025** installed and running.
2. **SQL Server Management Studio (SSMS)** installed.

### Step-by-Step Instructions

1. **Open SSMS** and connect to your SQL Server instance.
   - Server name: usually `localhost` or `.\SQLEXPRESS` or `(localdb)\MSSQLLocalDB`
   - Authentication: Windows Authentication (or SQL Server Authentication if configured)

2. **Run the scripts in order:**

   | Step | File | What It Does |
   |---|---|---|
   | 1 | `01_CreateDatabase.sql` | Creates the RescueFlowDB database |
   | 2 | `02_CreateTables.sql` | Creates all 5 tables |
   | 3 | `03_CreateConstraintsAndIndexes.sql` | Adds CHECK constraints and indexes |
   | 4 | `04_InsertSampleData.sql` | Inserts test data |
   | 5 | `05_TestQueries.sql` | Verifies everything works |

3. **For each script:**
   - File → Open → File → navigate to the script
   - Make sure "RescueFlowDB" is selected in the database dropdown (top-left of SSMS)
   - Click **Execute** (or press **F5**)
   - Check the **Messages** tab at the bottom for success/error messages

4. **Verify:** After running all 5 scripts, expand your database in the Object Explorer:
   ```
   Databases
   └── RescueFlowDB
       ├── Tables
       │   ├── dbo.Users
       │   ├── dbo.NGOProfiles
       │   ├── dbo.NGOAcceptedCategories
       │   ├── dbo.Donations
       │   └── dbo.PickupTasks
       └── ...
   ```

### Common Issues

| Problem | Solution |
|---|---|
| "Login failed" | Check your SQL Server is running (Services → SQL Server) |
| "Database already exists" | The script handles this — it prints a message and continues |
| "Cannot insert duplicate key" | Sample data was already inserted. The script skips if data exists. |
| Wrong database selected | Check the database dropdown in SSMS toolbar |

---

## 8. ASP.NET Core Integration Guide

> **Note:** This section provides guidance for your backend developer. You don't need to implement all of this — just share it with your teammate.

### 8.1 Connection String

Add this to `appsettings.json` (do NOT put real credentials in source control):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=RescueFlowDB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
}
```

For SQL Server Authentication (instead of Windows Authentication):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=RescueFlowDB;User Id=YOUR_USERNAME;Password=YOUR_PASSWORD;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
}
```

> **⚠️ Security:** For production, use environment variables or Azure Key Vault for credentials. Never commit passwords to Git.

### 8.2 NuGet Packages

Install these packages in the backend project:

```bash
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.EntityFrameworkCore.Design
```

### 8.3 Entity Classes

Create a `Models/` folder in the backend project with these C# classes:

```csharp
// Models/User.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RescueFlowAI.Models;

[Table("Users")]
public class User
{
    [Key]
    public int UserId { get; set; }

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Role { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    // Navigation properties
    public NGOProfile? NGOProfile { get; set; }
    public ICollection<Donation> Donations { get; set; } = new List<Donation>();
}
```

```csharp
// Models/NGOProfile.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RescueFlowAI.Models;

[Table("NGOProfiles")]
public class NGOProfile
{
    [Key]
    public int NGOProfileId { get; set; }

    public int UserId { get; set; }

    [Required, MaxLength(200)]
    public string OrganizationName { get; set; } = string.Empty;

    [Column(TypeName = "decimal(10,2)")]
    public decimal MaximumCapacity { get; set; }

    [Required, MaxLength(20)]
    public string CapacityUnit { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string Location { get; set; } = string.Empty;

    public bool IsVerified { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    // Navigation properties
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    public ICollection<NGOAcceptedCategory> AcceptedCategories { get; set; }
        = new List<NGOAcceptedCategory>();
}
```

```csharp
// Models/NGOAcceptedCategory.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RescueFlowAI.Models;

[Table("NGOAcceptedCategories")]
public class NGOAcceptedCategory
{
    [Key]
    public int NGOAcceptedCategoryId { get; set; }

    public int NGOProfileId { get; set; }

    [Required, MaxLength(50)]
    public string FoodCategory { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    // Navigation property
    [ForeignKey("NGOProfileId")]
    public NGOProfile NGOProfile { get; set; } = null!;
}
```

```csharp
// Models/Donation.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RescueFlowAI.Models;

[Table("Donations")]
public class Donation
{
    [Key]
    public int DonationId { get; set; }

    public int DonorId { get; set; }

    [Required, MaxLength(200)]
    public string FoodName { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string FoodCategory { get; set; } = string.Empty;

    [Column(TypeName = "decimal(10,2)")]
    public decimal Quantity { get; set; }

    [Required, MaxLength(20)]
    public string Unit { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string FoodCondition { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string StorageType { get; set; } = string.Empty;

    public DateTime PickupDeadline { get; set; }

    [Required, MaxLength(500)]
    public string PickupAddress { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required, MaxLength(20)]
    public string Status { get; set; } = "Available";

    [Column(TypeName = "decimal(5,2)")]
    public decimal UrgencyScore { get; set; } = 0;

    [Required, MaxLength(10)]
    public string UrgencyLevel { get; set; } = "Low";

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    // Navigation properties
    [ForeignKey("DonorId")]
    public User Donor { get; set; } = null!;

    public PickupTask? PickupTask { get; set; }
}
```

```csharp
// Models/PickupTask.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RescueFlowAI.Models;

[Table("PickupTasks")]
public class PickupTask
{
    [Key]
    public int PickupTaskId { get; set; }

    public int DonationId { get; set; }

    public int NGOId { get; set; }

    public int? VolunteerId { get; set; }

    public DateTime? AssignedAt { get; set; }
    public DateTime? ScheduledPickupTime { get; set; }
    public DateTime? ActualPickupTime { get; set; }
    public DateTime? ActualDeliveryTime { get; set; }

    [Required, MaxLength(20)]
    public string Status { get; set; } = "Pending";

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    // Navigation properties
    [ForeignKey("DonationId")]
    public Donation Donation { get; set; } = null!;

    [ForeignKey("NGOId")]
    public User NGO { get; set; } = null!;

    [ForeignKey("VolunteerId")]
    public User? Volunteer { get; set; }
}
```

### 8.4 DbContext

```csharp
// Data/RescueFlowDbContext.cs
using Microsoft.EntityFrameworkCore;
using RescueFlowAI.Models;

namespace RescueFlowAI.Data;

public class RescueFlowDbContext : DbContext
{
    public RescueFlowDbContext(DbContextOptions<RescueFlowDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<NGOProfile> NGOProfiles { get; set; }
    public DbSet<NGOAcceptedCategory> NGOAcceptedCategories { get; set; }
    public DbSet<Donation> Donations { get; set; }
    public DbSet<PickupTask> PickupTasks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Users: unique email
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // NGOProfiles: one-to-one with Users
        modelBuilder.Entity<NGOProfile>()
            .HasOne(np => np.User)
            .WithOne(u => u.NGOProfile)
            .HasForeignKey<NGOProfile>(np => np.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // NGOAcceptedCategories: unique (NGOProfileId, FoodCategory)
        modelBuilder.Entity<NGOAcceptedCategory>()
            .HasIndex(nac => new { nac.NGOProfileId, nac.FoodCategory })
            .IsUnique();

        // Donations: FK to Users (DonorId), NO ACTION on delete
        modelBuilder.Entity<Donation>()
            .HasOne(d => d.Donor)
            .WithMany(u => u.Donations)
            .HasForeignKey(d => d.DonorId)
            .OnDelete(DeleteBehavior.NoAction);

        // PickupTasks: unique DonationId (one task per donation)
        modelBuilder.Entity<PickupTask>()
            .HasIndex(pt => pt.DonationId)
            .IsUnique();

        // PickupTasks: FK to Donations, CASCADE on delete
        modelBuilder.Entity<PickupTask>()
            .HasOne(pt => pt.Donation)
            .WithOne(d => d.PickupTask)
            .HasForeignKey<PickupTask>(pt => pt.DonationId)
            .OnDelete(DeleteBehavior.Cascade);

        // PickupTasks: FK to Users (NGOId), NO ACTION on delete
        modelBuilder.Entity<PickupTask>()
            .HasOne(pt => pt.NGO)
            .WithMany()
            .HasForeignKey(pt => pt.NGOId)
            .OnDelete(DeleteBehavior.NoAction);

        // PickupTasks: FK to Users (VolunteerId), SET NULL on delete
        modelBuilder.Entity<PickupTask>()
            .HasOne(pt => pt.Volunteer)
            .WithMany()
            .HasForeignKey(pt => pt.VolunteerId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
```

### 8.5 Register DbContext in Program.cs

```csharp
// In Program.cs, add before builder.Build():
builder.Services.AddDbContext<RescueFlowDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
```

### 8.6 EF Core Migrations

If your backend developer decides to manage the database through EF Core migrations (instead of running SQL scripts manually), use these commands:

```bash
# Create the first migration
dotnet ef migrations add InitialCreate

# Apply migration to create/update the database
dotnet ef database update

# View the SQL that a migration would generate (for review)
dotnet ef migrations script
```

> **Choose one approach:** Either run the SQL scripts manually in SSMS, OR use EF Core migrations. Don't do both — they'll conflict. For learning, running SQL scripts manually gives you more visibility into what's happening.

---

## 9. Database Testing

### Test with SSMS

1. Run `05_TestQueries.sql` and verify all 12 queries return expected results.
2. Try inserting invalid data to verify constraints work:

```sql
-- This should FAIL (invalid role):
INSERT INTO Users (FullName, Email, PasswordHash, Role)
VALUES (N'Test', N'test@test.com', N'hash', N'SuperAdmin');
-- Error: CHECK constraint "CK_Users_Role" violation

-- This should FAIL (duplicate email):
INSERT INTO Users (FullName, Email, PasswordHash, Role)
VALUES (N'Test', N'arjun.admin@rescueflow.dev', N'hash', N'Admin');
-- Error: UNIQUE constraint "UQ_Users_Email" violation

-- This should FAIL (negative quantity):
INSERT INTO Donations (DonorId, FoodName, FoodCategory, Quantity, Unit,
    FoodCondition, StorageType, PickupDeadline, PickupAddress)
VALUES (2, N'Test', N'Cooked Food', -5, N'kg',
    N'Fresh', N'Refrigerated', '2026-12-01', N'Test Address');
-- Error: CHECK constraint "CK_Donations_Quantity" violation
```

### Test with EF Core

After connecting the backend, test CRUD operations through the API endpoints and verify data appears correctly in SSMS.

---

## 10. Presenting to Your Mentor

### Suggested Presentation Flow

1. **Show the ER Diagram** — explain the 5 tables and their relationships.
2. **Open SSMS** — show the database, tables, and columns.
3. **Run test queries** — demonstrate data retrieval (Queries 2, 4, 6, 8, 10).
4. **Show constraints** — try inserting invalid data and show the error messages.
5. **Explain normalization** — describe 1NF (categories), 2NF, 3NF (no duplication).
6. **Show the status workflow** — explain the donation lifecycle.
7. **Explain EF Core mapping** — show how C# classes map to SQL tables.

### Common Viva Questions

| Question | Key Points to Mention |
|---|---|
| "Why did you use a single Users table?" | All user types share login fields; role-specific data in profile tables; simpler authentication |
| "What is normalization?" | Organizing data to reduce redundancy. 1NF = atomic values, 2NF = no partial dependencies, 3NF = no transitive dependencies |
| "Why not store categories as comma-separated values?" | Violates 1NF; can't query, index, or validate individual categories |
| "How do you prevent invalid data?" | CHECK constraints, UNIQUE constraints, FK constraints, backend validation |
| "What happens if you delete a donor?" | NO ACTION on FK — prevents deletion if donations exist; use soft-delete (IsActive = 0) instead |
| "Why DATETIME2 and not DATETIME?" | Better precision, larger range, SQL standard, EF Core default |
| "How does the urgency system work?" | Backend calculates score (0–100) based on deadline, condition, quantity; level is a readable label |
| "What is a foreign key?" | A column that references the primary key of another table, enforcing data integrity |
| "What is an index?" | A data structure that speeds up SELECT queries on frequently searched columns, like a book index |
