-- ============================================================================
-- RescueFlow AI — Database Migration Script
-- Script 07: Add RecipientNgoId to Donations Table and Seed NGO Profile
-- ============================================================================
-- Description:
--   1. Adds 'RecipientNgoId' column to 'Donations' table if missing.
--   2. Adds Foreign Key to 'Users(UserId)'.
--   3. Backfills RecipientNgoId from existing VolunteerAssignments or PickupTasks.
--   4. Ensures Demo NGO (UserId 15) has an NGOProfile record.
--   5. Idempotent and safe to run multiple times.
-- ============================================================================

USE RescueFlowDB;
GO

PRINT '=============================================';
PRINT 'Starting Script 07: Add RecipientNgoId Migration...';
PRINT '=============================================';
GO

-- 1. Add RecipientNgoId column to Donations table if not exists
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Donations' AND COLUMN_NAME = 'RecipientNgoId'
)
BEGIN
    PRINT 'Adding RecipientNgoId column to Donations table...';
    ALTER TABLE Donations ADD RecipientNgoId INT NULL;
    PRINT '  ✓ Column RecipientNgoId added.';
END
ELSE
BEGIN
    PRINT '  Column RecipientNgoId already exists in Donations table.';
END
GO

-- 2. Add Foreign Key FK_Donations_Users_RecipientNgoId if not exists
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE name = 'FK_Donations_Users_RecipientNgoId'
)
BEGIN
    PRINT 'Adding FK_Donations_Users_RecipientNgoId constraint...';
    ALTER TABLE Donations
        ADD CONSTRAINT FK_Donations_Users_RecipientNgoId
        FOREIGN KEY (RecipientNgoId) REFERENCES Users(UserId)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;
    PRINT '  ✓ Foreign Key FK_Donations_Users_RecipientNgoId created.';
END
ELSE
BEGIN
    PRINT '  Foreign Key FK_Donations_Users_RecipientNgoId already exists.';
END
GO

-- 3. Create Index on RecipientNgoId
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Donations_RecipientNgoId' 
      AND object_id = OBJECT_ID('Donations')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Donations_RecipientNgoId
        ON Donations(RecipientNgoId);
    PRINT '  ✓ Index IX_Donations_RecipientNgoId created.';
END
GO

-- 4. Backfill RecipientNgoId from VolunteerAssignments
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'VolunteerAssignments')
BEGIN
    UPDATE d
    SET d.RecipientNgoId = va.AssignedByNgoId
    FROM Donations d
    INNER JOIN VolunteerAssignments va ON d.DonationId = va.DonationId
    WHERE d.RecipientNgoId IS NULL;
    
    PRINT '  ✓ RecipientNgoId backfilled from VolunteerAssignments: ' + CAST(@@ROWCOUNT AS VARCHAR(10));
END
GO

-- 5. Backfill RecipientNgoId from legacy PickupTasks where available
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PickupTasks')
BEGIN
    UPDATE d
    SET d.RecipientNgoId = pt.NGOId
    FROM Donations d
    INNER JOIN PickupTasks pt ON d.DonationId = pt.DonationId
    WHERE d.RecipientNgoId IS NULL AND pt.NGOId IS NOT NULL;
    
    PRINT '  ✓ RecipientNgoId backfilled from legacy PickupTasks: ' + CAST(@@ROWCOUNT AS VARCHAR(10));
END
GO

-- 6. Ensure Demo NGO (UserId 15 or demo user) has a valid NGOProfile record
DECLARE @DemoNgoUserId INT = (SELECT TOP 1 UserId FROM Users WHERE Email = 'ngo@demo.com' OR (Role = 'NGO' AND FullName LIKE '%Demo%'));

IF @DemoNgoUserId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM NGOProfiles WHERE UserId = @DemoNgoUserId)
BEGIN
    PRINT 'Creating NGOProfile record for Demo NGO (UserId ' + CAST(@DemoNgoUserId AS VARCHAR(10)) + ')...';
    INSERT INTO NGOProfiles (UserId, OrganizationName, MaximumCapacity, CapacityUnit, Location, IsVerified, CreatedAt, UpdatedAt)
    VALUES (
        @DemoNgoUserId,
        N'RescueFlow Community Kitchen',
        500.00,
        N'Meals',
        N'100 Hope Street, Jubilee Hills, Hyderabad 500033',
        1,
        SYSDATETIME(),
        SYSDATETIME()
    );
    PRINT '  ✓ NGOProfile created for Demo NGO.';
END
GO

-- 7. For any accepted donation without RecipientNgoId, assign Demo NGO or first NGO
DECLARE @FirstNgoId INT = (SELECT TOP 1 UserId FROM Users WHERE Role = 'NGO' ORDER BY CASE WHEN Email = 'ngo@demo.com' THEN 0 ELSE 1 END, UserId);

IF @FirstNgoId IS NOT NULL
BEGIN
    UPDATE Donations
    SET RecipientNgoId = @FirstNgoId
    WHERE Status IN ('Accepted', 'Assigned', 'PickedUp', 'Delivered', 'Completed')
      AND RecipientNgoId IS NULL;
      
    PRINT '  ✓ Any unlinked accepted/active donations updated with default NGO (UserId ' + CAST(@FirstNgoId AS VARCHAR(10)) + ').';
END
GO

PRINT '=============================================';
PRINT 'Script 07 Completed Successfully!';
PRINT '=============================================';
GO
