# ClinIQ — Intelligent Healthcare Appointment & Follow-up Management System

## Setup Guide

### Backend
1. cd `Backend`
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in the values
4. Run database migrations: `npx prisma migrate dev`
5. Start the server: `npm run dev`

### Frontend
1. cd `Frontend/ClinIQ`
2. Run `npm install`
3. Start the Vite server: `npm run dev`

## API Documentation
(To be populated)

## Database Schema
(To be populated)

## LLM Prompts
### Pre-visit summary:
> "Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: <symptoms>"

### Post-visit summary:
> "Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: <notes>"

## Google Calendar Setup
(To be populated)