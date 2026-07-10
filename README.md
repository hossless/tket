# 🎟️ tket - Sports Event Ticketing Platform

An enterprise-grade sports ticketing and reservation platform built with a highly normalized relational database architecture. This system is designed to handle high-concurrency ticket reservations, dynamic seat allocations, and secure payment processing.

## 📊 Tech Stack
* **Database:** PostgreSQL (Strict 3NF Compliance, PL/pgSQL)
* **Backend:** Python / Django *(In Progress - Phase 3)*
* **Caching:** Redis *(In Progress - Phase 3)*

## 🗺️ Project Roadmap
* ~~**Phase 1:** ER Diagram and Database Schema Setup (Normalized 3NF)~~
* ~~**Phase 2:** Raw SQL Implementation and Analytical Queries~~
* **Phase 3:** Backend APIs Integration (In Progress)
* **Phase 4:** Client UI / Search Optimization

## 🚀 Current Status: Phase 3 (Backend APIs Integration) - In Progress

### ✅ Phase 2 Completion Summary
The core database has been populated with realistic, edge-case-tested dummy data. All required business logic, analytical reporting, and search functionalities have been implemented directly at the database layer using advanced SQL and Stored Procedures.

**Phase 2 Engineering Highlights:**
* **Stored Procedures (PL/pgSQL):** Built highly optimized, UI-ready database functions to handle complex client requests. This includes a multi-table, case-insensitive (`ILIKE`) global search engine, and defensive role-checking functions.
* **Advanced Analytics:** Engineered 22 complex SQL queries using deep multi-table `JOIN`s, subqueries, and aggregations to calculate platform metrics (e.g., global cancelation percentages, top purchasing trends, and report frequency analysis).
* **Robust Data Simulation:** Developed a comprehensive test insert script that meticulously simulates a live production environment, including varied ticket states (Pending, Confirmed, Canceled), transaction statuses, and user roles.
* **DRY & Performant Code:** Adhered strictly to Don't Repeat Yourself (DRY) principles within PostgreSQL functions by utilizing `DECLARE` variables, ensuring efficient query execution plans.

## 🗂️ Repository Structure

```text
tket/
├── database/
│   ├── db_procedures.sql          # PL/pgSQL stored procedures and functions
│   ├── db_queries.sql             # 22 Advanced analytical queries and views
│   ├── db_schema.sql              # Master PostgreSQL initialization script (Tables & Constraints)
│   └── db_test_inserts.sql        # Real-world simulation data for testing logic and edge cases
├── docs/
│   ├── phase1/
│   │   ├── phase1_ERD.pdf           # High-level Entity Relationship Diagram
│   │   ├── phase1_ERD_source.drawio # Editable source file for the ERD
│   │   └── phase1_report.pdf        # Detailed architectural specification and design
│   └── phase2/
│       ├── phase2_ERD.pdf           # Updated Entity Relationship Diagram for Phase 2
│       └── phase2_ERD_source.drawio # Editable source file for the Phase 2 ERD
└── README.md
```
