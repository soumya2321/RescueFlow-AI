-- ============================================================================
-- RescueFlow AI — Test Queries
-- File: 05_TestQueries.sql
-- Purpose: 12 test queries to verify the database works correctly.
--          Run these after inserting sample data (04_InsertSampleData.sql).
--
-- HOW TO RUN:
--   1. Run scripts 01 through 04 first.
--   2. Open this file in SSMS (connected to RescueFlowDB).
--   3. You can run ALL queries at once (F5), or highlight individual
--      queries and press F5 to run them one at a time.
--
-- TIP FOR VIVA: Your mentor may ask you to demonstrate specific queries.
--   Practice running them one at a time and explaining the output.
-- ============================================================================

USE RescueFlowDB;
GO


-- ============================================================================
-- QUERY 1: View all users
-- ============================================================================
-- Purpose: Display all registered users with their roles.
-- Note: We exclude PasswordHash from the output for security —
--       you should NEVER display password hashes on screen.
-- ============================================================================

PRINT '=== QUERY 1: All Users ===';

SELECT
    UserId,
    FullName,
    Email,
    Role,
    Phone,
    CASE WHEN IsActive = 1 THEN 'Active' ELSE 'Inactive' END AS AccountStatus,
    CreatedAt
FROM Users
ORDER BY Role, FullName;
GO


-- ============================================================================
-- QUERY 2: View all available donations
-- ============================================================================
-- Purpose: Find donations that are waiting for an NGO to accept.
-- This is what NGOs see when they open the "Available Donations" page.
--
-- WHERE Status = 'Available'  → only show unclaimed donations
-- ============================================================================

PRINT '=== QUERY 2: Available Donations ===';

SELECT
    d.DonationId,
    d.FoodName,
    d.FoodCategory,
    d.Quantity,
    d.Unit,
    d.FoodCondition,
    d.PickupDeadline,
    d.PickupAddress,
    u.FullName          AS DonorName,
    d.UrgencyLevel
FROM Donations d
    INNER JOIN Users u ON d.DonorId = u.UserId
WHERE d.Status = 'Available'
ORDER BY d.UrgencyScore DESC;    -- Most urgent first
GO


-- ============================================================================
-- QUERY 3: View donations with urgency scores
-- ============================================================================
-- Purpose: Show all donations sorted by urgency for the admin dashboard.
-- The urgency score (0-100) determines priority for redistribution.
--
-- INNER JOIN: connects Donations to Users to show the donor's name
--   instead of just DonorId (which is a meaningless number to humans).
-- ============================================================================

PRINT '=== QUERY 3: Donations with Urgency Scores ===';

SELECT
    d.DonationId,
    d.FoodName,
    d.FoodCategory,
    d.Quantity,
    d.Unit,
    d.Status,
    d.UrgencyScore,
    d.UrgencyLevel,
    d.PickupDeadline,
    u.FullName          AS DonorName
FROM Donations d
    INNER JOIN Users u ON d.DonorId = u.UserId
ORDER BY d.UrgencyScore DESC;
GO


-- ============================================================================
-- QUERY 4: Find critical and high-priority donations
-- ============================================================================
-- Purpose: Emergency view — show only donations that need immediate action.
-- These are donations with UrgencyLevel = 'Critical' or 'High' that
-- are still actionable (not completed, cancelled, or expired).
--
-- AND Status IN (...): only show statuses where action can still be taken.
-- ============================================================================

PRINT '=== QUERY 4: Critical/High Priority Donations ===';

SELECT
    d.DonationId,
    d.FoodName,
    d.FoodCategory,
    d.Quantity,
    d.Unit,
    d.UrgencyScore,
    d.UrgencyLevel,
    d.Status,
    d.PickupDeadline,
    u.FullName          AS DonorName,
    u.Phone             AS DonorPhone,
    d.PickupAddress
FROM Donations d
    INNER JOIN Users u ON d.DonorId = u.UserId
WHERE d.UrgencyLevel IN ('Critical', 'High')
  AND d.Status IN ('Available', 'Accepted', 'Assigned')
