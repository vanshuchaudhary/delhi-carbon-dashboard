-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    total_co2_saved FLOAT DEFAULT 0,
    weekly_co2_saved FLOAT DEFAULT 0,
    eco_credits INT DEFAULT 0,
    current_rank INT,
    tier TEXT DEFAULT 'Seedling',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Leaderboard History Table
CREATE TABLE IF NOT EXISTS public.leaderboard_history (
    id SERIAL PRIMARY KEY,
    week_end_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rank INT NOT NULL,
    co2_saved FLOAT NOT NULL,
    credits_awarded INT
);

-- 3. Weekly Reset Function
CREATE OR REPLACE FUNCTION public.reset_weekly_leaderboard()
RETURNS void AS $$
DECLARE
    top_user RECORD;
    rank_counter INT := 1;
    credits INT;
BEGIN
    -- Archive Top 3 into History
    FOR top_user IN (
        SELECT id, weekly_co2_saved 
        FROM public.profiles 
        ORDER BY weekly_co2_saved DESC 
        LIMIT 3
    ) LOOP
        -- Award Credits
        IF rank_counter = 1 THEN credits := 500;
        ELSIF rank_counter = 2 THEN credits := 300;
        ELSE credits := 150;
        END IF;

        INSERT INTO public.leaderboard_history (profile_id, rank, co2_saved, credits_awarded)
        VALUES (top_user.id, rank_counter, top_user.weekly_co2_saved, credits);

        UPDATE public.profiles 
        SET eco_credits = eco_credits + credits 
        WHERE id = top_user.id;

        rank_counter := rank_counter + 1;
    END LOOP;

    -- Update Total CO2 Saved and Reset Weekly
    UPDATE public.profiles 
    SET total_co2_saved = total_co2_saved + weekly_co2_saved,
        weekly_co2_saved = 0;

END;
$$ LANGUAGE plpgsql;

-- 4. Sample Data Insertion (Mock)
INSERT INTO public.profiles (username, avatar_url, total_co2_saved, weekly_co2_saved, eco_credits, current_rank, tier)
VALUES 
('Aravind K.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aravind', 1250.5, 85.2, 1200, 1, 'Forest Guardian'),
('Priya S.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', 980.2, 72.1, 850, 2, 'Tree'),
('Rahul M.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul', 840.0, 68.5, 420, 3, 'Tree'),
('Ananya D.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya', 620.1, 45.4, 310, 4, 'Sapling'),
('Ishaan V.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ishaan', 410.5, 22.1, 150, 5, 'Seedling');
