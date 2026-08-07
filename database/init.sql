-- ==========================================
-- INITIALIZE DATABASE
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
    canceled_by INT REFERENCES users(user_id),
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


-- CREATE INDEXES
CREATE INDEX idx_ticket_price 
ON tickets(price);

CREATE INDEX idx_ticket_date_time 
ON tickets(ticket_date_time);

CREATE INDEX idx_ticket_teams 
ON tickets(home_team, away_team);

CREATE INDEX idx_ticket_search 
ON tickets(sport_type, venue_city, ticket_date_time);

CREATE INDEX idx_res_pending 
ON reservations(reservation_status) 
WHERE reservation_status = 'Pending';

-- foreign keys
CREATE INDEX idx_report_user ON reports(user_id);
CREATE INDEX idx_res_user ON reservations(user_id);
CREATE INDEX idx_pay_res ON payments(reservation_id);
CREATE INDEX idx_res_ticket ON reservations(ticket_id);


-- USERS
INSERT INTO users (username, password_hash, email, phone_number, first_name, last_name, city, role, account_status, created_at) VALUES
('hossless', 'pbkdf2_sha256$1200000$JxRWFW2kre5vPFVi4Sn589$mzdnZ4uGSPwKRUqOl3ixrwQM8yfcQA7qovmXse9admk=', 'hosseinlesani77@gmail.com', '09120000000', 'Hossein', 'Lessani', 'Sari', 'Admin', 'Active', '2005-04-04 00:00:00'),
('admin_collina', '5e884898da28', 'pierluigi@fifa.com', '09120000001', 'Pierluigi', 'Collina', 'Rome', 'Admin', 'Active', '2022-01-01 10:00:00'),
('admin_webb', '8d969eef6eca', 'howard@epl.com', '09120000002', 'Howard', 'Webb', 'London', 'Admin', 'Active', '2022-02-15 11:30:00'),
('leo_messi', 'c3ab8ff13720', 'leo@miami.com', '09120000003', 'Lionel', 'Messi', 'Miami', 'Spectator', 'Active', '2021-05-10 09:00:00'), 
('cr7_goat', '0ffe1abd1a08', 'cris@alnassr.com', '09120000004', 'Cristiano', 'Ronaldo', 'Riyadh', 'Spectator', 'Active', '2022-06-20 14:00:00'),
('king_james', 'b0f8b49f2298', 'lebron@lakers.com', '09120000005', 'LeBron', 'James', 'Los Angeles', 'Spectator', 'Active', '2022-07-01 08:45:00'),
('chef_curry', '1241c2a1e345', 'steph@gsw.com', '09120000006', 'Stephen', 'Curry', 'San Francisco', 'Spectator', 'Active', '2022-08-12 16:20:00'),
('magic_ngapeth', 'd82c4179116e', 'earvin@volley.fr', '09120000007', 'Earvin', 'Ngapeth', 'Paris', 'Spectator', 'Active', '2023-01-10 12:00:00'),
('air_jordan', '2b8344e6dbb8', 'mj23@bulls.com', '09120000008', 'Michael', 'Jordan', 'Chicago', 'Spectator', 'Active', '2023-03-05 18:30:00'),
('zlatan_god', '961b6dd3ede3', 'zlatan@milan.com', '09120000009', 'Zlatan', 'Ibrahimovic', 'Milan', 'Spectator', 'Active', '2023-04-01 09:15:00'),
('kd_sniper', 'f11b66da59d2', 'kevin@suns.com', '09120000010', 'Kevin', 'Durant', 'Phoenix', 'Spectator', 'Active', '2023-06-22 20:00:00'),
('yuki_fly', '9c7921a4155a', 'yuki@milano.it', '09120000011', 'Yuki', 'Ishikawa', 'Milan', 'Spectator', 'Active', '2023-09-14 10:10:00'),
('saeid_setter', '5d9c2288307d', 'saeid@iran.ir', '09120000012', 'Saeid', 'Marouf', 'Tehran', 'Spectator', 'Active', '2023-11-30 15:45:00');

