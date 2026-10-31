import { supabase } from '../client';
import type { ScenarioComment } from '../../types';

export interface CommentFilterParams {
  limit?: number;
  cursor?: string;
  signal?: AbortSignal;
}

export async function listScenarioComments(
  scenarioId: string,
  params: CommentFilterParams = {}
): Promise<{ data: ScenarioComment[]; error: Error | null }> {
  try {
    const limit = params.limit ?? 20;
    let query = supabase
      .from('scenario_comments')
      .select('id, scenario_id, user_id, body, is_anonymous, status, created_at')
      .eq('scenario_id', scenarioId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (params.cursor) {
      query = query.lt('created_at', params.cursor);
    }
    if (params.signal) {
      query = query.abortSignal(params.signal);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data as ScenarioComment[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function createScenarioComment(commentData: {
  scenario_id: string;
  body: string;
  is_anonymous?: boolean;
}): Promise<{ data: ScenarioComment | null; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { data: null, error: new Error('not_authenticated') };

    const { data, error } = await supabase
      .from('scenario_comments')
      .insert({
        scenario_id: commentData.scenario_id,
        user_id: authData.user.id,
        body: commentData.body,
        is_anonymous: commentData.is_anonymous || false,
        status: 'published',
      })
      .select()
      .single();

    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as ScenarioComment, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function likeScenarioComment(commentId: string): Promise<{ ok: boolean; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { ok: false, error: new Error('not_authenticated') };

    const { error } = await supabase
      .from('scenario_comment_likes')
      .insert({ comment_id: commentId, user_id: authData.user.id });

    if (error && !error.message.includes('unique')) {
      return { ok: false, error: new Error(error.message) };
    }
    return { ok: true, error: null };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
