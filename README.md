## Skill Forge

Skill Forge is an AI‑assisted learning and evaluation platform that connects learners, mentors, and admins. It provides track/module/task based learning journeys, automated code/answer evaluation via LLMs, and role‑based analytics.


---

## Live Links


- **Live Frontend**: [https://skill-forge-neon.vercel.app/](https://skill-forge-neon.vercel.app/)
- **Backend API Base URL**: https://skill-forge-rfi1.onrender.com 


---

## What Skill Forge Does

- **Track‑based learning**: Admins/mentors create **tracks → modules → tasks** to structure learning paths.
- **Role‑based experience**:
  - **Learners**: enroll into published tracks, complete tasks, see feedback and progress.
  - **Mentors**: create tracks/modules/tasks, review learners, manage publishing.
  - **Admins**: manage users, mentor applications, and platform analytics.
- **AI‑assisted evaluations**:
  - Submissions are queued and evaluated asynchronously using **Gemini/OpenAI** via workers and **BullMQ**.
  - Learners receive automated, consistent feedback at scale.
- **Analytics**:
  - Basic analytics and healthcheck endpoints for monitoring and reporting.

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router, Axios, Tailwind CSS
- **Backend**: Node.js, Express 5, Mongoose (MongoDB), JWT auth, BullMQ (Redis), Google Generative AI / OpenAI
- **Database**: MongoDB
- **Queue & Workers**: Redis + BullMQ for background evaluation jobs
- **Other**: dotenv, cors, cookie‑parser, bcrypt

---

## System Architecture

### High‑Level Architecture

```text
                         +-------------------------+
                         |   Client (React + Vite) |
                         |  SPA: Tracks / Tasks    |
                         +------------+------------+
                                      |
                           HTTPS / JSON requests
                                      v
                +---------------------+----------------------+
                |        Backend API (Node + Express)        |
                |  - Routes / Controllers / Middlewares      |
                |  - JWT Auth & Role Middleware              |
                |  - BullMQ Queues                           |
                +---------+-----------------+----------------+
                          |                 |
                          |                 |
                 CRUD over HTTP       Enqueue jobs
                          |                 v
                  +-------v-----+    +------+----------------+
                  |  MongoDB    |    |   BullMQ (Redis)      |
                  |  (Tracks,   |    |   Job Queues          |
                  |  Tasks, ...)|    +-----------+-----------+
                  +-------------+                |
                                                 |
                                Consume jobs / background work
                                                 v
                                     +-----------+-----------+
                                     |  Evaluation Worker    |
                                     | (Gemini / OpenAI)     |
                                     +-----------+-----------+
                                                 |
                                      Call LLM providers, then
                                     write scores/feedback back
                                                 v
                                           +-----+-----+
                                           |  MongoDB |
                                           +-----------+
```

#### High‑Level Architecture (text version)

- **Client** (`React + Vite` SPA)  
  - Talks to the backend over HTTPS/JSON.
- **Backend API** (`Node + Express`)  
  - `Express App` (routes, controllers, middlewares)  
  - `Auth` (JWT auth + role middleware)  
  - `BullMQ Queues` for background jobs.
- **Worker Service**  
  - `Evaluation Worker` that consumes jobs from BullMQ and calls LLMs.
- **Data Stores**  
  - `MongoDB` for users, tracks, modules, tasks, submissions, evaluations.  
  - `Redis` for BullMQ job storage.
- **LLM Providers**  
  - `Google Generative AI (Gemini)` and/or `OpenAI` used by the evaluation worker.

**Data flow (simplified):**  
Client → Backend API → MongoDB / BullMQ → Worker → LLMs → MongoDB → Client.

### Key Design Choices

- **Layered Express app**  
  - `routes` → `controllers` → `models` → `utils`  
  - Clear separation of concerns improves testability and onboarding for new engineers.
- **Role‑based access control (RBAC)**  
  - `verifyJWT` middleware for authentication; `authorizeRoles` for **admin / mentor / learner** flows.
  - Keeps critical operations (analytics, mentor approvals, track publishing) restricted.
- **Asynchronous evaluation via queues**  
  - Submissions are not evaluated inline with the request; they are pushed to BullMQ queues and processed by a separate worker (`evaluation.worker.js`).
  - This prevents long‑running LLM calls from blocking API latency and allows horizontal scaling of workers.
- **Config‑driven**  
  - Uses `.env` plus `config` files for DB, Gemini/OpenAI, constants, making it cloud‑deployment‑friendly.
- **CORS + SPA support**  
  - Backend configured with `cors` and `cookie-parser` to support secure cross‑origin calls from the Vite frontend.

---

## Backend API Overview

> Base URL: `http://localhost:8000/api/v1` (configurable via `PORT` / `CORS_ORIGIN`)

### Authentication & Users (`/users`)

- **POST `/users/register`**  
  - **Summary**: Register a new user (default role: learner).  
  - **Body (example)**:
    ```json
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "password": "StrongPass123!"
    }
    ```
- **POST `/users/login`**  
  - **Summary**: Login, returns access token (and refresh token via cookie, depending on implementation).  
- **POST `/users/logout`** (auth required)  
  - **Summary**: Invalidate current session tokens.
- **POST `/users/refresh-token`**  
  - **Summary**: Get a new access token using refresh token.
- **POST `/users/apply-mentor`** (role: `learner`)  
  - **Summary**: Learner applies to become a mentor.

**Admin‑only endpoints:**

- **GET `/users/students`** – list all learners.  
- **GET `/users/mentors`** – list all mentors.  
- **GET `/users/applications`** – list all mentor applications.  
- **POST `/users/applications/:userId/approve`** – approve mentor application.  
- **POST `/users/applications/:userId/reject`** – reject mentor application.  

---

### Tracks (`/tracks`)

- **GET `/tracks`**  
  - List all **published** tracks for public/learner view.
- **POST `/tracks`** (roles: `mentor`, `admin`)  
  - Create a new track with metadata (title, description, difficulty, etc.).
- **GET `/tracks/my`** (roles: `mentor`, `admin`)  
  - Get tracks created by the authenticated mentor/admin.
- **GET `/tracks/enrolled`** (role: `learner`)  
  - List tracks where the learner is enrolled.
- **PATCH `/tracks/toggle/publish/:trackId`** (roles: `mentor`, `admin`)  
  - Toggle publish/unpublish for a track.

---

### Modules and Tasks

> Note: Routes are wired in `app.js` under `/api/v1/tracks`, `/api/v1/modules`, `/api/v1/tasks`, etc.

- **Modules (example pattern)**  
  - `POST /tracks/:trackId/modules` – create module under a track (mentor/admin).  
  - `GET /tracks/:trackId/modules` – list modules for a track.  

- **Tasks (`task.route.js`)**
  - **GET `/modules/:moduleId/tasks`** (auth required)  
    - Get all tasks for a module.
  - **POST `/modules/:moduleId/tasks`** (roles: `admin`, `mentor`)  
    - Create new task under a module (coding assignment, quiz, etc.).

---

### Submissions & Evaluations

- **Submissions** (`/submissions`)  
  - Create a submission for a given task (code, text answer, etc.).  
  - Backend enqueues an evaluation job into BullMQ.

- **Evaluations** (`/evaluations`)  
  - Worker (`evaluation.worker.js`) pulls from the queue, calls Gemini/OpenAI via `config/gemini.js`, and persists:
    - Score
    - Feedback text
    - Any rubric‑based breakdown

Typical flow (simplified):

```text
Learner (Client)
    |
    | 1. POST /submissions (taskId, answer)
    v
+----------------------+
|   Express API        |
+----------+-----------+
           |
           | 2. Save submission with status = "pending"
           v
      +----+-----+
      | MongoDB |
      +----+----+
           |
           | 3. Enqueue evaluation job
           v
   +-------+--------+
   | BullMQ Queue   |  (stored in Redis)
   +-------+--------+
           |
           | 4. Worker pulls job
           v
+----------+-----------+
| Evaluation Worker    |
+----------+-----------+
           |
           | 5. Load submission + task from MongoDB
           | 6. Call LLM (Gemini / OpenAI) with answer + rubric
           v
   +-------+--------+
   |  LLM Provider  |
   +-------+--------+
           |
           | 7. Score + feedback
           v
+----------+-----------+
| Evaluation Worker    |
+----------+-----------+
           |
           | 8. Update submission (status = "evaluated",
           |    score, feedback) in MongoDB
           v
      +----+-----+
      | MongoDB |
      +----+----+
           |
           | 9. GET /submissions/:id
           v
+----------+-----------+
|   Express API        |
+----------+-----------+
           |
           | 10. Return submission + evaluation result
           v
     Learner (Client)
```

#### Submission & Evaluation Flow (text version)

1. **Learner** sends a submission for a task to the **API** (`POST /submissions`).  
2. **API** saves the submission in **MongoDB** with status `pending`.  
3. **API** enqueues an evaluation job into **BullMQ** (stored in **Redis**).  
4. **Evaluation Worker** picks up the job from the queue and loads submission + task details from **MongoDB**.  
5. Worker calls the **LLM provider** (Gemini / OpenAI) with the learner’s answer and rubric.  
6. LLM returns a **score + feedback**, which the worker stores back on the submission in **MongoDB** with status `evaluated`.  
7. **Learner** later calls `GET /submissions/:id` and the **API** returns the submission including evaluation results.

---

### Enrollments & Analytics

- **Enrollment** (`/enrollment`)  
  - Learners enroll into tracks; controllers handle linking user ↔ track.  
  - Endpoints such as `/enrollment` and `/tracks/enrolled` are used to manage and query enrollments.

- **Analytics (`/analytics`)**  
  - High‑level metrics like:
    - Number of active learners and mentors
    - Completion rates per track
    - Evaluation statistics

---

### Healthcheck (`/healthcheck`)

- **GET `/healthcheck`**  
  - Returns a lightweight status (e.g., service up, DB connected) for monitoring and uptime checks.

---

## Frontend Overview

- **React SPA (Vite)** located in `client/`
- Uses:
  - **React Router** for routes (e.g. dashboard, tracks, modules, tasks, analytics).
  - **Axios** for communicating with backend via `src/api/axios.js`.
  - **Tailwind CSS** for styling and layout.

Typical frontend responsibilities:

- Manage auth state and tokens.
- Render dashboards per role (learner / mentor / admin).
- Provide forms for:
  - Register/Login
  - Track / Module / Task creation
  - Submitting answers/solutions.
- Poll or fetch submission status and show AI evaluation feedback and analytics.

---

## Local Development Setup

### Prerequisites

- **Node.js**: v18+ recommended  
- **npm**: v9+ recommended  
- **MongoDB**: local instance or cloud (e.g., MongoDB Atlas)  
- **Redis**: for BullMQ queue (local or hosted like Redis Cloud)  
- **LLM Provider API Key(s)**:
  - Gemini: `GOOGLE_GENERATIVE_AI_API_KEY` (or similar)
  - / or OpenAI: `OPENAI_API_KEY`

---

### 1. Clone the Repository

```bash
git clone <your-repo-url> skill-forge
cd skill-forge
```

---

### 2. Backend Setup

From the project root:

```bash
npm install
```

Create a `.env` file in the root (same folder as `src/`), for example:

```bash
PORT=8000
MONGODB_URI=mongodb://127.0.0.1:27017/skillforge
JWT_ACCESS_TOKEN_SECRET=your_access_secret
JWT_REFRESH_TOKEN_SECRET=your_refresh_secret
CORS_ORIGIN=http://localhost:5173

REDIS_URL=redis://localhost:6379

GEMINI_API_KEY=your_gemini_key_here
# or
OPENAI_API_KEY=your_openai_key_here
```

Run the backend API:

```bash
npm run dev
```

Run the evaluation worker (in a separate terminal):

```bash
npm run worker
```

---

### 3. Frontend Setup

From the `client/` directory:

```bash
cd client
npm install
```

Create a `.env` (or `.env.local`) in `client/` if you want to configure API base URL:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Start the React dev server:

```bash
npm run dev
```

The frontend will typically run at `http://localhost:5173`.

---

### 4. Basic Smoke Test

- Backend: open `http://localhost:8000/api/v1/healthcheck` in a browser or via curl/Postman to confirm the API is running.
- Frontend: open `http://localhost:5173` and go through:
  - Register → Login
  - As admin/mentor: create track / module / tasks
  - As learner: enroll, submit an answer, and check if evaluation result appears after a short delay.

---

## Project Structure (High Level)

```text
.
├─ src/
│  ├─ server.js         # Entry point, loads env and starts Express
│  ├─ app.js            # Express app, middlewares, route mounting
│  ├─ config/           # DB, Gemini/OpenAI configuration, constants
│  ├─ controllers/      # Business logic per domain (user, track, task, etc.)
│  ├─ middlewares/      # JWT auth and role-based access
│  ├─ models/           # Mongoose schemas (User, Track, Module, Task, Enrollment, Evaluation, etc.)
│  ├─ queues/           # BullMQ queue definitions
│  ├─ routes/           # Route definitions per resource
│  ├─ utils/            # ApiError, ApiResponse, asyncHandler
│  └─ workers/          # Background workers (evaluation)
│
└─ client/
   ├─ src/
   │  ├─ api/           # Axios instance
   │  ├─ components/    # Reusable UI building blocks
   │  ├─ pages/         # Route-level pages (dashboard, tracks, etc.)
   │  ├─ App.jsx        # App root and routing
   │  └─ main.jsx       # React entry point
   └─ index.html / config files
```

---

## Project Overview

- **Product angle**: Skill Forge is an AI‑powered learning and evaluation platform that lets mentors design structured tracks and automatically evaluate learner submissions using LLMs.
- **Engineering angle**:
  - Designed a **scalable backend** with **asynchronous job processing** (BullMQ + Redis) to handle potentially slow AI evaluations.
  - Implemented **RBAC** (admin / mentor / learner) with JWT and Express middlewares.
  - Built a **modular API** (`routes`, `controllers`, `models`, `workers`) on top of MongoDB and Node/Express.
  - Created a **React SPA** with API‑driven UI, using Vite, Tailwind, and React Router.



