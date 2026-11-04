'use client';

import {
  onAuthStateChanged,
  sendPasswordResetEmail,
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
