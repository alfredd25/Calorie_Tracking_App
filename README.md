# NutriTrack: Full-stack Calorie Tracker Application

Welcome to **NutriTrack**, a feature-rich, full-stack Calorie Tracker application designed to help users accurately log their daily food intake, monitor nutrient consumption, and visualize their health progression. 

The project is built with a highly decoupled architecture, leveraging a modern React-based frontend (**Next.js**) and a high-performance Python backend (**FastAPI**), all seamlessly orchestrated via **Docker Compose** and integrated with a robust CI/CD pipeline using **Jenkins**, finally hosted reliably on **AWS**.

---

## Features Breakdown

### 1. Robust Authentication & Security
- **Secured User Accounts:** Secure registration and login flows using JWT (JSON Web Tokens). Passwords are cryptographically hashed using `bcrypt` preventing unauthorized access.
- **API Rate Limiting:** Built-in `slowapi` integration protects backend endpoints from DDoS, excessive spam, and brute-force attacks by limiting request rates per IP.

### 2. Comprehensive Food Tracking & Database
- **Advanced Food Search:** Users can search for detailed dietary information leveraging a robust PostgreSQL implementation—capable of full-text searching against external and internal datasets (such as the USDA database imports).
- **Logging Meals:** Users can log individual food items to specific meal categories (e.g., Breakfast, Lunch, Dinner). The app automatically calculates aggregated macronutrients and total calories.
- **Dynamic Meal Management:** Full CRUD capability. Add, edit, or delete logged foods flexibly through the custom *MealSection* UI. 

### 3. Interactive Dashboard & Analytics
- **Visualized Progression:** Utilizing `recharts`, the dashboard presents a `WeeklyChart` outlining calorie consumption over the week.
- **Goal Rings & Streaks:** Engaging UI/UX using animated elements (like `AnimatedRing`) to showcase daily goals versus consumed calories. 
- **Daily Summaries:** The backend automatically tracks daily metric aggregations and user progress streaks, persisting them reliably in the database.

### 4. Asynchronous Background Tasks
- **Celery & Redis:** Heavy computational tasks (like massive data imports, daily summary generation, or background cron-jobs) are offloaded to **Celery Workers** backed by **Redis** as a message broker. This ensures the main FastAPI application remains lightning-fast and responsive at all times.

### 5. Enterprise-grade Monitoring & Observability
- **Prometheus Metrics:** The FastAPI backend natively exposes HTTP metrics via `prometheus-fastapi-instrumentator`.
- **Grafana Dashboards:** Beautiful, real-time visual dashboards track API performance, load times, server strain, and application metrics to facilitate proactive optimization.

---

## Technology Stack

This project utilizes a cutting-edge, modern tech stack combining type-safety, robust performance, and scalability.

### **Frontend Interface**
- **Framework:** **Next.js (v16)** utilizing the cutting-edge App Router paradigm.
- **Library:** **React (v19)** with **TypeScript** for strict type checking and stability.
- **Styling:** **Tailwind CSS** paired with **shadcn/ui** components for a minimal, premium, beautiful user interface.
- **Animations:** Custom animations via Framer Motion and `tw-animate-css` to create a dynamic, engaging frontend.
- **Data Visualization:** **Recharts** for building interactive web charts.
- **State & Utils:** `date-fns` for time formatting, `sonner` for toast notifications.

### **Backend API**
- **Framework:** **FastAPI** (Python 3.11+), chosen for its exceptional speed, asynchronous support, and auto-generated Swagger UI documentation.
- **Database:** **PostgreSQL 15**, serving as the primary relational database.
- **ORM & Migrations:** **SQLAlchemy** handles database abstraction, while **Alembic** manages clean, version-controlled schema migrations.
- **Caching & Broker:** **Redis 7** functioning both as an caching layer and as the message broker for Celery.
- **Background Processing:** **Celery** handles asynchronous worker jobs (`meal_tasks`).
- **Data Processing:** **Pandas** for robust data manipulation (e.g., USDA database CSV ingestion).

### **DevOps, Operations & Infrastructure**
To ensure maximum portability and scalability, there are **no local installations** of third-party services. Everything runs reliably via containerization.

