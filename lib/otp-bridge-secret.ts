import { createHmac } from 'crypto';
import { getFirebaseServiceAccount } from '@/lib/firebase-service-account';

const DERIVE_SALT = 'esalk-otp-bridge-v1';

/**
 * سر توقيع جسر OTP (HttpOnly cookie بين sign-up و verify-otp).
 * على Vercel: إن لم يُضبط OTP_BRIDGE_SECRET يُشتقّ تلقائياً من FIREBASE_SERVICE_ACCOUNT_KEY.
 */
export function resolveOtpBridgeSigningSecret(): string {
  const explicit = process.env.OTP_BRIDGE_SECRET?.trim();
  if (explicit) return explicit;

  const serviceAccount = getFirebaseServiceAccount();
  if (serviceAccount?.private_key && serviceAccount.project_id) {
    return createHmac('sha256', DERIVE_SALT)
      .update(`${serviceAccount.project_id}:${serviceAccount.private_key}`)
      .digest('base64url');
  }

  throw new Error(
    'OTP_BRIDGE_SECRET أو FIREBASE_SERVICE_ACCOUNT_KEY مطلوب لتوقيع جسر OTP على الخادم.'
  );
}

export function isOtpBridgeConfigured(): boolean {
  try {
    resolveOtpBridgeSigningSecret();
    return true;
  } catch {
    return false;
  }
}
