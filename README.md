# FSOL Attendance Frontend

This project is the frontend UI for a simple HR attendance system. It provides:

- Daily punch in/out tracking
- Attendance history views (personal + company-wide for HR/management)
- Employee status dashboards (in-office, outside, WFH)

---

## Running locally

### Prerequisites
- Node.js (v16+ recommended)

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

The app will typically be available at `http://localhost:5173`.

---

## Notes
- This is a frontend-only repository. It expects a backend API to serve attendance data and handle punch in/out actions.
- API configuration is handled via `VITE_API_BASE_URL` in `vite.config.ts` or an `.env` file.
