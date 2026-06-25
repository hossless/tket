-- ==========================================
-- tket: DATABASE SCHEMA (POSTGRESQL)
-- ==========================================

-- DROP EXISTING TABLES
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS match_details CASCADE;

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

CREATE TABLE match_details (
    ticket_id INT PRIMARY KEY REFERENCES tickets(ticket_id),
    organizer VARCHAR(50),
    tournament_name VARCHAR(50) NOT NULL,
    venue_name VARCHAR(50) NOT NULL,
    facilities VARCHAR(500) 
);

CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    ticket_id INT NOT NULL REFERENCES tickets(ticket_id),
    quantity INT NOT NULL,
    seat_info VARCHAR(100), 
    reservation_status VARCHAR(20) DEFAULT 'Pending' NOT NULL,
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_valid_quantity CHECK (quantity > 0)
);

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL REFERENCES reservations(reservation_id),
    amount NUMERIC(12, 2) NOT NULL,
    method VARCHAR(50) DEFAULT 'Credit Card' NOT NULL,
    transaction_status VARCHAR(20) DEFAULT 'Pending' NOT NULL,
    tracking_code VARCHAR(100), 
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_positive_amount CHECK (amount > 0)
);

CREATE TABLE reports (
    report_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    reservation_id INT REFERENCES reservations(reservation_id),
    report_type VARCHAR(20) DEFAULT 'General' NOT NULL,
    description VARCHAR(500) NOT NULL,
    reply VARCHAR(500), 
    report_status VARCHAR(20) DEFAULT 'Waiting' NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);