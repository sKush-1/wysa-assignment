# Modular Conversation Flow Engine

> A robust, graph-based conversation engine with dynamic cross-module routing, checkpoint-aware navigation, stale deep-link recovery, and strict separation between immutable history and mutable active session state.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%7C%207.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-green.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg)](https://tailwindcss.com/)

---

## 📌 Table of Contents

- [Overview & Problem Statement](#-overview--problem-statement)
- [System Architecture & Core Concepts](#-system-architecture--core-concepts)
  - [1. Directed Graph Model](#1-directed-graph-model)
  - [2. State vs. History Separation](#2-state-vs-history-separation)
  - [3. Checkpoint Mechanics](#3-checkpoint-mechanics)
  - [4. Stale Deep-Link Resolution](#4-stale-deep-link-resolution)
  - [5. Defensive Design & Error Handling](#5-defensive-design--error-handling)
  - [6. Bonus: Intra-Module "Go Back" Navigation](#6-bonus-intra-module-go-back-navigation)
- [Database Schema (ERD)](#-database-schema-erd)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Local Setup Guide](#-local-setup-guide)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository & Setup Environment Variables](#1-clone-repository--setup-environment-variables)
  - [2. Start PostgreSQL Database via Docker](#2-start-postgresql-database-via-docker)
  - [3. Setup & Seed Backend](#3-setup--seed-backend)
  - [4. Setup & Start Frontend](#4-setup--start-frontend)
- [API Reference](#-api-reference)
  - [Authentication](#authentication)
  - [Endpoints Overview](#endpoints-overview)
  - [Interactive Swagger Docs](#interactive-swagger-docs)
- [Seeded Conversation Graph Spec](#-seeded-conversation-graph-spec)
- [AI Usage Documentation](#-ai-usage-documentation)

---

## 📖 Overview & Problem Statement

This project implements a backend and interactive frontend for a **modular conversation flow system** simulating a mental health triage and routing service (inspired by Wysa).

### Key Problem Requirements
1. **Dynamic Graph Routing**: Users traverse questions organized across multiple modules. Each answer option dictates the next node—either within the same module or leaping across module boundaries.
2. **State vs. History Separation**: 
   - **Active State (`FlowState`)**: Tracks the user's single current position (`currentQuestionId`, `currentModuleId`) and mutable navigation context (`breadcrumbTrail`).
   - **Conversation History (`FlowHistory`)**: Append-only, immutable ledger recording every answered question with timestamps.
3. **Checkpoint Support**: Specific critical questions (e.g., safety escalation, clinical evaluations) serve as *checkpoints*, permanently locking prior progress to prevent users from backing out while keeping historical records intact.
4. **Stale Deep-Link & Push Notification Recovery**: Handles scenarios where a user clicks an outdated link or notification (e.g., "Resume at Question 5"). If that question doesn't match their active position, the system automatically redirects them to their actual current question.
5. **Defensive Invariant Enforcement**: Protects against invalid option IDs, tampered submissions, out-of-order state transitions (`409 Conflict`), and re-entering completed modules (`403 Forbidden`).
6. **(Bonus) Backward Traversal**: Enables users to go back one question within their active module path without modifying immutable history.

---

## 🏗 System Architecture & Core Concepts

```
                  ┌───────────────────────────────┐
                  │        User / Client          │
                  └──────────────┬────────────────┘
                                 │
                    x-user-email │ (Header Auth)
                                 ▼
                  ┌───────────────────────────────┐
                  │       Express API Layer       │
                  │  (Validation, Routing, Auth)  │
                  └───────┬───────────────┬───────┘
                          │               │
            Read/Write    │               │ Append-only
            Active State  │               │ Audit Log
                          ▼               ▼
                  ┌──────────────┐ ┌──────────────┐
                  │  FlowState   │ │ FlowHistory  │
                  │  (Mutable)   │ │ (Immutable)  │
                  └──────┬───────┘ └──────┬───────┘
                         │                │
                         └───────┬────────┘
                                 ▼
                  ┌───────────────────────────────┐
                  │   Prisma ORM & PostgreSQL     │
                  │ (Module, Question, Option DB) │
                  └───────────────────────────────┘
```

### 1. Directed Graph Model
- **Modules**: Distinct subgraphs representing conversational stages (e.g., *Assessment*, *Grounding Tools*, *Escalation*).
- **Questions**: Nodes in the graph. Entry-point questions are automatically resolved by detecting questions with zero intra-module incoming routes (`incomingRoutes: { none: { question: { moduleId } } }`).
- **Options**: Directed edges. Each option specifies a `nextQuestionId`. If `nextQuestionId` points to a question in another module, the engine seamlessly switches the user's active module context. If `null`, the flow concludes.

### 2. State vs. History Separation
- **`FlowState` (1-to-1 with User)**:
  - Stores `currentModuleId`, `currentQuestionId`, and `breadcrumbTrail` (JSON array of visited question IDs).
  - Updated upon every valid answer or back navigation.
  - Durable in PostgreSQL (survives app restarts and eliminates cache expiration issues associated with Redis).
- **`FlowHistory` (1-to-Many with User)**:
  - Stores `userId`, `questionId`, `optionId`, `createdAt`.
  - **Never** modified, deleted, or rolled back when the user navigates backward.

### 3. Checkpoint Mechanics
When a user answers a question marked with `isCheckpoint = true`:
- The engine writes the record to `FlowHistory`.
- The engine **resets `breadcrumbTrail` to `[]`** in `FlowState`.
- Any subsequent call to `POST /api/flow/back` will be rejected with a `400 Bad Request`, guaranteeing the user cannot backtrack out of safety-critical workflows.

### 4. Stale Deep-Link Resolution
When accessing `GET /api/flow/questions/:questionId`:
- **Match**: If `questionId === FlowState.currentQuestionId`, returns `200 OK` with `redirected: false`.
- **Mismatch (Stale)**: If `questionId !== FlowState.currentQuestionId`, returns `307 Temporary Redirect` (or a redirect payload) containing the user's **actual current question** with `redirected: true` and an explanatory message.

### 5. Defensive Design & Error Handling
- **State Mismatch Protection**: Submitting an answer for a question different from `FlowState.currentQuestionId` triggers `409 Conflict`.
- **Tamper Resistance**: Ensures submitted `optionId` belongs strictly to the active `questionId` (`400 Bad Request`).
- **Module Re-entry Guard**: Prevents restarting previously visited modules (`403 Forbidden`).
- **Referential Integrity**: All graph edges are modeled with strict database foreign keys (`nextQuestionId -> Question.id`), preventing dangling references.

### 6. Bonus: Intra-Module "Go Back" Navigation
- `POST /api/flow/back` pops the latest question ID from `breadcrumbTrail` and updates `currentQuestionId`.
- If the breadcrumb trail is empty (start of module, crossed a checkpoint, or crossed a module boundary), returns `400 Bad Request`.
- Historical logs in `FlowHistory` remain intact.

---

## 🗄 Database Schema (ERD)

```mermaid
erDiagram
    User ||--o| FlowState : "has active"
    User ||--o{ FlowHistory : "accumulates"
    Module ||--o{ Question : "contains"
    Module ||--o{ FlowState : "active in"
    Question ||--o{ Option : "offers"
    Question ||--o{ Option : "targeted by (incomingRoutes)"
    Question ||--o{ FlowHistory : "logged in"
    Question ||--o{ FlowState : "current position"
    Option ||--o{ FlowHistory : "selected in"

    User {
        string id PK
        string email UK
        datetime createdAt
    }

    Module {
        string id PK
        string name
        string description
    }

    Question {
        string id PK
        string moduleId FK
        string text
        boolean isCheckpoint
    }

    Option {
        string id PK
        string questionId FK
        string text
        string nextQuestionId FK "nullable"
    }

    FlowState {
        string id PK
        string userId FK "UK"
        string currentModuleId FK
        string currentQuestionId FK
        json breadcrumbTrail "array of question IDs"
        datetime updatedAt
    }

    FlowHistory {
        string id PK
        string userId FK
        string questionId FK
        string optionId FK
        datetime createdAt "immutable"
    }
```

---

## 🛠 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Runtime & Language** | Node.js & TypeScript | Type-safe backend and frontend execution |
| **Backend Framework** | Express 5.x | REST API server with modern error handling |
| **Database & ORM** | PostgreSQL 17 & Prisma 5.22 | Relational storage with relational migrations & client |
| **Documentation** | Swagger UI (`swagger-jsdoc`) | Interactive OpenAPI 3.0 documentation |
| **Validation** | Zod 3.x | Strict request body schema validation |
| **Frontend UI** | React 19, Vite, Tailwind CSS v4 | Responsive chat & flow simulator interface |
| **Icons & Utilities** | Lucide React, Axios, React Router 7 | UI icons, HTTP client, client-side routing |
| **Containerization** | Docker & Docker Compose | Containerized PostgreSQL database |

---

## 📂 Project Structure

```
wysa-assignment/
├── Readme.md                          # Comprehensive project documentation
├── AI_USAGE.md                        # AI usage transparency & reflection
├── backend/
│   ├── docker-compose.yml             # PostgreSQL 17 service definition
│   ├── package.json                   # Backend dependencies & scripts
│   ├── tsconfig.json                  # TypeScript compiler configuration
│   ├── .env.example                   # Backend environment variables template
│   ├── questions-answers-module.md    # Seed data & graph specification
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema definitions
│   │   ├── seed.ts                    # Graph seeder (Modules, Questions, Options)
│   │   └── migrations/                # Version-controlled SQL migrations
│   └── src/
│       ├── index.ts                   # Express server entry point
│       ├── lib/
│       │   ├── prisma.ts              # Prisma client singleton
│       │   └── swagger.ts             # OpenAPI / Swagger definition
│       ├── middleware/
│       │   ├── auth.middleware.ts     # x-user-email authentication guard
│       │   └── error.middleware.ts    # Global centralized error handler
│       ├── routes/
│       │   ├── flow.routes.ts         # Flow endpoints (start, answer, back, deep-link)
│       │   └── history.routes.ts      # History query endpoint
│       ├── controllers/
│       │   ├── flow.controller.ts     # Request handlers for conversation flow
│       │   └── history.controller.ts  # Request handlers for user history
│       ├── services/
│       │   ├── flow.service.ts        # Graph traversal & state engine logic
│       │   └── history.service.ts     # Audit log queries
│       ├── types/                     # Express TypeScript extensions
│       └── validators/                # Zod request validators
└── frontend/
    ├── package.json                   # Frontend dependencies & scripts
    ├── vite.config.ts                 # Vite bundler & API reverse proxy configuration
    ├── .env.example                   # Frontend environment template
    ├── index.html                     # HTML entry point
    └── src/
        ├── main.tsx                   # React entry point
        ├── App.tsx                    # Root component with providers
        ├── api/
        │   ├── client.ts              # Axios instance with header interceptors
        │   └── flowApi.ts             # Typed API query functions
        ├── context/
        │   └── AuthContext.tsx        # User identity context (x-user-email)
        ├── pages/
        │   ├── EntryScreen.tsx        # User login & module selector
        │   ├── FlowScreen.tsx         # Interactive conversation & graph runner
        │   └── HistoryScreen.tsx      # Immutable conversation history view
        ├── components/                # UI components (Navbar, Modals, Toasts)
        └── types/                     # Shared frontend TypeScript types
```

---

## 🚀 Local Setup Guide

Follow these steps to run the complete stack locally.

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (or newer)
- **Package Manager**: `pnpm` (recommended) or `npm`
- **Docker & Docker Compose**: For running the PostgreSQL database

---

### 1. Clone Repository & Setup Environment Variables

```bash
git clone <repo-url>
cd wysa-assignment
```

#### Setup Backend `.env`:
```bash
cp backend/.env.example backend/.env
```
Default `backend/.env` contents:
```env
POSTGRES_USER=wysa
POSTGRES_PASSWORD=wysa_secret
POSTGRES_DB=wysa_db
POSTGRES_PORT=5432
DATABASE_URL="postgresql://wysa:wysa_secret@localhost:5432/wysa_db?schema=public"
PORT=3000
NODE_ENV=development
```

#### Setup Frontend `.env`:
```bash
cp frontend/.env.example frontend/.env
```
Default `frontend/.env` contents:
```env
VITE_API_BASE_URL=http://localhost:3000
```

---

### 2. Start PostgreSQL Database via Docker

From the `backend/` directory, spin up PostgreSQL container:
```bash
cd backend
docker compose up -d
```
Verify the container is healthy:
```bash
docker ps
# Status should show: (healthy) wysa_postgres
```

---

### 3. Setup & Seed Backend

From the `backend/` directory:

```bash
# 1. Install backend dependencies
pnpm install

# 2. Run database migrations
pnpm db:migrate

# 3. Seed the conversation graph & modules
pnpm db:seed

# 4. Start the backend development server
pnpm dev
```

The backend server will start on **`http://localhost:3000`**.
- 📖 **Swagger API Docs**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- 📋 **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

---

### 4. Setup & Start Frontend

Open a new terminal window in the project root:

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
pnpm install

# 3. Start Vite dev server
pnpm dev
```

The frontend application will start on **`http://localhost:5173`**.

---

## 📡 API Reference

### Authentication
All protected routes require the `x-user-email` header:
```http
x-user-email: user@example.com
```
If the user does not exist in the database, the backend automatically provisions a `User` record on first access.

---

### Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Server health check | No |
| `GET` | `/api-docs` | Interactive Swagger UI | No |
| `GET` | `/api/flow/modules` | List all conversation modules with visited status | Optional |
| `POST` | `/api/flow/start` | Start or initialize an active flow session for a module | **Yes** |
| `GET` | `/api/flow/current` | Retrieve the user's active question & options | **Yes** |
| `GET` | `/api/flow/questions/:questionId` | Deep-link / notification recovery handler | **Yes** |
| `POST` | `/api/flow/answer` | Submit an answer, append history, advance state | **Yes** |
| `POST` | `/api/flow/back` | *(Bonus)* Move back one question in the active trail | **Yes** |
| `GET` | `/api/history` | Retrieve full immutable conversation history log | **Yes** |

---

### Interactive Swagger Docs

Visit **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)** to test all endpoints interactively in your browser with Swagger UI.
- Use the **Authorize** button at the top right to set your test email (e.g., `test@example.com`).

---

### Sample cURL Requests

#### 1. Start Flow in Module 1
```bash
curl -X POST http://localhost:3000/api/flow/start \
  -H "Content-Type: application/json" \
  -H "x-user-email: test@example.com" \
  -d '{"moduleId": "<module-uuid>"}'
```

#### 2. Submit an Answer
```bash
curl -X POST http://localhost:3000/api/flow/answer \
  -H "Content-Type: application/json" \
  -H "x-user-email: test@example.com" \
  -d '{
    "questionId": "<current-question-uuid>",
    "optionId": "<selected-option-uuid>"
  }'
```

#### 3. Deep Link Resolution (Stale Link Test)
```bash
curl -X GET http://localhost:3000/api/flow/questions/<some-stale-question-uuid> \
  -H "x-user-email: test@example.com"
```
*If stale, the API returns status code `307` with `redirected: true` and the user's actual current question.*

#### 4. Go Back One Question (Bonus)
```bash
curl -X POST http://localhost:3000/api/flow/back \
  -H "x-user-email: test@example.com"
```

#### 5. Get Immutable History
```bash
curl -X GET http://localhost:3000/api/history \
  -H "x-user-email: test@example.com"
```

---

## 🗺 Seeded Conversation Graph Spec

The seeded graph models a real-world mental health triage system across 3 modules:

1. **Module 1: Initial Assessment & Triage**
   - Assesses user baseline mood.
   - Routes positive responses to *Module 2 (Tools)*.
   - Routes acute distress directly to *Module 3 (Escalation)* via cross-module jumps.
   - Contains a checkpoint at Question 3.
2. **Module 2: Cognitive Restructuring & Tools**
   - Interactive visual grounding (5-4-3-2-1) and box-breathing exercises.
   - Checkpoint at Question 3.
   - Allows trying intra-module "Go Back" before the checkpoint.
3. **Module 3: Escalation & Professional Support**
   - Human therapist connections and crisis support pathways.
   - Checkpoint nodes at Questions 1 & 5 to ensure user safety context cannot be undone.

For the exact node-by-node matrix, refer to [questions-answers-module.md](file:///home/sumit/Pictures/wysa-assignment/backend/questions-answers-module.md).

---

## 🤖 AI Usage Documentation

This project was built with thoughtful, transparent AI collaboration adhering to the assignment guidelines.

For a full breakdown of prompts, architectural decisions, modifications from raw AI output, identified pitfalls, and manual verification procedures, please see [AI_USAGE.md](file:///home/sumit/Pictures/wysa-assignment/AI_USAGE.md).
