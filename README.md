# Job Scheduler Automation

A full‑stack job scheduling system where users can create jobs with JSON payloads, assign priority, view them on a dashboard, and trigger execution that updates status and fires a webhook callback.

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** PostgreSQL on Render
- **Other:** Axios, Nodemon, Webhook.site (for testing webhooks)

---

## Features

- Create jobs with:
  - Task name
  - JSON payload
  - Priority: Low / Medium / High
- Dashboard:
  - Table of all jobs with filters by status and priority
  - Columns: ID, Task, Priority, Status, Created At, Action
- Job execution:
  - Click **Run** to move from `pending` → `running` → `completed`
  - 3‑second simulated processing delay
- Webhook integration:
  - On completion, sends a POST request to a configurable `WEBHOOK_URL`
  - Logs webhook response into the job record (webhookLog)
- Health endpoint for monitoring

---

## Project Structure

Job-Scheduler-Automation/
├─ backend/
│ ├─ src/
│ │ └─ server.ts # Express + Prisma API
│ ├─ prisma/
│ │ └─ schema.prisma # Job model & datasource
│ ├─ .env # Backend env vars (not committed)
│ ├─ tsconfig.json # TypeScript config
│ └─ package.json # Backend scripts & deps
└─ frontend/
├─ src/
│ └─ app/
│ └─ page.tsx # Job dashboard UI
├─ src/app/globals.css # Global styles (Tailwind)
└─ package.json # Frontend scripts & deps

---

## Backend Setup

### 1. Environment variables

Create `backend/.env`:

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=5000
NODE_ENV=development
WEBHOOK_URL="https://webhook.site/your-unique-id"
FRONTEND_URL="http://localhost:3000"

- `DATABASE_URL` is the Render PostgreSQL connection string.
- `WEBHOOK_URL` can be created with https://webhook.site for testing.

### 2. Install dependencies

cd backend
npm install

### 3. Prisma schema & migrations

Prisma is pinned to **v5.22.0**.


Generate client (if not generated)
npx prisma generate

(Schema was already pushed earlier; run if you change schema)
npx prisma migrate dev --name init

### 4. Run backend (development)

cd backend
npm run dev

Backend will be available at:

- `http://localhost:5000`

### 5. API Endpoints

#### Health

- `GET /health`  
  Returns basic status JSON.

#### Create Job

- `POST /jobs`  
  **Body (JSON):**

{
"taskName": "Example job",
"payload": { "example": true },
"priority": "High"
}


Returns created job with `status: "pending"`.

#### List Jobs

- `GET /jobs`  
  **Query params (optional):**
  - `status` = `pending | running | completed`
  - `priority` = `Low | Medium | High`

Example: `/jobs?status=pending&priority=High`

#### Get Job by ID

- `GET /jobs/:id`

#### Run Job

- `POST /run-job/:id`

Flow:
- Immediately sets `status` to `running`.
- After 3 seconds, sets `status` to `completed`.
- Sends POST to `WEBHOOK_URL` with job details.
- Stores webhook response JSON in `webhookLog`.

#### Delete Job (optional)

- `DELETE /jobs/:id`

---

## Frontend Setup

### 1. Install dependencies

cd frontend
npm install

### 2. Run frontend (development)

cd frontend
npm run dev


Frontend will be available at:

- `http://localhost:3000`

### 3. Frontend behavior

- Left panel: **Create Job**
  - Task Name input
  - JSON payload textarea (validated)
  - Priority select
  - On submit:
    - Validates JSON
    - Calls `POST http://localhost:5000/jobs`
    - Shows success/error messages
    - Refreshes job list
- Right panel: **Jobs**
  - Fetches from `GET http://localhost:5000/jobs`
  - Filters by status and priority
  - Shows job table
  - **Run** button → calls `POST /run-job/:id` and refreshes after delay

---

## Running the Full Stack Locally

Open two terminals:

**Terminal 1 – Backend**

cd backend
npm run dev

**Terminal 2 – Frontend**

cd frontend
npm run dev

Then open:

- Frontend UI: `http://localhost:3000`
- Backend health: `http://localhost:5000/health`

---

## Design & Architecture Notes

- **Database:** Render PostgreSQL chosen for:
  - Free tier suitable for long‑running side projects
  - Production‑ready managed service
  - Easy integration with Prisma and deployment platforms
- **Prisma:** Used as ORM for type‑safe DB access and migrations.
- **Separation of concerns:**
  - Backend focuses on job lifecycle, persistence, and webhook logic.
  - Frontend focuses on UX for creating and monitoring jobs.
- **Extensibility:**
  - New job types can be added by extending the payload contract.
  - Webhook target can be reconfigured via env without code change.

---

## How to Deploy (High Level)

- **Backend:** Deploy to Render (Node web service) using this backend folder and same `DATABASE_URL`.
- **Frontend:** Deploy to Vercel using the `frontend` folder and point it to the backend API URL.

(Deployment specifics can be added as needed.)

