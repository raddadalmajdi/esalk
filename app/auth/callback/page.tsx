'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { AuthBootScreen } from '@/components/auth/AuthBootScreen';
import { AppBrand } from '@/components/brand/AppBrand';
import {
  FIREBASE_EMAIL_LINK_STORAGE_KEY,
  getFirebaseAuth,
  isFirebaseConfigured,
} from '@/lib/firebase-auth-client';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (!isFirebaseConfigured()) {
        setStatus('error');
        setDetail('إعداد Firebase غير متاح.');
        return;
      }

      const auth = getFirebaseAuth();
      if (!auth) {
        setStatus('error');
        setDetail('Firebase Auth غير متاح.');
        return;
      }

      const href = typeof window !== 'undefined' ? window.location.href : '';

      try {
        if (isSignInWithEmailLink(auth, href)) {
          const email =
            window.localStorage.getItem(FIREBASE_EMAIL_LINK_STORAGE_KEY) ??
            searchParams.get('email')?.trim() ??
            '';

          if (!email) {
            setStatus('error');
            setDetail('لم يُعثر على البريد. افتح الرابط من نفس المتصفح الذي طلبت منه رابط الدخول.');
            return;
          }

          await signInWithEmailLink(auth, email, href);
          window.localStorage.removeItem(FIREBASE_EMAIL_LINK_STORAGE_KEY);
          setStatus('success');
          setDetail('تم تسجيل الدخول عبر رابط البريد.');
          window.setTimeout(() => router.replace('/'), 1200);
          return;
        }

        setStatus('success');
        setDetail('مرحباً بك في إيصالك!');
        window.setTimeout(() => router.replace('/'), 1200);
      } catch (error) {
        setStatus('error');
        setDetail(error instanceof Error ? error.message : 'تعذّر إكمال التحقق.');
      }
    })();
  }, [router, searchParams]);

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-mistara-sand px-5 py-8"
      dir="rtl"
    >
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/12 blur-[100px]"
        aria-hidden
      />
      <div className="auth-shell-card relative mx-auto w-full max-w-sm space-y-4 glass-panel rounded-[2rem] p-8 text-center backdrop-blur-xl sm:max-w-md">
        <AppBrand size="hero" className="mx-auto" priority />

        {status === 'loading' && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="text-base text-mistara-brown">جاري التحقق...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/25">
              <svg className="h-8 w-8 text-primary-dark" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-base font-bold text-primary-dark">{detail ?? 'تم بنجاح!'}</p>
            <p className="text-sm text-mistara-brown/80">سيتم تحويلك إلى لوحة التحكم...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="text-base font-bold text-red-700">{detail}</p>
            <button
              type="button"
              onClick={() => router.replace('/')}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-black text-white"
            >
              العودة للرئيسية
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthBootScreen message="جاري تحميل صفحة التفعيل..." />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
