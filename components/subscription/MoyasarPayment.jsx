'use client';

import { useEffect, useId, useRef } from 'react';
import { activateMoyasarSubscription } from '@/lib/billing-api';
import { loadMoyasarFormAssets } from '@/lib/moyasar-client-loader';

const MOYASAR_MONTHLY_HALALAS = 900;
const MOYASAR_CALLBACK_URL = 'https://esalk.com/payment-callback';

function resolvePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY?.trim() ||
    process.env.VITE_MOYASAR_PUBLISHABLE_KEY?.trim() ||
    ''
  );
}

/**
 * @param {{
 *   organizationId: string;
 *   accessToken: string;
 *   onActivated?: () => void;
 *   onError?: (message: string) => void;
 * }} props
 */
export function MoyasarPayment({ organizationId, accessToken, onActivated, onError }) {
  const containerId = useId().replace(/:/g, '');
  const initialized = useRef(false);

  useEffect(() => {
    if (!organizationId || !accessToken || initialized.current) return;

    const publishableKey = resolvePublishableKey();
    if (!publishableKey) {
      onError?.('مفتاح ميسر العام (NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY) غير مضبوط.');
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await loadMoyasarFormAssets();
      } catch (err) {
        if (!cancelled) {
          onError?.(err instanceof Error ? err.message : 'تعذّر تحميل مكتبة ميسر.');
        }
        return;
      }

      if (cancelled || initialized.current) return;
      if (typeof window === 'undefined' || !window.Moyasar?.init) {
        onError?.('مكتبة ميسر غير محمّلة. حدّث الصفحة أو تحقق من اتصال الشبكة.');
        return;
      }

      initialized.current = true;

      window.Moyasar.init({
      element: `#${containerId}`,
      amount: MOYASAR_MONTHLY_HALALAS,
      currency: 'SAR',
      description: 'اشتراك شهري في منصة إيصالك (esalk.com)',
      publishable_api_key: publishableKey,
      methods: ['creditcard', 'stcpay', 'applepay'],
      callback_url: MOYASAR_CALLBACK_URL,
      metadata: {
        organization_id: organizationId,
      },
      on_completed: async (payment) => {
        try {
          const paymentId = payment?.id;
          if (!paymentId) {
            throw new Error('لم يُرجع ميسر معرّف الدفع.');
          }
          await activateMoyasarSubscription(accessToken, organizationId, paymentId);
          onActivated?.();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'تعذّر تفعيل الاشتراك بعد الدفع.';
          onError?.(message);
        }
      },
    });
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, containerId, onActivated, onError, organizationId]);

  return (
    <div
      id={containerId}
      className="mysr-form min-h-[280px] rounded-xl border border-mistara-gold/20 bg-white/90 p-4"
      aria-label="نموذج الدفع — ميسر"
    />
  );
}
