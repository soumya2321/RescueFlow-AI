-- ============================================================================
-- RescueFlow AI — Sample Data Insertion Script
-- File: 04_InsertSampleData.sql
-- Purpose: Inserts realistic test data for development and testing.
--
-- ⚠️ WARNING: This is DEVELOPMENT-ONLY data. Do NOT use in production.
--    Password hashes are FAKE placeholders.
--    Names, emails, and phone numbers are FICTIONAL.
--
-- HOW TO RUN:
--   1. Run scripts 01, 02, and 03 first.
--   2. Open this file in SSMS (connected to RescueFlowDB).
--   3. Click "Execute" or press F5.
--
-- DATA INSERTED:
--   • 10 Users: 1 Admin, 3 Donors, 3 NGOs, 3 Volunteers
--   • 3 NGO Profiles with different capacities and locations
--   • 9 NGO Accepted Categories (3 per NGO, varied)
--   • 8 Donations with different statuses, categories, urgencies
--   • 5 Pickup Tasks in different workflow stages
-- ============================================================================

USE RescueFlowDB;
GO

-- ============================================================================
-- SECTION 1: USERS
-- ============================================================================
-- ⚠️ IMPORTANT: PasswordHash values below are NOT real password hashes.
--    They are placeholder strings clearly marked as development-only.
--    In production, your ASP.NET Core backend will generate real hashes
--    using BCrypt, PBKDF2, or ASP.NET Core Identity's built-in hasher.
--    NEVER use these placeholders in a live system.
-- ============================================================================

PRINT 'Inserting Users...';

-- Check if data already exists to avoid duplicate inserts
IF NOT EXISTS (SELECT 1 FROM Users)
BEGIN
    SET IDENTITY_INSERT Users ON;

    INSERT INTO Users (UserId, FullName, Email, PasswordHash, Role, Phone, IsActive, CreatedAt, UpdatedAt)
    VALUES
    -- ===== ADMIN =====
    (1,  N'Arjun Mehta',       N'arjun.admin@rescueflow.dev',
         N'DEV_ONLY_PLACEHOLDER_HASH_admin_DO_NOT_USE_IN_PRODUCTION',
         N'Admin',     N'+91-9000000001', 1, '2026-01-01 09:00:00', '2026-01-01 09:00:00'),

    -- ===== DONORS (users who donate surplus food) =====
    (2,  N'Priya Sharma',      N'priya.donor@rescueflow.dev',
         N'DEV_ONLY_PLACEHOLDER_HASH_donor1_DO_NOT_USE_IN_PRODUCTION',
         N'Donor',     N'+91-9000000002', 1, '2026-01-15 10:00:00', '2026-01-15 10:00:00'),

    (3,  N'Rajesh Patel',      N'rajesh.donor@rescueflow.dev',
         N'DEV_ONLY_PLACEHOLDER_HASH_donor2_DO_NOT_USE_IN_PRODUCTION',
         N'Donor',     N'+91-9000000003', 1, '2026-02-01 11:00:00', '2026-02-01 11:00:00'),

    (4,  N'Sneha Iyer',        N'sneha.donor@rescueflow.dev',
         N'DEV_ONLY_PLACEHOLDER_HASH_donor3_DO_NOT_USE_IN_PRODUCTION',
         N'Donor',     N'+91-9000000004', 1, '2026-02-10 12:00:00', '2026-02-10 12:00:00'),

    -- ===== NGOs (organizations that accept and redistribute food) =====
    (5,  N'Kavita Reddy',      N'kavita.ngo@rescueflow.dev',
         N'DEV_ONLY_PLACEHOLDER_HASH_ngo1_DO_NOT_USE_IN_PRODUCTION',
         N'NGO',       N'+91-9000000005', 1, '2026-01-20 09:30:00', '2026-01-20 09:30:00'),

    (6,  N'Mohammad Hussain',  N'mohammad.ngo@rescueflow.dev',
         N'DEV_ONLY_PLACEHOLDER_HASH_ngo2_DO_NOT_USE_IN_PRODUCTION',
         N'NGO',       N'+91-9000000006', 1, '2026-02-05 10:30:00', '2026-02-05 10:30:00'),

    (7,  N'Ananya Gupta',      N'ananya.ngo@rescueflow.dev',
         N'DEV_ONLY_PLACEHOLDER_HASH_ngo3_DO_NOT_USE_IN_PRODUCTION',
         N'NGO',       N'+91-9000000007', 1, '2026-03-01 11:30:00', '2026-03-01 11:30:00'),

    -- ===== VOLUNTEERS (people who pick up and deliver food) =====
    (8,  N'Vikram Singh',      N'vikram.volunteer@rescueflow.dev',
         N'DEV_ONLY_PLACEHOLDER_HASH_vol1_DO_NOT_USE_IN_PRODUCTION',
         N'Volunteer', N'+91-9000000008', 1, '2026-02-15 08:00:00', '2026-02-15 08:00:00'),

    (9,  N'Deepa Nair',        N'deepa.volunteer@rescueflow.dev',
         N'DEV_ONLY_PLACEHOLDER_HASH_vol2_DO_NOT_USE_IN_PRODUCTION',
         N'Volunteer', N'+91-9000000009', 1, '2026-03-01 09:00:00', '2026-03-01 09:00:00'),

    (10, N'Amit Joshi',        N'amit.volunteer@rescueflow.dev',
         N'DEV_ONLY_PLACEHOLDER_HASH_vol3_DO_NOT_USE_IN_PRODUCTION',
         N'Volunteer', N'+91-9000000010', 1, '2026-03-10 10:00:00', '2026-03-10 10:00:00');

    SET IDENTITY_INSERT Users OFF;

    PRINT '  ✓ 10 users inserted (1 Admin, 3 Donors, 3 NGOs, 3 Volunteers).';
