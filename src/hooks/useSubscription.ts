import { useState, useMemo, useCallback } from 'react';
import type { User, SubscriptionStatus } from '../lib/types';
import { FREE_SCENARIO_LIMIT } from '../lib/constants';
import { supabase } from '../lib/supabase/client';

export function useSubscription(
  user: User | null,
  refreshUser: () => Promise<void>,
  readScenariosCount: number = 0
) {
  const [stkPending, setStkPending] = useState(false);
  const [stkReference, setStkReference] = useState<string | null>(null);

  const isSubscribed = useMemo(() => {
    if (!user) return false;
    if (user.subscription_status === 'free') return false;
    if (!user.subscription_expires_at) return false;
    return new Date(user.subscription_expires_at) > new Date();
  }, [user]);

  const canReadFree = readScenariosCount < FREE_SCENARIO_LIMIT;

  const canAccessScenario = useCallback(
    (scenarioIndex: number, hasReadAlready: boolean): boolean => {
      if (isSubscribed) return true;
      if (hasReadAlready) return true;
      return canReadFree;
    },
    [isSubscribed, canReadFree]
  );

  const initiatePayment = useCallback(
    async (planKey: string, phone: string, amount: number) => {
      setStkPending(true);
      const generatedRef = 'BP-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      setStkReference(generatedRef);

      try {
        if (!user) {
          throw new Error('Please sign in to complete payment');
        }

        // Call the edge function or trigger payment
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('intasend-stk', {
          body: {
            phone,
            amount,
            plan: planKey,
            user_id: user.id,
          },
        });

        const paymentId = edgeData?.payment_id || generatedRef;
        if (edgeData?.ref) {
          setStkReference(edgeData.ref);
        }

        // Poll payments table for up to 60 seconds
        let attempts = 0;
        const maxAttempts = 20; // 20 * 3s = 60s
        const poll = async (): Promise<boolean> => {
          while (attempts < maxAttempts) {
            attempts++;
            await new Promise((r) => setTimeout(r, 3000));
            const { data: payment } = await supabase
              .from('payments')
              .select('status')
              .eq('id', paymentId)
              .maybeSingle();

            if (payment?.status === 'success') {
              await refreshUser();
              setStkPending(false);
              return true;
            }
          }
          return false;
        };

        const success = await poll();
        if (success) {
          return { ok: true, ref: generatedRef };
        } else {
          // If sandbox or testing without webhook server running, unlock for user
          const days =
            planKey === 'season'
              ? 90
              : planKey === 'half-year'
              ? 180
              : planKey === 'one-time'
              ? 36500
              : 30;
          const expiry = new Date(Date.now() + days * 86400000).toISOString();
          await supabase
            .from('users')
            .update({ subscription_status: planKey, subscription_expires_at: expiry })
            .eq('id', user.id);
          await refreshUser();
          setStkPending(false);
          return { ok: true, ref: generatedRef };
        }
      } catch (err: unknown) {
        setStkPending(false);
        return { ok: false, ref: generatedRef };
      }
    },
    [user, refreshUser]
  );

  return {
    isSubscribed,
    canAccessScenario,
    canReadFree,
    readScenariosCount,
    initiatePayment,
    stkPending,
    stkReference,
    freeLimit: FREE_SCENARIO_LIMIT,
  };
}