-- TICKETS
INSERT INTO tickets (sport_type, home_team, away_team, ticket_date_time, venue_city, price, total_capacity, remaining_capacity, category) VALUES
('Football', 'Real Madrid', 'Barcelona', '2026-10-15 20:00:00', 'Madrid', 150.00, 80000, 15000, 'VIP'),
('Football', 'Bayern Munich', 'Man City', '2026-11-05 21:00:00', 'Munich', 120.00, 75000, 0, 'Normal'),
('Football', 'Arsenal', 'Liverpool', '2026-12-12 18:30:00', 'London', 95.00, 60000, 5000, 'Normal'),
('Football', 'AC Milan', 'Inter Milan', '2023-05-10 20:45:00', 'Milan', 85.00, 75000, 20000, 'Economy'),
('Basketball', 'LA Lakers', 'Golden State', '2026-11-20 19:30:00', 'Los Angeles', 250.00, 19000, 1000, 'VIP'),
('Basketball', 'Boston Celtics', 'Miami Heat', '2026-12-01 20:00:00', 'Boston', 180.00, 18600, 3000, 'Normal'),
('Basketball', 'Chicago Bulls', 'NY Knicks', '2026-12-25 18:00:00', 'Chicago', 150.00, 20000, 4500, 'Normal'),
('Volleyball', 'Trentino Volley', 'Lube Civitanova', '2026-10-22 18:00:00', 'Trento', 50.00, 4000, 500, 'VIP'),
('Volleyball', 'Zenit Kazan', 'Sada Cruzeiro', '2023-12-15 19:00:00', 'Kazan', 40.00, 5000, 1200, 'Normal'),
('Volleyball', 'Zaksa', 'Perugia', '2026-11-18 20:30:00', 'Kedzierzyn-Kozle', 45.00, 3500, 200, 'Economy'),

