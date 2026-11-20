'use client';

import { useCallback, useState } from 'react';
import { getFirebaseIdToken } from '@/lib/firebase-auth-client';
import { OTP_CODE_LENGTH } from '@/lib/otp-config';

type ShopPhoneOtpGateProps = {
  accountEmail: string | null;
  fullPhone: string;
  verifiedForPhone: string | null;
  onVerified: (fullPhone: string) => void;
  onClearVerification: () => void;
};

export function ShopPhoneOtpGate({
  accountEmail,
  fullPhone,
  verifiedForPhone,
  onVerified,
  onClearVerification,
}: ShopPhoneOtpGateProps) {
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'info' | 'error' | 'success'>('info');

  const isVerified = verifiedForPhone === fullPhone && Boolean(fullPhone);

  const sendOtp = useCallback(async () => {
    setMessage(null);
    setSending(true);
    try {
      const token = await getFirebaseIdToken();
      if (!token) {
        setMessageTone('error');
        setMessage('سجّل الدخول ثم أعد المحاولة.');
        return;
      }
      const res = await fetch('/api/settings/phone-change/send-otp', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setMessageTone('error');
        setMessage(data.message ?? 'تعذّر إرسال الرمز.');
        onClearVerification();
        return;
      }
      setMessageTone('success');
      setMessage(data.message ?? 'أُرسل الرمز إلى بريدك.');
    } catch {
      setMessageTone('error');
      setMessage('تعذّر الاتصال بالخادم.');
    } finally {
      setSending(false);
    }
  }, [onClearVerification]);

  const verifyOtp = useCallback(async () => {
    setMessage(null);
    setVerifying(true);
    try {
      const token = await getFirebaseIdToken();
      if (!token) {
        setMessageTone('error');
        setMessage('سجّل الدخول ثم أعد المحاولة.');
        return;
      }
      const res = await fetch('/api/settings/phone-change/verify-otp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, phone: fullPhone }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setMessageTone('error');
        setMessage(data.message ?? 'رمز غير صحيح.');
        onClearVerification();
        return;
      }
      setMessageTone('success');
      setMessage(data.message ?? 'تم التأكيد.');
      onVerified(fullPhone);
      setCode('');
    } catch {
      setMessageTone('error');
      setMessage('تعذّر التحقق من الرمز.');
    } finally {
      setVerifying(false);
    }
  }, [code, fullPhone, onClearVerification, onVerified]);

  if (isVerified) {
    return (
      <p className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary-dark">
        تم تأكيد الرقم الجديد عبر بريدك — اضغط «حفظ الإعدادات» أدناه.
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-amber-500/35 bg-amber-50/80 px-3 py-3">
      <p className="text-xs font-bold leading-relaxed text-amber-950/90">
        تغيير رقم المحل يتطلب رمزاً يُرسل إلى{' '}
        {accountEmail ? (
          <span className="tnum font-black" dir="ltr">
            {accountEmail}
          </span>
        ) : (
          'بريد حسابك'
        )}
        .
      </p>
      <SendOtpButton sendOtp={sendOtp} sending={sending} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_CODE_LENGTH}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))}
          placeholder={`رمز ${OTP_CODE_LENGTH} أرقام`}
          className="auth-field-input tnum flex-1 text-center font-mono"
          dir="ltr"
        />
        <button
          type="button"
          disabled={verifying || code.length !== OTP_CODE_LENGTH}
          onClick={() => void verifyOtp()}
          className="auth-primary-btn shrink-0 rounded-xl px-4 py-2.5 text-sm font-black disabled:opacity-50"
        >
          {verifying ? 'جاري التحقق…' : 'تأكيد الرمز'}
        </button>
      </div>
      {message ? (
        <p
          className={`text-xs font-bold ${
            messageTone === 'error'
              ? 'text-red-800'
              : messageTone === 'success'
                ? 'text-primary-dark'
                : 'text-mistara-brown/80'
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function SendOtpButton({ sendOtp, sending }: { sendOtp: () => void; sending: boolean }) {
  return (
    <button
      type="button"
      disabled={sending}
      onClick={() => void sendOtp()}
      className="w-full rounded-xl border border-primary/30 bg-white py-2.5 text-xs font-black text-primary-dark disabled:opacity-50"
    >
      {sending ? 'جاري الإرسال…' : 'إرسال رمز التأكيد إلى البريد'}
    </button>
  );
}