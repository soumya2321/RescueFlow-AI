# RescueFlow AI 🚨🍱

### Intelligent Food Waste Prevention & Redistribution System

RescueFlow AI is a web-based platform designed to reduce food waste by connecting food donors with NGOs that can redistribute surplus food to people in need.

The system prioritizes food donations based on urgency and matches eligible NGOs to donations, helping ensure that surplus food is redistributed efficiently and on time.

## 🎯 Objectives

- Reduce food wastage by redistributing surplus food.
- Connect food donors with eligible NGOs.
- Prioritize donations using an urgency scoring mechanism.
- Manage donation acceptance and pickup workflows.
- Track food redistribution and social impact.

## ✨ Key Features

- **Food Donation Management** – Donors can register surplus food donations.
- **Urgency Scoring** – Prioritizes donations based on expiry time, food condition, and quantity.
- **NGO Matching** – Matches donations with eligible NGOs based on category, capacity, condition, and simulated proximity.
- **Donation Acceptance** – NGOs can accept or reject donation requests.
- **Pickup Management** – Tracks pickup and delivery statuses.
- **Impact Dashboard** – Displays completed donations and food redistribution statistics.

## 🧠 AI Logic

The project uses a rule-based intelligence mechanism rather than a trained machine-learning model.

### Donation Urgency Score

| Parameter | Maximum Score |
|---|---:|
| Time remaining | 50 |
| Food condition | 30 |
| Quantity | 20 |
| **Total** | **100** |

Urgency categories:

- Critical
- High
- Medium
- Low

### NGO Matching

NGOs are matched based on:

- Active and verified NGO status
- Food category compatibility
- Food condition eligibility
- NGO capacity
- Simulated proximity

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Backend | C#, ASP.NET Core Web API |
| Framework | .NET 10 |
| Database | SQL Server 2025 |
| ORM | Entity Framework Core |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| API Testing | Swagger, Postman |
| Version Control | Git, GitHub |
| IDE / Development Tools | Visual Studio, Antigravity |
| Unit Testing | xUnit |

## 🏗️ System Architecture

The application follows a layered architecture:

- Frontend – user interface and interactions
- API – HTTP endpoints and request handling
- Business Logic – urgency scoring, NGO matching and workflow logic
- Data Access – Entity Framework Core
- Database – SQL Server

## 👥 Project Team

RescueFlow AI is developed collaboratively by a four-member team.

| Member | Responsibility |
|---|---|
| Member 1 | Frontend Development |
| Member 2 | Backend API Development |
| Member 3 | Integration / Application Development |
| Member 4 | Database, AI Logic and Testing |

## 🚀 Getting Started

### Prerequisites

- .NET 10 SDK
- Node.js (v18+) & npm
- SQL Server 2025
- SQL Server Management Studio (SSMS)
- Git
- Visual Studio / VS Code or another compatible IDE

### Clone the Repository

```bash
git clone https://github.com/soumya2321/RescueFlow-AI.git
cd RescueFlow-AI
```

### Database Setup

1. Open SQL Server Management Studio.
2. Connect to your SQL Server instance.
3. Execute the database scripts in `database/scripts/` in numeric order (01 through 07):
   - `01_CreateDatabase.sql`
   - `02_CreateTables.sql`
   - `03_CreateConstraintsAndIndexes.sql`
   - `04_InsertSampleData.sql`
   - `05_TestQueries.sql`
   - `06_CreateVolunteerAssignments.sql`
   - `07_AddRecipientNgoIdToDonations.sql`
4. Verify that the database and tables have been created successfully.

### Run the Backend API

```bash
dotnet restore
dotnet build
dotnet run --project RescueFlow.API/RescueFlow.API.csproj
```

The API will listen at `http://localhost:5055`. Swagger is available at `http://localhost:5055/swagger`.

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173` and connect with the backend API.

## 🌿 Git Workflow

- `main` – stable and reviewed code
- Feature branches – individual development work

All changes should be developed on feature branches and submitted through Pull Requests.

Direct pushes to `main` are not permitted.

## 📂 Project Structure

```text
RescueFlow-AI/
│
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios HTTP client and API service endpoints
│   │   ├── components/   # UI layouts, role navigation bars, status badges, and modals
│   │   ├── context/      # AuthContext and ToastContext
│   │   ├── pages/        # Role dashboards (Donor, NGO, Volunteer, Admin) & feature workflows
│   │   └── types/        # TypeScript interfaces and data models
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── RescueFlow.API/
│   ├── Controllers/      # ASP.NET Core API controllers
│   ├── Data/             # RescueFlowDbContext and seed data
│   ├── DTOs/             # Data Transfer Objects for API requests and responses
│   ├── Models/           # Entity Framework Core domain models
│   ├── Services/         # Business services (Urgency calculation, NGO matching, etc.)
│   └── Program.cs        # Application startup, CORS configuration, JWT authentication
│
├── database/
│   ├── scripts/          # T-SQL scripts for database setup, test queries and migrations
│   ├── docs/             # Database design documents and data dictionaries
│   └── diagrams/         # Entity Relationship Diagram (Mermaid)
│
├── README.md
└── .gitignore
```

## 📊 Project Scope

The project focuses on:

- Food donation registration
- Rule-based urgency calculation
- NGO eligibility and matching
- Donation acceptance and rejection
- Pickup and delivery workflow
- Redistribution impact tracking

Advanced machine learning, real GPS tracking, route optimization, payment processing, IoT integration and mobile applications are outside the current project scope.

## 📄 Documentation

- Database design and schema – `database/docs/`
- Database scripts – `database/scripts/`
- Architecture documentation – `docs/architecture/`
- API documentation – `docs/api/`
- Testing documentation – `docs/testing/`

## 📜 License

This project is developed for academic purposes.
