'use client';

import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import {
  assertValidEmailRedirectTo,
  getAppPublicUrl,
  getFirebaseAuth,
  isFirebaseConfigured,
} from '@/lib/firebase-auth-client';

const LOG_PREFIX = '[esalk:firebase-email-verification-trial]';

export type FirebaseEmailVerificationTrialResult =
  | { ok: true; uid: string; email: string; continueUrl: string }
  | { ok: false; message: string; code?: string };

function mapTrialError(error: unknown): { message: string; code?: string } {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: string }).code)
      : undefined;

  switch (code) {
    case 'auth/email-already-in-use':
      return {
        code,
        message: 'البريد مسجّل مسبقاً. احذف المستخدم من Firebase أو استخدم بريداً تجريبياً آخر.',
      };
    case 'auth/invalid-email':
      return { code, message: 'البريد الإلكتروني غير صالح.' };
    case 'auth/weak-password':
      return { code, message: 'كلمة المرور ضعيفة (6 أحرف على الأقل).' };
    case 'auth/operation-not-allowed':
      return { code, message: 'تسجيل Email/Password غير مفعّل في Firebase Console.' };
    case 'auth/network-request-failed':
      return { code, message: 'فشل الاتصال بالشبكة.' };
    default:
      return {
        code,
        message: error instanceof Error ? error.message : 'خطأ غير معروف أثناء التجربة.',
      };
  }
}

/**
 * تجربة تسجيل مستخدم جديد وإرسال بريد التحقق عبر Firebase (sendEmailVerification).
 * النتائج تُطبَع في وحدة التحكم — للتطوير واختبار قوالب Firebase / النطاق المخصص.
 */
export async function firebaseTrialRegisterAndSendVerification(
  email: string,
  password: string
): Promise<FirebaseEmailVerificationTrialResult> {
  if (!isFirebaseConfigured()) {
    const message = 'Firebase غير مضبوط (NEXT_PUBLIC_FIREBASE_*).';
    console.error(LOG_PREFIX, 'FAIL', message);
    return { ok: false, message };
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    const message = 'Firebase Auth غير متاح في المتصفح.';
    console.error(LOG_PREFIX, 'FAIL', message);
    return { ok: false, message };
  }

  const trimmedEmail = email.trim();
  const continueUrl = assertValidEmailRedirectTo(`${getAppPublicUrl()}/auth/callback`);

  console.info(LOG_PREFIX, 'start', {
    email: trimmedEmail,
    continueUrl,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  });

  try {
    const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    const { user } = credential;

    console.info(LOG_PREFIX, 'userCreated', { uid: user.uid, email: user.email });

    await sendEmailVerification(user, {
      url: continueUrl,
      handleCodeInApp: false,
    });

    console.info(LOG_PREFIX, 'SUCCESS sendEmailVerification dispatched', {
      uid: user.uid,
      email: user.email,
      continueUrl,
      note: 'تحقق من صندوق الوارد وقالب Email address verification في Firebase.',
    });

    await signOut(auth).catch(() => undefined);
    console.info(LOG_PREFIX, 'signedOut after trial (session cleared)');

    return {
      ok: true,
      uid: user.uid,
      email: user.email ?? trimmedEmail,
      continueUrl,
    };
  } catch (error) {
    const mapped = mapTrialError(error);
    console.error(LOG_PREFIX, 'FAIL', mapped.code ?? 'error', mapped.message, error);
    return { ok: false, message: mapped.message, code: mapped.code };
  }
}

/** يُعرَض على window في صفحة التطوير لاستدعاء التجربة من وحدة التحكم. */
export function exposeFirebaseEmailVerificationTrialOnWindow(): void {
  if (typeof window === 'undefined') return;
  const w = window as Window & {
    __esalkFirebaseEmailVerificationTrial?: typeof firebaseTrialRegisterAndSendVerification;
  };
  w.__esalkFirebaseEmailVerificationTrial = firebaseTrialRegisterAndSendVerification;
  console.info(
    LOG_PREFIX,
    'ready — استدعِ: await __esalkFirebaseEmailVerificationTrial("test@example.com", "secret123")'
  );
}
