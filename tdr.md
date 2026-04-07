# 🚗 Smart Parking System – TDR (Technical Design Report)

---

## 🎯 1. Objective

Design and implement a scalable Smart Parking System supporting:

* Multi-zone booking models
* Time-based slot allocation
* Payment & subscription system
* Real-time updates
* Booking extension with penalty pricing

---

## 🏗️ 2. System Design Overview

### Architecture Pattern:

* Client → Supabase (BaaS) → Database
* Event-driven + API-based design

### Layers:

1. Presentation Layer (Frontend - Next.js)
2. Service Layer (Business Logic)
3. Data Layer (Supabase PostgreSQL)

---

## 🧩 3. Component-Level Design

### 3.1 Frontend Components

#### Core Components:

* `ZoneCard`
* `SlotGrid`
* `BookingModal`
* `ExtensionModal`
* `Navbar`
* `NotificationPanel`

---

### 3.2 Page Structure

* `/` → Zones Dashboard
* `/zone/[id]` → Slot Grid
* `/booking` → Booking Flow
* `/dashboard` → User Panel
* `/admin` → Admin Panel

---

## 🔄 4. Core Workflows

---

### 4.1 Booking Workflow

1. User selects:

   * Zone
   * Slot
   * Time

2. System checks:

   * Slot availability (overlap logic)

3. System checks:

   * Subscription status

4. If required:

   * Initiate payment

5. On success:

   * Create booking record
   * Send notification
   * Trigger realtime update

---

### 4.2 Availability Algorithm

#### Overlap Formula:

(new_start < existing_end AND new_end > existing_start)

#### Implementation:

* Query bookings for slot
* Filter overlapping records
* Return availability status

---

### 4.3 Slot Status Engine

For each slot:

* If overlap exists → `BOOKED`
* If future booking exists → `PARTIAL`
* Else → `AVAILABLE`

---

### 4.4 Extension Workflow

1. Check time difference:

   * Allow only if ≤ 30 minutes remaining

2. Determine pricing:

   * extension_count == 0 → normal price
   * else → penalty price

3. Process payment (if required)

4. Update booking:

   * end_time += 30 minutes
   * extension_count++

5. Lock slot for extended duration

---

### 4.5 Payment Workflow

1. Create Razorpay order
2. User completes payment
3. Verify payment (webhook)
4. Store payment record
5. Proceed with booking creation

---

## 🧠 5. Business Logic Layer

---

### 5.1 Booking Service

Functions:

* `checkAvailability(slotId, start, end)`
* `createBooking(data)`
* `extendBooking(bookingId)`

---

### 5.2 Subscription Service

Functions:

* `checkSubscription(userId)`
* `createSubscription(plan)`

---

### 5.3 Payment Service

Functions:

* `initiatePayment(amount)`
* `verifyPayment(data)`

---

### 5.4 Notification Service

Functions:

* `sendNotification(userId, message)`

---

## 🔐 6. Security Design

* Supabase Auth for authentication
* Role-based authorization (user/admin)
* Row Level Security (RLS)

---

### Example Access Rules:

* Users can access only their bookings
* Admin can modify zones and slots

---

## 🔄 7. Realtime Design

* Subscribe to:

  * `bookings`
  * `parking_slots`

* Trigger UI updates:

  * Slot color change
  * Booking confirmation

---

## 🧮 8. Data Flow Design

### Booking Flow:

Frontend → Availability Check → Payment → Booking Insert → Realtime Update

### Extension Flow:

Frontend → Time Check → Payment → Update Booking → Realtime Sync

---

## 📊 9. UI Logic Design

### Slot Grid:

* 10 slots per zone
* Color mapping:

  * Green → Available
  * Red → Booked
  * Yellow → Partial

---

### Time Filter:

* “Now”
* “Custom Time”

---

### Extension UI:

* Show only in last 30 minutes
* Display price dynamically

---

## ⚙️ 10. Performance Optimization

* Index:

  * slot_id
  * start_time
  * end_time

* Use:

  * Debouncing for API calls
  * Lazy loading for components

---

## ⚠️ 11. Edge Case Handling

* Prevent double booking
* Handle payment failure
* Handle expired subscriptions
* Prevent infinite extensions
* Handle timezone differences

---

## 🔧 12. Deployment Design

* Frontend:

  * Vercel CI/CD

* Backend:

  * Supabase production instance

* Secrets:

  * Stored in environment variables

---

## 🚀 13. Scalability Considerations

* Horizontal scaling via Supabase
* Modular service architecture
* API abstraction layer

---

## 🎯 14. Final Outcome

System should:

* Handle real-time parking allocation
* Prevent conflicts
* Support multiple booking models
* Ensure secure payments
* Provide smooth user experience

---
