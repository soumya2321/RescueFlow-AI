-- ============================================================================
-- RescueFlow AI — Constraints and Indexes Script
-- File: 03_CreateConstraintsAndIndexes.sql
-- Purpose: Adds CHECK constraints, additional UNIQUE constraints,
--          and performance indexes to all tables.
--
-- WHY A SEPARATE FILE?
--   Separating constraints from table creation makes it easier to:
--   • Read and understand each part independently
--   • Drop and re-add constraints during development
--   • Explain each constraint during your project viva
--
-- HOW TO RUN:
--   1. Run 01_CreateDatabase.sql and 02_CreateTables.sql first.
--   2. Open this file in SSMS (connected to RescueFlowDB).
--   3. Click "Execute" or press F5.
-- ============================================================================

USE RescueFlowDB;
GO

-- ============================================================================
-- SECTION 1: CHECK CONSTRAINTS
-- ============================================================================
-- CHECK constraints enforce business rules at the database level.
-- Even if the backend has validation, these are a safety net to prevent
-- invalid data from ever entering the database.
-- ============================================================================

-- -------------------------------------------------------
-- 1.1 Users.Role must be one of the four allowed values
-- -------------------------------------------------------
-- This prevents someone from inserting a user with Role = 'SuperAdmin'
-- or any other invalid value.
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Users_Role')
BEGIN
    ALTER TABLE Users
    ADD CONSTRAINT CK_Users_Role
    CHECK (Role IN ('Donor', 'NGO', 'Volunteer', 'Admin'));

    PRINT 'CHECK constraint CK_Users_Role added.';
END
GO

-- -------------------------------------------------------
-- 1.2 Donations.Quantity must be greater than zero
-- -------------------------------------------------------
-- You can't donate zero or negative quantity of food.
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Donations_Quantity')
BEGIN
    ALTER TABLE Donations
    ADD CONSTRAINT CK_Donations_Quantity
    CHECK (Quantity > 0);

    PRINT 'CHECK constraint CK_Donations_Quantity added.';
END
GO

-- -------------------------------------------------------
-- 1.3 Donations.UrgencyScore must be between 0 and 100
-- -------------------------------------------------------
-- The urgency scoring system uses a 0-100 scale.
-- 0 = no urgency, 100 = maximum urgency.
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Donations_UrgencyScore')
BEGIN
    ALTER TABLE Donations
    ADD CONSTRAINT CK_Donations_UrgencyScore
    CHECK (UrgencyScore >= 0 AND UrgencyScore <= 100);

    PRINT 'CHECK constraint CK_Donations_UrgencyScore added.';
END
GO

-- -------------------------------------------------------
-- 1.4 Donations.UrgencyLevel must be one of four values
-- -------------------------------------------------------
-- These labels correspond to score ranges:
--   Critical = 76-100, High = 51-75, Medium = 26-50, Low = 0-25
-- (The exact ranges are defined in the backend, not in SQL.)
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Donations_UrgencyLevel')
BEGIN
    ALTER TABLE Donations
    ADD CONSTRAINT CK_Donations_UrgencyLevel
    CHECK (UrgencyLevel IN ('Critical', 'High', 'Medium', 'Low'));

    PRINT 'CHECK constraint CK_Donations_UrgencyLevel added.';
END
GO

-- -------------------------------------------------------
-- 1.5 Donations.Status must be a valid donation status
-- -------------------------------------------------------
-- Only these 10 statuses are allowed. The backend enforces
-- which TRANSITIONS are valid (e.g., Available → Accepted is OK,
-- but Available → Completed is NOT).
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Donations_Status')
BEGIN
    ALTER TABLE Donations
    ADD CONSTRAINT CK_Donations_Status
    CHECK (Status IN (
        'Available',    -- Donor just created the donation
        'Accepted',     -- An NGO has accepted it
        'Assigned',     -- A volunteer has been assigned
        'PickedUp',     -- Volunteer picked up the food
        'Delivered',    -- Volunteer delivered to NGO
        'Completed',    -- Confirmed as successfully redistributed
        'Rejected',     -- NGO rejected the donation
        'Cancelled',    -- Donor or NGO cancelled
        'Expired',      -- Pickup deadline passed
        'Failed'        -- Pickup or delivery failed
    ));

    PRINT 'CHECK constraint CK_Donations_Status added.';
