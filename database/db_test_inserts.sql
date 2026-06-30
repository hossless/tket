-- ==========================================
-- DUMMY INSERTS FOR TESTING
-- ==========================================


-- USERS
INSERT INTO users (username, password_hash, email, phone_number, first_name, last_name, city, role, account_status, created_at) VALUES
('admin_collina', 'hashed_pass', 'pierluigi@fifa.com', '09120000001', 'Pierluigi', 'Collina', 'Rome', 'Admin', 'Active', '2022-01-01 10:00:00'),
('admin_webb', 'hashed_pass', 'howard@epl.com', '09120000002', 'Howard', 'Webb', 'London', 'Admin', 'Active', '2022-02-15 11:30:00'),
('leo_messi', 'hashed_pass', 'leo@miami.com', '09120000003', 'Lionel', 'Messi', 'Miami', 'Spectator', 'Active', '2021-05-10 09:00:00'), 
('cr7_goat', 'hashed_pass', 'cris@alnassr.com', '09120000004', 'Cristiano', 'Ronaldo', 'Riyadh', 'Spectator', 'Active', '2022-06-20 14:00:00'),
('king_james', 'hashed_pass', 'lebron@lakers.com', '09120000005', 'LeBron', 'James', 'Los Angeles', 'Spectator', 'Active', '2022-07-01 08:45:00'),
('chef_curry', 'hashed_pass', 'steph@gsw.com', '09120000006', 'Stephen', 'Curry', 'San Francisco', 'Spectator', 'Active', '2022-08-12 16:20:00'),
('magic_ngapeth', 'hashed_pass', 'earvin@volley.fr', '09120000007', 'Earvin', 'Ngapeth', 'Paris', 'Spectator', 'Active', '2023-01-10 12:00:00'),
('air_jordan', 'hashed_pass', 'mj23@bulls.com', '09120000008', 'Michael', 'Jordan', 'Chicago', 'Spectator', 'Active', '2023-03-05 18:30:00'),
('zlatan_god', 'hashed_pass', 'zlatan@milan.com', '09120000009', 'Zlatan', 'Ibrahimovic', 'Milan', 'Spectator', 'Active', '2023-04-01 09:15:00'),
('kd_sniper', 'hashed_pass', 'kevin@suns.com', '09120000010', 'Kevin', 'Durant', 'Phoenix', 'Spectator', 'Active', '2023-06-22 20:00:00'),
('yuki_fly', 'hashed_pass', 'yuki@milano.it', '09120000011', 'Yuki', 'Ishikawa', 'Milan', 'Spectator', 'Active', '2023-09-14 10:10:00'),
('saeid_setter', 'hashed_pass', 'saeid@iran.ir', '09120000012', 'Saeid', 'Marouf', 'Tehran', 'Spectator', 'Active', '2023-11-30 15:45:00');

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
('Volleyball', 'Zaksa', 'Perugia', '2026-11-18 20:30:00', 'Kedzierzyn-Kozle', 45.00, 3500, 200, 'Economy');

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
(10, 'CEV', 'Volleyball Champions League', 'Hala Azoty', 'Fan Zone, Bar');

-- RESERVATIONS
INSERT INTO reservations (user_id, ticket_id, quantity, seat_info, reservation_status, reserved_at, canceled_by) VALUES
(3, 1, 2, 'Row A, Seat 1-2', 'Confirmed', '2026-09-01 10:00:00', NULL),
(4, 2, 4, 'Row Z, Seat 10-13', 'Confirmed', '2026-09-05 14:30:00', NULL),
(5, 5, 2, 'Courtside 1-2', 'Confirmed', '2026-09-10 09:15:00', NULL),
(6, 6, 3, 'Block B, Seat 4-6', 'Confirmed', '2026-09-12 11:00:00', NULL),
(7, 8, 1, 'Row C, Seat 5', 'Pending', '2026-10-01 08:00:00', NULL), 
(9, 4, 5, 'VIP Box 3', 'Canceled', '2023-04-01 16:00:00', 1),
(10, 7, 2, 'Row D, Seat 1-2', 'Canceled', '2026-09-15 12:00:00', 1),
(11, 9, 2, 'Row E, Seat 10-11', 'Canceled', '2023-11-01 10:00:00', 2),
(12, 10, 4, 'Row A, Seat 15-18', 'Confirmed', '2026-09-20 15:45:00', NULL),
(3, 2, 1, 'Row B, Seat 7', 'Confirmed', '2026-09-22 09:00:00', NULL), 
(4, 1, 2, 'Row H, Seat 1-2', 'Pending', '2026-10-05 18:30:00', NULL),
(5, 1, 3, 'Row M, Seat 3-5', 'Canceled', '2026-09-25 10:00:00', 5);

