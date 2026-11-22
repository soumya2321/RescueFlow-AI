# RescueFlow AI — Frontend Prototype

Responsive browser-based prototype for a food rescue and redistribution workflow.

## Run it
1. Extract the ZIP.
2. Open `index.html` in a browser (or run a simple local server such as VS Code Live Server).
3. Use one of the demo accounts below.

## Demo accounts
Password for all accounts: `demo123`
- Food Donor: `donor@rescueflow.demo`
- Recipient Organization: `ngo@rescueflow.demo`
- Volunteer: `volunteer@rescueflow.demo`
- Administrator: `admin@rescueflow.demo`

## Included features
- Login and signup UI with role selection
- Dashboard and quick actions
- Food surplus registration (department, category, deadline, storage, condition, expiry, allergens)
- Inventory tracking with expiry alerts and filters
- Recipient organization cards and food offers
- Pickup creation and status updates
- Volunteer list and add-volunteer flow
- Impact/report dashboard
- Notifications and settings
- Browser localStorage persistence

## Important
This is a hackathon frontend demo. Demo login stores passwords locally and is **not secure**. Do not use real credentials, personal information, or production food-safety workflows. Real deployment requires a backend, secure authentication, authorization, validated APIs, database persistence, organization verification, and food-safety review. Expired inventory is blocked from donation actions in this prototype, but date-based UI checks alone do not establish food safety.