('Football', 'PSG', 'Atletico Madrid', '2026-11-28 20:45:00', 'Paris', 210.00, 47000, 2500, 'VIP'),
('Football', 'Manchester Utd', 'Chelsea', '2026-09-30 17:30:00', 'Manchester', 90.00, 74000, 0, 'Normal'),
('Basketball', 'Denver Nuggets', 'Miami Heat', '2023-06-12 20:30:00', 'Denver', 110.00, 19500, 100, 'Normal'),
('Volleyball', 'Sir Safety', 'Trentino', '2026-10-10 18:00:00', 'Perugia', 35.00, 4000, 1500, 'Economy'),
('Basketball', 'NY Knicks', 'Brooklyn Nets', '2026-07-12 14:00:00', 'New York', 450.00, 19000, 12, 'VIP'),
('Volleyball', 'Japan', 'Brazil', '2023-06-05 15:00:00', 'Tokyo', 150.00, 13000, 0, 'Normal'),
('Football', 'Juventus', 'Napoli', '2026-05-24 15:00:00', 'Turin', 480.00, 41000, 400, 'VIP'),
('Football', 'Dortmund', 'Bayer Leverkusen', '2026-07-05 14:00:00', 'Dortmund', 130.00, 81000, 20000, 'Normal'),
('Football', 'Argentina', 'Brazil', '2026-09-15 18:00:00', 'Buenos Aires', 85.00, 80000, 14000, 'Normal'),
('Basketball', 'Real Madrid', 'Barcelona', '2026-12-10 21:00:00', 'Madrid', 85.00, 15000, 300, 'Normal'), 
('Volleyball', 'France', 'Poland', '2026-10-28 19:00:00', 'Paris', 65.00, 12000, 5000, 'Normal'), 
('Football', 'Boca Juniors', 'River Plate', '2026-11-11 17:00:00', 'Buenos Aires', 40.00, 54000, 8000, 'Economy'),
('Volleyball', 'USA', 'Italy', '2026-08-20 20:00:00', 'Los Angeles', 55.00, 10000, 0, 'Normal'),
('Basketball', 'Phoenix Suns', 'LA Lakers', CURRENT_TIMESTAMP + INTERVAL '1 day', 'Phoenix', 300.00, 17000, 45, 'VIP'),
('Football', 'UCL Final', 'TBD', CURRENT_TIMESTAMP + INTERVAL '7 days', 'London', 450.00, 90000, 150, 'VIP'),
('Football', 'Liverpool', 'Everton', '2026-10-20 12:30:00', 'Liverpool', 75.00, 53000, 2500, 'Economy'),
('Football', 'Inter Miami', 'LA Galaxy', '2026-08-15 20:00:00', 'Miami', 350.00, 21000, 200, 'VIP'),
('Basketball', 'Golden State', 'Sacramento Kings', '2026-11-02 22:30:00', 'San Francisco', 95.00, 18000, 8000, 'Economy'),
('Volleyball', 'Modena', 'Lube Civitanova', '2026-12-05 18:00:00', 'Modena', 45.00, 5000, 400, 'Normal'),
('Football', 'Bayern Munich', 'Dortmund', '2026-04-10 18:30:00', 'Munich', 220.00, 75000, 0, 'VIP'),
('Basketball', 'Dallas Mavericks', 'Minnesota T-Wolves', '2026-12-20 20:30:00', 'Dallas', 115.00, 19200, 1200, 'Normal'),
('Football', 'Roma', 'Lazio', '2026-03-15 15:00:00', 'Rome', 60.00, 70000, 22000, 'Economy'),
('Volleyball', 'Jastrzebski', 'Zaksa', '2026-02-18 20:30:00', 'Jastrzebie-Zdroj', 30.00, 3000, 150, 'Economy'),
('Football', 'Tottenham', 'Arsenal', '2026-11-12 14:00:00', 'London', 140.00, 62000, 0, 'Normal'),
('Basketball', 'Milwaukee Bucks', 'OKC Thunder', '2026-01-25 19:30:00', 'Milwaukee', 85.00, 17500, 6500, 'Normal'),
('Football', 'Ajax', 'RB Leipzig', '2026-09-18 21:00:00', 'Amsterdam', 55.00, 55000, 14000, 'Economy'),
('Volleyball', 'Brazil', 'Italy', '2026-07-22 10:00:00', 'Rio de Janeiro', 180.00, 11000, 0, 'VIP'),
('Basketball', 'Panathinaikos', 'Olympiacos', '2026-11-28 20:00:00', 'Athens', 65.00, 18000, 5000, 'Economy'),
('Football', 'Man City', 'Real Madrid', CURRENT_TIMESTAMP + INTERVAL '30 days', 'Manchester', 280.00, 53000, 1200, 'VIP'),
('Basketball', 'Chicago Bulls', 'Detroit Pistons', '2026-03-02 20:00:00', 'Chicago', 70.00, 20000, 12000, 'Economy'),
('Football', 'Sporting CP', 'Benfica', '2026-04-18 20:30:00', 'Lisbon', 80.00, 50000, 4500, 'Normal'),
('Volleyball', 'USA', 'Serbia', '2026-05-12 19:00:00', 'Chicago', 120.00, 9000, 800, 'VIP'),
('Football', 'Galatasaray', 'Fenerbahce', '2026-10-30 19:00:00', 'Istanbul', 45.00, 52000, 0, 'Economy'),
('Basketball', 'Boston Celtics', 'Philadelphia 76ers', '2026-02-14 18:30:00', 'Boston', 210.00, 18600, 300, 'VIP'),
('Football', 'World Cup Final', 'TBD', '2026-07-19 15:00:00', 'New York', 500.00, 82500, 5000, 'VIP');

