-- 1. Create Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  color TEXT DEFAULT 'blue',
  recommended BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Public Read Policy (drop existing first to avoid duplicate errors if re-run)
DROP POLICY IF EXISTS "Public subscription plans selection" ON subscription_plans;
CREATE POLICY "Public subscription plans selection" 
  ON subscription_plans FOR SELECT 
  USING (true);

-- Admin Manage Policy
DROP POLICY IF EXISTS "Admin manage subscription plans" ON subscription_plans;
CREATE POLICY "Admin manage subscription plans" 
  ON subscription_plans FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed Default Plans if empty
INSERT INTO subscription_plans (id, name, price, features, color, recommended, is_active)
VALUES 
  (
    'basic', 
    'Basic Access', 
    0, 
    ARRAY['Pay-per-use in Zone 1, 2, 4, 5', 'Standard support', 'Real-time availability'], 
    'slate', 
    false, 
    true
  ),
  (
    'pro', 
    'SmartPark Pro', 
    29.99, 
    ARRAY['Free booking in Zone 4 & 5', 'Access to Zone 3 (Sub Only)', 'Priority support', 'Advanced statistics'], 
    'blue', 
    true, 
    true
  ),
  (
    'enterprise', 
    'Elite / VIP', 
    99.99, 
    ARRAY['All Pro features', 'Guaranteed slot reservation', 'Concierge service', 'Custom billing'], 
    'amber', 
    false, 
    true
  )
ON CONFLICT (id) DO NOTHING;
