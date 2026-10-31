import { supabase } from '../client';
import type { ProgressStatus, Scenario } from '../../types';

export interface UserProgressRow {
  id: string;
  user_id: string;
  scenario_id: string;
  status: ProgressStatus;
  last_opened: string;
  mastery_score: number;
}

export async function listUserProgress(
  userId?: string
): Promise<{ data: UserProgressRow[]; error: Error | null }> {
  try {
    let targetUid = userId;
    if (!targetUid) {
      const { data: authData } = await supabase.auth.getUser();
      targetUid = authData?.user?.id;
    }
    if (!targetUid) return { data: [], error: null };

    const { data, error } = await supabase
      .from('progress')
      .select('id, user_id, scenario_id, status, last_opened, mastery_score')
      .eq('user_id', targetUid);

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data as UserProgressRow[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function upsertProgress(progressData: {
  scenario_id: string;
  status: ProgressStatus;
  mastery_score?: number;
}): Promise<{ data: UserProgressRow | null; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { data: null, error: new Error('not_authenticated') };

    const { data, error } = await supabase
      .from('progress')
      .upsert(
        {
          user_id: authData.user.id,
          scenario_id: progressData.scenario_id,
          status: progressData.status,
          mastery_score: progressData.mastery_score ?? 0,
          last_opened: new Date().toISOString(),
        },
        { onConflict: 'user_id,scenario_id' }
      )
      .select()
      .single();

    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as UserProgressRow, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function listSavedScenarios(
  userId?: string
): Promise<{ data: Scenario[]; error: Error | null }> {
  try {
    let targetUid = userId;
    if (!targetUid) {
      const { data: authData } = await supabase.auth.getUser();
      targetUid = authData?.user?.id;
    }
    if (!targetUid) return { data: [], error: null };

    const { data, error } = await supabase
      .from('bookmarks')
      .select('scenario_id, scenarios!inner(*)')
      .eq('user_id', targetUid)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: new Error(error.message) };
    const list = (data || []).map((row: unknown) => (row as { scenarios: Scenario }).scenarios);
    return { data: list, error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function listBookmarkIds(
  userId?: string
): Promise<{ data: string[]; error: Error | null }> {
  try {
    let targetUid = userId;
    if (!targetUid) {
      const { data: authData } = await supabase.auth.getUser();
      targetUid = authData?.user?.id;
    }
    if (!targetUid) return { data: [], error: null };

    const { data, error } = await supabase
      .from('bookmarks')
      .select('scenario_id')
      .eq('user_id', targetUid);

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data || []).map((b) => b.scenario_id), error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function saveBookmark(scenarioId: string): Promise<{ ok: boolean; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { ok: false, error: new Error('not_authenticated') };

    const { error } = await supabase
      .from('bookmarks')
      .insert({ scenario_id: scenarioId, user_id: authData.user.id });

    if (error && !error.message.includes('unique')) {
      return { ok: false, error: new Error(error.message) };
    }
    return { ok: true, error: null };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function removeBookmark(scenarioId: string): Promise<{ ok: boolean; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { ok: false, error: new Error('not_authenticated') };

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('scenario_id', scenarioId)
      .eq('user_id', authData.user.id);

    if (error) return { ok: false, error: new Error(error.message) };
    return { ok: true, error: null };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
