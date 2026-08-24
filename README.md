# ClinIQ — Intelligent Healthcare Appointment & Follow-up Management System

ClinIQ is a modern, AI-powered platform designed to streamline the healthcare experience for patients, doctors, and clinic administrators. It bridges the communication gap before and after appointments using AI-generated summaries and seamlessly integrates with Google Calendar to manage schedules without friction.

---

## Key Features

### For Doctors
- **Personalized Dashboard**: View daily schedules, upcoming appointments, and completed visits at a glance.
- **AI Pre-Visit Summaries**: Before the patient walks in, review an AI-generated summary of their symptoms, chief complaint, urgency level, and suggested questions.
- **AI Post-Visit Prescriptions**: Type quick clinical notes, and the AI translates them into a patient-friendly summary, medication schedule, and follow-up plan.
- **Google Calendar Sync**: Automatically block off time slots in Google Calendar when a patient books an appointment.
- **Leave Management**: Request leave days which automatically handle conflict resolution by canceling affected appointments and notifying patients.

### For Patients
- **Smart Booking Flow**: Search for doctors by specialization, pick an available slot, and fill out a pre-visit symptom intake form.
- **Appointment Management**: View scheduled, completed, and canceled appointments.
- **Post-Visit Insights**: Access AI-generated, easy-to-read prescription summaries and follow-up instructions right from the dashboard.
- **Google Calendar Sync**: Add booked appointments directly to personal Google Calendars.

### For Administrators
- **Clinic Overview**: Track total doctors, patients, and platform users.
- **Doctor Roster & Leave Management**: Add leave days for doctors directly, with automatic conflict resolution for overlapping appointments.
- **User Management**: Register new doctors, admins, and patients. Configure doctor specializations, slot durations, and working hours.

---

## Technology Stack

**Frontend**
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM
- **HTTP Client**: Axios (with custom interceptors)
- **Notifications**: React Hot Toast

**Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (hosted on Neon)
- **ORM**: Prisma
- **Authentication**: JWT & Google OAuth 2.0
- **AI Integration**: Google Gemini API (`@google/genai`)
- **External APIs**: Google Calendar API

---

## Local Development Setup

### 1. Database Setup
Ensure you have a PostgreSQL database running (locally or via a service like Neon/Supabase). 

### 2. Backend Setup
```bash
cd Backend
npm install
```

**Environment Variables**
Create a `.env` file in the `Backend` directory:
```env
PORT=5000
DB_CONNECTION_STRING=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
```

**Run Migrations & Seed Data**
```bash
npx prisma generate
npx prisma db push
node scripts/cleanAndSeed.js
```

**Start the Server**
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd Frontend/ClinIQ
npm install
```

**Start the Vite Server**
```bash
npm run dev
```
The application will be running at `http://localhost:5173`.

---

## AI Prompt Design (Gemini)

ClinIQ leverages Google's Gemini AI to process unstructured text into structured healthcare data. 

**Pre-visit summary prompt:**
> *"Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: `<symptoms>`"*

**Post-visit summary prompt:**
> *"Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: `<notes>`"*

---

## Google Calendar & OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and enable the **Google Calendar API**.
3. Configure the **OAuth consent screen** (add scopes for `/auth/calendar.events` and `/auth/userinfo.email`).
4. Create **OAuth 2.0 Client IDs**.
5. Add `http://localhost:5000/api/v1/auth/google/callback` to the **Authorized redirect URIs**.
6. Copy the Client ID and Secret to your backend `.env` file.

---

## Deployment

For detailed deployment instructions, refer to the guides in the `Planning Docs` folder:
- [Backend Deployment Guide (Render)](./Planning%20Docs/backend_deployment.md)
- [Frontend Deployment Guide (Vercel)](./Planning%20Docs/frontend_deployment.md)

---
*Built for a smarter healthcare future.*