END
ELSE
    PRINT '  Users table already has data. Skipping.';
GO


-- ============================================================================
-- SECTION 2: NGO PROFILES
-- ============================================================================
-- Each NGO user (UserId 5, 6, 7) gets one profile with their
-- organization details, capacity, and verification status.
-- ============================================================================

PRINT 'Inserting NGO Profiles...';

IF NOT EXISTS (SELECT 1 FROM NGOProfiles)
BEGIN
    SET IDENTITY_INSERT NGOProfiles ON;

    INSERT INTO NGOProfiles (NGOProfileId, UserId, OrganizationName, MaximumCapacity, CapacityUnit, Location, IsVerified, CreatedAt, UpdatedAt)
    VALUES
    (1, 5, N'Helping Hands Foundation',   500.00, N'kg',
        N'45 MG Road, Bengaluru, Karnataka 560001',
        1,  -- Verified by admin
        '2026-01-20 09:30:00', '2026-01-20 09:30:00'),

    (2, 6, N'Food For All Trust',         200.00, N'meals',
        N'12 Jubilee Hills, Hyderabad, Telangana 500033',
        1,  -- Verified
        '2026-02-05 10:30:00', '2026-02-05 10:30:00'),

    (3, 7, N'Anna Daan Seva',              50.00, N'kg',
        N'78 Connaught Place, New Delhi 110001',
        0,  -- NOT yet verified (pending admin approval)
        '2026-03-01 11:30:00', '2026-03-01 11:30:00');

    SET IDENTITY_INSERT NGOProfiles OFF;

    PRINT '  ✓ 3 NGO profiles inserted.';
    PRINT '    - Helping Hands Foundation (Bengaluru, 500 kg, verified)';
    PRINT '    - Food For All Trust (Hyderabad, 200 meals, verified)';
    PRINT '    - Anna Daan Seva (New Delhi, 50 kg, NOT verified)';
END
ELSE
    PRINT '  NGOProfiles table already has data. Skipping.';
