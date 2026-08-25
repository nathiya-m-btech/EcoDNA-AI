
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name text NOT NULL UNIQUE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  region text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations public read" ON public.locations FOR SELECT USING (true);
CREATE POLICY "locations write" ON public.locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.environmental_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  date date NOT NULL,
  air_quality numeric NOT NULL,
  water_quality numeric NOT NULL,
  biodiversity numeric NOT NULL,
  waste_level numeric NOT NULL,
  temperature numeric,
  humidity numeric,
  rainfall numeric,
  green_cover numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.environmental_data TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.environmental_data TO authenticated;
GRANT ALL ON public.environmental_data TO service_role;
ALTER TABLE public.environmental_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "env data public read" ON public.environmental_data FOR SELECT USING (true);
CREATE POLICY "env data write" ON public.environmental_data FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.environmental_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  date date NOT NULL,
  environmental_dna_score numeric NOT NULL,
  air_score numeric,
  water_score numeric,
  biodiversity_score numeric,
  waste_score numeric,
  weather_score numeric,
  green_cover_score numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.environmental_scores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.environmental_scores TO authenticated;
GRANT ALL ON public.environmental_scores TO service_role;
ALTER TABLE public.environmental_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores public read" ON public.environmental_scores FOR SELECT USING (true);
CREATE POLICY "scores write" ON public.environmental_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pollution_hotspots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  pollution_level text NOT NULL,
  risk_level text NOT NULL,
  detected_factor text,
  environmental_score numeric,
  recommended_action text,
  status text NOT NULL DEFAULT 'active',
  detected_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pollution_hotspots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pollution_hotspots TO authenticated;
GRANT ALL ON public.pollution_hotspots TO service_role;
ALTER TABLE public.pollution_hotspots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hotspots public read" ON public.pollution_hotspots FOR SELECT USING (true);
CREATE POLICY "hotspots write" ON public.pollution_hotspots FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.ai_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  prediction_date date NOT NULL DEFAULT current_date,
  current_score numeric,
  predicted_score_30_days numeric,
  predicted_score_90_days numeric,
  confidence numeric,
  prediction_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_predictions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_predictions TO authenticated;
GRANT ALL ON public.ai_predictions TO service_role;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predictions public read" ON public.ai_predictions FOR SELECT USING (true);
CREATE POLICY "predictions write" ON public.ai_predictions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.recovery_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  action_name text NOT NULL,
  action_type text,
  current_score numeric,
  predicted_score numeric,
  expected_improvement numeric,
  recommendation text,
  status text NOT NULL DEFAULT 'recommended',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recovery_actions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recovery_actions TO authenticated;
GRANT ALL ON public.recovery_actions TO service_role;
ALTER TABLE public.recovery_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recovery public read" ON public.recovery_actions FOR SELECT USING (true);
CREATE POLICY "recovery write" ON public.recovery_actions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  factor text,
  recommendation text,
  detected_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'open'
);
GRANT SELECT ON public.alerts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts public read" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "alerts write" ON public.alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.historical_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  date date NOT NULL,
  environmental_score numeric,
  air_quality numeric,
  water_quality numeric,
  biodiversity numeric,
  waste_level numeric,
  green_cover numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.historical_data TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historical_data TO authenticated;
GRANT ALL ON public.historical_data TO service_role;
ALTER TABLE public.historical_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history public read" ON public.historical_data FOR SELECT USING (true);
CREATE POLICY "history write" ON public.historical_data FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.locations (location_name, latitude, longitude, region) VALUES
 ('Coimbatore', 11.0168, 76.9558, 'Tamil Nadu'),
 ('Karur', 10.9601, 78.0766, 'Tamil Nadu'),
 ('Erode', 11.3410, 77.7172, 'Tamil Nadu'),
 ('Salem', 11.6643, 78.1460, 'Tamil Nadu'),
 ('Tiruppur', 11.1085, 77.3411, 'Tamil Nadu');

INSERT INTO public.environmental_data (location_id, date, air_quality, water_quality, biodiversity, waste_level, temperature, humidity, rainfall, green_cover)
SELECT l.id, d.date, d.aq, d.wq, d.bio, d.waste, d.temp, d.hum, d.rain, d.green
FROM public.locations l
CROSS JOIN (VALUES
 ('2026-01-01'::date, 61, 74, 68, 52, 27, 62, 10, 62),
 ('2026-02-01'::date, 64, 76, 70, 50, 29, 64, 14, 65),
 ('2026-03-01'::date, 66, 79, 72, 48, 31, 60, 9, 68),
 ('2026-04-01'::date, 69, 82, 74, 46, 33, 58, 6, 72),
 ('2026-05-01'::date, 72, 85, 77, 44, 32, 63, 16, 77),
 ('2026-06-01'::date, 74, 88, 79, 41, 30, 68, 22, 81)
) AS d(date, aq, wq, bio, waste, temp, hum, rain, green)
WHERE l.location_name = 'Coimbatore';