-- MATCH DETAILS
INSERT INTO match_details (ticket_id, organizer, tournament_name, venue_name, facilities) VALUES
(1, 'La Liga', 'El Clasico Super Cup', 'Santiago Bernabeu', 'VIP Lounge, Free Wifi, Parking'),
(2, 'UEFA', 'Champions League', 'Allianz Arena', 'Food Court, Merchandise Shop'),
(3, 'FA', 'Premier League', 'Emirates Stadium', 'Pubs, Disabled Access'),
(4, 'Serie A', 'Derby della Madonnina', 'San Siro', 'Museum, Cafe'),
(5, 'NBA', 'Western Conference', 'Crypto.com Arena', 'Courtside Dining, Bars'),
(6, 'NBA', 'Eastern Conference', 'TD Garden', 'Pro Shop, Fast Food'),
(7, 'NBA', 'Christmas Special', 'United Center', 'Statue Park, Steakhouse'),
(8, 'Lega Volley', 'SuperLega', 'BLM Group Arena', 'Snack Bar, Parking'),
(9, 'FIVB', 'Club World Championship', 'Saint Petersburg Hall', 'Heated Seats, Cafe'),
(10, 'CEV', 'Volleyball Champions League', 'Hala Azoty', 'Fan Zone, Bar'),

(11, 'UEFA', 'Champions League', 'Parc des Princes', 'VIP Lounge, Champagne Bar'),
(12, 'FA', 'Premier League', 'Old Trafford', 'Pubs, Museum, Megastore'),
(13, 'NBA', 'NBA Finals', 'Ball Arena', 'Standard Concessions, Parking'),
(14, 'Lega Volley', 'Serie A1', 'PalaBarton', 'Fan Zone, Fast Food'),
(15, 'NBA', 'Eastern Conference', 'Madison Square Garden', 'Courtside Dining, Luxury Suites'),
(16, 'FIVB', 'Nations League', 'Yoyogi National Gymnasium', 'Fan Village, Cafe'),
(17, 'Serie A', 'Derby', 'Allianz Stadium', 'Luxury Suites, Fine Dining'),
(18, 'Bundesliga', 'Regular Season', 'Signal Iduna Park', 'Yellow Wall, Beer Garden'),
(19, 'CONMEBOL', 'World Cup Qualifiers', 'El Monumental', 'Intense Atmosphere, Standing Room'),
(20, 'EuroLeague', 'Final Four', 'WiZink Center', 'Merchandise, Premium Seating'),
(21, 'FIVB', 'Volleyball Nations League', 'Accor Arena', 'Fan Zone, Fast Food'),
(22, 'CONMEBOL', 'Copa Libertadores', 'La Bombonera', 'Standing Room, Local Pubs'),
(23, 'FIVB', 'Nations League', 'Crypto.com Arena', 'Standard Concessions, Wifi'),
(24, 'NBA', 'Regular Season', 'Footprint Center', 'Courtside Dining, Pro Shop'),
(25, 'UEFA', 'Champions League Final', 'Wembley Stadium', 'Luxury Suites, VIP Entrance'),
(26, 'FA', 'Merseyside Derby', 'Anfield', 'Pubs, Local Food, Fan Zone'),
(27, 'MLS', 'Regular Season', 'Chase Stadium', 'VIP Lounge, Open Bar'),
(28, 'NBA', 'Western Conference', 'Chase Center', 'Pro Shop, Premium WiFi'),
(29, 'Lega Volley', 'SuperLega', 'Eurosuole Forum', 'Snack Bar, Parking'),
(30, 'Bundesliga', 'Der Klassiker', 'Allianz Arena', 'Beer Garden, Merchandise'),
(31, 'NBA', 'Regular Season', 'American Airlines Center', 'Courtside Dining, Suites'),
(32, 'Serie A', 'Derby della Capitale', 'Stadio Olimpico', 'Historical Monument, Food Trucks'),
(33, 'PlusLiga', 'Regular Season', 'Hala Widowiskowo-Sportowa', 'Fan Zone, Merchandise'),
(34, 'FA', 'North London Derby', 'Tottenham Hotspur Stadium', 'Sky Lounge, Goal Line Bar'),
(35, 'NBA', 'Regular Season', 'Fiserv Forum', 'Deer District, Pro Shop'),
(36, 'UEFA', 'Europa League', 'Johan Cruyff Arena', 'Museum, Free WiFi'),
(37, 'FIVB', 'World Championship', 'Maracanazinho', 'VIP Box, Cocktail Bar'),
(38, 'EuroLeague', 'Greek Derby', 'OAKA Arena', 'Intense Atmosphere, Food Stalls'),
(39, 'UEFA', 'Champions League', 'Etihad Stadium', 'Tunnel Club, Fine Dining'),
(40, 'NBA', 'Central Division', 'United Center', 'Statue Park, Steakhouse'),
(41, 'Primeira Liga', 'Lisbon Derby', 'Estadio Jose Alvalade', 'Fan Zone, Local Food'),
(42, 'FIVB', 'Nations League', 'United Center', 'VIP Seats, Exclusive Lounge'),
(43, 'Super Lig', 'Intercontinental Derby', 'Rams Park', 'Standing Room, Fan Village'),
(44, 'NBA', 'Eastern Conference', 'TD Garden', 'Luxury Suites, Pro Shop'),
(45, 'FIFA', 'World Cup 2026 Final', 'MetLife Stadium', 'Ultra VIP, Full Hospitality');

