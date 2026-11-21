-- ============================================================================
-- RescueFlow AI — Table Creation Script
-- File: 02_CreateTables.sql
-- Purpose: Creates all 5 tables with columns, data types, PKs, FKs,
--          NOT NULL constraints, and default values.
--
-- HOW TO RUN:
--   1. Run 01_CreateDatabase.sql first.
--   2. Open this file in SSMS.
--   3. Make sure the database dropdown at the top shows "RescueFlowDB".
--   4. Click "Execute" or press F5.
--
-- TABLES CREATED (in order):
--   1. Users            — All system users (Donor, NGO, Volunteer, Admin)
--   2. NGOProfiles      — Additional details for NGO users
--   3. NGOAcceptedCategories — Food categories each NGO accepts
--   4. Donations        — Surplus food donation listings
--   5. PickupTasks      — Pickup & delivery tracking
--
-- NOTE: Tables are created in dependency order. Users first (no FKs),
--       then tables that reference Users, etc.
-- ============================================================================

USE RescueFlowDB;
GO

-- ============================================================================
-- TABLE 1: Users
-- ============================================================================
-- Stores ALL users in the system: Donors, NGOs, Volunteers, and Admins.
-- The 'Role' column distinguishes the type of user.
-- 
-- Design decisions:
--   • Single users table (instead of separate Donor/NGO/Volunteer tables)
--     because all users share the same login fields. Role-specific data
--     goes in separate profile tables (like NGOProfiles).
--   • NVARCHAR used for text columns to support Unicode (Indian names,
--     addresses with special characters).
--   • PasswordHash is NVARCHAR(500) to accommodate any hashing algorithm
--     (BCrypt ~60 chars, PBKDF2 ~68 chars, Argon2 can be longer).
--   • IsActive BIT column enables soft-delete: set to 0 instead of
--     deleting the row, so we preserve history.
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users
    (
        -- Primary Key: auto-incrementing integer
        UserId          INT             IDENTITY(1,1)   NOT NULL,

        -- User's full name (e.g., "Rahul Sharma")
        FullName        NVARCHAR(100)   NOT NULL,

        -- Login email — must be unique across all users
        Email           NVARCHAR(255)   NOT NULL,

        -- Hashed password — NEVER store plain text passwords
        -- The backend (ASP.NET Core Identity or BCrypt) generates this
        PasswordHash    NVARCHAR(500)   NOT NULL,

        -- User type: determines what the user can do in the system
        -- Donor    = can create food donations
        -- NGO      = can accept donations, has an NGOProfile
        -- Volunteer = can be assigned to pickup tasks
        -- Admin    = can manage and monitor everything
        Role            NVARCHAR(20)    NOT NULL,

        -- Optional phone number
        Phone           NVARCHAR(20)    NULL,

        -- Soft-delete flag: 1 = active, 0 = deactivated
        IsActive        BIT             NOT NULL    DEFAULT 1,

        -- When this record was created
        CreatedAt       DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),

        -- When this record was last updated
        UpdatedAt       DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),

        -- Primary key constraint
        CONSTRAINT PK_Users PRIMARY KEY (UserId),

        -- Each email must be unique — no two users can share an email
        CONSTRAINT UQ_Users_Email UNIQUE (Email)
    );

    PRINT 'Table "Users" created successfully.';
END
ELSE
    PRINT 'Table "Users" already exists. Skipping.';
GO


