import { supabase } from '../client';
import type { ContentType, ReportReason } from '../../types';

export async function submitReport(reportData: {
  content_type: ContentType;
  content_id: string;
  reason: ReportReason;
  comment?: string;
}): Promise<{ ok: boolean; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const reporterId = authData?.user?.id || null;

    const { error } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      content_type: reportData.content_type,
      content_id: reportData.content_id,
      reason: reportData.reason,
      comment: reportData.comment || null,
      status: 'pending',
    });

    if (error) return { ok: false, error: new Error(error.message) };
    return { ok: true, error: null };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function blockUser(blockedId: string): Promise<{ ok: boolean; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { ok: false, error: new Error('not_authenticated') };

    const { error } = await supabase.from('blocked_users').insert({
      blocker_id: authData.user.id,
      blocked_id: blockedId,
    });

    if (error && !error.message.includes('unique')) {
      return { ok: false, error: new Error(error.message) };
    }
    return { ok: true, error: null };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function listBlockedUserIds(
  blockerId?: string
): Promise<{ data: string[]; error: Error | null }> {
  try {
    let targetUid = blockerId;
    if (!targetUid) {
      const { data: authData } = await supabase.auth.getUser();
      targetUid = authData?.user?.id;
    }
    if (!targetUid) return { data: [], error: null };

    const { data, error } = await supabase
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', targetUid);

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data || []).map((b) => b.blocked_id), error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}
