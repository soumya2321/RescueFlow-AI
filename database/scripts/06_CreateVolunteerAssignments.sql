-- ============================================================================
-- RescueFlow AI — Database Migration Script
-- Script 06: Create VolunteerAssignments Table & Seed/Migrate Data
-- ============================================================================
-- Description:
--   Creates the missing 'VolunteerAssignments' table required by RescueFlow.API
--   (matching the EF Core migration 20261122170352_AddVolunteerAssignments).
--   Preserves all existing data in Users, Donations, NGOProfiles, etc.
--   Idempotent and safe to run multiple times.
-- ============================================================================

USE RescueFlowDB;
GO

PRINT '=============================================';
PRINT 'Starting VolunteerAssignments Migration...';
PRINT '=============================================';
GO

-- 1. Create VolunteerAssignments table if it does not exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VolunteerAssignments')
BEGIN
    PRINT 'Creating table "VolunteerAssignments"...';

    CREATE TABLE VolunteerAssignments (
        AssignmentId INT IDENTITY(1,1) NOT NULL,
        DonationId INT NOT NULL,
        VolunteerId INT NOT NULL,
        AssignedByNgoId INT NOT NULL,
        AssignedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        Status NVARCHAR(20) NOT NULL DEFAULT 'Assigned',

        CONSTRAINT PK_VolunteerAssignments PRIMARY KEY CLUSTERED (AssignmentId ASC),

        CONSTRAINT FK_VolunteerAssignments_Donations_DonationId FOREIGN KEY (DonationId)
            REFERENCES Donations (DonationId)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION,

        CONSTRAINT FK_VolunteerAssignments_Users_AssignedByNgoId FOREIGN KEY (AssignedByNgoId)
            REFERENCES Users (UserId)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION,

        CONSTRAINT FK_VolunteerAssignments_Users_VolunteerId FOREIGN KEY (VolunteerId)
            REFERENCES Users (UserId)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION,

        CONSTRAINT CK_VolunteerAssignments_Status CHECK (
            Status IN ('Assigned', 'PickedUp', 'Delivered', 'Completed', 'Cancelled')
        )
    );

    PRINT '  ✓ Table "VolunteerAssignments" created successfully.';
END
ELSE
BEGIN
    PRINT '  Table "VolunteerAssignments" already exists. Skipping creation.';
END
GO

-- 2. Create Unique Index on DonationId (one assignment per donation, matching EF Core)
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_VolunteerAssignments_DonationId' 
      AND object_id = OBJECT_ID('VolunteerAssignments')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX IX_VolunteerAssignments_DonationId
        ON VolunteerAssignments(DonationId);
    PRINT '  ✓ Unique Index IX_VolunteerAssignments_DonationId created.';
END
GO

-- 3. Create Nonclustered Index on AssignedByNgoId
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_VolunteerAssignments_AssignedByNgoId' 
      AND object_id = OBJECT_ID('VolunteerAssignments')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_VolunteerAssignments_AssignedByNgoId
        ON VolunteerAssignments(AssignedByNgoId);
    PRINT '  ✓ Index IX_VolunteerAssignments_AssignedByNgoId created.';
END
GO

-- 4. Create Nonclustered Index on VolunteerId
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_VolunteerAssignments_VolunteerId' 
      AND object_id = OBJECT_ID('VolunteerAssignments')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_VolunteerAssignments_VolunteerId
        ON VolunteerAssignments(VolunteerId);
    PRINT '  ✓ Index IX_VolunteerAssignments_VolunteerId created.';
END
GO

-- 5. Create Nonclustered Index on Status
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_VolunteerAssignments_Status' 
      AND object_id = OBJECT_ID('VolunteerAssignments')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_VolunteerAssignments_Status
        ON VolunteerAssignments(Status);
    PRINT '  ✓ Index IX_VolunteerAssignments_Status created.';
END
GO

-- 6. Migrate legacy assigned tasks from PickupTasks if present and VolunteerAssignments is empty
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PickupTasks')
   AND NOT EXISTS (SELECT 1 FROM VolunteerAssignments)
