import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { EcosystemState, SimulationSettings } from './simulation';

export type SimulationRecord = { id: string; location_id: string; name: string; model_version: string; baseline_date: string | null; settings: SimulationSettings; baseline: EcosystemState; result: EcosystemState; target_name: string | null; created_at: string };
export function useSimulationHistory(locationId?: string) {
  return useQuery({ queryKey: ['simulations', locationId ?? 'all'], queryFn: async () => {
    let q = supabase.from('eco_simulations').select('*').order('created_at', { ascending: false });
    if (locationId) q = q.eq('location_id', locationId);
    const { data, error } = await q.limit(50);
    if (error) throw error;
    return (data ?? []) as unknown as SimulationRecord[];
  } });
}
export function useSaveSimulation() {
  const qc = useQueryClient();
  return async (record: Omit<SimulationRecord, 'id' | 'created_at'>) => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) throw new Error('Please sign in again before saving.');
    const { data, error } = await supabase.from('eco_simulations').insert({ ...record, user_id: auth.user.id, settings: record.settings as unknown as Json, baseline: record.baseline as unknown as Json, result: record.result as unknown as Json }).select().single();
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ['simulations'] });
    return data as unknown as SimulationRecord;
  };
}
export function useAlertActions() {
  return useQuery({ queryKey: ['alert-actions'], queryFn: async () => {
    const { data, error } = await supabase.from('eco_alert_actions').select('*');
    if (error) throw error;
    return data ?? [];
  } });
}