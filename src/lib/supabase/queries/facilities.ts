import { supabase } from '../client';
import type { Facility } from '../../types';

export async function listFacilities(
  signal?: AbortSignal
): Promise<{ data: Facility[]; error: Error | null }> {
  try {
    let query = supabase
      .from('facilities')
      .select('id, name, level, county, wards, notes, created_by, verified, created_at')
      .order('verified', { ascending: false })
      .order('created_at', { ascending: false });

    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data as Facility[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function createFacility(facilityData: {
  name: string;
  level: string;
  county: string;
  wards?: string[];
  notes?: string | null;
}): Promise<{ data: Facility | null; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;

    const { data, error } = await supabase
      .from('facilities')
      .insert({
        name: facilityData.name,
        level: facilityData.level,
        county: facilityData.county,
        wards: facilityData.wards || [],
        notes: facilityData.notes || null,
        created_by: userId,
        verified: false,
      })
      .select()
      .single();

    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as Facility, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function verifyFacility(facilityId: string): Promise<{ ok: boolean; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { ok: false, error: new Error('not_authenticated') };

    const { error } = await supabase
      .from('facilities')
      .update({ verified: true })
      .eq('id', facilityId);

    if (error) return { ok: false, error: new Error(error.message) };
    return { ok: true, error: null };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
