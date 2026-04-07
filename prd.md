# 🚗 Smart Parking System – PRD (Prompt Format)

## 🎯 Project Overview

Build a production-ready Smart Parking System using Supabase (PostgreSQL, Auth, Realtime) as backend and React (Next.js) as frontend. The system should support multi-zone parking with different booking models, real-time availability, payment integration, subscription system, and advanced booking extension logic.

---

## 🧩 Core Requirements

### 1. Parking Zones

* Create 5 predefined zones:

  * Zone 1 → Fixed Time Booking
  * Zone 2 → Hourly Auto Billing
  * Zone 3 → Subscription Only
  * Zone 4 → Hybrid (Subscription + Pay-per-use)
  * Zone 5 → Hybrid (Subscription + Pay-per-use)

* Each zone must contain 10 parking slots initially

* Admin can:

  * Add/remove slots
  * Change pricing
  * Change zone type

---

### 2. Booking System

#### General Rules:

* Users can book slots based on time
* Prevent overlapping bookings using:
  (new_start < existing_end AND new_end > existing_start)

---

#### Zone-wise Logic:

* Zone 1 (Fixed):

  * User selects start and end time
  * Price calculated based on duration

* Zone 2 (Hourly Auto):

  * Booking starts immediately
  * Ends when user exits
  * Auto billing based on time

* Zone 3 (Subscription):

  * Only subscribed users can book
  * No per-booking payment

* Zone 4 & 5 (Hybrid):

  * If subscribed → free booking
  * Else → normal paid booking

---

### 3. Slot Availability System

* Show slots in grid format (10 slots per zone)

* Status:

  * Available (green)
  * Booked (red)
  * Partially booked (yellow)

* Support:

  * Real-time updates
  * Future booking
  * Time-based filtering

---

### 4. Payment System

* Integrate Razorpay
* Logic:

  * Subscription users → no payment
  * Normal users → pay before booking
  * If payment fails → booking not created

---

### 5. Subscription System

* Users can buy subscription plans

* Fields:

  * Plan type
  * Start date
  * End date
  * Status

* Used in:

  * Zone 3
  * Zone 4 & 5 (optional usage)

---

### 6. Booking Extension System (Advanced Feature)

#### Rules:

* User can extend booking only in last 30 minutes before expiry
* Extension duration: +30 minutes

#### Pricing:

* First extension → normal rate
* Second and further → penalty rate

#### Restrictions:

* During extension window:

  * Other users cannot book that slot immediately after end_time
  * They can book only after extension buffer

---

### 7. User Roles

#### User:

* Book slots
* View bookings
* Make payments
* Subscribe
* Manage profile
* Receive notifications

#### Admin:

* Manage zones
* Manage slots
* Control pricing
* View all bookings

---

### 8. Dashboard Features

#### User Dashboard:

* View zones
* Book slot
* My bookings
* Notifications
* Profile (username, password, id)
* Settings

#### Admin Dashboard:

* Zone management
* Slot management
* Booking overview
* Pricing control

---

### 9. Notifications

* Booking confirmation
* Payment success
* Extension success
* Subscription expiry reminder

---

### 10. Database (Supabase PostgreSQL)

Tables required:

* profiles (user info + role)
* zones (zone_type, pricing)
* parking_slots
* bookings (start_time, end_time, extension_count)
* payments
* subscriptions
* notifications

---

### 11. Security

* Use Supabase Auth
* Implement Row Level Security (RLS)
* Admin-only access for sensitive operations

---

### 12. Realtime Features

* Update slot availability in real-time using Supabase Realtime

---

### 13. UI/UX Requirements

* Grid-based slot layout
* Color-coded availability
* Time filter (Now / Custom)
* Extend booking button (only in last 30 min)
* Show “Available after X time”

---

### 14. Deployment

* Frontend → Vercel
* Backend → Supabase

---

## 🚀 Goal

Build a scalable, real-world smart parking system with:

* Multi-zone logic
* Time-based booking
* Subscription + payment system
* Smart extension handling
* Admin + user dashboards

---
