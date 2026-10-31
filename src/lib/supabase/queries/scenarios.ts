import { supabase } from '../client';
import type { Scenario } from '../../types';

export interface ScenarioFilterParams {
  limit?: number;
  cursor?: string;
  facility_level?: string;
  department?: string;
  trap_type?: string;
  query?: string;
  signal?: AbortSignal;
}

export interface ScenarioQueryResult {
  rows: Scenario[];
  nextCursor?: string;
}

const SCENARIO_COLUMNS =
  'id, slug, title, swahili_title, facility_level, department, trap_type, experience_level, scenario_text, swahili_scenario_text, what_board_tests, wrong_answer, swahili_wrong_answer, right_answer, swahili_right_answer, image_url, english_audio_url, swahili_audio_url, external_resources, memory_stickiness, verified_by, version, created_at, updated_at';

export async function listScenarios(
  params: ScenarioFilterParams = {}
): Promise<{ data: ScenarioQueryResult; error: Error | null }> {
  try {
    const limit = params.limit ?? 20;
    let query = supabase
      .from('scenarios')
      .select(SCENARIO_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (params.cursor) {
      query = query.lt('created_at', params.cursor);
    }
    if (params.facility_level && params.facility_level !== 'all') {
      query = query.eq('facility_level', params.facility_level);
    }
    if (params.department && params.department !== 'all') {
      query = query.eq('department', params.department);
    }
    if (params.trap_type && params.trap_type !== 'all') {
      query = query.eq('trap_type', params.trap_type);
    }
    if (params.query && params.query.trim()) {
      query = query.or(
        `title.ilike.%${params.query.trim()}%,scenario_text.ilike.%${params.query.trim()}%,department.ilike.%${params.query.trim()}%`
      );
    }
    if (params.signal) {
      query = query.abortSignal(params.signal);
    }

    const { data, error } = await query;
    if (error) {
      return { data: { rows: [] }, error: new Error(error.message) };
    }

    const items = (data as unknown as Scenario[]) || [];
    let nextCursor: string | undefined = undefined;
    let rows = items;

    if (items.length > limit) {
      rows = items.slice(0, limit);
      nextCursor = rows[rows.length - 1].created_at;
    }

    return { data: { rows, nextCursor }, error: null };
  } catch (err: unknown) {
    return { data: { rows: [] }, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function searchScenarios(
  params: ScenarioFilterParams = {}
): Promise<{ data: ScenarioQueryResult; error: Error | null }> {
  return listScenarios(params);
}

export async function getScenarioBySlug(
  slug: string,
  signal?: AbortSignal
): Promise<{ data: Scenario | null; error: Error | null }> {
  try {
    let query = supabase
      .from('scenarios')
      .select(SCENARIO_COLUMNS)
      .eq('slug', slug);

    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query.maybeSingle();
    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return { data: (data as unknown as Scenario) || null, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function getTodaysScenario(
  signal?: AbortSignal
): Promise<{ data: Scenario | null; error: Error | null }> {
  try {
    let query = supabase
      .from('scenarios')
      .select(SCENARIO_COLUMNS)
      .order('memory_stickiness', { ascending: false })
      .limit(1);

    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query.maybeSingle();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: (data as unknown as Scenario) || null, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function getResumeScenario(
  userId: string,
  signal?: AbortSignal
): Promise<{ data: Scenario | null; error: Error | null }> {
  try {
    let query = supabase
      .from('progress')
      .select('scenario_id, scenarios!inner(*)')
      .eq('user_id', userId)
      .neq('status', 'mastered')
      .order('last_opened', { ascending: false })
      .limit(1);

    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query.maybeSingle();
    if (error || !data) return { data: null, error: error ? new Error(error.message) : null };

    const sc = (data as unknown as { scenarios: Scenario }).scenarios;
    return { data: sc || null, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
