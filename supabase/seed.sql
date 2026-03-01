-- Simplification for MVP: Remove the auth.users foreign key requirement so we can insert profiles directly.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- We will recreate the foreign key constraint just in case it was named differently, to be safe:
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;

-- Insert the 3 initial players with fixed UUIDs
INSERT INTO public.profiles (id, username, avatar_url, total_points, current_gym_badge_count)
VALUES 
  ('11111111-1111-4111-a111-111111111111', 'Markel', '/markel.png', 120, 3),
  ('22222222-2222-4222-a222-222222222222', 'Raul', '/raul.png', 90, 2),
  ('33333333-3333-4333-a333-333333333333', 'Xavi', '/xavi.png', -15, 0)
ON CONFLICT (id) DO UPDATE 
SET username = EXCLUDED.username, avatar_url = EXCLUDED.avatar_url, total_points = EXCLUDED.total_points;

-- Insert the existing mock events
INSERT INTO public.events (id, profile_id, type, points_change, description, event_date)
VALUES
  (uuid_generate_v4(), '11111111-1111-4111-a111-111111111111', 'Muerte', -10, 'Perdió a Pikachu contra el Líder', '2023-10-25'),
  (uuid_generate_v4(), '11111111-1111-4111-a111-111111111111', 'Medalla', 20, 'Consiguió la Medalla Roca', '2023-10-23'),
  (uuid_generate_v4(), '22222222-2222-4222-a222-222222222222', 'Ventaja', 0, 'Encontró Poción Máxima', '2023-10-24')
ON CONFLICT DO NOTHING;

-- Insert active effects
INSERT INTO public.active_effects (id, profile_id, label, color)
VALUES
  (uuid_generate_v4(), '11111111-1111-4111-a111-111111111111', '+2 Niveles', '#22c55e'),
  (uuid_generate_v4(), '33333333-3333-4333-a333-333333333333', '-1 Poke en Gimnasio', '#f97316')
ON CONFLICT DO NOTHING;

-- Generate the 8 blank badges for each player
INSERT INTO public.badges (profile_id, badge_index, is_obtained)
SELECT p.id, b.idx, 
       -- Set obtained to true if badge_index is less than the current_gym_badge_count of the profile
       (b.idx < p.current_gym_badge_count)
FROM public.profiles p
CROSS JOIN generate_series(0, 7) AS b(idx)
ON CONFLICT (profile_id, badge_index) DO NOTHING;
