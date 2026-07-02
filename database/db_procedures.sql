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
    -- for partial matches across multiple tables. Returns all searchable 
    -- columns so the frontend can display exactly why the row matched.

CREATE OR REPLACE FUNCTION search_tickets(p_keyword VARCHAR)
RETURNS TABLE (
    first_name VARCHAR,
    last_name VARCHAR,
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
        u.first_name,
        u.last_name,
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

-- PROCEDURE 5: Get Users in the Same City
    -- Takes a user's contact info, stores their city and ID in variables, 
    -- and returns a table of all other users living in that same city.

CREATE OR REPLACE FUNCTION get_same_city_users(p_contact_info VARCHAR)
RETURNS TABLE (
    username VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    city VARCHAR
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_target_city VARCHAR;
    v_target_id INT;
BEGIN
    SELECT u.city, u.user_id 
    INTO v_target_city, v_target_id
    FROM users u
    WHERE (u.email = p_contact_info OR u.phone_number = p_contact_info)
    LIMIT 1;

    RETURN QUERY
    SELECT u.username, u.first_name, u.last_name, u.city
    FROM users u
    WHERE u.city = v_target_city 
      AND u.user_id != v_target_id;
END;
$$;

-- PROCEDURE 6: Top N Ticket Buyers After a Specific Date
    -- Takes a target date and an integer N, returning the usernames 
    -- and ticket counts of the top N users who bought the most tickets 
    -- after that specified date.

CREATE OR REPLACE FUNCTION get_top_buyers_after_date(p_target_date DATE, p_limit INT)
RETURNS TABLE (
    username VARCHAR,
    total_tickets BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.username,
        SUM(r.quantity) AS total_tickets
    FROM users u
    JOIN reservations r ON u.user_id = r.user_id
    WHERE r.reserved_at >= p_target_date
      AND r.reservation_status = 'Confirmed'
    GROUP BY u.user_id, u.username
    ORDER BY total_tickets DESC
    LIMIT p_limit;
END;
$$;

-- PROCEDURE 7: Get Canceled Tickets by Sport Type
    -- Takes a sport type (e.g. 'Football') as input and returns a list
    -- of all canceled reservations associated with that specific sport.

CREATE OR REPLACE FUNCTION get_sport_canceled_tickets(p_sport_type VARCHAR)
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
    WHERE t.sport_type = p_sport_type
      AND r.reservation_status = 'Canceled'
    ORDER BY r.reserved_at DESC;
END;
$$;

-- PROCEDURE 8: Users with Most Reports by Report Type
    -- Takes a report type (e.g. 'General') and returns the users
    -- who have submitted the highest number of reports under that specific type.

CREATE OR REPLACE FUNCTION get_most_reports_by_title(p_title VARCHAR)
RETURNS TABLE (
    username VARCHAR,
    total_reports BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.username,
        COUNT(rp.report_id) AS total_reports
    FROM users u
    JOIN reports rp ON u.user_id = rp.user_id
    WHERE rp.report_type = p_title
    GROUP BY u.user_id, u.username
    ORDER BY total_reports DESC
    FETCH FIRST 1 ROWS WITH TIES;
END;
$$;
