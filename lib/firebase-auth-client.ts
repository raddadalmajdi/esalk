'use client';

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuthClient, isFirebaseConfigured } from '@/lib/firebase';
import { getAuthCallbackUrl, assertValidEmailRedirectTo, getAppPublicUrl } from '@/lib/app-env';

export type FirebaseAuthUser = User;

export { getAuthCallbackUrl, assertValidEmailRedirectTo, getAppPublicUrl, isFirebaseConfigured };

export function getFirebaseAuth() {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) return null;
  return getFirebaseAuthClient();
}

export async function getFirebaseIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) return null;
  return auth.currentUser.getIdToken();
}

export async function firebaseSignInWithCustomToken(customToken: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth غير متاح.');
  return signInWithCustomToken(auth, customToken);
}

export async function firebaseSignInWithPassword(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth غير متاح.');
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function firebaseCreateUserWithEmailAndPassword(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth غير متاح.');
  return createUserWithEmailAndPassword(auth, email.trim(), password);
}

export async function firebaseSendEmailVerificationToUser(
  user: User,
  continueUrl?: string
): Promise<void> {
  const url = assertValidEmailRedirectTo(continueUrl ?? `${getAppPublicUrl()}/auth/callback`);
  await sendEmailVerification(user, {
    url,
    handleCodeInApp: false,
  });
}

export const FIREBASE_EMAIL_LINK_STORAGE_KEY = 'esalk.emailForSignIn';

export async function firebaseSendSignInLinkToEmail(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth غير متاح.');

  const continueUrl = assertValidEmailRedirectTo(`${getAppPublicUrl()}/auth/callback`);
  await sendSignInLinkToEmail(auth, email.trim(), {
    url: continueUrl,
    handleCodeInApp: true,
  });

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(FIREBASE_EMAIL_LINK_STORAGE_KEY, email.trim().toLowerCase());
  }
}

export function mapFirebaseAuthClientError(
  error: unknown,
  context: 'signup' | 'login' | 'otp' = 'login'
): { message: string; code?: string } {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: string }).code)
      : undefined;

  switch (code) {
    case 'auth/email-already-in-use':
      return { code, message: 'هذا البريد مسجّل مسبقاً. سجّل الدخول أو استخدم بريداً آخر.' };
    case 'auth/invalid-email':
      return { code, message: 'البريد الإلكتروني غير صالح.' };
    case 'auth/weak-password':
      return { code, message: 'كلمة المرور ضعيفة (6 أحرف على الأقل).' };
    case 'auth/user-not-found':
      return { code, message: 'لا يوجد حساب بهذا البريد.' };
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return { code, message: 'البريد أو كلمة المرور غير صحيحة.' };
    case 'auth/too-many-requests':
      return { code, message: 'محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.' };
    case 'auth/popup-closed-by-user':
      return { code, message: 'أغلقت نافذة تسجيل الدخول.' };
    case 'auth/account-exists-with-different-credential':
      return {
        code,
        message: 'هذا البريد مسجّل بطريقة أخرى. جرّب البريد وكلمة المرور أو نفس المزود السابق.',
      };
    case 'auth/operation-not-allowed':
      return { code, message: 'طريقة الدخول غير مفعّلة في Firebase Console.' };
    case 'auth/unauthorized-domain':
      return { code, message: 'النطاق غير مصرّح له في Firebase (Authorized domains).' };
    default:
      if (error instanceof Error && error.message) {
        return { code, message: error.message };
      }
      return {
        code,
        message:
          context === 'signup'
            ? 'تعذّر إنشاء الحساب. حاول مجدداً.'
            : 'تعذّر إتمام العملية. حاول مجدداً.',
      };
  }
}

/** يرسل رابط إعادة تعيين كلمة المرور إلى البريد (Firebase Auth). */
export async function firebaseSendPasswordResetEmail(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth غير متاح.');

  const continueUrl = assertValidEmailRedirectTo(`${getAppPublicUrl()}/auth/callback`);

  await sendPasswordResetEmail(auth, email.trim(), {
    url: continueUrl,
    handleCodeInApp: false,
  });
}

export function mapFirebasePasswordResetError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'البريد الإلكتروني غير صالح.';
    case 'auth/missing-email':
      return 'يرجى إدخال البريد الإلكتروني.';
    case 'auth/too-many-requests':
      return 'محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.';
    case 'auth/user-not-found':
      return 'لا يوجد حساب بهذا البريد. تحقق من العنوان أو أنشئ حساباً جديداً.';
    case 'auth/network-request-failed':
      return 'تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.';
    default:
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return 'تعذّر إرسال رابط الاستعادة. حاول لاحقاً.';
  }
}

export async function firebaseSignOut() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export function subscribeFirebaseAuth(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
}

export function isEmailVerifiedFirebaseUser(user: User | null | undefined): boolean {
  return Boolean(user?.emailVerified);
}
