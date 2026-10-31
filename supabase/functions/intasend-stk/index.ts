import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { phone, amount, plan, user_id } = await req.json();
    const secret = Deno.env.get('INTASEND_SECRET_KEY')!;
    const publishable = Deno.env.get('INTASEND_PUBLISHABLE_KEY')!;
    const env = Deno.env.get('INTASEND_ENVIRONMENT') || 'sandbox';
    const base = env === 'production' ? 'https://payment.intasend.com' : 'https://sandbox.intasend.com';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: payment, error: insErr } = await supabase
      .from('payments')
      .insert({ user_id, amount_kes: amount, plan, status: 'pending' })
      .select()
      .single();
    if (insErr) throw insErr;

    const stkRes = await fetch(`${base}/api/v1/payment/mpesa-stk-push/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
        'X-IntaSend-Public-API-Key': publishable,
      },
      body: JSON.stringify({
        phone_number: phone,
        amount,
        api_ref: payment.id,
        narrative: 'BOARDPASS subscription',
      }),
    });
    const stk = await stkRes.json();
    if (!stkRes.ok) {
      await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id);
      throw new Error(stk?.detail || 'STK failed');
    }
    await supabase.from('payments').update({ intasend_ref: stk.invoice?.invoice_id || stk.id }).eq('id', payment.id);
    return new Response(JSON.stringify({ ok: true, payment_id: payment.id, ref: stk }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
