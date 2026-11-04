'use client';

import { useCallback, useEffect, useState } from 'react';
import { resolveClientSession } from '@/lib/auth-session-client';
import { fetchOrganizationSubscription } from '@/lib/billing-api';
import type { SubscriptionSummary } from '@/lib/subscription';

export function useHomeSubscriptionBadge(organizationId: string | null) {
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);

  const refresh = useCallback(async () => {
    if (!organizationId) {
      setSummary(null);
      return;
    }
    const sessionResult = await resolveClientSession();
    if (!sessionResult.ok) {
      setSummary(null);
      return;
    }
    try {
      const sub = await fetchOrganizationSubscription(sessionResult.accessToken, organizationId);
      setSummary(sub);
    } catch {
      setSummary(null);
    }
  }, [organizationId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const trialing = summary?.subscription.status === 'trialing';
  const daysLeft = trialing ? summary?.daysUntilTrialEnd : null;

  return {
    summary,
    trialDaysRemaining: daysLeft,
    showTrialBadge: trialing && daysLeft != null,
    refreshSubscriptionBadge: refresh,
  };
}
