import { supabase } from '../client';
import type { Payment } from '../../types';

export async function createPendingPayment(params: {
  amount: number;
  plan: string;
  phone: string;
}): Promise<{ data: Payment | null; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { data: null, error: new Error('not_authenticated') };

    // Invoke the intasend-stk edge function
    const { data, error } = await supabase.functions.invoke('intasend-stk', {
      body: {
        phone: params.phone,
        amount: params.amount,
        plan: params.plan,
        user_id: authData.user.id,
      },
    });

    if (error) {
      // Fallback direct pending insert if edge function is deploying
      const { data: fallback, error: fallbackErr } = await supabase
        .from('payments')
        .insert({
          user_id: authData.user.id,
          amount_kes: params.amount,
          plan: params.plan,
          status: 'pending',
        })
        .select()
        .single();

      if (fallbackErr) return { data: null, error: new Error(fallbackErr.message) };
      return { data: fallback as Payment, error: null };
    }

    return { data: data?.payment || null, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function pollPayment(
  paymentId: string
): Promise<{ data: Payment | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('id, user_id, amount_kes, plan, mpesa_ref, intasend_ref, status, created_at')
      .eq('id', paymentId)
      .maybeSingle();

    if (error) return { data: null, error: new Error(error.message) };
    return { data: (data as Payment) || null, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function myPayments(): Promise<{ data: Payment[]; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { data: [], error: null };

    const { data, error } = await supabase
      .from('payments')
      .select('id, user_id, amount_kes, plan, mpesa_ref, intasend_ref, status, created_at')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data as Payment[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}