-- ============================================================================
-- TABLE 2: NGOProfiles
-- ============================================================================
-- Stores additional information specific to NGO users.
-- Only users with Role = 'NGO' should have a row here.
--
-- Design decisions:
--   • Separated from Users table to follow normalization (3NF):
--     Not all users need organization name, capacity, etc.
--   • UserId has a UNIQUE constraint → one-to-one relationship with Users.
--   • MaximumCapacity uses DECIMAL(10,2) for precise decimal quantities.
--   • IsVerified lets admins approve NGOs before they can accept donations.
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NGOProfiles')
BEGIN
    CREATE TABLE NGOProfiles
    (
        -- Primary key
        NGOProfileId        INT             IDENTITY(1,1)   NOT NULL,

        -- Which user this profile belongs to (must be an NGO user)
        -- UNIQUE ensures one profile per user (one-to-one relationship)
        UserId              INT             NOT NULL,

        -- The NGO's registered organization name
        OrganizationName    NVARCHAR(200)   NOT NULL,

        -- Maximum quantity of food the NGO can handle at a time
        MaximumCapacity     DECIMAL(10,2)   NOT NULL,

        -- Unit for the capacity (kg, meals, litres, etc.)
        CapacityUnit        NVARCHAR(20)    NOT NULL,

        -- NGO's address / service area
        Location            NVARCHAR(500)   NOT NULL,

        -- Has an admin verified this NGO? (0 = pending, 1 = verified)
        IsVerified          BIT             NOT NULL    DEFAULT 0,

        -- Timestamps
        CreatedAt           DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),
        UpdatedAt           DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),

        -- Constraints
        CONSTRAINT PK_NGOProfiles PRIMARY KEY (NGOProfileId),

        -- One-to-one: each user can have at most one NGO profile
        CONSTRAINT UQ_NGOProfiles_UserId UNIQUE (UserId),

        -- Foreign key to Users table
        -- ON DELETE CASCADE: if the user is deleted, remove their profile too
        -- ON UPDATE CASCADE: if UserId changes (rare), update here too
        CONSTRAINT FK_NGOProfiles_Users FOREIGN KEY (UserId)
            REFERENCES Users(UserId)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    );

    PRINT 'Table "NGOProfiles" created successfully.';
END
ELSE
    PRINT 'Table "NGOProfiles" already exists. Skipping.';
GO


-- ============================================================================
-- TABLE 3: NGOAcceptedCategories
-- ============================================================================
-- Stores which food categories each NGO is willing to accept.
-- Each row = one category for one NGO.
--
-- Example: If "Helping Hands Foundation" accepts "Cooked Food" and 
-- "Bakery Items", that's TWO rows in this table.
--
-- Design decisions:
--   • Normalized design (1NF): categories stored as separate rows,
--     NOT as comma-separated values like "Cooked Food,Bakery Items".
--     This allows proper querying: "Find all NGOs that accept Cooked Food."
--   • UNIQUE constraint on (NGOProfileId, FoodCategory) prevents an NGO
--     from having the same category listed twice.
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NGOAcceptedCategories')
BEGIN
    CREATE TABLE NGOAcceptedCategories
    (
        -- Primary key
        NGOAcceptedCategoryId   INT             IDENTITY(1,1)   NOT NULL,

        -- Which NGO profile this category belongs to
        NGOProfileId            INT             NOT NULL,

        -- The food category name (e.g., "Cooked Food", "Raw Vegetables")
        FoodCategory            NVARCHAR(50)    NOT NULL,

        -- Can the NGO temporarily stop accepting this category?
        IsActive                BIT             NOT NULL    DEFAULT 1,

        -- Constraints
        CONSTRAINT PK_NGOAcceptedCategories PRIMARY KEY (NGOAcceptedCategoryId),

        -- Foreign key to NGOProfiles
        -- ON DELETE CASCADE: if the NGO profile is deleted, remove categories
        CONSTRAINT FK_NGOAcceptedCategories_NGOProfiles FOREIGN KEY (NGOProfileId)
            REFERENCES NGOProfiles(NGOProfileId)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    );

    PRINT 'Table "NGOAcceptedCategories" created successfully.';
END
ELSE
    PRINT 'Table "NGOAcceptedCategories" already exists. Skipping.';
GO