END
GO

-- -------------------------------------------------------
-- 1.6 Donations.FoodCondition must be a valid value
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Donations_FoodCondition')
BEGIN
    ALTER TABLE Donations
    ADD CONSTRAINT CK_Donations_FoodCondition
    CHECK (FoodCondition IN ('Fresh', 'Near Expiry', 'Leftover', 'Packed'));

    PRINT 'CHECK constraint CK_Donations_FoodCondition added.';
END
GO

-- -------------------------------------------------------
-- 1.7 Donations.StorageType must be a valid value
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Donations_StorageType')
BEGIN
    ALTER TABLE Donations
    ADD CONSTRAINT CK_Donations_StorageType
    CHECK (StorageType IN ('Refrigerated', 'Room Temperature', 'Frozen'));

    PRINT 'CHECK constraint CK_Donations_StorageType added.';
END
GO

-- -------------------------------------------------------
-- 1.8 NGOProfiles.MaximumCapacity must be greater than zero
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_NGOProfiles_MaximumCapacity')
BEGIN
    ALTER TABLE NGOProfiles
    ADD CONSTRAINT CK_NGOProfiles_MaximumCapacity
    CHECK (MaximumCapacity > 0);

    PRINT 'CHECK constraint CK_NGOProfiles_MaximumCapacity added.';
END
GO

-- -------------------------------------------------------
-- 1.9 PickupTasks.Status must be a valid pickup status
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_PickupTasks_Status')
BEGIN
    ALTER TABLE PickupTasks
    ADD CONSTRAINT CK_PickupTasks_Status
    CHECK (Status IN (
        'Pending',      -- NGO accepted donation, waiting for volunteer
        'Assigned',     -- Volunteer assigned
        'PickedUp',     -- Food picked up by volunteer
        'Delivered',    -- Food delivered to NGO
        'Failed',       -- Pickup or delivery failed
        'Cancelled'     -- Task cancelled
    ));

    PRINT 'CHECK constraint CK_PickupTasks_Status added.';
END
GO


-- ============================================================================
-- SECTION 2: UNIQUE CONSTRAINTS
-- ============================================================================

-- -------------------------------------------------------
-- 2.1 Each NGO can list each food category only once
-- -------------------------------------------------------
-- Prevents duplicate entries like "Cooked Food" appearing twice
-- for the same NGO profile.
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_NGOAcceptedCategories_Profile_Category')
BEGIN
    ALTER TABLE NGOAcceptedCategories
    ADD CONSTRAINT UQ_NGOAcceptedCategories_Profile_Category
    UNIQUE (NGOProfileId, FoodCategory);

    PRINT 'UNIQUE constraint UQ_NGOAcceptedCategories_Profile_Category added.';
END
GO


-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================
-- Indexes speed up SELECT queries on frequently searched columns.
-- Without indexes, SQL Server must scan every row in the table (slow).
-- With an index, it can jump directly to matching rows (fast).
--
-- WHEN TO ADD AN INDEX:
--   • Columns used in WHERE clauses
--   • Columns used in JOIN conditions (FK columns)
--   • Columns used in ORDER BY
--
-- TRADE-OFF: Indexes speed up reads but slightly slow down writes
--   (INSERT/UPDATE/DELETE). For our app, reads are much more frequent
--   than writes, so this is a good trade-off.
-- ============================================================================

-- ------- Users Table Indexes -------

-- 3.1 Fast lookup by email (login queries)
-- Note: Email already has a UNIQUE constraint which creates an index,
-- but we name it explicitly for clarity.
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Role')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Users_Role
    ON Users(Role);

    PRINT 'Index IX_Users_Role created.';
END
GO

-- 3.2 Filter active/inactive users
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_IsActive')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Users_IsActive
    ON Users(IsActive);

    PRINT 'Index IX_Users_IsActive created.';
