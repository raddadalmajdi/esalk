'use client';

import type { AuthErrorLike } from '@/lib/auth-errors';
import {
  firebaseCreateUserWithEmailAndPassword,
  firebaseSendEmailVerificationToUser,
  firebaseSignOut,
  getAuthCallbackUrl,
  getFirebaseIdToken,
  isFirebaseConfigured,
  mapFirebaseAuthClientError,
} from '@/lib/firebase-auth-client';
import type { SignUpExecutionResult, SignUpSessionStub } from '@/lib/auth-sign-up';

async function ensureOrganizationAfterSignUp(params: {
  userId: string;
  email: string;
  accessToken: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch('/api/auth/ensure-organization', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      userId: params.userId,
      email: params.email,
    }),
  });

  const json = (await res.json()) as { ok?: boolean; message?: string };
  if (!res.ok || !json.ok) {
    return {
      ok: false,
      message: json.message ?? 'تعذّر إعداد محلّك بعد التسجيل.',
    };
  }
  return { ok: true };
}

/** تسجيل عبر Firebase Auth في المتصفح + بريد التحقق (بدون Resend). */
export async function executeFirebaseClientSignUp(params: {
  email: string;
  password: string;
  emailRedirectTo: string;
}): Promise<SignUpExecutionResult> {
  const emailRedirectTo = params.emailRedirectTo;

  if (!isFirebaseConfigured()) {
    return {
      data: null,
      error: {
        message: 'إعداد Firebase غير مكتمل (NEXT_PUBLIC_FIREBASE_*).',
        code: 'firebase_not_configured',
      },
      emailRedirectTo,
    };
  }

  const email = params.email.trim().toLowerCase();
  const password = params.password;

  try {
    const credential = await firebaseCreateUserWithEmailAndPassword(email, password);
    const user = credential.user;

    const accessToken = await getFirebaseIdToken();
    if (!accessToken) {
      await firebaseSignOut().catch(() => undefined);
      return {
        data: null,
        error: { message: 'تعذّر الحصول على جلسة بعد التسجيل.', code: 'internal_error' },
        emailRedirectTo,
      };
    }

    const org = await ensureOrganizationAfterSignUp({
      userId: user.uid,
      email,
      accessToken,
    });

    if (!org.ok) {
      await firebaseSignOut().catch(() => undefined);
      return {
        data: null,
        error: { message: org.message, code: 'organization_failed' },
        emailRedirectTo,
      };
    }

    const continueUrl = getAuthCallbackUrl();
    await firebaseSendEmailVerificationToUser(user, continueUrl);

    await firebaseSignOut().catch(() => undefined);

    const stub: SignUpSessionStub = {
      user: {
        id: user.uid,
        email: user.email ?? email,
        emailVerified: false,
      },
      session: null,
    };

    return {
      data: stub,
      error: null,
      emailRedirectTo,
      emailSentViaFirebase: true,
    };
  } catch (error) {
    const mapped = mapFirebaseAuthClientError(error, 'signup');
    return {
      data: null,
      error: mapped as AuthErrorLike,
      emailRedirectTo,
    };
  }
}

/** إعادة إرسال بريد التحقق (يتطلب كلمة المرور لإعادة الدخول المؤقت). */
export async function resendFirebaseSignupVerificationEmail(params: {
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { firebaseSignInWithPassword } = await import('@/lib/firebase-auth-client');
    const credential = await firebaseSignInWithPassword(params.email, params.password);
    await firebaseSendEmailVerificationToUser(credential.user, getAuthCallbackUrl());
    await firebaseSignOut().catch(() => undefined);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: mapFirebaseAuthClientError(error, 'signup').message ?? 'تعذّر إعادة الإرسال.',
    };
  }
}
