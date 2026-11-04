'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppBrand } from '@/components/brand/AppBrand';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { getAppPublicUrl } from '@/lib/firebase-auth-client';
import {
  exposeFirebaseEmailVerificationTrialOnWindow,
  firebaseTrialRegisterAndSendVerification,
} from '@/lib/firebase-auth-verification-trial';

export function FirebaseEmailVerificationTrialClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    exposeFirebaseEmailVerificationTrialOnWindow();
  }, []);

  const handleRun = async (event: React.FormEvent) => {
    event.preventDefault();
    setResult(null);
    setRunning(true);
    const outcome = await firebaseTrialRegisterAndSendVerification(email, password);
    setRunning(false);
    if (outcome.ok) {
      setResult({
        type: 'success',
        message: `تم إرسال بريد التحقق إلى ${outcome.email}. راجع وحدة التحكم (Console) للتفاصيل.`,
      });
    } else {
      setResult({ type: 'error', message: outcome.message });
    }
  };

  return (
    <main
      className="relative flex min-h-[100dvh] flex-col justify-center bg-mistara-sand px-4 py-8 text-mistara-espresso"
      dir="rtl"
    >
      <div className="auth-shell-card glass-panel mx-auto w-full max-w-md space-y-4 backdrop-blur-xl">
        <AppBrand size="sm" showTitle subtitle={null} />
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
          DEV فقط — يُنشئ مستخدماً حقيقياً في Firebase ويرسل sendEmailVerification. افتح Console في
          المتصفح.
        </p>
        <p className="text-xs text-mistara-brown/75">
          continueUrl: <span dir="ltr">{getAppPublicUrl()}/auth/callback</span>
        </p>

        {result && <AuthAlert type={result.type} message={result.message} />}

        <form onSubmit={(e) => void handleRun(e)} className="space-y-3">
          <div>
            <label htmlFor="trial-email" className="auth-field-label block">
              بريد تجريبي
            </label>
            <input
              id="trial-email"
              type="email"
              required
              className="auth-field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={running}
            />
          </div>
          <div>
            <label htmlFor="trial-password" className="auth-field-label block">
              كلمة مرور (6+)
            </label>
            <input
              id="trial-password"
              type="password"
              required
              minLength={6}
              className="auth-field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={running}
            />
          </div>
          <button
            type="submit"
            disabled={running}
            className="auth-primary-btn w-full rounded-2xl font-black disabled:opacity-50"
          >
            {running ? 'جاري التسجيل والإرسال...' : 'تجربة التسجيل + sendEmailVerification'}
          </button>
        </form>

        <p className="text-[11px] leading-relaxed text-mistara-brown/65">
          من Console:{' '}
          <code dir="ltr" className="rounded bg-mistara-cream px-1">
            await __esalkFirebaseEmailVerificationTrial(&quot;you@mail.com&quot;, &quot;pass123&quot;)
          </code>
        </p>

        <Link href="/" className="block text-center text-sm font-bold text-primary underline">
          ← الرئيسية
        </Link>
      </div>
    </main>
  );
}
