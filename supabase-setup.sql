-- Supabase visits table setup
-- Run this in Supabase Dashboard → SQL Editor

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id BIGSERIAL PRIMARY KEY,
  country TEXT NOT NULL,
  region TEXT,
  city TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_visits_timestamp ON visits(timestamp);
CREATE INDEX IF NOT EXISTS idx_visits_country ON visits(country);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts (for Netlify Functions)
-- This allows the anon key to insert data
CREATE POLICY "Allow anonymous inserts" ON visits
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow reads (for export function)
CREATE POLICY "Allow anonymous reads" ON visits
  FOR SELECT
  TO anon
  USING (true);