ORDER BY d.UrgencyScore DESC;
GO


-- ============================================================================
-- QUERY 5: View donations created by each donor
-- ============================================================================
-- Purpose: Show donation summary grouped by donor.
-- COUNT(*) counts the number of donations per donor.
-- GROUP BY groups the results by donor name.
--
-- This is useful for the admin dashboard:
--   "Priya Sharma has donated 3 times, Rajesh Patel 3 times, etc."
-- ============================================================================

PRINT '=== QUERY 5: Donations by Each Donor ===';

SELECT
    u.FullName          AS DonorName,
    u.Email             AS DonorEmail,
    COUNT(*)            AS TotalDonations,
    SUM(d.Quantity)     AS TotalQuantity,
    MIN(d.CreatedAt)    AS FirstDonation,
    MAX(d.CreatedAt)    AS LatestDonation
FROM Users u
    INNER JOIN Donations d ON u.UserId = d.DonorId
WHERE u.Role = 'Donor'
GROUP BY u.FullName, u.Email
ORDER BY TotalDonations DESC;
GO


-- ============================================================================
-- QUERY 6: Find NGOs accepting a specific food category
-- ============================================================================
-- Purpose: When a donor creates a "Cooked Food" donation, find all NGOs
--          that accept "Cooked Food".
--
-- This query uses TWO JOINs:
--   NGOAcceptedCategories → NGOProfiles → Users
-- to get from the category to the NGO's name and contact info.
--
-- Change 'Cooked Food' to any other category to test different matches.
-- ============================================================================

PRINT '=== QUERY 6: NGOs Accepting "Cooked Food" ===';

SELECT
    np.OrganizationName,
    u.FullName          AS ContactPerson,
    u.Email,
    u.Phone,
    np.MaximumCapacity,
    np.CapacityUnit,
    np.Location,
    CASE WHEN np.IsVerified = 1 THEN 'Verified' ELSE 'Pending' END AS VerificationStatus
FROM NGOAcceptedCategories nac
    INNER JOIN NGOProfiles np ON nac.NGOProfileId = np.NGOProfileId
    INNER JOIN Users u ON np.UserId = u.UserId
WHERE nac.FoodCategory = N'Cooked Food'
  AND nac.IsActive = 1
  AND u.IsActive = 1
ORDER BY np.IsVerified DESC, np.OrganizationName;
GO


-- ============================================================================
-- QUERY 7: Find NGOs with enough capacity for a donation
-- ============================================================================
-- Purpose: Given a donation of 30 kg, find NGOs whose maximum capacity
--          is at least 30 and who accept that food category.
--
-- NOTE: This is a simplified capacity check. In a real system, you'd
--   also subtract currently active/pending pickups from MaximumCapacity
--   to get "available capacity." For the MVP, we compare against max.
--
-- Change the values (30, 'kg', 'Raw Vegetables') to test other scenarios.
-- ============================================================================

PRINT '=== QUERY 7: NGOs with Capacity for 30 kg of Raw Vegetables ===';

SELECT
    np.OrganizationName,
    np.MaximumCapacity,
    np.CapacityUnit,
    np.Location,
    u.FullName          AS ContactPerson,
    u.Phone
FROM NGOProfiles np
    INNER JOIN Users u ON np.UserId = u.UserId
    INNER JOIN NGOAcceptedCategories nac ON np.NGOProfileId = nac.NGOProfileId
WHERE nac.FoodCategory = N'Raw Vegetables'
  AND nac.IsActive = 1
  AND np.MaximumCapacity >= 30
  AND np.CapacityUnit = N'kg'
  AND np.IsVerified = 1
  AND u.IsActive = 1;
GO


