-- Enable RLS on the correct safety features table
ALTER TABLE reference_table.zat_features_safetyfeature ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Allow public read access to safety features" ON reference_table.zat_features_safetyfeature;

-- Create public SELECT policy
CREATE POLICY "Allow public read access to safety features"
  ON reference_table.zat_features_safetyfeature FOR SELECT
  USING (true);

-- Grant SELECT permissions
GRANT USAGE ON SCHEMA reference_table TO anon;
GRANT USAGE ON SCHEMA reference_table TO authenticated;
GRANT SELECT ON reference_table.zat_features_safetyfeature TO anon;
GRANT SELECT ON reference_table.zat_features_safetyfeature TO authenticated;