-- PAYMENTS
INSERT INTO payments (reservation_id, amount, method, transaction_status, tracking_code, paid_at) VALUES
(1, 300.00, 'Credit Card', 'Success', 'TRX-998877', '2026-08-15 10:00:00'), -- Moved to August
(2, 480.00, 'PayPal', 'Success', 'TRX-112233', '2026-09-05 14:35:00'),
(3, 500.00, 'Credit Card', 'Success', 'TRX-445566', '2026-10-05 14:00:00'), -- Moved to October
(4, 540.00, 'Crypto', 'Success', 'TRX-778899', '2026-09-12 11:05:00'),
(5, 50.00, 'Credit Card', 'Pending', NULL, NULL),
(6, 425.00, 'Bank Transfer', 'Refunded', 'TRX-REF-001', '2023-04-02 10:00:00'),
(7, 300.00, 'Credit Card', 'Refunded', 'TRX-REF-002', '2026-09-16 09:00:00'),
(8, 80.00, 'PayPal', 'Refunded', 'TRX-REF-003', '2023-11-02 11:00:00'),
(9, 180.00, 'Credit Card', 'Success', 'TRX-334455', '2026-11-20 09:00:00'), -- Moved to November
(10, 120.00, 'Crypto', 'Success', 'TRX-667788', '2026-09-22 09:05:00'),
(11, 300.00, 'Credit Card', 'Pending', NULL, NULL),
(12, 450.00, 'Bank Transfer', 'Refunded', 'TRX-REF-004', '2026-09-26 10:00:00');

-- REPORTS
INSERT INTO reports (user_id, reservation_id, report_type, description, reply, report_status, reported_at) VALUES
(3, 1, 'General', 'Where exactly is the VIP entrance for the Bernabeu?', 'It is at Gate 4, Mr. Messi.', 'Answered', '2026-09-02 10:00:00'),
(4, 2, 'Technical', 'QR Code not loading on my phone.', NULL, 'Waiting', '2026-09-06 14:00:00'),
(9, 6, 'Complaint', 'Why was my AC Milan ticket canceled?! I am Zlatan!', 'Sorry Zlatan, Admin Collina rejected it.', 'Answered', '2023-04-01 16:30:00'),
(10, 7, 'Complaint', 'Collina canceled my Bulls ticket too, unfair.', NULL, 'Waiting', '2026-09-15 12:30:00'),
(6, NULL, 'Technical', 'The website crashed when I tried to log in yesterday.', 'We have fixed the server issue.', 'Answered', '2026-09-13 09:00:00'),
(8, NULL, 'General', 'Hi, I haven''t bought anything yet, just browsing.', NULL, 'Waiting', '2026-10-01 12:00:00'),
(12, 9, 'General', 'Are drums allowed in the Hala Azoty arena?', 'Yes, small drums are permitted.', 'Answered', '2026-09-21 14:00:00'),
(5, 12, 'Refund', 'I canceled my ticket, when do I get my money back?', 'Refund processed, allow 3 days.', 'Answered', '2026-09-26 10:30:00'),
(11, 8, 'Complaint', 'I wanted courtside seats, you gave me row E.', NULL, 'Waiting', '2023-11-01 10:30:00'),
(7, 5, 'Technical', 'Payment is stuck on pending, please help.', 'Please check with your bank.', 'Answered', '2026-10-02 08:30:00');