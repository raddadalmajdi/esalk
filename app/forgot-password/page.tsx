'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { AppBrand } from '@/components/brand/AppBrand';
import { APP_TAGLINE } from '@/lib/brand';
import {
  firebaseSendPasswordResetEmail,
  isFirebaseConfigured,
  mapFirebasePasswordResetError,
} from '@/lib/firebase-auth-client';

type FormFeedback = { type: 'success' | 'error'; message: string } | null;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FormFeedback>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const configured = isFirebaseConfigured();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setSentTo(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'يرجى إدخال البريد الإلكتروني.' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFeedback({ type: 'error', message: 'صيغة البريد الإلكتروني غير صحيحة.' });
      return;
    }

    if (!configured) {
      setFeedback({
        type: 'error',
        message: 'إعداد Firebase غير مكتمل على هذا الخادم. تواصل مع الدعم.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await firebaseSendPasswordResetEmail(trimmed);
      setSentTo(trimmed);
      setFeedback({
        type: 'success',
        message:
          'إذا كان البريد مسجّلاً لدينا، ستصلك رسالة خلال دقائق. افتح الرابط في البريد لاختيار كلمة مرور جديدة.',
      });
    } catch (error) {
      setFeedback({ type: 'error', message: mapFirebasePasswordResetError(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      className="auth-page relative flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-mistara-sand text-mistara-espresso"
      dir="rtl"
    >
      <div
        className="pointer-events-none absolute -top-[20vh] left-1/2 h-[min(18rem,45vw)] w-[min(18rem,45vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-[20vh] left-1/2 h-[min(18rem,45vw)] w-[min(18rem,45vw)] -translate-x-1/2 rounded-full bg-primary/8 blur-[100px]"
        aria-hidden
      />

      <div className="auth-shell-card glass-panel relative mx-auto w-full backdrop-blur-xl">
        <div className="space-y-[clamp(1rem,4vw,1.5rem)]">
          <AppBrand size="hero" subtitle={APP_TAGLINE} priority className="w-full" />

          <div className="space-y-1 text-center">
            <h1 className="text-lg font-black text-mistara-espresso sm:text-xl">استعادة كلمة المرور</h1>
            <p className="text-[clamp(0.75rem,3.2vw,0.875rem)] leading-relaxed text-mistara-brown/80">
              أدخل بريدك الإلكتروني المرتبط بحسابك في إيصالك، وسنرسل لك رابطاً آمناً لإعادة التعيين.
            </p>
          </div>

          {!configured && (
            <AuthAlert
              type="error"
              message="متغيرات NEXT_PUBLIC_FIREBASE_* غير مضبوطة. لا يمكن إرسال رابط الاستعادة حالياً."
            />
          )}

          {feedback && <AuthAlert type={feedback.type} message={feedback.message} />}

          {sentTo && feedback?.type === 'success' && (
            <p
              className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-center text-xs font-bold text-mistara-brown sm:text-sm"
              dir="ltr"
            >
              {sentTo}
            </p>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-[clamp(0.875rem,3.5vw,1.125rem)]">
            <div>
              <label htmlFor="forgot-email" className="auth-field-label block">
                البريد الإلكتروني
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                required
                disabled={submitting || !configured}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (feedback) setFeedback(null);
                  if (sentTo) setSentTo(null);
                }}
                placeholder="name@example.com"
                className="auth-field-input"
                aria-invalid={feedback?.type === 'error'}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !configured}
              className="auth-primary-btn flex w-full items-center justify-center gap-2 rounded-2xl font-black transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none touch-manipulation"
            >
              {submitting && (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/25 border-t-primary-foreground"
                  aria-hidden
                />
              )}
              {submitting ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
            </button>
          </form>

          <div className="space-y-2 border-t border-mistara-brown/15 pt-3 text-center">
            <Link
              href="/"
              className="inline-block text-sm font-bold text-primary-dark underline underline-offset-2 decoration-primary/40 hover:text-primary"
            >
              ← العودة لتسجيل الدخول
            </Link>
            <p className="text-[11px] leading-relaxed text-mistara-brown/60">
              لم تصلك الرسالة؟ تحقق من مجلد «البريد غير المرغوب» أو انتظر دقيقتين ثم أعد المحاولة.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