-- ============================================================================
-- TABLE 4: Donations
-- ============================================================================
-- Stores surplus food donation listings created by Donor users.
-- Each row represents one donation of food that is available for
-- redistribution.
--
-- Design decisions:
--   • DonorId FK references Users — the backend must ensure only
--     users with Role = 'Donor' can create donations (enforced by
--     a CHECK constraint in script 03).
--   • Status tracks the donation through its lifecycle:
--     Available → Accepted → Assigned → PickedUp → Delivered → Completed
--     (or Cancelled/Expired/Rejected/Failed at various points).
--   • UrgencyScore (0–100) is calculated by the backend's rule engine
--     based on factors like time until deadline, food condition, etc.
--   • UrgencyLevel is a human-readable label derived from the score.
--     Storing both is a small denormalization for performance.
--   • Quantity uses DECIMAL(10,2) for precise values (e.g., 2.5 kg).
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Donations')
BEGIN
    CREATE TABLE Donations
    (
        -- Primary key
        DonationId      INT             IDENTITY(1,1)   NOT NULL,

        -- Who donated this food (must be a Donor user)
        DonorId         INT             NOT NULL,

        -- Name of the food item (e.g., "Chicken Biryani", "Mixed Vegetables")
        FoodName        NVARCHAR(200)   NOT NULL,

        -- Category for NGO matching (e.g., "Cooked Food", "Raw Vegetables")
        FoodCategory    NVARCHAR(50)    NOT NULL,

        -- How much food (must be > 0)
        Quantity        DECIMAL(10,2)   NOT NULL,

        -- Unit of measurement (kg, meals, litres, packets, etc.)
        Unit            NVARCHAR(20)    NOT NULL,

        -- Condition of the food
        FoodCondition   NVARCHAR(50)    NOT NULL,

        -- How the food is stored
        StorageType     NVARCHAR(50)    NOT NULL,

        -- When the food must be picked up by (after this, it may spoil)
        PickupDeadline  DATETIME2       NOT NULL,

        -- Where to pick up the food from
        PickupAddress   NVARCHAR(500)   NOT NULL,

        -- Optional additional notes from the donor
        Description     NVARCHAR(1000)  NULL,

        -- Current status in the donation workflow
        Status          NVARCHAR(20)    NOT NULL    DEFAULT 'Available',

        -- Urgency score calculated by the backend (0 = not urgent, 100 = critical)
        UrgencyScore    DECIMAL(5,2)    NOT NULL    DEFAULT 0,

        -- Human-readable urgency label
        UrgencyLevel    NVARCHAR(10)    NOT NULL    DEFAULT 'Low',

        -- Timestamps
        CreatedAt       DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),
        UpdatedAt       DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),

        -- Constraints
        CONSTRAINT PK_Donations PRIMARY KEY (DonationId),

        -- Foreign key to Users (Donor)
        -- ON DELETE NO ACTION: don't delete donations when a donor is deleted
        --   (preserves redistribution history for the impact dashboard)
        -- ON UPDATE CASCADE: if UserId changes, update DonorId
        CONSTRAINT FK_Donations_Users FOREIGN KEY (DonorId)
            REFERENCES Users(UserId)
            ON DELETE NO ACTION
            ON UPDATE CASCADE
    );

    PRINT 'Table "Donations" created successfully.';
END
ELSE
    PRINT 'Table "Donations" already exists. Skipping.';
GO


