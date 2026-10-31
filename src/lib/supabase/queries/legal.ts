import { supabase } from '../client';
import type { LegalPage } from '../../types';

export async function listLegalPages(
  signal?: AbortSignal
): Promise<{ data: LegalPage[]; error: Error | null }> {
  try {
    let query = supabase
      .from('legal_pages')
      .select('id, slug, title, content_md, version, last_updated')
      .order('slug', { ascending: true });

    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data as LegalPage[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function getLegalPage(
  slug: string,
  signal?: AbortSignal
): Promise<{ data: LegalPage | null; error: Error | null }> {
  try {
    let query = supabase
      .from('legal_pages')
      .select('id, slug, title, content_md, version, last_updated')
      .eq('slug', slug);

    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query.maybeSingle();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: (data as LegalPage) || null, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