-- ============================================================================
-- QUERY 8: View pickup tasks with NGO and volunteer names
-- ============================================================================
-- Purpose: Show all pickup tasks with human-readable names instead of IDs.
--
-- This query uses MULTIPLE JOINs:
--   PickupTasks → Donations (to get food info)
--   PickupTasks → Users (as ngo_user, for NGO name)
--   PickupTasks → Users (as vol_user, for Volunteer name) — LEFT JOIN
--     because VolunteerId can be NULL
--
-- LEFT JOIN vs INNER JOIN:
--   INNER JOIN: only returns rows where BOTH sides have data
--   LEFT JOIN:  returns all rows from the left table, even if the
--               right table has no match (shows NULL for volunteer)
-- ============================================================================

PRINT '=== QUERY 8: Pickup Tasks with Names ===';

SELECT
    pt.PickupTaskId,
    d.FoodName,
    d.Quantity,
    d.Unit,
    pt.Status                       AS TaskStatus,
    ngo_user.FullName               AS NGOContactName,
    np.OrganizationName             AS NGOName,
    COALESCE(vol_user.FullName, 'Not Assigned')  AS VolunteerName,
    pt.ScheduledPickupTime,
    pt.ActualPickupTime,
    pt.ActualDeliveryTime,
    pt.Notes
FROM PickupTasks pt
    INNER JOIN Donations d          ON pt.DonationId = d.DonationId
    INNER JOIN Users ngo_user       ON pt.NGOId = ngo_user.UserId
    INNER JOIN NGOProfiles np       ON ngo_user.UserId = np.UserId
    LEFT JOIN  Users vol_user       ON pt.VolunteerId = vol_user.UserId
ORDER BY
    CASE pt.Status
        WHEN 'Pending'   THEN 1
        WHEN 'Assigned'  THEN 2
        WHEN 'PickedUp'  THEN 3
        WHEN 'Delivered' THEN 4
        WHEN 'Failed'    THEN 5
        WHEN 'Cancelled' THEN 6
    END;
GO


-- ============================================================================
-- QUERY 9: View completed donations
-- ============================================================================
-- Purpose: Show all donations that have been successfully redistributed.
-- Used for the impact dashboard.
-- ============================================================================

PRINT '=== QUERY 9: Completed Donations ===';

SELECT
    d.DonationId,
    d.FoodName,
    d.FoodCategory,
    d.Quantity,
    d.Unit,
    donor.FullName                  AS DonorName,
    np.OrganizationName             AS ReceivedByNGO,
    vol.FullName                    AS DeliveredByVolunteer,
    pt.ActualPickupTime,
    pt.ActualDeliveryTime,
    d.PickupAddress                 AS PickedUpFrom,
    np.Location                     AS DeliveredTo
FROM Donations d
    INNER JOIN Users donor          ON d.DonorId = donor.UserId
    INNER JOIN PickupTasks pt       ON d.DonationId = pt.DonationId
    INNER JOIN Users ngo_user       ON pt.NGOId = ngo_user.UserId
    INNER JOIN NGOProfiles np       ON ngo_user.UserId = np.UserId
    LEFT JOIN  Users vol            ON pt.VolunteerId = vol.UserId
WHERE d.Status = 'Completed'
ORDER BY pt.ActualDeliveryTime DESC;
GO


-- ============================================================================
-- QUERY 10: Total redistributed quantity (Impact Dashboard)
-- ============================================================================
-- Purpose: Calculate how much food has been successfully redistributed,
--          grouped by unit of measurement.
--
-- SUM(d.Quantity): adds up all quantities
-- GROUP BY d.Unit: separates totals by unit (kg, meals, packets, etc.)
--
-- This powers the "Impact" section of the dashboard:
--   "We've redistributed 25 kg and 0 meals so far!"
-- ============================================================================

PRINT '=== QUERY 10: Total Redistributed Quantity by Unit ===';

SELECT
    d.Unit,
    COUNT(*)            AS CompletedDonations,
    SUM(d.Quantity)     AS TotalQuantity
FROM Donations d
WHERE d.Status = 'Completed'
GROUP BY d.Unit
ORDER BY TotalQuantity DESC;
GO


