-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to create profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (new.id, new.raw_user_meta_data->>'username', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Zones Table
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('fixed', 'hourly', 'subscription', 'hybrid')),
  price_per_hour NUMERIC DEFAULT 0,
  subscription_price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Parking Slots
CREATE TABLE parking_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  slot_number INT NOT NULL,
  price_per_hour_override NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(zone_id, slot_number)
);

-- 4. Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES parking_slots(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  extension_count INT DEFAULT 0,
  last_extended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  payment_method TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance (Overlap logic performance)
CREATE INDEX idx_bookings_slot_time ON bookings (slot_id, start_time, end_time);
CREATE INDEX idx_bookings_user_id ON bookings (user_id);
CREATE INDEX idx_parking_slots_zone ON parking_slots (zone_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Anyone can select, users can update their own
CREATE POLICY "Public profile selection" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Zones: Anyone can read, only admin can insert/update/delete
CREATE POLICY "Public zones access" ON zones FOR SELECT USING (true);
CREATE POLICY "Admin manage zones" ON zones FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Slots: Anyone can read, only admin can insert/update/delete
CREATE POLICY "Public slots access" ON parking_slots FOR SELECT USING (true);
CREATE POLICY "Admin manage slots" ON parking_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Bookings: Users can select/insert their own. Admin can select/manage all.
CREATE POLICY "Users select own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin manage bookings" ON bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Payments: Uses same pattern as bookings
CREATE POLICY "Users select own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin access payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Subscriptions: Uses same pattern
CREATE POLICY "Users select own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage subscriptions" ON subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Notifications: Only users can see/manage their own
CREATE POLICY "Users access own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Seeding Default Zones
INSERT INTO zones (name, zone_type, price_per_hour, subscription_price) VALUES 
('Zone 1 (Fixed)', 'fixed', 5.00, 0),
('Zone 2 (Hourly)', 'hourly', 2.00, 0),
('Zone 3 (Premium / Sub Only)', 'subscription', 0, 50.00),
('Zone 4 (Hybrid)', 'hybrid', 3.00, 30.00),
('Zone 5 (Hybrid)', 'hybrid', 3.00, 30.00);

-- Trigger to Auto-add 10 slots to newly created zones
CREATE OR REPLACE FUNCTION seed_zone_slots() RETURNS TRIGGER AS $$
BEGIN
  FOR i IN 1..10 LOOP
    INSERT INTO parking_slots (zone_id, slot_number) VALUES (NEW.id, i);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_zone_created
  AFTER INSERT ON zones
  FOR EACH ROW EXECUTE PROCEDURE seed_zone_slots();

-- Also explicitly trigger for the immediately seeded zones above
DO $$ 
DECLARE 
  z RECORD;
BEGIN
  FOR z IN SELECT id FROM zones LOOP
    IF NOT EXISTS (SELECT 1 FROM parking_slots WHERE zone_id = z.id) THEN
      FOR i IN 1..10 LOOP
        INSERT INTO parking_slots (zone_id, slot_number) VALUES (z.id, i);
      END LOOP;
    END IF;
  END LOOP;
END $$;
