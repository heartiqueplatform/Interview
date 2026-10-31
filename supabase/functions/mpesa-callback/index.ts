import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const body = await req.json();
    const invoiceId = body?.invoice_id || body?.reference || body?.api_ref;
    const mpesaRef = body?.mpesa_reference || body?.transaction_id || null;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .or(`intasend_ref.eq.${invoiceId},id.eq.${invoiceId}`)
      .maybeSingle();
    if (!payment) return new Response('not found', { status: 404 });

    const success = body?.state === 'COMPLETE' || body?.status === 'success' || body?.invoice?.state === 'COMPLETE';
    if (!success) {
      await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id);
      return new Response('failed', { status: 200 });
    }

    const now = new Date();
    const planDurations: Record<string, number> = {
      monthly: 30,
      season: 90,
      'half-year': 180,
      'one-time': 36500,
    };
    const days = planDurations[payment.plan] || 30;
    const expiry = new Date(now.getTime() + days * 86400000).toISOString();

    await supabase.from('payments').update({ status: 'success', mpesa_ref: mpesaRef }).eq('id', payment.id);
    await supabase.from('users').update({ subscription_status: payment.plan, subscription_expires_at: expiry }).eq('id', payment.user_id);

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400 });
  }
});
