import { supabase } from '../client';
import type { DrugCalc } from '../../types';

export async function listDrugCalcs(
  signal?: AbortSignal
): Promise<{ data: DrugCalc[]; error: Error | null }> {
  try {
    let query = supabase
      .from('drug_calcs')
      .select('id, question, options, correct_index, explanation, created_at')
      .order('created_at', { ascending: false });

    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data as DrugCalc[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function getRandomDrill(
  signal?: AbortSignal
): Promise<{ data: DrugCalc | null; error: Error | null }> {
  try {
    let query = supabase
      .from('drug_calcs')
      .select('id, question, options, correct_index, explanation')
      .limit(10);

    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return { data: null, error: error ? new Error(error.message) : null };
    }

    const randomIndex = Math.floor(Math.random() * data.length);
    return { data: (data[randomIndex] as DrugCalc) || null, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function recordAttempt(attempt: {
  calc_id: string;
  selected_index: number;
  is_correct: boolean;
}): Promise<{ ok: boolean; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { ok: false, error: new Error('not_authenticated') };

    const { error } = await supabase.from('drug_calc_attempts').insert({
      user_id: authData.user.id,
      calc_id: attempt.calc_id,
      selected_index: attempt.selected_index,
      is_correct: attempt.is_correct,
    });

    if (error) return { ok: false, error: new Error(error.message) };
    return { ok: true, error: null };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
