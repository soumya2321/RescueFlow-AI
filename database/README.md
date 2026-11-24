# RescueFlow AI — Database Module

> Database design and implementation for the RescueFlow AI Intelligent Food Waste Prevention & Redistribution System.

---

## 📋 Overview

RescueFlow AI connects food donors (restaurants, supermarkets, grocery shops) with NGOs and volunteers to redistribute surplus food before it goes to waste. This module contains the complete SQL Server database design.

## 🛠️ Technology

| Component | Technology |
|---|---|
| Database | Microsoft SQL Server 2025 |
| Management Tool | SQL Server Management Studio (SSMS) |
| Backend ORM | Entity Framework Core |
| Backend | C# ASP.NET Core Web API (.NET 10) |

## 📁 Folder Structure

```
database/
├── README.md                       ← You are here
├── scripts/
│   ├── 01_CreateDatabase.sql       ← Creates the RescueFlowDB database
│   ├── 02_CreateTables.sql         ← Creates all 5 tables
│   ├── 03_CreateConstraintsAndIndexes.sql  ← CHECK constraints & indexes
│   ├── 04_InsertSampleData.sql     ← Realistic test data (10 users, 8 donations, etc.)
│   └── 05_TestQueries.sql          ← 12 test queries to verify data
├── diagrams/
│   └── RescueFlow_ERD.md           ← Mermaid ER diagram (view on GitHub)
└── docs/
    ├── DataDictionary.md           ← Every column, type, and constraint explained
    └── DatabaseDesign.md           ← Architecture, rationale, EF Core guide
```

## 🗄️ Database Tables

| Table | Records (Sample) | Purpose |
|---|---|---|
| **Users** | 10 | All system users (Donor, NGO, Volunteer, Admin) |
| **NGOProfiles** | 3 | Additional details for NGO users |
| **NGOAcceptedCategories** | 9 | Food categories each NGO accepts |
| **Donations** | 8 | Surplus food donation listings |
| **PickupTasks** | 5 | Pickup and delivery tracking |

## 🚀 Quick Start

### Prerequisites

- SQL Server 2025 installed and running
- SQL Server Management Studio (SSMS)

### Setup Steps

1. Open **SSMS** and connect to your SQL Server instance.
2. Run the scripts **in order** (1 → 2 → 3 → 4 → 5):

| Step | File | Action |
|---|---|---|
| 1 | `scripts/01_CreateDatabase.sql` | File → Open → Execute (F5) |
| 2 | `scripts/02_CreateTables.sql` | Select `RescueFlowDB` in dropdown → Execute |
| 3 | `scripts/03_CreateConstraintsAndIndexes.sql` | Execute |
| 4 | `scripts/04_InsertSampleData.sql` | Execute |
| 5 | `scripts/05_TestQueries.sql` | Execute — review results |

3. Verify by expanding `RescueFlowDB → Tables` in Object Explorer.

> ⚠️ **Important:** Always select `RescueFlowDB` in the database dropdown before executing scripts 02–05.

## 🔗 ER Diagram

View the full ER diagram with relationships: [RescueFlow_ERD.md](diagrams/RescueFlow_ERD.md)

```
Users ──┬── 1:1 ──── NGOProfiles ──── 1:N ──── NGOAcceptedCategories
        │
        ├── 1:N ──── Donations ──── 1:1 ──── PickupTasks
        │                                        │
        ├── 1:N ──── PickupTasks (as NGO) ───────┘
        └── 1:N ──── PickupTasks (as Volunteer, nullable)
```

## 📊 Donation Workflow

```
Available → Accepted → Assigned → PickedUp → Delivered → Completed
    │           │          │          │
    ├→ Cancelled ├→ Cancelled ├→ Failed  ├→ Failed
    ├→ Expired
    └→ Rejected
```

## 📖 Documentation

- **[Data Dictionary](docs/DataDictionary.md)** — Complete reference for all tables, columns, types, and constraints
- **[Database Design](docs/DatabaseDesign.md)** — Architecture, design rationale, normalization, and ASP.NET Core integration guide

## 🧪 Testing

Run `scripts/05_TestQueries.sql` to execute 12 test queries:

1. View all users
2. View available donations
3. Donations with urgency scores
4. Critical/high-priority donations
5. Donations by each donor
6. NGOs accepting a specific food category
7. NGOs with capacity for a donation
8. Pickup tasks with names
9. Completed donations
10. Total redistributed quantity (impact dashboard)
11. Donations approaching deadlines
12. Orphan records and duplicate email checks

## 👥 Team

This database module is part of the RescueFlow AI college major project, developed by a 4-member team.

## ⚠️ Sample Data Notice

The sample data in `04_InsertSampleData.sql` is for **development and testing only**:
- All names, emails, and phone numbers are **fictional**
- Password hashes are **fake placeholder strings** — real users must be created through the authentication API
- Do NOT use sample data in production