END
GO

-- ------- Donations Table Indexes -------

-- 3.3 List all donations by a specific donor
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Donations_DonorId')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Donations_DonorId
    ON Donations(DonorId);

    PRINT 'Index IX_Donations_DonorId created.';
END
GO

-- 3.4 Filter donations by status (e.g., find all "Available" donations)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Donations_Status')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Donations_Status
    ON Donations(Status);

    PRINT 'Index IX_Donations_Status created.';
END
GO

-- 3.5 Match donations to NGOs by food category
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Donations_FoodCategory')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Donations_FoodCategory
    ON Donations(FoodCategory);

    PRINT 'Index IX_Donations_FoodCategory created.';
END
GO

-- 3.6 Sort/filter by urgency (find critical donations first)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Donations_UrgencyScore')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Donations_UrgencyScore
    ON Donations(UrgencyScore DESC);

    PRINT 'Index IX_Donations_UrgencyScore created.';
END
GO

-- 3.7 Find donations approaching their deadlines
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Donations_PickupDeadline')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Donations_PickupDeadline
    ON Donations(PickupDeadline);

    PRINT 'Index IX_Donations_PickupDeadline created.';
END
GO

-- ------- PickupTasks Table Indexes -------

-- 3.8 Find all pickup tasks for a specific NGO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PickupTasks_NGOId')
BEGIN
    CREATE NONCLUSTERED INDEX IX_PickupTasks_NGOId
    ON PickupTasks(NGOId);

    PRINT 'Index IX_PickupTasks_NGOId created.';
END
GO

-- 3.9 Find all pickup tasks for a specific volunteer
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PickupTasks_VolunteerId')
BEGIN
    CREATE NONCLUSTERED INDEX IX_PickupTasks_VolunteerId
    ON PickupTasks(VolunteerId);

    PRINT 'Index IX_PickupTasks_VolunteerId created.';
END
GO

-- 3.10 Filter pickup tasks by status
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PickupTasks_Status')
BEGIN
    CREATE NONCLUSTERED INDEX IX_PickupTasks_Status
    ON PickupTasks(Status);

    PRINT 'Index IX_PickupTasks_Status created.';
END
GO

-- ------- NGOAcceptedCategories Table Indexes -------

-- 3.11 Find NGOs that accept a specific food category
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_NGOAcceptedCategories_FoodCategory')
BEGIN
    CREATE NONCLUSTERED INDEX IX_NGOAcceptedCategories_FoodCategory
    ON NGOAcceptedCategories(FoodCategory);

    PRINT 'Index IX_NGOAcceptedCategories_FoodCategory created.';
END
GO


-- ============================================================================
-- SUMMARY
-- ============================================================================
-- CHECK constraints added:  9
--   • CK_Users_Role
--   • CK_Donations_Quantity
--   • CK_Donations_UrgencyScore
--   • CK_Donations_UrgencyLevel
--   • CK_Donations_Status
--   • CK_Donations_FoodCondition
--   • CK_Donations_StorageType
--   • CK_NGOProfiles_MaximumCapacity
--   • CK_PickupTasks_Status
--
-- UNIQUE constraints added: 1
--   • UQ_NGOAcceptedCategories_Profile_Category (NGOProfileId, FoodCategory)
--
-- Indexes added: 9
--   • IX_Users_Role
--   • IX_Users_IsActive
--   • IX_Donations_DonorId
--   • IX_Donations_Status
--   • IX_Donations_FoodCategory
--   • IX_Donations_UrgencyScore (DESC)
--   • IX_Donations_PickupDeadline
--   • IX_PickupTasks_NGOId
--   • IX_PickupTasks_VolunteerId
--   • IX_PickupTasks_Status
--   • IX_NGOAcceptedCategories_FoodCategory
--
-- Next step: Run 04_InsertSampleData.sql
-- ============================================================================

PRINT '';
PRINT '=============================================';
PRINT 'All constraints and indexes added!';
PRINT 'Next: Run 04_InsertSampleData.sql';
PRINT '=============================================';
GO