-- RESERVATIONS
INSERT INTO reservations (user_id, ticket_id, quantity, seat_info, reservation_status, reserved_at, canceled_by) VALUES
(3, 1, 2, 'Row A, Seat 1-2', 'Confirmed', '2026-08-01 10:00:00', NULL),
(4, 2, 4, 'Row Z, Seat 10-13', 'Confirmed', '2026-09-05 14:30:00', NULL),
(5, 5, 2, 'Courtside 1-2', 'Confirmed', '2026-09-10 09:15:00', NULL),
(6, 6, 3, 'Block B, Seat 4-6', 'Confirmed', CURRENT_TIMESTAMP - INTERVAL '3 days', NULL), 
(7, 8, 1, 'Row C, Seat 5', 'Pending', '2026-10-01 08:00:00', NULL),
(9, 4, 5, 'VIP Box 3', 'Canceled', '2023-04-01 16:00:00', 1),
(10, 7, 2, 'Row D, Seat 1-2', 'Canceled', '2026-09-15 12:00:00', 1),
(11, 9, 2, 'Row E, Seat 10-11', 'Canceled', '2023-11-01 10:00:00', 2),
(12, 10, 4, 'Row A, Seat 15-18', 'Confirmed', '2026-09-20 15:45:00', NULL),
(3, 2, 1, 'Row B, Seat 7', 'Confirmed', '2026-09-22 09:00:00', NULL),
(4, 1, 2, 'Row H, Seat 1-2', 'Pending', '2026-10-05 18:30:00', NULL),
(5, 1, 3, 'Row M, Seat 3-5', 'Canceled', '2026-09-25 10:00:00', 5),
(3, 1, 1, 'Row A, Seat 3', 'Confirmed', '2026-08-02 11:00:00', NULL),
(3, 5, 2, 'Courtside 3-4', 'Confirmed', '2026-09-11 10:00:00', NULL),
(3, 10, 1, 'Row B, Seat 1', 'Confirmed', '2026-09-21 16:00:00', NULL),
(6, 7, 2, 'Block A, Seat 1-2', 'Confirmed', CURRENT_TIMESTAMP - INTERVAL '2 days', NULL),
(6, 1, 1, 'Row C, Seat 1', 'Confirmed', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL);

