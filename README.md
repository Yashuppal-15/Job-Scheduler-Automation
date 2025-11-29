# 🚀 Job Scheduler Automation

> A full-stack job scheduling and automation platform with real-time dashboard, webhook integration, and priority-based task management.

**Built for:** Dotix Full-Stack Developer Skill Test  
**Status:** ✅ Complete & Production-Ready  
**Demo Video:** [Add link if available]

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [System Architecture](#-system-architecture)
5. [Database Design](#-database-design)
6. [API Documentation](#-api-documentation)
7. [AI Usage & Documentation](#-ai-usage--documentation)
8. [Getting Started](#-getting-started)
9. [Webhook Integration](#-webhook-integration)
10. [GitHub & Version Control](#-github--version-control)
11. [Interview Talking Points](#-interview-talking-points)

---

## 📋 Project Overview

**Job Scheduler Automation** is an enterprise-grade job scheduling system that allows users to:

- ✅ Create tasks with JSON payloads and priority levels
- ✅ Monitor job execution in real-time via a modern dashboard
- ✅ Trigger manual job execution with automatic status transitions
- ✅ Receive webhook callbacks on job completion for downstream integrations
- ✅ Filter and search jobs by status and priority

### Use Cases

- Batch data processing
- Report generation on schedule
- Email campaigns
- Background task execution
- External API calls with audit trails

---

## ⭐ Features

| Feature | Status | Details |
|---------|--------|---------|
| **Job Creation** | ✅ | Create jobs with task name, JSON payload, priority |
| **Real-time Dashboard** | ✅ | Modern dark UI with filters and stats cards |
| **Job Execution** | ✅ | One-click job execution with status tracking |
| **Status Transitions** | ✅ | Pending → Running → Completed with 3s delay |
| **Webhook Integration** | ✅ | Auto-POST on completion with response logging |
| **Database Persistence** | ✅ | PostgreSQL with Prisma ORM |
| **API Documentation** | ✅ | 6 RESTful endpoints with examples |
| **Error Handling** | ✅ | Comprehensive validation and error toasts |
| **Type Safety** | ✅ | Full TypeScript across frontend & backend |

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14.x | React framework with App Router |
| **TypeScript** | 5.7 | Type-safe code |
| **Tailwind CSS** | Latest | Modern dark theme UI |
| **Lucide React** | Latest | Icon library |
| **Axios** | 1.7.7 | HTTP client for API calls |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express** | 4.19.2 | REST API framework |
| **TypeScript** | 5.7.2 | Type-safe backend code |
| **Prisma** | 5.22.0 | ORM for database access |
| **PostgreSQL** | Latest | Relational database (Render) |
| **Axios** | 1.7.7 | Webhook HTTP requests |

### Infrastructure

| Component | Provider | Reason |
|-----------|----------|--------|
| **Database** | Render PostgreSQL | Free tier, production-ready, no credit card required |
| **Environment** | `.env` files | 12-factor app compliance |
| **Version Control** | GitHub | Industry standard, easy collaboration |

---

## 🏗 System Architecture

### High-Level Flow Diagram

┌─────────────────────────────────────────────────────────┐
│ Frontend (Next.js) │
│ - Job creation form │
│ - Real-time dashboard │
│ - Filter & search interface │
│ - Status badge visualization │
└──────────────────┬──────────────────────────────────────┘
│
│ REST API (Axios)
│ http://localhost:5000
↓
┌─────────────────────────────────────────────────────────┐
│ Backend (Express + TypeScript) │
│ ✓ POST /jobs (Create job) │
│ ✓ GET /jobs (List with filters) │
│ ✓ GET /jobs/:id (Get single job) │
│ ✓ POST /run-job/:id (Execute job) │
│ ✓ DELETE /jobs/:id (Remove job) │
│ ✓ GET /health (Health check) │
└──────────────────┬──────────────────────────────────────┘
│
┌──────────┼──────────┐
│ │ │
↓ ↓ ↓
┌────────┐ ┌──────────┐ ┌──────────┐
│ Prisma │ │ Job Logic│ │ Webhooks │
│ ORM │ │ (Exec) │ │(Axios) │
└────┬───┘ └──────────┘ └────┬─────┘
│ │
↓ ↓
┌─────────────┐ ┌──────────────────┐
│ PostgreSQL │ │ Webhook Endpoint │
│ (Render) │ │ (webhook.site) │
└─────────────┘ └──────────────────┘


### Component Responsibilities

| Layer | Responsibility |
|-------|-----------------|
| **Frontend** | UI rendering, form validation, state management, API integration |
| **Backend** | Job CRUD, status management, webhook dispatch, data validation |
| **Database** | Persistent job storage, indexes for performance |
| **Webhooks** | Notification system for job completion events |

---

## 📊 Database Design

### ER Diagram (Text Format)

JOBS Table
├── id (PK) ..................... INTEGER, Auto-increment
├── taskName .................... VARCHAR, Required
├── payload ..................... JSON, Required
├── priority .................... VARCHAR (Low|Medium|High)
├── status ...................... VARCHAR (pending|running|completed|failed)
├── webhookLog .................. TEXT (nullable)
├── createdAt ................... TIMESTAMP, Auto-generated
├── updatedAt ................... TIMESTAMP, Auto-updated
│
└── Indexes:
├── idx_status (for filtering by status)
├── idx_priority (for filtering by priority)
└── idx_createdAt (for sorting)

### Prisma Schema

datasource db {
provider = "postgresql"
url = env("DATABASE_URL")
}

generator client {
provider = "prisma-client-js"
}

model Job {
id Int @id @default(autoincrement())
taskName String
payload Json
priority String @default("Medium")
status String @default("pending")
webhookLog String?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

@@index([status])
@@index([priority])
@@index([createdAt])
}

### Design Rationale

- **Single table design** keeps schema simple for learning purposes
- **JSON payload** allows flexible data structure per job
- **Status enum (string)** enables easy filtering and transitions
- **Indexes on status, priority, createdAt** optimize common queries
- **webhookLog field** preserves audit trail of webhook responses

---

## 🔌 API Documentation

### Base URL
Local: http://localhost:5000
Production: [Your Render backend URL]

### Authentication
None (for demo purposes; would add JWT in production)

---

### 1️⃣ Health Check

GET /health

**Response (200 OK):**
{
"status": "Server is running",
"timestamp": "2025-11-29T15:30:00.000Z"
}

---

### 2️⃣ Create Job

POST /jobs
Content-Type: application/json

**Request Body:**
{
"taskName": "Send daily digest email",
"payload": {
"recipientEmail": "user@example.com",
"templateId": 5,
"retryCount": 3
},
"priority": "High"
}

**Response (201 Created):**
{
"id": 1,
"taskName": "Send daily digest email",
"payload": {
"recipientEmail": "user@example.com",
"templateId": 5,
"retryCount": 3
},
"priority": "High",
"status": "pending",
"webhookLog": null,
"createdAt": "2025-11-29T15:30:00.000Z",
"updatedAt": "2025-11-29T15:30:00.000Z"
}

**Error Response (400 Bad Request):**
{
"error": "taskName and payload are required"
}

---

### 3️⃣ List Jobs (with Filters)

GET /jobs?status=pending&priority=High

**Query Parameters:**
| Param | Type | Values | Example |
|-------|------|--------|---------|
| `status` | string | pending, running, completed, failed | `?status=pending` |
| `priority` | string | Low, Medium, High | `?priority=High` |

**Response (200 OK):**
[
{
"id": 1,
"taskName": "Send daily digest email",
"priority": "High",
"status": "pending",
"webhookLog": null,
"createdAt": "2025-11-29T15:30:00.000Z",
"updatedAt": "2025-11-29T15:30:00.000Z"
},
{
"id": 2,
"taskName": "Generate report",
"priority": "High",
"status": "pending",
"webhookLog": null,
"createdAt": "2025-11-29T15:35:00.000Z",
"updatedAt": "2025-11-29T15:35:00.000Z"
}
]

---

### 4️⃣ Get Job by ID

GET /jobs/1

**Response (200 OK):**
{
"id": 1,
"taskName": "Send daily digest email",
"payload": { "...": "..." },
"priority": "High",
"status": "pending",
"webhookLog": null,
"createdAt": "2025-11-29T15:30:00.000Z",
"updatedAt": "2025-11-29T15:30:00.000Z"
}

**Response (404 Not Found):**
{
"error": "Job not found"
}

---

### 5️⃣ Run Job (Execute)

POST /run-job/1

**Behavior:**
1. ✓ Immediately sets status → `running`
2. ✓ Returns 200 response instantly
3. ✓ After 3 seconds: sets status → `completed`
4. ✓ Sends webhook POST to `WEBHOOK_URL`
5. ✓ Stores webhook response in `webhookLog`

**Response (200 OK):**
{
"message": "Job started",
"jobId": 1
}

**Webhook Payload (sent to WEBHOOK_URL):**
{
"jobId": 1,
"taskName": "Send daily digest email",
"priority": "High",
"payload": {
"recipientEmail": "user@example.com",
"templateId": 5,
"retryCount": 3
},
"completedAt": "2025-11-29T15:30:03.000Z"
}

**Webhook Response Stored in webhookLog:**
{
"uuid": "550e8400-e29b-41d4-a716-446655440000",
"status": 200,
"headers": { "content-type": "application/json" }
}

---

### 6️⃣ Delete Job

DELETE /jobs/1

**Response (200 OK):**
{
"message": "Job deleted",
"job": { "id": 1, "...": "..." }
}

---

## 📖 AI Usage & Documentation

This section fulfills the **Dotix AI Disclosure Policy** requirement.

### AI Tools Used

| Tool | Model | Purpose |
|------|-------|---------|
| Browser-based AI Assistant | GPT-4 class | Code suggestions, debugging, architecture guidance |
| Version | Latest available | All interactions in Nov 2025 |

### What AI Helped With

#### 1. Backend Architecture ✅
- **What:** Structuring Express routes and Prisma schema
- **Prompt:** *"How should I structure a job scheduler backend with status transitions and webhooks?"*
- **Output:** Route patterns for CRUD + webhook logic
- **Manual Review:** ✓ Confirmed, modified, tested

#### 2. Database Selection ✅
- **What:** Evaluating cloud DB providers (Railway, PlanetScale, Render)
- **Prompt:** *"Which free PostgreSQL database is best for a learning project that needs production readiness?"*
- **Output:** Render PostgreSQL recommendation (long-term free tier)
- **Manual Review:** ✓ Verified pricing, tested connection

#### 3. Frontend UI Design ✅
- **What:** Dashboard layout with Tailwind CSS dark theme
- **Prompt:** *"Create a modern two-column layout: left form, right job table with status badges"*
- **Output:** Tailwind utility classes, component structure
- **Manual Review:** ✓ Tweaked colors, adjusted spacing, tested responsiveness

#### 4. TypeScript Configuration ✅
- **What:** Setting up ts-node, tsconfig, Prisma with TypeScript
- **Prompt:** *"How do I configure TypeScript with ts-node and Prisma in Node.js?"*
- **Output:** tsconfig.json structure, script setup
- **Manual Review:** ✓ Tested compilation, fixed errors

#### 5. Debugging & Troubleshooting ✅
- **What:** Fixing CORS issues, port conflicts, Prisma version mismatches
- **Prompts:**
  - *"EADDRINUSE error on port 5000 - how to resolve?"*
  - *"Prisma v7 datasource error - should I downgrade?"*
  - *"CORS: frontend localhost:3000 can't reach backend localhost:5000"*
- **Output:** Specific error solutions and configuration fixes
- **Manual Review:** ✓ Implemented all fixes, tested end-to-end

#### 6. Documentation & README ✅
- **What:** README structure, API documentation format, architecture diagrams
- **Prompt:** *"Create a professional README with API docs and architecture diagram for a GitHub project"*
- **Output:** README template, documentation structure
- **Manual Review:** ✓ Customized for this project, added specific details

### What Was NOT AI-Generated

❌ **Secrets or Private Keys** – No API keys, passwords, or DB URLs shared with AI  
❌ **Dotix-Specific Requirements** – Interpreted from PDF directly  
❌ **Final Architecture Decisions** – Made manually after AI suggestions  
❌ **Business Logic** – Job execution, status transitions coded manually  
❌ **Webhook Integration** – Custom implementation after AI guidance  
❌ **Testing** – All manual testing end-to-end  

### AI Disclosure Statement

> "This project was built with assistance from an AI coding assistant for architectural guidance, debugging, and documentation. All AI suggestions were reviewed, modified, and tested manually before integration. Core business logic, design decisions, and production code are original work."

---

## 🚀 Getting Started

### Prerequisites

- ✅ Node.js v18 or higher
- ✅ npm (comes with Node.js)
- ✅ Git
- ✅ Free Render PostgreSQL account

### Step 1: Clone Repository

git clone https://github.com/Yashuppal-15/Job-Scheduler-Automation.git
cd Job-Scheduler-Automation


### Step 2: Backend Setup

cd backend

Install dependencies
npm install

Create .env file
DATABASE_URL="postgresql://user:password@host:5432/job_scheduler"
PORT=5000
NODE_ENV=development
WEBHOOK_URL="https://webhook.site/your-id"
FRONTEND_URL="http://localhost:3000"
Setup Prisma
npx prisma generate

Start backend
npm run dev

✅ Server running on http://localhost:5000

### Step 3: Frontend Setup (New Terminal)

cd frontend

Install dependencies
npm install

Start frontend
npm run dev

✅ App running on http://localhost:3000

### Step 4: Access Dashboard

Open browser → `http://localhost:3000`

You should see:
- ✅ Job Scheduler Core dashboard
- ✅ Create Job form on left
- ✅ Jobs table on right
- ✅ Stats cards (Total, Running, Pending, Completed)

---

## 🔗 Webhook Integration

### Setup Webhook.site

1. Go to https://webhook.site
2. Copy your **unique URL** (e.g., `https://webhook.site/550e8400-e29b-41d4-a716-446655440000`)
3. Add to `backend/.env`:

WEBHOOK_URL="https://webhook.site/550e8400-e29b-41d4-a716-446655440000"

4. Restart backend: `npm run dev`

### Test Webhook Flow

1. **Create a job** from dashboard:
   - Task Name: `Test Webhook`
   - Payload: `{ "test": true }`
   - Priority: `High`

2. **Click "Run"** button

3. **Check webhook.site** after 3-5 seconds:
   - You should see a **POST request**
   - Body contains `jobId`, `taskName`, `priority`, `payload`, `completedAt`

**Expected Webhook Payload:**
{
"jobId": 1,
"taskName": "Test Webhook",
"priority": "High",
"payload": { "test": true },
"completedAt": "2025-11-29T16:00:00.000Z"
}

---

## 📦 GitHub & Version Control

### Repository Structure

Job-Scheduler-Automation/
├── backend/
│ ├── src/
│ │ └── server.ts
│ ├── prisma/
│ │ ├── schema.prisma
│ │ └── migrations/
│ ├── .env
│ ├── package.json
│ └── tsconfig.json
│
├── frontend/
│ ├── src/
│ │ ├── app/
│ │ │ ├── page.tsx
│ │ │ ├── layout.tsx
│ │ │ └── globals.css
│ │ └── components/
│ ├── package.json
│ └── tsconfig.json
│
├── .gitignore
├── README.md
└── LICENSE (optional)

---

## 📄 License

This project is provided as-is for educational purposes (Dotix assignment).

---

## 🤝 Support & Questions

- **Documentation:** See README sections above
- **API Issues:** Check `/health` endpoint first
- **Database:** Verify `DATABASE_URL` in `.env`
- **Webhook:** Test at https://webhook.site

---

## 🎉 Conclusion

**Job Scheduler Automation** demonstrates a complete full-stack application with:

✅ Professional backend API design  
✅ Modern, responsive frontend UI  
✅ Production-grade database (PostgreSQL)  
✅ Webhook integration for scalability  
✅ Complete documentation  
✅ AI disclosure (transparent AI usage)  
✅ Git version control best practices  


---

**Created:** November 29, 2025  
**Author:** Yash Uppal 
**Repository:** https://github.com/Yashuppal-15/Job-Scheduler-Automation  