-- ============================================================================
-- QUERY 11: Donations approaching pickup deadlines
-- ============================================================================
-- Purpose: Find actionable donations whose deadline is within the next
--          24 hours. These need urgent attention.
--
-- SYSDATETIME(): returns the current date and time
-- DATEADD(HOUR, 24, SYSDATETIME()): adds 24 hours to current time
--
-- WHERE PickupDeadline BETWEEN [now] AND [now + 24 hours]:
--   finds donations expiring soon
-- AND Status IN (...): only actionable statuses
-- ============================================================================

PRINT '=== QUERY 11: Donations Approaching Deadlines (Next 24 Hours) ===';

SELECT
    d.DonationId,
    d.FoodName,
    d.FoodCategory,
    d.Quantity,
    d.Unit,
    d.Status,
    d.UrgencyScore,
    d.UrgencyLevel,
    d.PickupDeadline,
    DATEDIFF(MINUTE, SYSDATETIME(), d.PickupDeadline) AS MinutesRemaining,
    u.FullName          AS DonorName,
    u.Phone             AS DonorPhone,
    d.PickupAddress
FROM Donations d
    INNER JOIN Users u ON d.DonorId = u.UserId
WHERE d.PickupDeadline BETWEEN SYSDATETIME() AND DATEADD(HOUR, 24, SYSDATETIME())
  AND d.Status IN ('Available', 'Accepted', 'Assigned')
ORDER BY d.PickupDeadline ASC;      -- Soonest deadline first
GO


-- ============================================================================
-- QUERY 12: Check for orphan records and duplicate emails
-- ============================================================================
-- Purpose: Data integrity checks. Run these to verify the database
--          has no broken references or duplicate data.
--
-- ORPHAN RECORDS: rows that reference a parent that no longer exists.
--   For example, a Donation with a DonorId that doesn't match any UserId.
--   Our foreign keys should prevent this, but it's good to verify.
--
-- DUPLICATE EMAILS: Our UNIQUE constraint prevents this, but this query
--   confirms it.
-- ============================================================================

PRINT '=== QUERY 12A: Check for Orphan Donations (DonorId not in Users) ===';

SELECT d.*
FROM Donations d
    LEFT JOIN Users u ON d.DonorId = u.UserId
WHERE u.UserId IS NULL;
-- Expected result: 0 rows (no orphans)
GO


PRINT '=== QUERY 12B: Check for Orphan NGO Profiles (UserId not in Users) ===';

SELECT np.*
FROM NGOProfiles np
    LEFT JOIN Users u ON np.UserId = u.UserId
WHERE u.UserId IS NULL;
-- Expected result: 0 rows
GO


PRINT '=== QUERY 12C: Check for Orphan Pickup Tasks ===';

-- Tasks referencing non-existent donations
SELECT pt.*
FROM PickupTasks pt
    LEFT JOIN Donations d ON pt.DonationId = d.DonationId
WHERE d.DonationId IS NULL;
-- Expected result: 0 rows

-- Tasks referencing non-existent NGO users
SELECT pt.*
FROM PickupTasks pt
    LEFT JOIN Users u ON pt.NGOId = u.UserId
WHERE u.UserId IS NULL;
-- Expected result: 0 rows
GO


PRINT '=== QUERY 12D: Check for Duplicate Emails ===';

SELECT
    Email,
    COUNT(*) AS Occurrences
FROM Users
GROUP BY Email
HAVING COUNT(*) > 1;
-- Expected result: 0 rows (no duplicates)
GO


PRINT '=== QUERY 12E: Check NGO Profiles belong to NGO-role Users ===';

SELECT
    np.NGOProfileId,
    np.OrganizationName,
    u.FullName,
    u.Role
FROM NGOProfiles np
    INNER JOIN Users u ON np.UserId = u.UserId
WHERE u.Role <> 'NGO';
-- Expected result: 0 rows (all profiles should belong to NGO users)
GO


-- ============================================================================
-- END OF TEST QUERIES
-- ============================================================================
PRINT '';
PRINT '=============================================';
PRINT 'All 12 test queries executed successfully!';
PRINT 'Review the results above to verify your data.';
PRINT '=============================================';
GO
