CREATE TABLE public.eco_simulations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 location_id uuid NOT NULL REFERENCES public.locations(id),
 name text NOT NULL,
 model_version text NOT NULL,
 baseline_date date,
 settings jsonb NOT NULL,
 baseline jsonb NOT NULL,
 result jsonb NOT NULL,
 target_name text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eco_simulations TO authenticated;
GRANT ALL ON public.eco_simulations TO service_role;
ALTER TABLE public.eco_simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own simulations" ON public.eco_simulations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX eco_simulations_user_location ON public.eco_simulations(user_id, location_id, created_at DESC);
CREATE TABLE public.eco_alert_actions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 alert_id uuid NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
 status text NOT NULL CHECK (status IN ('acknowledged', 'resolved')),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, alert_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eco_alert_actions TO authenticated;
GRANT ALL ON public.eco_alert_actions TO service_role;
ALTER TABLE public.eco_alert_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own alert actions" ON public.eco_alert_actions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);