-- PAYMENTS
INSERT INTO payments (reservation_id, amount, method, transaction_status, tracking_code, paid_at) VALUES
(1, 300.00, 'Credit Card', 'Success', 'TRX-998877', '2026-08-01 10:05:00'),
(2, 480.00, 'PayPal', 'Success', 'TRX-112233', '2026-09-05 14:35:00'),
(3, 500.00, 'Credit Card', 'Success', 'TRX-445566', '2026-10-05 14:00:00'),
(4, 540.00, 'Crypto', 'Success', 'TRX-778899', CURRENT_TIMESTAMP - INTERVAL '3 days'), 
(5, 50.00, 'Credit Card', 'Pending', NULL, NULL),
(6, 425.00, 'Bank Transfer', 'Refunded', 'TRX-REF-001', '2023-04-02 10:00:00'),
(7, 300.00, 'Credit Card', 'Refunded', 'TRX-REF-002', '2026-09-16 09:00:00'),
(8, 80.00, 'PayPal', 'Refunded', 'TRX-REF-003', '2023-11-02 11:00:00'),
(9, 180.00, 'Credit Card', 'Success', 'TRX-334455', '2026-11-20 09:00:00'), 
(10, 120.00, 'Crypto', 'Success', 'TRX-667788', '2026-09-22 09:05:00'),
(11, 300.00, 'Credit Card', 'Pending', NULL, NULL),
(12, 450.00, 'Bank Transfer', 'Refunded', 'TRX-REF-004', '2026-09-26 10:00:00'),
(13, 150.00, 'Credit Card', 'Success', 'TRX-999999', '2026-08-02 11:05:00'),
(14, 500.00, 'Credit Card', 'Success', 'TRX-111111', '2026-09-11 10:05:00'),
(15, 45.00, 'PayPal', 'Success', 'TRX-222222', '2026-09-21 16:05:00'),
(16, 300.00, 'Crypto', 'Success', 'TRX-333333', CURRENT_TIMESTAMP - INTERVAL '2 days'), 
(17, 150.00, 'Credit Card', 'Success', 'TRX-444444', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- REPORTS
INSERT INTO reports (user_id, reservation_id, report_type, description, reply, report_status, reported_at) VALUES
(3, 1, 'General', 'Where exactly is the VIP entrance for the Bernabeu?', 'It is at Gate 4, Mr. Messi.', 'Resolved', '2026-09-02 10:00:00'),
(4, 2, 'Technical', 'QR Code not loading on my phone.', NULL, 'Waiting', '2026-09-06 14:00:00'),
(9, 6, 'Complaint', 'Why was my AC Milan ticket canceled?! I am Zlatan!', 'Sorry Zlatan, Admin Collina rejected it.', 'Resolved', '2023-04-01 16:30:00'),
(10, 7, 'Complaint', 'Collina canceled my Bulls ticket too, unfair.', NULL, 'Waiting', '2026-09-15 12:30:00'),
(6, NULL, 'Technical', 'The website crashed when I tried to log in yesterday.', 'We have fixed the server issue.', 'Resolved', '2026-09-13 09:00:00'),
(8, NULL, 'General', 'Hi, I haven''t bought anything yet, just browsing.', NULL, 'Waiting', '2026-10-01 12:00:00'),
(12, 9, 'General', 'Are drums allowed in the Hala Azoty arena?', 'Yes, small drums are permitted.', 'Resolved', '2026-09-21 14:00:00'),
(5, 12, 'Refund', 'I canceled my ticket, when do I get my money back?', 'Refund processed, allow 3 days.', 'Resolved', '2026-09-26 10:30:00'),
(11, 8, 'Complaint', 'I wanted courtside seats, you gave me row E.', NULL, 'Waiting', '2023-11-01 10:30:00'),
(7, 5, 'Technical', 'Payment is stuck on pending, please help.', 'Please check with your bank.', 'Resolved', '2026-10-02 08:30:00');