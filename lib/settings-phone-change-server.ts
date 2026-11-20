import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';
import { storeOtpSession, verifyOtpSession, OtpSessionStoreError } from '@/lib/firebase-otp-server';
import { isOtpBridgeConfigured } from '@/lib/otp-bridge-secret';
import { isResendConfigured, sendPhoneChangeOtpEmail } from '@/lib/resend';
import { logServerException } from '@/lib/server-error-log';

const GRANT_TTL_MS = 15 * 60 * 1000;

export function normalizeMerchantPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function grantDocRef(userId: string) {
  return getFirebaseAdminFirestore().collection('phone_change_grants').doc(userId);
}

export async function storePhoneChangeGrant(userId: string, phone: string): Promise<void> {
  const normalized = normalizeMerchantPhone(phone);
  if (normalized.length < 8) {
    throw new Error('رقم المحل غير صالح.');
  }
  await grantDocRef(userId).set({
    userId,
    phone: normalized,
    expiresAt: Date.now() + GRANT_TTL_MS,
    createdAt: Date.now(),
  });
}

export async function consumePhoneChangeGrant(
  userId: string,
  phone: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const normalized = normalizeMerchantPhone(phone);
  const snap = await grantDocRef(userId).get();
  if (!snap.exists) {
    return {
      ok: false,
      message: 'يجب تأكيد تغيير الرقم برمز يصل إلى بريدك قبل الحفظ.',
    };
  }

  const data = snap.data() as { phone?: string; expiresAt?: number };
  if (data.phone !== normalized) {
    return {
      ok: false,
      message: 'رمز التأكيد لا يطابق الرقم المُدخل. أعد إرسال الرمز بعد تعديل الرقم.',
    };
  }

  if (typeof data.expiresAt === 'number' && Date.now() > data.expiresAt) {
    await grantDocRef(userId).delete().catch(() => undefined);
    return { ok: false, message: 'انتهت صلاحية التأكيد. أرسل رمزاً جديداً إلى بريدك.' };
  }

  await grantDocRef(userId).delete().catch(() => undefined);
  return { ok: true };
}

export type SendPhoneChangeOtpResult =
  | { ok: true }
  | { ok: false; code: string; message: string; status: number };

export async function sendMerchantPhoneChangeOtp(params: {
  userId: string;
  email: string;
}): Promise<SendPhoneChangeOtpResult> {
  const email = params.email.trim().toLowerCase();
  if (!email) {
    return { ok: false, code: 'no_email', message: 'لا يوجد بريد مرتبط بالحساب.', status: 400 };
  }

  if (!isResendConfigured()) {
    return {
      ok: false,
      code: 'resend_not_configured',
      message: 'خدمة إرسال رمز التأكيد غير متاحة حالياً. حاول لاحقاً.',
      status: 501,
    };
  }

  if (!isOtpBridgeConfigured()) {
    return {
      ok: false,
      code: 'otp_bridge_not_configured',
      message: 'إعداد التحقق على الخادم غير مكتمل.',
      status: 501,
    };
  }

  let otpSession;
  try {
    otpSession = await storeOtpSession({
      email,
      userId: params.userId,
      purpose: 'phone_change',
    });
  } catch (error) {
    logServerException('settings-phone-change/storeOtpSession', error, { email });
    if (error instanceof OtpSessionStoreError) {
      return {
        ok: false,
        code: 'otp_store_failed',
        message: 'تعذّر توليد رمز التأكيد.',
        status: 500,
      };
    }
    return { ok: false, code: 'otp_unavailable', message: 'تعذّر إرسال الرمز.', status: 500 };
  }

  try {
    await sendPhoneChangeOtpEmail({ to: email, otp: otpSession.deliveryOtp });
  } catch (error) {
    logServerException('settings-phone-change/resend', error, { email });
    return {
      ok: false,
      code: 'email_send_failed',
      message: 'تعذّر إرسال الرمز إلى بريدك. تحقق من صندوق الوارد أو حاول لاحقاً.',
      status: 502,
    };
  }

  return { ok: true };
}

export async function verifyMerchantPhoneChangeOtp(params: {
  userId: string;
  email: string;
  code: string;
  phone: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const verified = await verifyOtpSession({ email: params.email, code: params.code });
  if (!verified.ok) {
    return { ok: false, message: verified.message };
  }
  if (verified.userId !== params.userId) {
    return { ok: false, message: 'رمز التأكيد لا يطابق حسابك.' };
  }

  try {
    await storePhoneChangeGrant(params.userId, params.phone);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذّر حفظ التأكيد.';
    return { ok: false, message };
  }

  return { ok: true };
}