INSERT INTO public.environmental_scores (location_id, date, environmental_dna_score, air_score, water_score, biodiversity_score, waste_score, weather_score, green_cover_score)
SELECT l.id, s.date, s.dna, s.air, s.water, s.bio, s.waste, s.weather, s.green
FROM public.locations l
CROSS JOIN (VALUES
 ('2026-01-01'::date, 61, 61, 74, 68, 48, 72, 62),
 ('2026-02-01'::date, 64, 64, 76, 70, 50, 76, 65),
 ('2026-03-01'::date, 68, 66, 79, 72, 52, 78, 68),
 ('2026-04-01'::date, 72, 69, 82, 74, 54, 80, 72),
 ('2026-05-01'::date, 76, 72, 85, 77, 62, 82, 77),
 ('2026-06-01'::date, 82, 74, 88, 79, 68, 84, 81)
) AS s(date, dna, air, water, bio, waste, weather, green)
WHERE l.location_name = 'Coimbatore';

INSERT INTO public.historical_data (location_id, date, environmental_score, air_quality, water_quality, biodiversity, waste_level, green_cover)
SELECT location_id, date, environmental_dna_score, air_score, water_score, biodiversity_score, 100 - waste_score, green_cover_score
FROM public.environmental_scores;

INSERT INTO public.pollution_hotspots (location_id, name, latitude, longitude, pollution_level, risk_level, detected_factor, environmental_score, recommended_action, status)
SELECT l.id, h.name, h.lat, h.lng, h.plevel, h.risk, h.factor, h.score, h.action, h.status
FROM public.locations l
CROSS JOIN (VALUES
 ('Industrial Zone', 11.0250, 76.9300, 'High', 'High', 'Air Pollution, Waste, Water', 48, 'Control pollution source and increase green buffer', 'active'),
 ('Textile Belt', 11.0050, 76.9800, 'High', 'High', 'Water Contamination', 52, 'Improve effluent water treatment', 'active'),
 ('City Centre', 11.0168, 76.9558, 'Medium', 'Medium', 'Traffic Emissions', 64, 'Expand urban tree cover', 'active'),
 ('Riverfront', 11.0400, 76.9700, 'Low', 'Low', 'Organic Waste', 74, 'Maintain waste segregation', 'recovering'),
 ('Forest Reserve', 11.0600, 76.9100, 'Low', 'Low', 'None significant', 89, 'Continue conservation programme', 'healthy'),
 ('Lake Area', 10.9900, 76.9400, 'Medium', 'Medium', 'Nutrient Runoff', 67, 'Restore wetland buffer', 'recovering')
) AS h(name, lat, lng, plevel, risk, factor, score, action, status)
WHERE l.location_name = 'Coimbatore';

INSERT INTO public.ai_predictions (location_id, current_score, predicted_score_30_days, predicted_score_90_days, confidence, prediction_summary)
SELECT id, 82, 87, 91, 91,
 'Based on pollution trends, water quality, biodiversity, weather and historical environmental patterns, environmental health is expected to improve over the next 30-90 days.'
FROM public.locations WHERE location_name = 'Coimbatore';

INSERT INTO public.recovery_actions (location_id, action_name, action_type, current_score, predicted_score, expected_improvement, recommendation, status)
SELECT l.id, r.name, r.type, 48, r.pred, r.imp, r.rec, 'recommended'
FROM public.locations l
CROSS JOIN (VALUES
 ('Increase Green Cover', 'green_cover', 57, 9, 'Plant native species across 12% of the industrial buffer zone'),
 ('Reduce Waste Accumulation', 'waste', 54, 6, 'Deploy segregated collection and weekly clearance cycles'),
 ('Improve Water Treatment', 'water', 55, 7, 'Upgrade effluent treatment before discharge into the river'),
 ('Control Pollution Source', 'air', 56, 8, 'Enforce emission caps on high-output industrial units'),
 ('Improve Rainwater Recharge', 'water', 52, 4, 'Construct recharge pits and restore two lake catchments')
) AS r(name, type, pred, imp, rec)
WHERE l.location_name = 'Coimbatore';

INSERT INTO public.alerts (location_id, alert_type, severity, message, factor, recommendation, status)
SELECT l.id, a.type, a.sev, a.msg, a.factor, a.rec, a.status
FROM public.locations l
CROSS JOIN (VALUES
 ('Pollution', 'Critical', 'High pollution detected in Industrial Zone.', 'Air Pollution', 'Control emission sources and expand green buffer', 'open'),
 ('Water', 'High', 'Water contamination rising in Textile Belt.', 'Water Quality', 'Upgrade effluent treatment capacity', 'open'),
 ('Waste', 'Medium', 'Waste accumulation above threshold near City Centre.', 'Waste Level', 'Increase clearance frequency', 'open'),
 ('Biodiversity', 'Low', 'Minor biodiversity decline observed at Lake Area.', 'Biodiversity', 'Restore wetland vegetation', 'reviewed'),
 ('Recovery', 'Recovered', 'Riverfront zone returned to healthy range.', 'Green Cover', 'Maintain current conservation actions', 'recovered')
) AS a(type, sev, msg, factor, rec, status)
WHERE l.location_name = 'Coimbatore';
