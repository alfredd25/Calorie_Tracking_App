# NutriTrack

NutriTrack is a full-stack calorie and nutrition tracker. Users can log meals from a USDA-derived food database, build their own foods and meal templates, monitor weight, and track macro and calorie progress on an interactive dashboard.

The application is built around a clear separation between a FastAPI backend and a Next.js frontend, with PostgreSQL for persistence, Redis for caching and as a Celery broker, Nginx as the edge proxy, and Prometheus and Grafana for observability. Everything runs through Docker Compose locally and is deployed to AWS EC2 via a Jenkins pipeline.

---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Repository Layout](#repository-layout)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Database and Migrations](#database-and-migrations)
- [API Reference](#api-reference)
- [Frontend Routes](#frontend-routes)
- [Background Tasks](#background-tasks)
- [Observability](#observability)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment](#deployment)
- [Testing](#testing)

---

## Architecture

```
                +----------------------+
                |        Nginx         |
                |  (reverse proxy)     |
                +----------+-----------+
                           |
            +--------------+--------------+
            |                             |
    +-------+--------+            +-------+--------+
    |    Frontend    |            |     FastAPI    |
    |   (Next.js)    |            |    backend     |
    +----------------+            +-------+--------+
                                          |
                          +---------------+---------------+
                          |               |               |
                  +-------+-----+   +-----+-----+   +-----+------+
                  | PostgreSQL  |   |   Redis   |   |   Celery   |
                  +-------------+   +-----------+   |   worker   |
                                                    +------------+

           +----------------+      +----------------+
           |   Prometheus   |----->|     Grafana    |
           +----------------+      +----------------+
```

Nginx terminates HTTP and HTTPS, routes `/api/*` to the FastAPI service, and serves the Next.js application for everything else. FastAPI talks to PostgreSQL via SQLAlchemy and to Redis for caching frequent reads (food searches, daily summaries) and as a broker for background work. Celery workers consume jobs such as recalculating daily summaries after a meal item changes and dispatching password reset emails through Resend.

Nginx uses Docker's embedded resolver with `proxy_pass` against variable upstreams so it re-resolves container DNS on every request. This avoids stale-IP `502 Bad Gateway` errors when the API container is rebuilt or replaced.

---

## Features

### Authentication and Account Security

- Email and password registration and login with JWT-based sessions.
- Passwords stored as bcrypt hashes.
- Forgot-password flow with single-use, time-limited tokens (15 minute TTL). Tokens are stored hashed (SHA-256) in the database and dispatched to users via email through Resend in a Celery task.
- Per-route rate limiting via `slowapi` to protect login, registration, and password reset endpoints from brute force.

### Onboarding and Profile

- Onboarding flow captures age, gender, height, current weight, target weight, goal, and activity level.
- The backend computes BMR, TDEE, and per-macro targets from the profile so the dashboard can render goal rings.

### Food Database and Search

- USDA-derived foods are imported into PostgreSQL.
- Search is backed by a `tsvector` full-text column with a trigram fallback (`pg_trgm`) for fuzzy matches and an autocomplete endpoint optimised for prefix-style queries.
- Search responses are cached in Redis with a 30-minute TTL.

### Meal Logging

- Users log foods to one of four meal types (breakfast, lunch, dinner, snack) for any date.
- Quantities for database foods are stored in grams; nutritional values are scaled per 100 g (USDA standard).
- Daily summaries are recomputed asynchronously after every change, then cached in Redis with a 10-minute TTL.

### Custom Foods (My Foods)

- Authenticated users can create their own foods with per-serving values for calories, protein, carbohydrates, and fat.
- Custom foods can be edited, deleted, and listed alongside database results when searching, with a "Yours" badge to distinguish them.
- Logging a custom food creates a `MealItem` whose name and macros are pre-resolved, so it appears in the diary even though it does not exist in the `foods` table.

### Custom Meals (My Meals)

- Users can group any combination of database foods and custom foods into a named meal template.
- Templates expose live totals for calories and macros via the API.
- One-tap logging adds every item in the template to today's diary as individual `MealItem` rows so daily summaries remain accurate.

### Create Meal Workflow

The `/create-meal` page provides a guided meal-builder:

- A meal-type selector with colour-coded cards (breakfast, lunch, dinner, snack).
- A unified search that merges custom foods (shown first with a "Yours" badge) and database results.
- Inline "Create food" modal for adding a new custom food on the fly without leaving the page.
- Live totals panel showing aggregated calories and macros that scales as quantities change.
- "Log Meal" CTA that posts each item using the correct endpoint based on its source.
- Optional "Save as Custom Meal" to persist the current selection as a reusable template.

### Per-Meal-Type Quick View

The `/log-meal/[mealType]` route provides a focused view per meal type with three tabs:

- Favourites (placeholder for future work).
- My Foods - browse, edit, delete, and one-tap log custom foods.
- My Meals - list saved templates and log them in a single tap.

### Weight Tracking

- Daily weight log with kg/lb toggle.
- Last-7-days mini-chart in the Log Meals page and a target-progress card on the dashboard.

### Dashboard

- Animated rings showing daily intake versus targets for calories, protein, carbohydrates, and fat.
- Weekly intake chart powered by Recharts.
- Streak counter for consecutive logging days.

---

## Technology Stack

### Frontend

- Next.js 16 with the App Router.
- React 19 with TypeScript.
- Tailwind CSS v4 with shadcn-style primitives.
- Recharts for data visualisation.
- Lucide icons, `tw-animate-css` for utility animations, `sonner` for toasts.

### Backend

- FastAPI on Python 3.11.
- SQLAlchemy 2.x ORM with Alembic migrations.
- PostgreSQL 15 with `pg_trgm` for trigram similarity and `tsvector` indices for full-text search.
- Redis 7 as cache and Celery broker.
- Celery for asynchronous workers.
- `python-jose` for JWT, `passlib[bcrypt]` for password hashing.
- `slowapi` for rate limiting, `prometheus-fastapi-instrumentator` for metrics.
- Resend for transactional email.

### Infrastructure

- Docker and Docker Compose for local orchestration.
- Nginx as reverse proxy with HTTP/HTTPS server blocks; uses Docker's embedded resolver for per-request upstream DNS resolution.
- Jenkins for the build, test, image push, and deploy pipeline.
- AWS EC2 for compute, Amazon EBS for persistent volumes.
- Prometheus and Grafana for metrics and dashboards.

---

## Repository Layout

```
Calorie_Tracker/
|-- backend/
|   |-- alembic/                        Schema migrations
|   |-- app/
|   |   |-- api/                        FastAPI routers (auth, food, meal, user,
|   |   |                               weight, custom_food, custom_meal)
|   |   |-- auth/                       JWT and password hashing helpers
|   |   |-- core/                       DB engine, Redis client, Celery app
|   |   |-- models/                     SQLAlchemy models
|   |   |-- repositories/               DB access functions
|   |   |-- schemas/                    Pydantic request/response models
|   |   |-- services/                   Application logic
|   |   |-- tasks/                      Celery tasks (meal recompute, email)
|   |   `-- main.py                     FastAPI app factory and router includes
|   |-- tests/                          Pytest suite
|   `-- Dockerfile
|
|-- frontend/
|   |-- app/                            App Router pages
|   |   |-- create-meal/                Meal-builder workflow
|   |   |-- dashboard/                  Goal rings and weekly chart
|   |   |-- forgot-password/            Reset request form
|   |   |-- log-meal/[mealType]/        Per-meal-type quick view (Favourites,
|   |   |                               My Foods, My Meals)
|   |   |-- log-meals/                  Daily diary
|   |   |-- login/, register/           Auth screens
|   |   |-- onboarding/                 Profile setup
|   |   |-- reset-password/[token]/     Reset completion form
|   |   `-- welcome/                    Post-login summary
|   |-- components/
|   |   |-- log-meal/                   Tab bar, modal, food/meal cards & forms
|   |   |-- ui/                         Button, card, input primitives
|   |   `-- ...                         App-level components
|   |-- hooks/, services/, types/       Client-side data layer
|   `-- Dockerfile
|
|-- monitoring/                         Prometheus configuration
|-- nginx/
|   |-- nginx.conf                      Production (TLS) configuration
|   `-- nginx.local.conf                Local HTTP-only configuration
|-- jenkins/                            Jenkins agent assets
|-- docker-compose.yml                  Local orchestration
|-- docker-compose.test.yml             CI test orchestration
|-- Jenkinsfile                         Build, test, push, deploy pipeline
|-- pyproject.toml                      Black, Ruff configuration
`-- README.md
```

---

## Local Development

### Prerequisites

- Docker Desktop or Docker Engine 20.10+ with Docker Compose v2.
- Node.js 20+ (only required if running the frontend outside Docker).
- Python 3.11+ (only required if running the backend outside Docker).

### Quick Start

1. Copy `.env.example` to `.env` and fill in any values you need (the defaults work for local development apart from `RESEND_API_KEY`, which is only required for the password reset flow).
2. Build and start every service:

   ```sh
   docker compose up -d --build
   ```

3. Apply database migrations (the API container does this automatically on start, but you can run it manually if needed):

   ```sh
   docker compose exec api alembic upgrade head
   ```

4. Open the application:

   - Web app: http://localhost:3000
   - Edge entry through Nginx: http://localhost
   - API documentation (Swagger UI): http://localhost/api/docs
   - Grafana: http://localhost:3001 (default admin password is `admin`)
   - Prometheus: http://localhost:9090

### Useful Commands

```sh
# Tail the API logs
docker compose logs -f api

# Open a shell inside the API container
docker compose exec api bash

# Recreate just the API after code changes
docker compose up -d --build api

# Reload Nginx after editing nginx.local.conf
docker compose exec nginx nginx -s reload
```

---

## Environment Variables

The root `.env` file is consumed by the backend services. Defaults are shown where applicable.

| Variable             | Required | Default                  | Notes                                                    |
| -------------------- | -------- | ------------------------ | -------------------------------------------------------- |
| `POSTGRES_USER`      | yes      | `calorie_user`           | PostgreSQL user.                                         |
| `POSTGRES_PASSWORD`  | yes      | `calorie_password`       | PostgreSQL password.                                     |
| `POSTGRES_DB`        | yes      | `calorie_db`             | PostgreSQL database name.                                |
| `POSTGRES_HOST`      | yes      | `postgres`               | Service name in Docker Compose.                          |
| `POSTGRES_PORT`      | yes      | `5432`                   | PostgreSQL port.                                         |
| `REDIS_HOST`         | yes      | `redis`                  | Redis hostname.                                          |
| `REDIS_PORT`         | yes      | `6379`                   | Redis port.                                              |
| `SECRET_KEY`         | yes      | `supersecret`             | JWT signing secret. Override in production.              |
| `RESEND_API_KEY`     | partial  | unset                    | Required for the forgot-password flow.                   |
| `RESEND_FROM_EMAIL`  | partial  | `noreply@nutritracks.tech` | Sender address on a verified Resend domain.            |
| `CLIENT_URL`         | no       | `http://localhost:3000`  | Used to build password-reset links in outgoing emails.   |

The frontend reads `NEXT_PUBLIC_API_URL` at build time from `docker-compose.yml`. It defaults to `http://localhost/api`, which matches the Nginx route on the local stack.

---

## Database and Migrations

Alembic migrations live in `backend/alembic/versions/` and run automatically when the API container starts. The current chain is:

1. `a922e68267e1` - create users table
2. `0f530edccae8` - create foods table
3. `141830b3e363` - add full-text search and trigram indexes to foods
4. `8e760c288915` - create meals, meal_items, and daily_summaries
5. `15ae02c055c6` - add user profile and weight log
6. `f3187a03f702` - fix user profile columns
7. `6b8e2b0e7c0d` - add password reset fields to users
8. `7d2c9e1a4b30` - add custom_foods, custom_meals, custom_meal_items; allow nullable food_id and add a name column on meal_items

To create a new revision after editing models:

```sh
docker compose exec api alembic revision --autogenerate -m "describe change"
docker compose exec api alembic upgrade head
```

---

## API Reference

All routes are exposed under `/api` when accessed through Nginx.

### Authentication

| Method | Path                           | Description                                            |
| ------ | ------------------------------ | ------------------------------------------------------ |
| POST   | `/auth/register`               | Create an account. Returns access token and user id.   |
| POST   | `/auth/login`                  | Exchange credentials for a JWT.                        |
| POST   | `/auth/forgot-password`        | Request a password reset email.                        |
| GET    | `/auth/verify-reset-token`     | Validate a reset token without consuming it.           |
| POST   | `/auth/reset-password/{token}` | Set a new password using a reset token.                |

### User Profile

| Method | Path             | Description                            |
| ------ | ---------------- | -------------------------------------- |
| GET    | `/users/me`      | Return the authenticated user profile. |
| PUT    | `/users/profile` | Update profile and recompute targets.  |

### Foods

| Method | Path                   | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| GET    | `/foods/search`        | Full-text search with trigram fallback. |
| GET    | `/foods/autocomplete`  | Lightweight prefix search.           |

### Meals (diary)

| Method | Path                              | Description                                            |
| ------ | --------------------------------- | ------------------------------------------------------ |
| POST   | `/meals/create`                   | Get or create a Meal row for a date and meal type.     |
| POST   | `/meals/add-food`                 | Add a food to a meal (grams).                          |
| GET    | `/meals/list`                     | List meals and items for a given date.                 |
| GET    | `/meals/day-summary`              | Return cached daily totals.                            |
| GET    | `/meals/weekly-summary`           | Return totals for the trailing seven days.             |
| GET    | `/meals/streak`                   | Return current logging streak.                         |
| DELETE | `/meals/remove-food/{meal_item_id}` | Remove an item and recalculate daily totals.         |

### Weight

| Method | Path             | Description                        |
| ------ | ---------------- | ---------------------------------- |
| POST   | `/weight/log`    | Upsert today's weight.             |
| GET    | `/weight/history`| Return last 7 days of weight logs. |

### Custom Foods (My Foods)

| Method | Path                       | Description                                                   |
| ------ | -------------------------- | ------------------------------------------------------------- |
| GET    | `/custom-foods`            | List the authenticated user's custom foods.                   |
| POST   | `/custom-foods`            | Create a custom food.                                         |
| PUT    | `/custom-foods/{id}`       | Update a custom food.                                         |
| DELETE | `/custom-foods/{id}`       | Delete a custom food.                                         |
| POST   | `/custom-foods/log`        | Log a custom food to today's diary at a serving multiplier.   |

### Custom Meals (My Meals)

| Method | Path                            | Description                                                |
| ------ | ------------------------------- | ---------------------------------------------------------- |
| GET    | `/custom-meals`                 | List meal templates with computed totals.                  |
| POST   | `/custom-meals`                 | Create a meal template from custom and database foods.     |
| PUT    | `/custom-meals/{id}`            | Update name and items.                                     |
| DELETE | `/custom-meals/{id}`            | Delete a template.                                         |
| POST   | `/custom-meals/{id}/log`        | Add every item in the template to today's diary.           |

---

## Frontend Routes

| Route                          | Purpose                                                       |
| ------------------------------ | ------------------------------------------------------------- |
| `/`                            | Landing and combined login/register page.                     |
| `/login`, `/register`          | Standalone auth screens.                                      |
| `/forgot-password`             | Password-reset request form.                                  |
| `/reset-password/[token]`      | Reset completion form (validates the token on mount).         |
| `/onboarding`                  | Profile capture for first-time users.                         |
| `/welcome`                     | Post-login summary.                                           |
| `/dashboard`                   | Daily goal rings, weekly chart, streak, and weight progress.  |
| `/log-meals`                   | Daily diary with weight widget and per-meal-type sections.    |
| `/log-meal/[mealType]`         | Focused per-meal view with Favourites, My Foods, My Meals.    |
| `/create-meal`                 | Multi-source meal builder with inline custom-food creation.   |

---

## Background Tasks

Celery handles work that should not block API requests.

- `recalculate_daily_summary(user_id, date)` runs after any meal item is added or removed. It aggregates totals from `meal_items` and upserts the matching row in `daily_summaries`, then invalidates the Redis cache key for that day.
- `send_reset_email(email, link)` posts the email to Resend.

The Celery worker uses Redis as both broker and result backend. Configuration lives in `backend/app/core/celery_worker.py`.

---

## Observability

Prometheus scrapes the `/metrics` endpoint exposed by the FastAPI app every few seconds. Grafana ships with persistent volumes under `grafana_data` and is reachable at port 3001 in the local stack. The default `admin` password should be rotated for any non-local environment.

Useful starting metrics include:

- `http_requests_total` and `http_request_duration_seconds` per route.
- Process metrics via the standard Python exporter that ships with the instrumentator.

---

## CI/CD Pipeline

The Jenkins pipeline defined in `Jenkinsfile` runs on every push to `main`:

1. Checkout source.
2. Run the pytest suite using `docker-compose.test.yml` against ephemeral Postgres and Redis services.
3. Build the backend and frontend Docker images.
4. Push tagged images to Docker Hub under the `alfredd25` namespace.
5. SSH into the EC2 host, pull the new images, run `alembic upgrade head`, and restart the affected services.

The image build always uses `--no-cache` for safety so an in-place fix to a Dockerfile never gets masked by a cached layer.

---

## Deployment

Production traffic terminates on Nginx with Let's Encrypt certificates mounted from `/etc/letsencrypt`. The production server block in `nginx/nginx.conf` redirects HTTP to HTTPS and proxies `/api/*` to the FastAPI service. Both server blocks use Docker's embedded DNS resolver and variable upstreams so a redeploy of the API container does not leave Nginx serving 502s.

Persistent state lives on EBS volumes:

- PostgreSQL data
- Redis snapshots (when AOF is enabled)
- Grafana dashboards and users

Secrets are loaded via the `.env` file and the SSH-uploaded environment, never baked into images.

---

## Testing

The backend test suite uses Pytest with `pytest-asyncio`. Tests run against ephemeral Postgres and Redis containers spun up by `docker-compose.test.yml`.

Run the suite locally with:

```sh
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

Coverage is recorded to `backend/.coverage`.

---

## License

See `LICENSE`.