GO


-- ============================================================================
-- SECTION 3: NGO ACCEPTED CATEGORIES
-- ============================================================================
-- Each NGO specifies which food categories they can accept.
-- This is used for matching: when a donor creates a "Cooked Food"
-- donation, the system finds NGOs that accept "Cooked Food".
-- ============================================================================

PRINT 'Inserting NGO Accepted Categories...';

IF NOT EXISTS (SELECT 1 FROM NGOAcceptedCategories)
BEGIN
    INSERT INTO NGOAcceptedCategories (NGOProfileId, FoodCategory, IsActive)
    VALUES
    -- Helping Hands Foundation (NGOProfileId = 1) — accepts 3 categories
    (1, N'Cooked Food',      1),
    (1, N'Raw Vegetables',   1),
    (1, N'Bakery Items',     1),

    -- Food For All Trust (NGOProfileId = 2) — accepts 3 categories
    (2, N'Cooked Food',      1),
    (2, N'Packaged Food',    1),
    (2, N'Dairy Products',   1),

    -- Anna Daan Seva (NGOProfileId = 3) — accepts 3 categories
    (3, N'Cooked Food',      1),
    (3, N'Raw Vegetables',   1),
    (3, N'Fruits',           1);

    PRINT '  ✓ 9 NGO accepted categories inserted (3 per NGO).';
END
ELSE
    PRINT '  NGOAcceptedCategories table already has data. Skipping.';
GO


-- ============================================================================
-- SECTION 4: DONATIONS
-- ============================================================================
-- 8 donations with varied:
--   • Food categories (Cooked Food, Raw Vegetables, Bakery, etc.)
--   • Quantities and units
--   • Conditions (Fresh, Near Expiry, Leftover, Packed)
--   • Statuses (Available, Accepted, Assigned, PickedUp, Delivered, Completed, Cancelled, Expired)
--   • Urgency levels (Critical, High, Medium, Low)
--   • Pickup deadlines (some past, some future)
--
-- NOTE: Deadlines use dates relative to Nov 2026 for realistic testing.
-- ============================================================================

PRINT 'Inserting Donations...';

