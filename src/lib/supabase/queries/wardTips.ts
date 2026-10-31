import { supabase } from '../client';
import type { WardTip } from '../../types';

export async function getRandomTip(
  signal?: AbortSignal
): Promise<{ data: WardTip | null; error: Error | null }> {
  try {
    let query = supabase
      .from('ward_tips')
      .select('id, tip, department, created_at')
      .limit(10);

    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return { data: null, error: error ? new Error(error.message) : null };
    }

    const randomIndex = Math.floor(Math.random() * data.length);
    return { data: (data[randomIndex] as WardTip) || null, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function listWardTips(
  signal?: AbortSignal
): Promise<{ data: WardTip[]; error: Error | null }> {
  try {
    let query = supabase
      .from('ward_tips')
      .select('id, tip, department, created_at')
      .order('created_at', { ascending: false });

    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data as WardTip[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}
