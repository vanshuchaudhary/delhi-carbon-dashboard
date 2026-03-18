-- Note: These tables are defined for the Delhi Digital Twin Carbon Dashboard
-- Run this in your Supabase SQL Editor.

-- Enable PostGIS if you want to perform spatial queries later
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    geometry JSONB NOT NULL -- GeoJSON representation for Mapbox GL JS
);

CREATE TABLE IF NOT EXISTS public.real_time_emissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ward_id UUID REFERENCES public.wards(id) ON DELETE CASCADE,
    sector VARCHAR(100) NOT NULL, -- e.g., 'Transport', 'Industry', 'Energy', 'Waste'
    transport_mode VARCHAR(100),  -- e.g., 'Metro Line', 'Highway Traffic' (Nullable for non-transport sectors)
    co2_level NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id UUID REFERENCES wards(id) ON DELETE CASCADE,
    sector TEXT NOT NULL,
    predicted_co2 NUMERIC NOT NULL,
    target_date TIMESTAMPTZ NOT NULL,
    policy_scenario TEXT DEFAULT 'baseline' -- e.g., 'baseline', 'EV Transition', 'Industrial Filter'
);

-- Insert dummy wards for testing
INSERT INTO wards (name, geometry) VALUES
('New Delhi Municipal Council', '{"type": "Polygon", "coordinates": [[[77.2, 28.6], [77.22, 28.6], [77.22, 28.62], [77.2, 28.62], [77.2, 28.6]]]}'),
('South Delhi', '{"type": "Polygon", "coordinates": [[[77.18, 28.55], [77.22, 28.55], [77.22, 28.59], [77.18, 28.59], [77.18, 28.55]]]}');

-- Insert dummy emissions
INSERT INTO real_time_emissions (ward_id, sector, co2_level)
SELECT id, 'Transport', 450.5 FROM wards WHERE name = 'New Delhi Municipal Council';

INSERT INTO real_time_emissions (ward_id, sector, co2_level)
SELECT id, 'Power', 300.2 FROM wards WHERE name = 'South Delhi';
