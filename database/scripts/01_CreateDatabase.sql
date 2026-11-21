-- ============================================================================
-- RescueFlow AI — Database Creation Script
-- File: 01_CreateDatabase.sql
-- Purpose: Creates the RescueFlowDB database on SQL Server
-- 
-- HOW TO RUN:
--   1. Open SQL Server Management Studio (SSMS)
--   2. Connect to your SQL Server instance
--   3. Open this file (File → Open → File)
--   4. Click "Execute" or press F5
--
-- NOTE: This script must be run FIRST, before any other scripts.
-- ============================================================================

-- Check if the database already exists. If it does, print a message.
-- If it doesn't, create it.
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'RescueFlowDB')
BEGIN
    CREATE DATABASE RescueFlowDB;
    PRINT 'Database RescueFlowDB created successfully.';
END
ELSE
BEGIN
    PRINT 'Database RescueFlowDB already exists. Skipping creation.';
END
GO

-- Switch to the new database for all subsequent scripts
USE RescueFlowDB;
GO

PRINT 'Now using RescueFlowDB.';
GO
