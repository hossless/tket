-- ==============================================================================
-- ANALYTICAL QUERIES
-- ==============================================================================


-- QUERY 1: Find Users Without Reservations
    -- Description: Retrieves the first and last names of all 'Spectator' 
    -- accounts that do not have any records in the reservations table.

SELECT first_name, last_name 
FROM users 
WHERE user_id NOT IN (SELECT user_id FROM reservations) 
AND role = 'Spectator';

-- QUERY 2: Find Users With At Least One Reservation
    -- Description: Retrieves the first and last names of all 'Spectator' 
    -- accounts that exist in the reservations table. Using IN prevents 
    -- duplicate names for users with multiple reservations.

SELECT first_name, last_name 
FROM users 
WHERE user_id IN (SELECT user_id FROM reservations) 
AND role = 'Spectator';