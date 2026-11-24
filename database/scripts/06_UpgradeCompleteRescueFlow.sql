
-- RescueFlow AI
-- Script 06: Complete Application Database Upgrade
-- Run after the original database setup scripts.

USE [RescueFlowDB];
GO

SET XACT_ABORT ON;

BEGIN TRY

    BEGIN TRANSACTION;

    -- 1. Donation NGO ownership

    IF COL_LENGTH('dbo.Donations', 'AcceptedByNgoId') IS NULL
    BEGIN
        ALTER TABLE dbo.Donations
        ADD AcceptedByNgoId INT NULL;
    END;

    IF OBJECT_ID('dbo.FK_Donations_AcceptedByNgo', 'F') IS NULL
    BEGIN
        EXEC(N'
            ALTER TABLE dbo.Donations WITH CHECK
            ADD CONSTRAINT FK_Donations_AcceptedByNgo
            FOREIGN KEY (AcceptedByNgoId)
            REFERENCES dbo.Users(UserId);
        ');
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_Donations_AcceptedByNgoId'
        AND object_id = OBJECT_ID('dbo.Donations')
    )
    BEGIN
        EXEC(N'
            CREATE INDEX IX_Donations_AcceptedByNgoId
            ON dbo.Donations(AcceptedByNgoId);
        ');
    END;

    -- 2. Volunteer assignments

    IF OBJECT_ID('dbo.VolunteerAssignments', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.VolunteerAssignments
        (
            AssignmentId INT IDENTITY(1,1) PRIMARY KEY,
            DonationId INT NOT NULL UNIQUE,
            VolunteerId INT NOT NULL,
            AssignedByNgoId INT NOT NULL,
            AssignedAt DATETIME2(7) NOT NULL,
            Status NVARCHAR(20) NOT NULL,

            CONSTRAINT FK_VA_Donation
                FOREIGN KEY (DonationId)
                REFERENCES dbo.Donations(DonationId),

            CONSTRAINT FK_VA_Volunteer
                FOREIGN KEY (VolunteerId)
                REFERENCES dbo.Users(UserId),

            CONSTRAINT FK_VA_NGO
                FOREIGN KEY (AssignedByNgoId)
                REFERENCES dbo.Users(UserId)
        );
    END;

    -- Backfill only from recorded assignments.
    -- Do not assign donations to arbitrary NGOs.

    EXEC(N'
        UPDATE d
        SET d.AcceptedByNgoId = va.AssignedByNgoId
        FROM dbo.Donations d
        INNER JOIN (
            SELECT DonationId,
                   MIN(AssignedByNgoId) AS AssignedByNgoId
            FROM dbo.VolunteerAssignments
            GROUP BY DonationId
            HAVING COUNT(DISTINCT AssignedByNgoId) = 1
        ) va ON d.DonationId = va.DonationId
        WHERE d.AcceptedByNgoId IS NULL;
    ');

    -- 3. NGO verification workflow

    IF COL_LENGTH('dbo.NGOProfiles', 'VerificationStatus') IS NULL
    BEGIN
        ALTER TABLE dbo.NGOProfiles
        ADD VerificationStatus NVARCHAR(20) NOT NULL
        CONSTRAINT DF_NGOProfiles_VerificationStatus
        DEFAULT 'Pending';

        EXEC(N'
            UPDATE dbo.NGOProfiles
            SET VerificationStatus =
                CASE
                    WHEN IsVerified = 1 THEN ''Approved''
                    ELSE ''Pending''
                END;
        ');
    END;

    IF OBJECT_ID(
        'dbo.CK_NGOProfiles_VerificationStatus', 'C'
    ) IS NULL
    BEGIN
        EXEC(N'
            ALTER TABLE dbo.NGOProfiles WITH CHECK
            ADD CONSTRAINT CK_NGOProfiles_VerificationStatus
            CHECK (
                (VerificationStatus = ''Approved''
                 AND IsVerified = 1)
                OR
                (VerificationStatus IN (''Pending'', ''Rejected'')
                 AND IsVerified = 0)
            );
        ');
    END;

    -- 4. Notification system

    IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Notifications
        (
            NotificationId INT IDENTITY(1,1) PRIMARY KEY,
            UserId INT NOT NULL,
            Title NVARCHAR(120) NOT NULL,
            Message NVARCHAR(500) NOT NULL,
            IsRead BIT NOT NULL DEFAULT 0,
            CreatedAt DATETIME2(7) NOT NULL
                DEFAULT SYSUTCDATETIME(),

            CONSTRAINT FK_Notifications_Users
                FOREIGN KEY (UserId)
                REFERENCES dbo.Users(UserId)
        );
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_Notifications_UserId_IsRead'
        AND object_id = OBJECT_ID('dbo.Notifications')
    )
    BEGIN
        CREATE INDEX IX_Notifications_UserId_IsRead
        ON dbo.Notifications(UserId, IsRead);
    END;

    COMMIT TRANSACTION;

    PRINT 'RescueFlow AI database upgraded successfully.';

END TRY
BEGIN CATCH

    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;

END CATCH;
GO
