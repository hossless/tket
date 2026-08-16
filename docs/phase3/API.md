# 🔌 API Documentation

This document contains the complete API reference for the **tket** backend, including endpoint descriptions, authentication requirements, request parameters, and example responses.

---

## 📑 Table of Contents

- [1. Authentication](#1-authentication)
  - [1.1 Request OTP](#11-request-otp)
  - [1.2 Verify OTP & Signup](#12-verify-otp--signup)
  - [1.3 Login](#13-login)

- [2. User Profile & History](#2-user-profile--history)
  - [2.1 Update Profile](#21-update-profile)
  - [2.2 Get User Bookings](#22-get-user-bookings)

- [3. Ticketing & Discovery](#3-ticketing--discovery)
  - [3.1 Get Cities & Venues](#31-get-cities--venues-cached)
  - [3.2 Search Tickets](#32-search-tickets)

- [4. Checkout & Payments](#4-checkout--payments)
  - [4.1 Reserve Ticket (Concurrency Locked)](#41-reserve-ticket-concurrency-locked)
  - [4.2 Process Payment](#42-process-payment)
  - [4.3 Check Cancellation Penalty](#43-check-cancellation-penalty)
  - [4.4 Cancel Ticket & Refund](#44-cancel-ticket--refund)

- [5. Admin & Support](#5-admin--support)
  - [5.1 Submit Report](#51-submit-report)
  - [5.2 Admin Ticket Management](#52-admin-ticket-management)
  - [5.3 Get Admin Dashboard Data](#53-get-admin-dashboard-data)
  - [5.4 Create Ticket](#54-create-ticket)
  - [5.5 Get User Reports](#55-get-user-reports)

---

## 1. Authentication

### 1.1 Request OTP

#### Endpoint

```http
POST /api/auth/signup/request/
```

#### Description

Initiates registration by sending a 6-digit OTP to the user's provided contact method. The OTP is stored securely in Redis for **2 minutes**.

#### Request Body

```json
{
    "contact_info": "fan@example.com",
    "username": "sportsfan99",
    "password": "SecurePassword123!"
}
```

> **Note**
>
> `contact_info` accepts either a valid email address or phone number.

#### Success Response (200)

```json
{
    "message": "OTP sent successfully. Please verify within 2 minutes."
}
```

---

### 1.2 Verify OTP & Signup

#### Endpoint

```http
POST /api/auth/signup/verify/
```

#### Description

Verifies the Redis-stored OTP, hashes the password, and creates the database user.

#### Request Body

```json
{
    "contact_info": "fan@example.com",
    "otp": "123456"
}
```

#### Success Response (201)

```json
{
    "message": "User registered successfully.",
    "user_id": 1,
    "token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

---
### 1.3 Login

#### Endpoint

```http
POST /api/auth/login/
```

#### Description

Authenticates a user using their username, email, or phone number along with their password.

Upon successful authentication, returns a JWT access token for subsequent authorized requests.

#### Request Body

```json
{
    "login_identifier": "sportsfan99",
    "password": "SecurePassword123!"
}
```

#### Success Response (200)

```json
{
    "message": "Logged in successfully",
    "user": {
        "user_id": 1,
        "token": "eyJhbGciOiJIUzI1NiIsInR..."
    }
}
```
---

## 2. User Profile & History

### 2.1 Update Profile

#### Endpoint

```http
PATCH /api/user/profile/
```

#### Description

Updates user details and synchronizes the cached profile in Redis.

All fields are optional.

🔒 **Authentication Required:** JWT Bearer Token

#### Request Body

```json
{
    "first_name": "Johnny",
    "last_name": "Doe",
    "city": "Tehran"
}
```

#### Success Response (200)

```json
{
    "message": "Profile updated successfully.",
    "user": {
        "user_id": 1,
        "username": "sportsfan99",
        "email": "fan@example.com",
        "phone_number": null,
        "first_name": "Johnny",
        "last_name": "Doe",
        "city": "Tehran"
    }
}
```

---

### 2.2 Get User Bookings

#### Endpoint

```http
GET /api/user/reservations/
```

#### Description

Retrieves booking history.

Supports dynamic filtering.

🔒 **Authentication Required:** JWT Bearer Token

#### Query Parameters

| Parameter | Description |
| ---------- | ----------- |
| `status` | Reservation status (e.g. `Confirmed`) |
| `time` | `upcoming` or `past` |

#### Success Response (200)

```json
{
    "reservations": [
        {
            "reservation_id": 42,
            "quantity": 2,
            "status": "Confirmed",
            "seat_info": "Block A, Row 12",
            "ticket_id": 1,
            "sport_type": "Football",
            "home_team": "Real Madrid",
            "away_team": "Barcelona",
            "venue_city": "Madrid",
            "price": 150.00,
            "ticket_date_time": "2026-08-15 20:00:00",
            "venue_name": "Santiago Bernabeu"
        }
    ]
}
```
---

## 3. Ticketing & Discovery

### 3.1 Get Cities & Venues

#### Endpoint

```http
GET /api/tickets/cities-venues/
```

#### Description

Fetches all distinct cities and venues for dropdown menus.

Caches heavily in Redis.

Includes a payload source identifier.

#### Success Response (200)

```json
{
    "venues": [
        {
            "venue_name": "Santiago Bernabeu",
            "venue_city": "Madrid"
        },
        {
            "venue_name": "Azadi Stadium",
            "venue_city": "Tehran"
        }
    ]
}
```

---

### 3.2 Search Tickets

#### Endpoint

```http
GET /api/tickets/search/
```

#### Description

Dynamically searches available tickets based on multiple query filters.

Supports:

- Multi-parameter filtering
- Fuzzy text search
- Availability toggles
- Pagination
- Sorting
- Redis caching

#### Query Parameters

| Parameter | Description |
| ---------- | ----------- |
| `sport_type` | Filter by sport type |
| `team` | Filter by home or away team |
| `venue_city` | Filter by venue city |
| `venue_name` | Filter by venue name |
| `category` | Filter by ticket category |
| `min_price` | Minimum ticket price |
| `max_price` | Maximum ticket price |
| `start_date` | Filter tickets after this date |
| `end_date` | Filter tickets before this date |
| `sort_by` | Sorting option: `price_asc`, `price_desc`, `date_asc`, `date_desc` |
| `q` | Fuzzy search across home team, away team, and venue name |
| `exclude_sold_out` | Exclude tickets with no remaining capacity (`true` / `1`) |
| `page` | Page number |
| `limit` | Number of results per page (maximum: 100) |
| `show_past` | Include past events (`true` / `1`) |

#### Success Response (200)

```json
{
    "data": {
        "pagination": {
            "total_items": 1,
            "total_pages": 1,
            "current_page": 1,
            "limit": 20
        },
        "tickets": [
            {
                "ticket_id": 1,
                "sport_type": "Football",
                "home_team": "Real Madrid",
                "away_team": "Barcelona",
                "remaining_capacity": 49998,
                "total_capacity": 50000,
                "venue_city": "Madrid",
                "price": 150.00,
                "category": "Normal",
                "ticket_date_time": "2026-08-15 20:00:00",
                "venue_name": "Santiago Bernabeu"
            }
        ]
    }
}
```
---

## 4. Checkout & Payments
### 4.1 Reserve Ticket (Concurrency Locked)

#### Endpoint

```http
POST /api/tickets/reserve/
```

#### Description

Handles ticket reservation by checking capacity, deducting quantity within an atomic transaction, creating a **Pending** reservation record, and setting a 10-minute Redis lock.

🔒 **Authentication Required:** JWT Bearer Token

#### Request Body

```json
{
    "ticket_id": 1,
    "quantity": 2,
    "seat_info": "Block A, Row 12"
}
```

> **Note**
>
> `quantity` must be a positive integer and cannot exceed 10 tickets per transaction.
>
> If `seat_info` is not provided, a seat assignment is generated automatically.

#### Success Response (201)

```json
{
    "message": "Ticket reserved successfully.",
    "reservation_id": 42,
    "quantity": 2,
    "seat_info": "Block A, Row 12",
    "status": "Pending"
}
```

---
### 4.2 Process Payment

#### Endpoint

```http
POST /api/tickets/pay/
```

#### Description

Processes ticket payment by verifying active Redis TTL locks, recording transaction details in PostgreSQL within an atomic transaction, updating the reservation status to **Confirmed**, and releasing the temporary Redis lock upon completion.

🔒 **Authentication Required:** JWT Bearer Token

#### Request Body

```json
{
    "reservation_id": 42,
    "method": "Credit Card"
}
```

> **Note**
>
> Allowed payment methods:
>
> - `Credit Card`
> - `PayPal`
> - `Crypto`
> - `Bank Transfer`
> - `Wallet`

#### Success Response (200)

```json
{
    "message": "Payment successful.",
    "tracking_code": "TRK-A1B2C3D4E5",
    "amount": 300.00,
    "status": "Confirmed"
}
```

---

### 4.3 Check Cancellation Penalty

#### Endpoint

```http
GET /api/tickets/reservations/<int:reservation_id>/penalty/
```

#### Description

Calculates the exact financial penalty for late cancellations.

🔒 **Authentication Required:** JWT Bearer Token

#### Success Response (200)

```json
{
    "reservation_id": 42,
    "total_amount": 300.00,
    "penalty_percent": 30,
    "penalty_amount": 90.00,
    "refund_amount": 210.00
}
```

---

### 4.4 Cancel Ticket & Refund

#### Endpoint

```http
PATCH /api/user/reservations/cancel/
```

#### Description

Restores database capacity safely using row locks and processes refunds.

🔒 **Authentication Required:** JWT Bearer Token

#### Request Body

```json
{
    "reservation_id": 42
}
```

#### Success Response (200)

```json
{
    "message": "Reservation canceled successfully.",
    "cancellation_details": {
        "reservation_id": 42,
        "ticket_id": 1,
        "penalty_percent": 30,
        "penalty_amount": 90.00,
        "refund_amount": 210.00
    }
}
```
---

## 5. Admin & Support

### 5.1 Submit Report

#### Endpoint

```http
POST /api/user/reports/
```

#### Description

Submits a technical or refund support ticket.

🔒 **Authentication Required:** JWT Bearer Token

#### Request Body

```json
{
    "report_type": "Refund",
    "description": "I accidentally booked the wrong date.",
    "reservation_id": 42
}
```

#### Success Response (201)

```json
{
    "message": "Report submitted successfully.",
    "report_id": 15
}
```

---

### 5.2 Admin Ticket Management

#### Endpoint

```http
PATCH /admin/manage/
```

#### Description

Allows system administrators and support staff to update reservation statuses (tracking who canceled them) or reply to user support reports.

🔒 **Authentication Required:** JWT Bearer Token (Admin or Support Role)

---

### Reservation Management

#### Request Body

```json
{
    "target_type": "reservation",
    "target_id": 42,
    "status": "Canceled"
}
```

> **Note**
>
> Allowed reservation statuses:
>
> - `Pending`
> - `Confirmed`
> - `Canceled`
> - `Expired`
> - `Failed`

#### Success Response (200)

```json
{
    "message": "Reservation updated successfully.",
    "reservation": {
        "reservation_id": 42,
        "status": "Canceled",
        "ticket_id": 1,
        "canceled_by": 5
    }
}
```

---

### Report Management

#### Request Body

```json
{
    "target_type": "report",
    "target_id": 15,
    "status": "Resolved",
    "reply": "Refund has been processed manually."
}
```

> **Note**
>
> Allowed report statuses:
>
> - `Waiting`
> - `Resolved`

#### Success Response (200)

```json
{
    "message": "Report updated successfully.",
    "report": {
        "report_id": 15,
        "status": "Resolved",
        "reply": "Refund has been processed manually."
    }
}
```

---

### 5.3 Get Admin Dashboard Data

#### Endpoint

```http
GET /api/admin/dashboard/
```

#### Description

Retrieves a comprehensive overview of all system reservations and user support reports. 

This endpoint automatically triggers the `release_expired_reservations` utility to clean up dead locks before fetching data. It sorts reports intelligently, prioritizing those with a `Waiting` status.

🔒 **Authentication Required:** JWT Bearer Token (Admin or Support Role)

#### Success Response (200)

```json
{
    "reservations": [
        {
            "reservation_id": 42,
            "username": "sportsfan99",
            "home_team": "Real Madrid",
            "away_team": "Barcelona",
            "quantity": 2,
            "reservation_status": "Confirmed",
            "reserved_at": "2024-05-10T14:30:00Z",
            "ticket_id": 1
        }
    ],
    "reports": [
        {
            "report_id": 15,
            "username": "angryfan01",
            "reservation_id": 42,
            "report_type": "Refund",
            "description": "I accidentally booked the wrong date.",
            "reply": null,
            "report_status": "Waiting",
            "reported_at": "2024-05-11T09:15:00Z"
        }
    ]
}
```

---

### 5.4 Create Ticket

#### Endpoint

```http
POST /api/admin/tickets/create/
```

#### Description

Creates a new ticket entity. 

This endpoint uses an atomic database transaction to guarantee that both the core ticket data and its associated `match_details` are inserted safely. Upon successful creation, it automatically invalidates the Redis ticket caches and triggers an ElasticSearch indexing sequence to make the new event instantly searchable.

🔒 **Authentication Required:** JWT Bearer Token (Admin or Support Role)

#### Request Body

```json
{
    "sport_type": "Football",
    "home_team": "Manchester City",
    "away_team": "Arsenal",
    "ticket_date_time": "2024-08-15T20:00:00Z",
    "venue_city": "Manchester",
    "venue_name": "Etihad Stadium",
    "price": 120.50,
    "total_capacity": 55000,
    "category": "VIP",
    "tournament_name": "Premier League",
    "organizer": "FA",
    "facilities": "VIP Lounge, Free WiFi"
}
```

> **Note**
> 
> - `price` must be `>= 0` and `total_capacity` must be `> 0`.
> - `remaining_capacity` is automatically derived from `total_capacity` upon creation.
> - `tournament_name`, `organizer`, `venue_name`, and `facilities` are optional but recommended for ElasticSearch discoverability.

#### Success Response (201)

```json
{
    "message": "Event created successfully.",
    "ticket_id": 105
}
```

---

### 5.5 Get User Reports

#### Endpoint

```http
GET /api/user/reports/list/
```

#### Description

Retrieves a chronological history of all support reports and complaints submitted by the authenticated user. 

This endpoint fetches the `report_status` (e.g., Waiting or Resolved) along with any official `reply` provided by the administrative team. It relies on a highly optimized, single-table query filtering strictly by the user's JWT identity.

🔒 **Authentication Required:** JWT Bearer Token

#### Success Response (200)

```json
{
    "reports": [
        {
            "report_id": 15,
            "reservation_id": 42,
            "report_type": "Refund",
            "description": "I accidentally booked the wrong date.",
            "report_status": "Resolved",
            "reply": "We have successfully processed your refund manually. Please allow 3-5 days for funds to settle."
        },
        {
            "report_id": 18,
            "reservation_id": null,
            "report_type": "Bug",
            "description": "The search bar glitched on my mobile device.",
            "report_status": "Waiting",
            "reply": null
        }
    ]
}
```