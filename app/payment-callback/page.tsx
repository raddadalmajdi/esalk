'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppBrand } from '@/components/brand/AppBrand';
import { useOrganization } from '@/components/organization/OrganizationProvider';
import { resolveClientSession } from '@/lib/auth-session-client';
import { activateMoyasarSubscription } from '@/lib/billing-api';

type CallbackStatus = 'loading' | 'success' | 'error' | 'auth_required' | 'org_missing';

function PaymentCallbackInner() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('id')?.trim() ?? searchParams.get('payment_id')?.trim() ?? '';
  const { organizationId, loading: orgLoading } = useOrganization();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (orgLoading) return;

    void (async () => {
      if (!paymentId) {
        setStatus('error');
        setMessage('لم يُعثر على معرّف الدفع في الرابط.');
        return;
      }

      const sessionResult = await resolveClientSession();
      if (!sessionResult.ok) {
        setStatus('auth_required');
        setMessage(sessionResult.message);
        return;
      }

      if (!organizationId) {
        setStatus('org_missing');
        setMessage('لم يُعثر على محل مرتبط بحسابك.');
        return;
      }

      try {
        await activateMoyasarSubscription(
          sessionResult.accessToken,
          organizationId,
          paymentId
        );
        setStatus('success');
        setMessage('تم تفعيل اشتراكك الشهري بنجاح.');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'تعذّر تأكيد الدفع.');
      }
    })();
  }, [orgLoading, organizationId, paymentId]);

  return (
    <div className="min-h-screen bg-mistara-sand text-mistara-espresso" dir="rtl">
      <header className="glass-header border-b border-mistara-gold/20 px-4 py-3">
        <AppBrand size="sm" layout="row" showTitle subtitle={null} />
      </header>
      <main className="mx-auto max-w-md px-4 py-10 text-center space-y-4">
        {status === 'loading' && (
          <p className="text-sm font-bold text-mistara-brown/80">جاري تأكيد الدفع...</p>
        )}
        {status === 'success' && (
          <>
            <p className="text-lg font-black text-emerald-800">✓ {message}</p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-primary px-6 py-3 text-sm font-black text-white"
            >
              العودة للوحة التحكم
            </Link>
          </>
        )}
        {(status === 'error' || status === 'auth_required' || status === 'org_missing') && (
          <>
            <p className="text-base font-black text-red-800">{message}</p>
            <Link href="/billing" className="text-sm font-bold text-primary underline">
              صفحة الاشتراك
            </Link>
          </>
        )}
      </main>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-mistara-sand p-8 text-center text-sm font-bold">
          جاري التحميل...
        </div>
      }
    >
      <PaymentCallbackInner />
    </Suspense>
  );
}
