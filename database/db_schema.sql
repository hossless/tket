-- ==========================================
-- tket: DATABASE SCHEMA (POSTGRESQL)
-- ==========================================

-- DROP EXISTING TABLES
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS match_details CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- CREATE CORE TABLES
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(15) UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    city VARCHAR(50),
    role VARCHAR(20) DEFAULT 'Spectator' NOT NULL,
    account_status VARCHAR(20) DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_contact_method CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    sport_type VARCHAR(20) NOT NULL,
    home_team VARCHAR(50) NOT NULL,
    away_team VARCHAR(50) NOT NULL,
    ticket_date_time TIMESTAMP NOT NULL,
    venue_city VARCHAR(50) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    total_capacity INT NOT NULL,
    remaining_capacity INT NOT NULL,
    category VARCHAR(20) DEFAULT 'Normal' NOT NULL,
    CONSTRAINT chk_positive_numbers CHECK (total_capacity > 0 AND remaining_capacity >= 0 AND price >= 0),
    CONSTRAINT chk_logical_capacity CHECK (remaining_capacity <= total_capacity)
);