CREATE TABLE IF NOT EXISTS public.pollution_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  source_type text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  intensity numeric NOT NULL DEFAULT 50,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pollution_sources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pollution_sources TO authenticated;
GRANT ALL ON public.pollution_sources TO service_role;

ALTER TABLE public.pollution_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sources public read" ON public.pollution_sources;
CREATE POLICY "sources public read" ON public.pollution_sources FOR SELECT USING (true);
DROP POLICY IF EXISTS "sources write" ON public.pollution_sources;
CREATE POLICY "sources write" ON public.pollution_sources FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.locations (location_name, latitude, longitude, region)
SELECT v.n, v.lat, v.lon, v.r
FROM (VALUES
  ('Chennai', 13.0827, 80.2707, 'Tamil Nadu'),
  ('Madurai', 9.9252, 78.1198, 'Tamil Nadu'),
  ('Tiruchirappalli', 10.7905, 78.7047, 'Tamil Nadu'),
  ('Tirunelveli', 8.7139, 77.7567, 'Tamil Nadu'),
  ('Vellore', 12.9165, 79.1325, 'Tamil Nadu'),
  ('Thoothukudi', 8.7642, 78.1348, 'Tamil Nadu'),
  ('Thanjavur', 10.7870, 79.1378, 'Tamil Nadu'),
  ('Dindigul', 10.3673, 77.9803, 'Tamil Nadu'),
  ('Kanyakumari', 8.0883, 77.5385, 'Tamil Nadu'),
  ('Puducherry', 11.9416, 79.8083, 'Puducherry')
) AS v(n, lat, lon, r)
WHERE NOT EXISTS (SELECT 1 FROM public.locations l WHERE l.location_name = v.n);