BEGIN
    PRINT 'Migrating data from existing "PickupTasks" into "VolunteerAssignments"...';

    INSERT INTO VolunteerAssignments (DonationId, VolunteerId, AssignedByNgoId, AssignedAt, Status)
    SELECT 
        pt.DonationId,
        pt.VolunteerId,
        pt.NGOId,
        ISNULL(pt.AssignedAt, SYSDATETIME()),
        CASE 
            WHEN pt.Status IN ('Assigned', 'PickedUp', 'Delivered', 'Completed', 'Cancelled') THEN pt.Status
            WHEN pt.Status = 'Pending' THEN 'Assigned'
            ELSE 'Assigned'
        END
    FROM PickupTasks pt
    WHERE pt.VolunteerId IS NOT NULL
      AND pt.NGOId IS NOT NULL
      AND pt.DonationId IS NOT NULL
      AND EXISTS (SELECT 1 FROM Donations d WHERE d.DonationId = pt.DonationId)
      AND EXISTS (SELECT 1 FROM Users u WHERE u.UserId = pt.VolunteerId)
      AND EXISTS (SELECT 1 FROM Users u WHERE u.UserId = pt.NGOId)
      AND pt.DonationId NOT IN (SELECT DonationId FROM VolunteerAssignments);

    PRINT '  ✓ Legacy task records migrated successfully: ' + CAST(@@ROWCOUNT AS VARCHAR(10));
END
GO

-- 7. Seed demo volunteer assignment if table is still empty and demo users/donations exist
IF NOT EXISTS (SELECT 1 FROM VolunteerAssignments)
BEGIN
    DECLARE @DemoVolunteerId INT = (SELECT TOP 1 UserId FROM Users WHERE Role = 'Volunteer' AND Email LIKE '%volunteer%' ORDER BY UserId);
    DECLARE @DemoNgoId INT = (SELECT TOP 1 UserId FROM Users WHERE Role = 'NGO' AND Email LIKE '%ngo%' ORDER BY UserId);
    DECLARE @EligibleDonationId INT = (
        SELECT TOP 1 DonationId FROM Donations 
        WHERE Status IN ('Accepted', 'Assigned') 
          AND DonationId NOT IN (SELECT DonationId FROM VolunteerAssignments)
        ORDER BY DonationId
    );

    IF @DemoVolunteerId IS NOT NULL AND @DemoNgoId IS NOT NULL AND @EligibleDonationId IS NOT NULL
    BEGIN
        INSERT INTO VolunteerAssignments (DonationId, VolunteerId, AssignedByNgoId, AssignedAt, Status)
        VALUES (@EligibleDonationId, @DemoVolunteerId, @DemoNgoId, SYSDATETIME(), 'Assigned');

        UPDATE Donations SET Status = 'Assigned', UpdatedAt = SYSDATETIME() WHERE DonationId = @EligibleDonationId;
        PRINT '  ✓ Sample demo assignment created for testing (Donation #' + CAST(@EligibleDonationId AS VARCHAR(10)) + ').';
    END
END
GO

-- 8. Synchronize __EFMigrationsHistory if table exists so EF Core knows migration is applied
IF EXISTS (SELECT * FROM sys.tables WHERE name = '__EFMigrationsHistory')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20261122165848_InitialBaseline')
    BEGIN
        INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
        VALUES ('20261122165848_InitialBaseline', '10.0.0');
    END

    IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20261122170352_AddVolunteerAssignments')
    BEGIN
        INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
        VALUES ('20261122170352_AddVolunteerAssignments', '10.0.0');
    END
    PRINT '  ✓ EF Core Migration history updated.';
END
GO

PRINT '=============================================';
PRINT 'VolunteerAssignments Migration Completed!';
PRINT '=============================================';
SELECT 'VolunteerAssignments Record Count:' AS [Status], COUNT(*) AS [Count] FROM VolunteerAssignments;
GO