IF NOT EXISTS (SELECT 1 FROM Donations)
BEGIN
    SET IDENTITY_INSERT Donations ON;

    INSERT INTO Donations
        (DonationId, DonorId, FoodName, FoodCategory, Quantity, Unit,
         FoodCondition, StorageType, PickupDeadline, PickupAddress,
         Description, Status, UrgencyScore, UrgencyLevel, CreatedAt, UpdatedAt)
    VALUES
    -- Donation 1: COMPLETED — full lifecycle done
    (1, 2, N'Chicken Biryani',      N'Cooked Food',     25.00, N'kg',
        N'Fresh',       N'Refrigerated',    '2026-11-15 18:00:00',
        N'Spice Garden Restaurant, 23 Brigade Road, Bengaluru',
        N'Leftover from a catering event. Well-packed in containers.',
        N'Completed',   85.50, N'Critical',
        '2026-11-14 10:00:00', '2026-11-15 17:00:00'),

    -- Donation 2: AVAILABLE — fresh, waiting for NGO acceptance
    (2, 2, N'Mixed Vegetable Curry', N'Cooked Food',     10.00, N'kg',
        N'Fresh',       N'Room Temperature', '2026-11-22 20:00:00',
        N'Spice Garden Restaurant, 23 Brigade Road, Bengaluru',
        N'Today''s lunch surplus. Must be consumed within 6 hours.',
        N'Available',   72.00, N'High',
        '2026-11-21 08:00:00', '2026-11-21 08:00:00'),

    -- Donation 3: ACCEPTED — NGO accepted, waiting for volunteer
    (3, 3, N'Assorted Bread Rolls',  N'Bakery Items',    50.00, N'packets',
        N'Near Expiry', N'Room Temperature', '2026-11-22 12:00:00',
        N'Patel Bakery, 56 Station Road, Hyderabad',
        N'Day-old bread rolls. Best consumed today.',
        N'Accepted',    65.00, N'High',
        '2026-11-20 16:00:00', '2026-11-21 07:00:00'),

    -- Donation 4: ASSIGNED — volunteer assigned, pickup pending
    (4, 3, N'Fresh Tomatoes & Onions', N'Raw Vegetables', 30.00, N'kg',
        N'Fresh',       N'Room Temperature', '2026-11-23 10:00:00',
        N'Patel Grocery Store, 12 Market Road, Hyderabad',
        N'Surplus stock from weekly delivery. Good condition.',
        N'Assigned',    45.00, N'Medium',
        '2026-11-20 09:00:00', '2026-11-21 06:00:00'),

    -- Donation 5: DELIVERED — picked up and delivered, awaiting confirmation
    (5, 4, N'Paneer Tikka',         N'Cooked Food',      8.00,  N'kg',
        N'Leftover',    N'Refrigerated',     '2026-11-21 22:00:00',
        N'Sneha''s Kitchen, 89 Lajpat Nagar, New Delhi',
        N'From a birthday party. Refrigerated immediately.',
        N'Delivered',   58.00, N'High',
        '2026-11-21 06:00:00', '2026-11-21 08:00:00'),

    -- Donation 6: CANCELLED — donor cancelled before pickup
    (6, 4, N'Fruit Salad',          N'Fruits',           5.00,  N'kg',
        N'Fresh',       N'Refrigerated',     '2026-11-20 15:00:00',
        N'Sneha''s Kitchen, 89 Lajpat Nagar, New Delhi',
        N'Cancelled because the food was consumed by staff.',
        N'Cancelled',   30.00, N'Medium',
        '2026-11-19 10:00:00', '2026-11-19 14:00:00'),

    -- Donation 7: EXPIRED — deadline passed without pickup
    (7, 2, N'Dal Makhani',          N'Cooked Food',      15.00, N'kg',
        N'Leftover',    N'Room Temperature', '2026-11-18 14:00:00',
        N'Spice Garden Restaurant, 23 Brigade Road, Bengaluru',
        N'Could not be picked up in time. Food disposed of.',
        N'Expired',     92.00, N'Critical',
        '2026-11-17 20:00:00', '2026-11-18 14:00:00'),

    -- Donation 8: AVAILABLE — low urgency, plenty of time
    (8, 3, N'Packaged Rice Bags',   N'Packaged Food',    100.00, N'kg',
        N'Packed',      N'Room Temperature', '2026-11-30 18:00:00',
        N'Patel Grocery Store, 12 Market Road, Hyderabad',
        N'Excess stock of 5kg rice bags. Long shelf life.',
        N'Available',   15.00, N'Low',
        '2026-11-20 14:00:00', '2026-11-20 14:00:00');

    SET IDENTITY_INSERT Donations OFF;

    PRINT '  ✓ 8 donations inserted with varied statuses and urgency levels.';
END
ELSE
    PRINT '  Donations table already has data. Skipping.';
GO


-- ============================================================================
-- SECTION 5: PICKUP TASKS
-- ============================================================================
-- Pickup tasks correspond to donations that have been accepted by an NGO.
-- Each task tracks the assignment, pickup, and delivery stages.
--
-- Task mapping:
--   Task 1 → Donation 1 (Completed)  — full lifecycle
--   Task 2 → Donation 3 (Pending)    — NGO accepted, no volunteer yet
--   Task 3 → Donation 4 (Assigned)   — volunteer assigned, waiting for pickup
--   Task 4 → Donation 5 (Delivered)  — delivered, awaiting confirmation
--   Task 5 → Donation 6 (Cancelled)  — was cancelled
-- ============================================================================

PRINT 'Inserting Pickup Tasks...';

