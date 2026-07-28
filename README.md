# 🎟️ tket - Enterprise Sports Ticketing API

## 🌟 Overview

**tket** is a highly concurrent, enterprise-grade sports ticketing backend developed as the final project for **Database Systems Design**.

The backend intentionally bypasses traditional ORMs in favor of highly optimized raw PostgreSQL cursors and stored procedures, providing maximum control over database operations while maintaining strict data integrity.

---

## 🛠️ Tech Stack

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-6.0-092E20?style=flat&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Alpine-DC382D?style=flat&logo=redis&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=flat&logo=jsonwebtokens&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat&logo=docker&logoColor=white)

The system leverages:

- **Django** for API routing and security
- **PostgreSQL** for strict 3NF normalized data storage
- **Redis** for ultra-fast geographical query caching
- **Docker** for seamless, one-click deployment

---

## 📑 Table of Contents

- [Documentation](#-documentation)
- [Setup & Installation](#️-setup--installation)
- [Architectural Design Notes](#️-architectural-design-notes)
- [API](#-api)
- [Repository Structure](#️-repository-structure)

---

## 📖 Documentation

- **API Documentation:** [`docs/phase3/API.md`](docs/phase3/API.md)
- **Database Design:** SQL files inside `database/`

---

## ⚙️ Setup & Installation

The entire backend environment is managed by Docker.

You do **not** need to install Python, PostgreSQL, or Redis on your local machine.

### Prerequisites

- Docker Desktop installed and running.

> **Note**
>
> The included `Dockerfile` automatically downloads Python 3.12, installs all required dependencies from `requirements.txt`, and configures the Django server environment.

### Clone the Repository

```bash
git clone https://github.com/hossless/tket
cd tket
```

### Configure Environment Variables

> ⚠️ **Warning**
>
> Never commit your actual `.env` file to a public repository. It is ignored through `.gitignore`.

Create a `.env` file in the project root:

```env
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

DB_NAME=tket_db
DB_USER=tket_admin
DB_PASSWORD=tket_db_password1234
DB_HOST=db
DB_PORT=5432
```

> **Note**
>
> Keep `DB_HOST=db` when running through Docker.
>
> If running Django locally without Docker, change it to:
>
> ```env
> DB_HOST=127.0.0.1
> ```

### Build and Launch

The following command builds the Django image, initializes PostgreSQL (automatically executing `init.sql`), starts Redis, and launches the application.

```bash
docker compose up --build -d
```

The API will be available at:

```text
http://localhost:8000/
```

---

## 🏗️ Architectural Design Notes

To maximize performance and data integrity, the project implements several advanced database techniques.

### Strict Concurrency Control

High-traffic ticket reservations utilize PostgreSQL row-level locking through:

```sql
SELECT ... FOR UPDATE
```

This prevents race conditions and eliminates double-booking anomalies.

### Redis Micro-Caching

Redis caches heavy analytical datasets to reduce database load and achieve response times below **5 ms**.

Cached endpoints include a transparent response flag indicating whether the data originated from **Redis** or the **Database**.

### Raw SQL & PL/pgSQL

The Django ORM is intentionally bypassed.

All database operations execute through parameterized `cursor.execute()` calls, providing complete control over query execution plans while preventing SQL injection.

### Dynamic Cancellation Penalties

Ticket cancellation penalties are calculated dynamically according to the time remaining until match kickoff using server timestamps.

---

## 🔌 API

The complete endpoint documentation, including request parameters, authentication requirements, request bodies, and response examples, is available in the **[Phase 3 API Documentation](docs/phase3/API.md)**.

---

## 🗂️ Repository Structure

```text
tket/
├── database/
│   ├── init.sql
│   ├── db_schema.sql
│   ├── db_procedures.sql
│   ├── db_queries.sql
│   └── db_test_inserts.sql
├── docs/
│   ├── phase1/
│   │   ├── phase1_report.pdf
│   │   ├── phase1_ERD.pdf
│   │   └── phase1_ERD_source.drawio
│   ├── phase2/
│   │   ├── phase2_ERD.pdf
│   │   └── phase2_ERD_source.drawio
│   └── phase3/
│       └── API.md
├── core/
│   ├── views/
│   └── utils.py
├── config/
│   ├── settings.py
│   └── urls.py
├── Dockerfile
├── docker-compose.yml
└── README.md
```