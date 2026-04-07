# 🚗 Smart Parking System – TRD (Technical Requirement Document)

## 🎯 1. System Architecture

### Architecture Type:

* Full Stack Web Application (Client-Server Architecture)

### Tech Stack:

* Frontend: Next.js (React), Tailwind CSS
* Backend: Supabase (PostgreSQL, Auth, Realtime, Storage)
* Payment Gateway: Razorpay
* Deployment:

  * Frontend → Vercel
  * Backend → Supabase Cloud

---

## 🧩 2. High-Level Architecture Flow

1. User interacts with frontend (Next.js)
2. Frontend communicates with Supabase APIs
3. Supabase handles:

   * Authentication
   * Database queries
   * Realtime updates
4. Razorpay handles payments
5. Webhooks update payment status in database

---

## 🗄️ 3. Database Schema (PostgreSQL)

### 3.1 Profiles Table

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text,
  role text default 'user',
  created_at timestamp default now()
);
```

---

### 3.2 Zones Table

```sql
create table zones (
  id uuid primary key default gen_random_uuid(),
  name text,
  zone_type text, -- fixed, hourly, subscription, hybrid
  price_per_hour numeric,
  subscription_price numeric,
  created_at timestamp default now()
);
```

---

### 3.3 Parking Slots

```sql
create table parking_slots (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid references zones(id) on delete cascade,
  slot_number int,
  created_at timestamp default now()
);
```

---

### 3.4 Bookings

```sql
create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  slot_id uuid references parking_slots(id),
  start_time timestamp,
  end_time timestamp,
  status text default 'confirmed',
  extension_count int default 0,
  last_extended_at timestamp,
  created_at timestamp default now()
);
```

---

### 3.5 Payments

```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  booking_id uuid,
  amount numeric,
  status text,
  payment_method text,
  created_at timestamp default now()
);
```

---

### 3.6 Subscriptions

```sql
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  plan text,
  start_date timestamp,
  end_date timestamp,
  status text
);
```

---

### 3.7 Notifications

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  message text,
  is_read boolean default false,
  created_at timestamp default now()
);
```

---

## ⚙️ 4. Core Functional Modules

### 4.1 Authentication Module

* Supabase Auth (Email/Password)
* Role-based access (user/admin)
* Session management

---

### 4.2 Zone Management Module (Admin)

* Create/update/delete slots
* Update zone type
* Update pricing

---

### 4.3 Booking Module

#### Overlap Prevention Logic:

* Condition:
  (new_start < existing_end AND new_end > existing_start)

#### Flow:

1. Check slot availability
2. Validate user subscription
3. Process payment (if required)
4. Create booking
5. Update notifications

---

### 4.4 Payment Module

* Razorpay integration
* Payment verification via webhook
* Store payment records

---

### 4.5 Subscription Module

* Create subscription plans
* Validate active subscription
* Restrict booking access (Zone 3)

---

### 4.6 Slot Availability Engine

* Fetch slots + bookings
* Apply time-based filtering
* Mark:

  * Available
  * Booked
  * Partial

---

### 4.7 Booking Extension Module

#### Rules:

* Allowed only in last 30 minutes
* Extension duration: +30 minutes

#### Pricing:

* First extension → normal rate
* Further → penalty rate

#### Constraints:

* Block other bookings during extension window

---

### 4.8 Notification Module

* Trigger events:

  * Booking confirmation
  * Payment success
  * Extension success
  * Subscription expiry

---

## 🔐 5. Security (RLS Policies)

### Example: Booking Access

```sql
create policy "Users can access their bookings"
on bookings
for select
using (auth.uid() = user_id);
```

### Admin Control Policy

```sql
create policy "Admin can manage zones"
on zones
for update
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and role = 'admin'
  )
);
```

---

## 🔄 6. Realtime System

* Use Supabase Realtime
* Subscribe to:

  * parking_slots
  * bookings
* Update UI instantly when slot status changes

---

## 🎨 7. Frontend Architecture

### Pages:

* Home (Zones)
* Slot Selection
* Booking Page
* Dashboard
* Admin Panel

### Components:

* SlotGrid
* ZoneCard
* BookingModal
* Navbar
* NotificationPanel

---

## 🚀 8. APIs / Service Layer

### Booking APIs:

* checkAvailability()
* createBooking()
* extendBooking()

### User APIs:

* getProfile()
* updateProfile()

### Admin APIs:

* updateZone()
* manageSlots()

---

## 📊 9. Performance Considerations

* Index on:

  * slot_id
  * start_time
  * end_time
* Use pagination for bookings
* Cache zone data

---

## ⚠️ 10. Edge Cases

* Double booking prevention
* Payment failure rollback
* Subscription expiry mid-booking
* Multiple extension abuse

---

## 🔧 11. Deployment Strategy

* CI/CD with Vercel
* Environment variables for keys
* Supabase production instance

---

## 🎯 12. System Goals

* High scalability
* Real-time updates
* Secure transactions
* Clean UI/UX
* Modular architecture

---