IF NOT EXISTS (SELECT 1 FROM PickupTasks)
BEGIN
    SET IDENTITY_INSERT PickupTasks ON;

    INSERT INTO PickupTasks
        (PickupTaskId, DonationId, NGOId, VolunteerId,
         AssignedAt, ScheduledPickupTime, ActualPickupTime, ActualDeliveryTime,
         Status, Notes, CreatedAt, UpdatedAt)
    VALUES
    -- Task 1: DELIVERED (for Donation 1 which is Completed)
    -- Full lifecycle: NGO accepted → Volunteer assigned → Picked up → Delivered
    (1, 1, 5, 8,
        '2026-11-14 11:00:00',   -- Volunteer assigned at
        '2026-11-14 14:00:00',   -- Scheduled pickup
        '2026-11-14 14:30:00',   -- Actually picked up
        '2026-11-14 15:30:00',   -- Actually delivered
        N'Delivered',
        N'Smooth pickup and delivery. Food in good condition.',
        '2026-11-14 10:30:00', '2026-11-14 15:30:00'),

    -- Task 2: PENDING (for Donation 3 — Accepted, no volunteer yet)
    (2, 3, 5, NULL,
        NULL,                     -- No volunteer assigned yet
        NULL,                     -- No scheduled time yet
        NULL,                     -- Not picked up
        NULL,                     -- Not delivered
        N'Pending',
        N'Looking for available volunteer in Hyderabad area.',
        '2026-11-21 07:00:00', '2026-11-21 07:00:00'),

    -- Task 3: ASSIGNED (for Donation 4 — volunteer assigned)
    (3, 4, 6, 9,
        '2026-11-21 06:30:00',   -- Volunteer assigned
        '2026-11-22 09:00:00',   -- Scheduled for tomorrow morning
        NULL,                     -- Not picked up yet
        NULL,                     -- Not delivered yet
        N'Assigned',
        N'Volunteer Deepa confirmed availability for tomorrow.',
        '2026-11-21 06:00:00', '2026-11-21 06:30:00'),

    -- Task 4: DELIVERED (for Donation 5 — delivered, awaiting completion confirmation)
    (4, 5, 7, 10,
        '2026-11-21 06:30:00',   -- Volunteer assigned
        '2026-11-21 07:30:00',   -- Scheduled pickup
        '2026-11-21 07:45:00',   -- Actually picked up
        '2026-11-21 08:30:00',   -- Actually delivered
        N'Delivered',
        N'Delivered to Anna Daan Seva. Awaiting NGO confirmation.',
        '2026-11-21 06:15:00', '2026-11-21 08:30:00'),

    -- Task 5: CANCELLED (for Donation 6 — donor cancelled)
    (5, 6, 7, NULL,
        NULL, NULL, NULL, NULL,
        N'Cancelled',
        N'Donor cancelled the donation. Food consumed by staff.',
        '2026-11-19 12:00:00', '2026-11-19 14:00:00');

    SET IDENTITY_INSERT PickupTasks OFF;

    PRINT '  ✓ 5 pickup tasks inserted in various stages.';
END
ELSE
    PRINT '  PickupTasks table already has data. Skipping.';
GO


-- ============================================================================
-- VERIFICATION: Show record counts
-- ============================================================================
PRINT '';
PRINT '=============================================';
PRINT 'Sample data insertion complete!';
PRINT '=============================================';
PRINT '';

SELECT 'Users'                  AS TableName, COUNT(*) AS RecordCount FROM Users
UNION ALL
SELECT 'NGOProfiles',           COUNT(*) FROM NGOProfiles
UNION ALL
SELECT 'NGOAcceptedCategories', COUNT(*) FROM NGOAcceptedCategories
UNION ALL
SELECT 'Donations',             COUNT(*) FROM Donations
UNION ALL
SELECT 'PickupTasks',           COUNT(*) FROM PickupTasks;

PRINT '';
PRINT 'Next: Run 05_TestQueries.sql to verify the data.';
GO