- **Containers:** **Docker** and **Docker Compose**. The application provisions the following containerized services natively via official Docker images:
  - `postgres:15-alpine`
  - `redis:7-alpine`
  - `prom/prometheus:latest`
  - `grafana/grafana:latest`
  - `nginx:alpine`
- **Reverse Proxy:** **Nginx** serves as the API and Web gateway, successfully multiplexing requests to the correct frontend and backend containers.
- **CI/CD Pipeline:** Dedicated **Jenkins** pipeline (`Jenkinsfile`) automates checking out code, spinning up testing environments, building fresh Docker images, pushing them to Docker Hub (`alfredd25`), and executing deployment over SSH.

### **Cloud Hosting (AWS)**
- **Compute:** **Amazon EC2** (x2 Instances). One instance serves as the primary host for the frontend, API, and the essential microservices, while the workload is appropriately distributed to ensure maximum uptime.
- **Storage:** **Amazon EBS** (Elastic Block Store) volumes are attached to the EC2 instances, ensuring persistent storage for the Postgres database, Redis cache state, and Grafana volume logs.

---

## Project Structure

```
Calorie_Tracker/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # API Route Controllers (Auth, Food, Meal)
│   │   ├── core/             # Core Configurations & Celery app
│   │   ├── models/           # SQLAlchemy DB Models (User, Meal, DailySummary, etc.)
│   │   ├── schemas/          # Pydantic Schemas for Request/Response Validation
│   │   ├── services/         # Business Logic implementation
│   │   └── tasks/            # Celery Background Tasks (meal_tasks)
│   ├── alembic/              # Database schema migrations setup
│   ├── tests/                # Pytest suites
│   ├── Dockerfile            # Python Backend Docker Build
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Next.js Application
│   ├── app/                  # Next.js 16 App Router pages
│   │   ├── dashboard/        # Dashboard view containing metrics
│   │   ├── log-meals/        # Food searching & logging views
│   │   ├── login/ & register/# Auth forms
│   │   └── page.tsx          # Landing / Welcome Page
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # shadcn UI components
│   │   ├── AnimatedRing.tsx  # Circular animation component
│   │   ├── MealSection.tsx   # Complex specific logic for logging meals
│   │   └── WeeklyChart.tsx   # Recharts Line/Bar chart logic
│   ├── Dockerfile            # Node.js Frontend Docker Build
│   └── package.json          # Node.js dependencies
│
├── monitoring/               # Prometheus & Grafana Configuration YAMLs
├── nginx/                    # Nginx Reverse Proxy Configs
├── docker-compose.yml        # Orchestration configurations for Production
├── docker-compose.test.yml   # Orchestration for Jenkins CI test running
├── Jenkinsfile               # Automated Jenkins CI/CD pipeline definition
└── pyproject.toml            # Global Python config (Black, Ruff, linting rules)
```

---

## CI/CD Pipeline Flow

The deployment of this application is fully automated to streamline development using the included `Jenkinsfile`:

1. **Checkout SCM:** Jenkins pulls the latest commits from the repository.
2. **Run Tests:** Uses `docker-compose.test.yml` to spin up scoped containers, execute backend pytest test scripts with `pytest-asyncio`, and then cleanly tear down the test environment.
3. **Build Images:** Initiates an isolated build for both the frontend (Next.js) and backend (FastAPI), injecting the relevant environment variables to point to the EC2 Host's IP.
4. **Push to Docker Hub:** Authenticates and pushes the freshly tagged image versions to Docker Hub under the `alfredd25` registry.
5. **Deploy to EC2:** Jenkins SSH's securely into the AWS EC2 Host, pulls the latest images using `docker compose pull`, restarts the containers, and runs Alembic migrations (`alembic upgrade head`) to automatically sync database schemas. 

---

## Conclusion

This project successfully bridges cutting-edge modern frontend aesthetics with a robust, production-ready, asynchronous Python backend. Features like Redis caching, background task queuing with Celery, and comprehensive monitoring with Prometheus and Grafana validate that this application is not merely a prototype, but a fully scalable engineering achievement deployed seamlessly to the AWS Cloud.
