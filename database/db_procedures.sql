-- ==========================================
-- STORED PROCEDURES
-- ==========================================


-- PROCEDURE 1: Get User Tickets by Contact Info
    -- A function that takes a single string (either email or phone)
    -- and returns a table of the user's confirmed tickets ordered by time.

CREATE OR REPLACE FUNCTION get_user_tickets(p_contact_info VARCHAR)
RETURNS TABLE (
    reservation_id INT,
    home_team VARCHAR,
    away_team VARCHAR,
    quantity INT,
    reserved_at TIMESTAMP
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.reservation_id,
        t.home_team,
        t.away_team,
        r.quantity,
        r.reserved_at
    FROM users u
    JOIN reservations r ON u.user_id = r.user_id
    JOIN tickets t ON r.ticket_id = t.ticket_id
    WHERE (u.email = p_contact_info OR u.phone_number = p_contact_info)
      AND r.reservation_status = 'Confirmed'
    ORDER BY r.reserved_at ASC;
END;
$$;

-- PROCEDURE 2: Get Users with Cancelations by Specific Admin
    -- Takes an admin's contact info, verifies they are an Admin, and returns  
    -- the unique usernames of customers whose reservations they canceled.

CREATE OR REPLACE FUNCTION get_canceled_users_by_admin(p_contact_info VARCHAR)
RETURNS TABLE (
    username VARCHAR
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT customer.username
    FROM reservations r
    JOIN users admin ON r.canceled_by = admin.user_id
    JOIN users customer ON r.user_id = customer.user_id
    WHERE (admin.email = p_contact_info OR admin.phone_number = p_contact_info)
      AND r.reservation_status = 'Canceled'
      AND admin.role = 'Admin';
END;
$$;

-- PROCEDURE 3: Get Purchased Tickets by City
    -- Takes a city name as input and returns a detailed list of all 
    -- confirmed ticket purchases for matches hosted in that city.

CREATE OR REPLACE FUNCTION get_city_tickets(p_city VARCHAR)
RETURNS TABLE (
    username VARCHAR,
    reservation_id INT,
    home_team VARCHAR,
    away_team VARCHAR,
    quantity INT,
    reserved_at TIMESTAMP
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.username,
        r.reservation_id,
        t.home_team,
        t.away_team,
        r.quantity,
        r.reserved_at
    FROM reservations r
    JOIN tickets t ON r.ticket_id = t.ticket_id
    JOIN users u ON r.user_id = u.user_id
    WHERE t.venue_city = p_city
      AND r.reservation_status = 'Confirmed'
    ORDER BY r.reserved_at DESC;
END;
$$;

-- PROCEDURE 4: Global Ticket Search
    -- Takes a keyword, formats it as a search pattern once, and searches 
    -- for partial, case-insensitive matches across multiple tables,
    -- returning only confirmed reservations.

CREATE OR REPLACE FUNCTION search_tickets(p_keyword VARCHAR)
RETURNS TABLE (
    username VARCHAR,
    reservation_id INT,
    home_team VARCHAR,
    away_team VARCHAR,
    venue_name VARCHAR,
    category VARCHAR,
    quantity INT,
    reserved_at TIMESTAMP
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_search_pattern VARCHAR := '%' || p_keyword || '%';
BEGIN
    RETURN QUERY
    SELECT 
        u.username,
        r.reservation_id,
        t.home_team,
        t.away_team,
        md.venue_name,
        t.category,
        r.quantity,
        r.reserved_at
    FROM reservations r
    JOIN tickets t ON r.ticket_id = t.ticket_id
    JOIN users u ON r.user_id = u.user_id
    JOIN matchdetails md ON t.ticket_id = md.ticket_id
    WHERE (
        u.first_name ILIKE v_search_pattern OR 
        u.last_name ILIKE v_search_pattern OR 
        u.username ILIKE v_search_pattern OR 
        t.home_team ILIKE v_search_pattern OR 
        t.away_team ILIKE v_search_pattern OR 
        md.venue_name ILIKE v_search_pattern OR 
        t.category ILIKE v_search_pattern
    )
      AND r.reservation_status = 'Confirmed'
    ORDER BY r.reserved_at DESC;
END;
$$;