-- ============================================================================
-- TABLE 5: PickupTasks
-- ============================================================================
-- Tracks the entire pickup and delivery process:
--   1. NGO accepts a donation → PickupTask created (Status = Pending)
--   2. Volunteer is assigned → (Status = Assigned)
--   3. Volunteer picks up food → (Status = PickedUp)
--   4. Volunteer delivers to NGO → (Status = Delivered)
--
-- Design decisions:
--   • DonationId is UNIQUE: in the MVP, each donation can only have
--     one active pickup task. This simplifies the workflow.
--   • NGOId and VolunteerId both reference Users table.
--     The backend must verify NGOId has Role='NGO' and VolunteerId
--     has Role='Volunteer'.
--   • VolunteerId is NULLABLE: a task starts as "Pending" before
--     any volunteer is assigned.
--   • Multiple timestamp fields track the workflow milestones:
--     AssignedAt, ScheduledPickupTime, ActualPickupTime, ActualDeliveryTime.
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PickupTasks')
BEGIN
    CREATE TABLE PickupTasks
    (
        -- Primary key
        PickupTaskId        INT             IDENTITY(1,1)   NOT NULL,

        -- Which donation this task is for (one task per donation in MVP)
        DonationId          INT             NOT NULL,

        -- Which NGO accepted this donation
        NGOId               INT             NOT NULL,

        -- Which volunteer is assigned (NULL until a volunteer is assigned)
        VolunteerId         INT             NULL,

        -- When the volunteer was assigned
        AssignedAt          DATETIME2       NULL,

        -- Planned pickup time
        ScheduledPickupTime DATETIME2       NULL,

        -- When the volunteer actually picked up the food
        ActualPickupTime    DATETIME2       NULL,

        -- When the volunteer actually delivered the food to the NGO
        ActualDeliveryTime  DATETIME2       NULL,

        -- Current status of the pickup task
        Status              NVARCHAR(20)    NOT NULL    DEFAULT 'Pending',

        -- Optional notes (e.g., "Gate was locked, rescheduling")
        Notes               NVARCHAR(1000)  NULL,

        -- Timestamps
        CreatedAt           DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),
        UpdatedAt           DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),

        -- Constraints
        CONSTRAINT PK_PickupTasks PRIMARY KEY (PickupTaskId),

        -- One pickup task per donation (MVP constraint)
        CONSTRAINT UQ_PickupTasks_DonationId UNIQUE (DonationId),

        -- Foreign key to Donations
        -- ON DELETE CASCADE: if donation is removed, remove its task
        CONSTRAINT FK_PickupTasks_Donations FOREIGN KEY (DonationId)
            REFERENCES Donations(DonationId)
            ON DELETE CASCADE
            ON UPDATE CASCADE,

        -- Foreign key to Users for the NGO
        -- ON DELETE NO ACTION: don't delete tasks if NGO user is deleted
        CONSTRAINT FK_PickupTasks_NGO FOREIGN KEY (NGOId)
            REFERENCES Users(UserId)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION,

        -- Foreign key to Users for the Volunteer (nullable)
        -- ON DELETE SET NULL: if volunteer is deleted, unassign them
        CONSTRAINT FK_PickupTasks_Volunteer FOREIGN KEY (VolunteerId)
            REFERENCES Users(UserId)
            ON DELETE SET NULL
            ON UPDATE NO ACTION
    );

    PRINT 'Table "PickupTasks" created successfully.';
END
ELSE
    PRINT 'Table "PickupTasks" already exists. Skipping.';
GO


-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Tables created:
--   1. Users                  — 9 columns, 1 PK, 1 UQ (Email)
--   2. NGOProfiles            — 9 columns, 1 PK, 1 UQ (UserId), 1 FK
--   3. NGOAcceptedCategories  — 4 columns, 1 PK, 1 FK
--   4. Donations              — 16 columns, 1 PK, 1 FK
--   5. PickupTasks            — 12 columns, 1 PK, 1 UQ (DonationId), 3 FKs
--
-- Total foreign keys: 6
-- Total unique constraints: 3 (Email, NGOProfiles.UserId, PickupTasks.DonationId)
--
-- Next step: Run 03_CreateConstraintsAndIndexes.sql
-- ============================================================================

PRINT '';
PRINT '=============================================';
PRINT 'All tables created successfully!';
PRINT 'Next: Run 03_CreateConstraintsAndIndexes.sql';
PRINT '=============================================';
GO
