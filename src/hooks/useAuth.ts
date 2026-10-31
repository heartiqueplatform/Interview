import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import type { User } from '../lib/types';
import { getMe, updateMe } from '../lib/supabase/queries/users';

export const GUEST_USER: User = {
  id: 'guest_anonymous',
  email: '',
  name: null,
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
  created_at: '2026-01-01T00:00:00Z',
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await getMe();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const updateUserProfile = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return;
      // Optimistic update
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
      const { data, error } = await updateMe(updates);
      if (data) {
        setUser(data);
      }
    },
    [user]
  );

  const login = useCallback(
    async (email: string, pass: string) => {
      setLoading(true);
      setAuthError(null);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('email not confirmed')) {
            setAuthError('Email not confirmed');
            return { ok: false, error: 'Email not confirmed' };
          }
          if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
            setAuthError('Wrong email or password.');
            return { ok: false, error: 'Wrong email or password.' };
          }
          if (msg.includes('rate limit')) {
            setAuthError('Too many attempts. Wait a minute.');
            return { ok: false, error: 'Too many attempts. Wait a minute.' };
          }
          setAuthError(error.message);
          return { ok: false, error: error.message };
        }
        await fetchProfile();
        return { ok: true };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Login failed';
        setAuthError(msg);
        return { ok: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile]
  );

  const signup = useCallback(
    async (email: string, pass: string, name?: string) => {
      setLoading(true);
      setAuthError(null);
      try {
        const now = new Date().toISOString();
        const meta = {
          name: name || email.split('@')[0],
          terms_accepted_at: now,
          privacy_accepted_at: now,
          guidelines_accepted_at: now,
          terms_version: '1.0',
          age_confirmed: true,
        };

        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: meta,
          },
        });

        if (error) {
          setAuthError(error.message);
          return { ok: false, error: error.message };
        }

        await fetchProfile();
        return { ok: true };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Signup failed';
        setAuthError(msg);
        return { ok: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile]
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : 'Failed' };
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return { ok: false, error: 'not_authenticated' };
    try {
      // Anonymize user's posts, replies, comments
      await Promise.all([
        supabase.from('posts').update({ body: '[deleted]', is_anonymous: true }).eq('user_id', user.id),
        supabase.from('post_replies').update({ body: '[deleted]', is_anonymous: true }).eq('user_id', user.id),
        supabase.from('scenario_comments').update({ body: '[deleted]', is_anonymous: true }).eq('user_id', user.id),
      ]);

      // Delete user row
      await supabase.from('users').delete().eq('id', user.id);
      await logout();
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : 'Failed to delete' };
    }
  }, [user, logout]);

  return {
    user: user || GUEST_USER,
    rawUser: user,
    isGuest: !user,
    loading,
    authError,
    setAuthError,
    login,
    signup,
    logout,
    updateUser: updateUserProfile,
    resetPassword,
    deleteAccount,
    refreshUser: fetchProfile,
  };
}
