'use client';

import { AUTH_CONFIRMATION_LINK_HINT } from '@/lib/auth-confirmation-copy';
import { AuthAlert } from '@/components/auth/AuthAlert';

type AuthFeedback = { type: 'success' | 'error'; message: string } | null;

type AuthConfirmationPanelProps = {
  email: string;
  authFeedback: AuthFeedback;
  authSubmitting: boolean;
  otpResendCooldown: number;
  onResend: () => void;
  onCheckEmailVerified: () => void;
  onBack: () => void;
};

function formatCooldown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safe % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function AuthConfirmationPanel({
  email,
  authFeedback,
  authSubmitting,
  otpResendCooldown,
  onResend,
  onCheckEmailVerified,
  onBack,
}: AuthConfirmationPanelProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2.5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25 shadow-[0_0_25px_-5px_rgba(23,70,158,0.35)]">
          <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3.5 8.5 12 14l8.5-5.5M4.5 6.5h15A1.5 1.5 0 0 1 21 8v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17V8a1.5 1.5 0 0 1 1.5-1.5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-[clamp(1.125rem,4.8vw,1.5rem)] font-black text-mistara-espresso">
          فعّل بريدك الإلكتروني
        </h2>
        <p className="text-sm text-mistara-brown/80 leading-relaxed">
          أرسلنا رابط تفعيل عبر <span className="font-bold">Firebase</span> إلى
          <br />
          <span className="font-mono text-primary-dark font-bold" dir="ltr">
            {email}
          </span>
        </p>
      </div>

      {authFeedback && <AuthAlert type={authFeedback.type} message={authFeedback.message} />}

      <ol className="space-y-2 rounded-xl border border-primary/15 bg-white/60 px-4 py-3 text-xs font-bold leading-relaxed text-mistara-brown/85">
        <li>1. افتح البريد واضغط رابط التفعيل.</li>
        <li>2. عد إلى هذه الصفحة واضغط الزر أدناه.</li>
        <li>3. سجّل الدخول بكلمة المرور التي اخترتها.</li>
      </ol>

      <button
        type="button"
        disabled={authSubmitting}
        onClick={() => void onCheckEmailVerified()}
        className="auth-primary-btn flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {authSubmitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/25 border-t-primary-foreground" />
        )}
        {authSubmitting ? 'جاري التحقق...' : 'فعّلت بريدي — تسجيل الدخول'}
      </button>

      <div className="flex items-center justify-center">
        {otpResendCooldown > 0 ? (
          <p className="text-sm text-mistara-brown/60" dir="ltr">
            <span dir="rtl">إعادة إرسال الرابط خلال</span>{' '}
            <span className="font-mono font-bold text-primary text-base tnum">
              {formatCooldown(otpResendCooldown)}
            </span>
          </p>
        ) : (
          <button
            type="button"
            disabled={authSubmitting}
            onClick={() => void onResend()}
            className="text-sm font-bold text-primary disabled:text-mistara-brown/50 py-1 underline-offset-4 hover:underline"
          >
            لم يصلك الرابط؟ إعادة الإرسال
          </button>
        )}
      </div>

      <p className="text-xs text-mistara-brown/60 text-center leading-relaxed">{AUTH_CONFIRMATION_LINK_HINT}</p>

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-2xl bg-mistara-beige/80 hover:bg-mistara-beige py-3 text-sm text-mistara-espresso font-bold transition-colors border border-primary/10"
      >
        تعديل البريد أو العودة
      </button>
    </div>
  );
}
