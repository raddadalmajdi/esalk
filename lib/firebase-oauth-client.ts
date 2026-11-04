'use client';

import {
  GoogleAuthProvider,
  OAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential,
} from 'firebase/auth';
import { getFirebaseAuth, mapFirebaseAuthClientError } from '@/lib/firebase-auth-client';

export type OAuthProviderId = 'google' | 'apple';

function buildGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

function buildAppleProvider(): OAuthProvider {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  return provider;
}

function providerInstance(id: OAuthProviderId) {
  return id === 'google' ? buildGoogleProvider() : buildAppleProvider();
}

async function signInWithPopupOrRedirect(
  id: OAuthProviderId
): Promise<UserCredential | null> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth غير متاح.');

  const provider = providerInstance(id);

  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export async function firebaseSignInWithGoogle(): Promise<UserCredential | null> {
  return signInWithPopupOrRedirect('google');
}

export async function firebaseSignInWithApple(): Promise<UserCredential | null> {
  return signInWithPopupOrRedirect('apple');
}

/** يُستدعى عند boot التطبيق لإكمال signInWithRedirect. */
export async function firebaseCompleteOAuthRedirectIfPending(): Promise<UserCredential | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  try {
    return await getRedirectResult(auth);
  } catch {
    return null;
  }
}

export function mapFirebaseOAuthError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'أغلقت نافذة تسجيل الدخول. حاول مجدداً.';
    case 'auth/cancelled-popup-request':
      return 'طلب تسجيل الدخول السابق ما زال قيد التنفيذ. انتظر ثم حاول.';
    case 'auth/account-exists-with-different-credential':
      return 'هذا البريد مسجّل بطريقة أخرى (مثلاً كلمة مرور). استخدم نفس طريقة التسجيل السابقة.';
    case 'auth/operation-not-allowed':
      return 'مزود الدخول غير مفعّل في Firebase Console.';
    case 'auth/unauthorized-domain':
      return 'النطاق غير مصرّح له في Firebase (Authorized domains).';
    default:
      return mapFirebaseAuthClientError(error, 'login').message;
  }
}
