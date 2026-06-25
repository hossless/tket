# 🎟️ tket - Sports Event Ticketing Platform

An enterprise-grade sports ticketing and reservation platform built with a highly normalized relational database architecture. This system is designed to handle high-concurrency ticket reservations, dynamic seat allocations, and secure payment processing.

## 📊 Tech Stack
* **Database:** PostgreSQL (Strict 3NF Compliance)
* **Backend:** Python / Django *(Planned - Phase 3)*
* **Caching:** Redis *(Planned - Phase 3)*

## 🗺️ Project Roadmap
* **Phase 1:** ER Diagram and Database Schema Setup (Normalized 3NF)
* **Phase 2:** Raw SQL Implementation and Analytical Queries
* **Phase 3:** Backend APIs Integration
* **Phase 4:** Client UI / Search Optimization

## 🚀 Current Status: Phase 1 (Database Architecture) - Complete
The foundational database schema has been designed, fully constrained, and optimized for high-performance read/write operations. 

**Key Engineering Highlights:**
* **1-to-1 Entity Splitting:** Core `tickets` table separated from `match_details` to keep the primary search feed lightweight and incredibly fast.
* **Concurrency-Ready Reservations:** The `reservations` ledger is explicitly designed to support an upcoming 10-minute Redis lock system (holding temporary seats before payment).
* **Strategic Indexing:** Custom B-Tree composite indexes (`sport`, `city`, `date`) and partial status indexes deployed to optimize the specific queries required by the application's UI.
* **Defensive Constraints:** Robust table-level `CHECK` constraints applied to ensure absolute data integrity (e.g., preventing remaining capacity from exceeding total capacity).

## 🗂️ Repository Structure
```text
tket/
├── database/
│   └── db_schema.sql          # Master PostgreSQL initialization script (Tables, Constraints, Indexes)
├── docs/
│   └── phase1/
│       ├── phase1_report.pdf  # Detailed architectural specification and design justifications
│       ├── ERD.pdf            # High-level Entity Relationship Diagram
│       └── ERD.drawio         # Editable source file for the ERD
└── README.md
```