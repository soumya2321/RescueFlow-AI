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
| Frontend | HTML, CSS, JavaScript, Bootstrap |
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
- SQL Server 2025
- SQL Server Management Studio (SSMS)
- Git
- Visual Studio or another compatible IDE

### Clone the Repository

```bash
git clone https://github.com/soumya2321/RescueFlow-AI.git
cd RescueFlow-AI
```

### Database Setup

1. Open SQL Server Management Studio.
2. Connect to your SQL Server instance.
3. Execute the database scripts available in the `database/scripts/` directory in the documented order.
4. Verify that the database and tables have been created successfully.

### Run the Backend API

```bash
dotnet restore
dotnet build
dotnet run --project RescueFlow.API/RescueFlow.API.csproj
```

Use Swagger to explore and test available API endpoints when Swagger is configured and enabled.

## 🌿 Git Workflow

- `main` – stable and reviewed code
- Feature branches – individual development work

All changes should be developed on feature branches and submitted through Pull Requests.

Direct pushes to `main` are not permitted.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development and contribution guidelines.

## 📂 Project Structure

```text
RescueFlow-AI/
│
├── RescueFlow.API/
│   ├── Controllers/
│   ├── Data/
│   ├── Models/
│   ├── Services/
│   └── Program.cs
│
├── database/
│   ├── scripts/
│   ├── docs/
│   └── diagrams/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── testing/
│
├── tests/
│
├── CONTRIBUTING.md
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
