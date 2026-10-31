import { supabase } from '../client';
import type { Scenario, Facility, LegalPage, AdminLog, User } from '../../types';

export interface ModerationReport {
  id: string;
  reporter_id: string;
  content_type: 'post' | 'post_reply' | 'scenario_comment' | 'scenario';
  content_id: string;
  reason: string;
  comment: string | null;
  status: 'pending' | 'actioned' | 'dismissed';
  created_at: string;
}

export interface LiveAnalytics {
  usersCount: number;
  activeSubscriptions: number;
  scenariosCount: number;
  pendingReports: number;
}

export async function logAdminAction(
  action: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown> = {}
): Promise<{ ok: boolean }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    await supabase.from('admin_logs').insert({
      admin_id: authData?.user?.id || null,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function listAdminLogs(): Promise<{ data: AdminLog[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('id, admin_id, action, target_type, target_id, details, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data as AdminLog[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function listPendingReports(): Promise<{ data: ModerationReport[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id, reporter_id, content_type, content_id, reason, comment, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data as ModerationReport[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function actionReport(
  reportId: string,
  action: 'hide' | 'ban_user' | 'dismiss'
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const { data: report } = await supabase
      .from('reports')
      .select('content_type, content_id')
      .eq('id', reportId)
      .single();

    await supabase.from('reports').update({ status: 'actioned' }).eq('id', reportId);

    if (report && action === 'hide') {
      if (report.content_type === 'post') {
        await supabase.from('posts').update({ status: 'removed' }).eq('id', report.content_id);
      } else if (report.content_type === 'post_reply') {
        await supabase.from('post_replies').update({ status: 'removed' }).eq('id', report.content_id);
      } else if (report.content_type === 'scenario_comment') {
        await supabase.from('scenario_comments').update({ status: 'removed' }).eq('id', report.content_id);
      }
    }

    await logAdminAction('REPORT_MODERATED', 'report', reportId, { action });
    return { ok: true, error: null };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Moderation failed' };
  }
}

export async function dismissReport(reportId: string): Promise<{ ok: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId);
    if (error) return { ok: false, error: error.message };
    await logAdminAction('REPORT_DISMISSED', 'report', reportId);
    return { ok: true, error: null };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function upsertScenario(scenario: Scenario): Promise<{ data: Scenario | null; error: string | null }> {
  try {
    const isNew = scenario.id.startsWith('sc-') && scenario.id.length < 30;
    const payload: any = {
      slug: scenario.slug,
      title: scenario.title,
      swahili_title: scenario.swahili_title || null,
      facility_level: scenario.facility_level,
      department: scenario.department,
      trap_type: scenario.trap_type,
      experience_level: scenario.experience_level,
      scenario_text: scenario.scenario_text,
      swahili_scenario_text: scenario.swahili_scenario_text || null,
      what_board_tests: scenario.what_board_tests,
      wrong_answer: scenario.wrong_answer,
      swahili_wrong_answer: scenario.swahili_wrong_answer || null,
      right_answer: scenario.right_answer,
      swahili_right_answer: scenario.swahili_right_answer || null,
      memory_stickiness: scenario.memory_stickiness,
      verified_by: scenario.verified_by || null,
      version: scenario.version,
      updated_at: new Date().toISOString(),
    };
    if (!isNew) {
      payload.id = scenario.id;
    }

    const { data, error } = await supabase
      .from('scenarios')
      .upsert(payload, { onConflict: 'slug' })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    await logAdminAction('SCENARIO_UPSERTED', 'scenario', data.id, { slug: scenario.slug });
    return { data: data as Scenario, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to save scenario' };
  }
}

export async function deleteScenario(id: string): Promise<{ ok: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from('scenarios').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    await logAdminAction('SCENARIO_DELETED', 'scenario', id);
    return { ok: true, error: null };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function verifyFacilityAdmin(facilityId: string): Promise<{ ok: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('facilities')
      .update({ verified: true })
      .eq('id', facilityId);

    if (error) return { ok: false, error: error.message };
    await logAdminAction('FACILITY_VERIFIED', 'facility', facilityId);
    return { ok: true, error: null };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function updateLegalPage(
  slug: string,
  content_md: string
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const { data: existing } = await supabase
      .from('legal_pages')
      .select('version')
      .eq('slug', slug)
      .single();

    const newVersion = (existing?.version || 1) + 1;
    const { error } = await supabase
      .from('legal_pages')
      .update({
        content_md,
        version: newVersion,
        last_updated: new Date().toISOString(),
      })
      .eq('slug', slug);

    if (error) return { ok: false, error: error.message };
    await logAdminAction('LEGAL_PAGE_UPDATED', 'legal_page', slug, { version: newVersion });
    return { ok: true, error: null };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function getLiveAnalytics(): Promise<{ data: LiveAnalytics | null; error: Error | null }> {
  try {
    const [usersRes, subsRes, scRes, repRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).neq('subscription_status', 'free'),
      supabase.from('scenarios').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    return {
      data: {
        usersCount: usersRes.count ?? 0,
        activeSubscriptions: subsRes.count ?? 0,
        scenariosCount: scRes.count ?? 0,
        pendingReports: repRes.count ?? 0,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

export async function listUsersAdmin(): Promise<{ data: User[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data as User[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}
