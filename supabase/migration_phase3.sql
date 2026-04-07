-- 1. Update Profiles Table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Update Parking Slots Table
ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS price_per_hour_override NUMERIC;

-- 3. Create Storage Bucket for Avatars
-- (Run this in the SQL Editor)
-- First, ensure the 'avatars' bucket exists in the UI or via SQL if possible.
-- Most Supabase setups require manual bucket creation in UI, but policies can be scripted.

-- policies for 'avatars' bucket
-- Note: 'storage' schema might require explicit references
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "User Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Simplified Policies for the demo/dev environment:
-- (Allows anyone to see any avatar, but only the owner to upload/update/delete)

-- Enable Public Access to Objects
CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Allow Authenticated Users to Upload (using their UID as folder name)
CREATE POLICY "Avatar Upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow Users to Update their own
CREATE POLICY "Avatar Update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow Users to Delete their own
CREATE POLICY "Avatar Delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
