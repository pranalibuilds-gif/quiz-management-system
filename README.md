# Quiz Management & Online Assessment Platform

A professional, full-stack Quiz Management System built with **FastAPI**, **React**, and **PostgreSQL**. This platform is designed as a modular monolith, emphasizing secure backend validation, relational snapshot architecture, and a production-ready engineering lifecycle.

## 🚀 Key Features

### 👤 Authentication & Identity
- **Secure Hashing**: Password storage using **Argon2**.
- **JWT Strategy**: Dual-token system (Access + Refresh tokens).
- **Session Management**: **Stateful Refresh Tokens** stored and hashed in PostgreSQL.
- **Security Hardening**: Automatic **Refresh Token Rotation** and explicit session revocation (Logout/Deactivation).
- **RBAC**: Role-Based Access Control (Admin vs. Student) enforced at the API layer.

### 📝 Assessment Engine
- **Versioning**: Deep-cloning architecture. Editing a published quiz creates a new version, preserving historical data for existing attempts.
- **Relational Snapshots**: Every attempt creates a full relational snapshot of the quiz metadata, questions, and options.
- **Deterministic Randomization**: Shuffled questions and options based on a stored `random_seed`.
- **Authoritative Timing**: Server-enforced expiration with a visual frontend representation.
- **Resume Support**: Atomic progress saving allows students to continue attempts after a refresh or network drop.
- **Scoring Pipeline**: Backend-only scoring with support for negative marking.

### 📊 Reporting & Analytics
- **Delayed Review**: 24-hour lock on detailed answers and explanations to maintain assessment integrity.
- **Platform Analytics**: Global pass rates, average scores, and student registration trends.
- **Question Analytics**: Success rate and difficulty analysis for individual questions.
- **Leaderboards**: Quiz-specific and global rankings with time-based tie-breakers.

## 🛠️ Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), Alembic, Pydantic v2.
- **Frontend**: React 18, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod.
- **Database**: PostgreSQL.
- **Tooling**: Vite, UV, Pytest, Ruff.

## 📂 Project Structure

```text
/
├── backend/
│   ├── app/                # Feature-first Modular Monolith
│   │   ├── auth/           # Identity & Session Management
│   │   ├── users/          # User Domain & RBAC
│   │   ├── quizzes/        # Quiz Metadata & Versioning
│   │   ├── questions/      # Question Bank
│   │   ├── attempts/       # Assessment Engine & Snapshots
│   │   ├── analytics/      # Aggregated Reporting
│   │   ├── core/           # Config, Security, Logging
│   │   └── database/       # Session & Base Models
│   ├── tests/              # Unit & Integration Suite
│   ├── alembic/            # Database Migrations
│   └── uploads/            # Quiz Thumbnails (Gitignored)
├── frontend/
│   ├── src/
│   │   ├── app/            # Router & Global Providers
│   │   ├── features/       # Capability-based modules (Auth, Runner, etc.)
│   │   ├── components/     # Design System Primitives (UI, Layout)
│   │   └── lib/            # API Client (Axios + Interceptors)
```

## ⚙️ Local Setup

### Backend
1. Navigate to `backend/`.
2. Install dependencies: `pip install -r requirements.txt` (or use `uv`).
3. Configure `.env` using `.env.example`.
4. Run migrations: `alembic upgrade head`.
5. Start server: `uvicorn app.main:app --reload`.

### Frontend
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`.
3. Configure `.env` using `.env.example`.
4. Start dev server: `npm run dev`.

## 🧪 Testing
Run the backend test suite:
```bash
cd backend
pytest
```

## 📝 Known Limitations
- V1 only supports single-choice questions.
- File storage is local (ready for S3 migration).
- Analytics are computed on-demand (ready for materialized views/caching).

## 📄 License
MIT
