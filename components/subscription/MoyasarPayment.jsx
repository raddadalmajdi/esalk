'use client';

import { useEffect, useRef, useState } from 'react';
import { activateMoyasarSubscription } from '@/lib/billing-api';
import { getMoyasarPaymentCallbackUrl } from '@/lib/app-env';
import { loadMoyasarFormAssets } from '@/lib/moyasar-client-loader';

const MOYASAR_MONTHLY_HALALAS = 900;
const MOYASAR_FORM_CLASS = 'mysr-form';
const INIT_TIMEOUT_MS = 20_000;

function resolvePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY?.trim() ||
    process.env.VITE_MOYASAR_PUBLISHABLE_KEY?.trim() ||
    ''
  );
}

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
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
  const formHostRef = useRef(null);
  const [loadPhase, setLoadPhase] = useState('loading');

  useEffect(() => {
    setLoadPhase('loading');
    const host = formHostRef.current;
    if (host) {
      host.innerHTML = '';
      host.classList.add(MOYASAR_FORM_CLASS);
    }

    if (!organizationId || !accessToken) return;

    const publishableKey = resolvePublishableKey();
    if (!publishableKey) {
      setLoadPhase('error');
      onError?.('مفتاح ميسr العام (NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY) غير مضبوط.');
      return;
    }

    let cancelled = false;
    let initTimer = null;

    void (async () => {
      try {
        await loadMoyasarFormAssets();
        await waitForPaint();
      } catch (err) {
        if (!cancelled) {
          setLoadPhase('error');
          onError?.(err instanceof Error ? err.message : 'تعذّر تحميل مكتبة ميسr.');
        }
        return;
      }

      if (cancelled || !formHostRef.current) return;
      if (typeof window === 'undefined' || !window.Moyasar?.init) {
        setLoadPhase('error');
        onError?.('مكتبة ميسr غير محمّلة. حدّث الصفحة أو تحقق من اتصال الشبكة.');
        return;
      }

      initTimer = window.setTimeout(() => {
        if (cancelled) return;
        setLoadPhase((phase) => {
          if (phase === 'loading') {
            onError?.(
              'تعذّر فتح نموذج الدفع. تأكد من إضافة esalk.com في لوحة ميسr، ثم حدّث الصفحة.'
            );
            return 'error';
          }
          return phase;
        });
      }, INIT_TIMEOUT_MS);

      try {
        window.Moyasar.init({
          element: `.${MOYASAR_FORM_CLASS}`,
          amount: MOYASAR_MONTHLY_HALALAS,
          currency: 'SAR',
          description: 'Esalk monthly subscription',
          publishable_api_key: publishableKey,
          language: 'ar',
          methods: ['creditcard'],
          supported_networks: ['visa', 'mastercard', 'mada'],
          callback_url: getMoyasarPaymentCallbackUrl(),
          metadata: {
            organization_id: organizationId,
          },
          on_completed: async (payment) => {
            try {
              const paymentId = payment?.id;
              if (!paymentId) {
                throw new Error('لم يُرجع ميسr معرّف الدفع.');
              }
              await activateMoyasarSubscription(accessToken, organizationId, paymentId);
              onActivated?.();
            } catch (err) {
              const message =
                err instanceof Error ? err.message : 'تعذّر تفعيل الاشتراك بعد الدفع.';
              onError?.(message);
            }
          },
        });
        if (!cancelled) {
          setLoadPhase('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setLoadPhase('error');
          onError?.(err instanceof Error ? err.message : 'تعذّر تهيئة نموذج ميسr.');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (initTimer !== null) {
        window.clearTimeout(initTimer);
      }
      if (formHostRef.current) {
        formHostRef.current.innerHTML = '';
      }
    };
  }, [accessToken, onActivated, onError, organizationId]);

  return (
    <div className="space-y-2">
      {loadPhase === 'loading' && (
        <p className="text-center text-xs font-bold text-mistara-brown/70">جاري تحميل نموذج الدفع...</p>
      )}
      <div
        ref={formHostRef}
        className={`${MOYASAR_FORM_CLASS} min-h-[360px] w-full rounded-xl border border-mistara-gold/20 bg-white p-2`}
        aria-label="نموذج الدفع — ميسr"
        aria-busy={loadPhase === 'loading'}
      />
    </div>
  );
}
