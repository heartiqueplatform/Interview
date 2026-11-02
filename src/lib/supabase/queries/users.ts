import { supabase } from '../client';
import type { User } from '../../types';

export async function getMe(
  signal?: AbortSignal
): Promise<{ data: User | null; error: Error | null }> {
  try {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return { data: null, error: null }; // Clean guest user
    }

    let query = supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id);

    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query.maybeSingle();
    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    if (!data) {
      // Auto fallback if trigger was delayed
      const fallbackUser: User = {
        id: authData.user.id,
        email: authData.user.email || '',
        name: authData.user.user_metadata?.name || null,
        experience_level: null,
        target_facility_level: null,
        county: null,
        subscription_status: 'free',
        subscription_expires_at: null,
        coins: 0,
        streak_count: 0,
        last_active_date: null,
        preferred_language: 'en',
        theme: 'system',
        metadata: {},
        created_at: new Date().toISOString(),
      };
      return { data: fallbackUser, error: null };
    }

    return { data: data as unknown as User, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function updateMe(
  updates: Partial<User>
): Promise<{ data: User | null; error: string | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return { data: null, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', authData.user.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as unknown as User, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Update failed' };
  }
}

export async function recordActiveToday(): Promise<{ ok: boolean; newStreak?: number }> {
  try {
    const { data: authData } = await supabase.auth.getUser();

    // Guests have no users row and no streak to increment.
    // Skip the RPC entirely for unauthenticated sessions.
    if (!authData?.user) {
      return { ok: false };
    }

    const { data, error } = await supabase.rpc('increment_streak', {
      p_user_id: authData.user.id,
    });

    if (error) {
      return { ok: false };
    }

    return { ok: true, newStreak: data as number };
  } catch {
    return { ok: false };
  }
}