'use client';

import { useEffect, useState } from 'react';
import { mapAuthErrorToArabic } from '@/lib/auth-errors';
import { resolveSignUpFlow } from '@/lib/auth-handler';
import { logAuthRedirectDiagnostics } from '@/lib/auth-debug';
import { executeSignUp } from '@/lib/auth-sign-up';
import { resendFirebaseSignupVerificationEmail } from '@/lib/auth-sign-up-firebase-client';
import { checkEmailRegistered } from '@/lib/check-email-api';
import { DUPLICATE_EMAIL_MESSAGE, isDuplicateEmailMessage } from '@/lib/check-email-registered';
import {
  firebaseSendSignInLinkToEmail,
  firebaseSignInWithPassword,
  firebaseSignOut,
  getAuthCallbackUrl,
  isFirebaseConfigured,
  isEmailVerifiedFirebaseUser,
  mapFirebaseAuthClientError,
} from '@/lib/firebase-auth-client';
import { isEmailVerifiedUser } from '@/lib/auth-confirmation-guard';
import {
  AUTH_CONFIRMATION_RESENT,
  AUTH_CONFIRMATION_SENT,
  AUTH_LOGIN_LINK_SENT,
  AUTH_UNCONFIRMED_LOGIN,
} from '@/lib/auth-confirmation-copy';
import {
  firebaseSignInWithApple,
  firebaseSignInWithGoogle,
  mapFirebaseOAuthError,
  type OAuthProviderId,
} from '@/lib/firebase-oauth-client';
import type { AuthFeedback } from '@/lib/home/types';

type UseAuthFlowOptions = {
  refreshOrganization: () => Promise<void>;
  onVerified: () => void;
};

export function useAuthFlow({ refreshOrganization, onVerified }: UseAuthFlowOptions) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [authPhase, setAuthPhase] = useState<'form' | 'confirm'>('form');
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [authFeedback, setAuthFeedback] = useState<AuthFeedback>(null);
  const [emailDuplicateError, setEmailDuplicateError] = useState<string | null>(null);
  const [emailCheckPending, setEmailCheckPending] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [devDeleteStatus, setDevDeleteStatus] = useState<string | null>(null);
  const [devDeleteLoading, setDevDeleteLoading] = useState(false);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<OAuthProviderId | null>(null);

  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setOtpResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpResendCooldown]);

  const switchAuthMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    setLoginMethod('password');
    setAuthPhase('form');
    setAuthFeedback(null);
    setEmailDuplicateError(null);
    setPassword('');
    setAuthSubmitting(false);
  };

  const beginConfirmationPhase = (successMessage?: string) => {
    setAuthPhase('confirm');
    setAuthFeedback({
      type: 'success',
      message: successMessage ?? AUTH_CONFIRMATION_SENT,
    });
    setOtpResendCooldown(60);
  };

  const handleSendLoginOtp = async () => {
    if (!isFirebaseConfigured()) return;
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setAuthFeedback({ type: 'error', message: 'أدخل بريدك الإلكتروني أولاً.' });
      return;
    }

    setAuthSubmitting(true);
    setAuthFeedback(null);
    try {
      await firebaseSendSignInLinkToEmail(trimmedEmail);
      setAuthFeedback({ type: 'success', message: AUTH_LOGIN_LINK_SENT });
      setOtpResendCooldown(60);
    } catch (error) {
      setAuthFeedback({
        type: 'error',
        message: mapFirebaseAuthClientError(error, 'login').message,
      });
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResendVerificationLink = async () => {
    if (!isFirebaseConfigured() || otpResendCooldown > 0) return;
    if (!password) {
      setAuthFeedback({
        type: 'error',
        message: 'أدخل كلمة المرور في الخطوة السابقة لإعادة إرسال رابط التفعيل.',
      });
      return;
    }

    setAuthSubmitting(true);
    setAuthFeedback(null);
    try {
      const result = await resendFirebaseSignupVerificationEmail({
        email: email.trim().toLowerCase(),
        password,
      });
      if (!result.ok) {
        setAuthFeedback({ type: 'error', message: result.message });
        return;
      }
      setAuthFeedback({ type: 'success', message: AUTH_CONFIRMATION_RESENT });
      setOtpResendCooldown(60);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleOAuthSignIn = async (provider: OAuthProviderId) => {
    if (!isFirebaseConfigured()) return;

    setOauthLoadingProvider(provider);
    setAuthSubmitting(true);
    setAuthFeedback(null);

    try {
      const result =
        provider === 'google'
          ? await firebaseSignInWithGoogle()
          : await firebaseSignInWithApple();

      if (result === null) {
        setAuthFeedback({
          type: 'success',
          message: 'جاري تحويلك إلى صفحة Google/Apple… أكمل الدخول هناك.',
        });
        return;
      }

      await refreshOrganization();
      setAuthFeedback({
        type: 'success',
        message:
          provider === 'google'
            ? 'تم تسجيل الدخول بحساب Google بنجاح.'
            : 'تم تسجيل الدخول بحساب Apple بنجاح.',
      });
      onVerified();
      setPassword('');
    } catch (error) {
      setAuthFeedback({
        type: 'error',
        message: mapFirebaseOAuthError(error),
      });
    } finally {
      setOauthLoadingProvider(null);
      setAuthSubmitting(false);
    }
  };

  const handleCheckEmailVerified = async () => {
    if (!isFirebaseConfigured()) return;
    if (!email.trim() || !password) {
      setAuthFeedback({
        type: 'error',
        message: 'أدخل البريد وكلمة المرور في الخطوة السابقة ثم حاول مجدداً.',
      });
      return;
    }

    setAuthSubmitting(true);
    setAuthFeedback(null);
    try {
      const credential = await firebaseSignInWithPassword(email.trim(), password);
      await credential.user.reload();

      if (!isEmailVerifiedFirebaseUser(credential.user)) {
        await firebaseSignOut().catch(() => undefined);
        setAuthFeedback({
          type: 'error',
          message:
            'البريد لم يُفعَّل بعد. افتح رابط التفعيل في بريدك (تحقق من Spam) ثم حاول مجدداً.',
        });
        return;
      }

      setAuthFeedback({ type: 'success', message: 'تم تفعيل بريدك وتسجيل الدخول بنجاح.' });
      await refreshOrganization();
      onVerified();
      setAuthPhase('form');
      setPassword('');
    } catch (error) {
      setAuthFeedback({
        type: 'error',
        message: mapAuthErrorToArabic(mapFirebaseAuthClientError(error, 'login'), 'login'),
      });
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFirebaseConfigured()) {
      setAuthFeedback({
        type: 'error',
        message:
          'إعداد Firebase غير مكتمل. أضف متغيرات NEXT_PUBLIC_FIREBASE_* في Vercel ثم أعد النشر.',
      });
      return;
    }

    if (!isSignUp && loginMethod === 'otp') {
      await handleSendLoginOtp();
      return;
    }

    const trimmedEmail = email.trim();

    if (isSignUp && (!trimmedEmail || !password)) {
      setAuthFeedback({ type: 'error', message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' });
      return;
    }

    if (!isSignUp && loginMethod === 'password' && (!trimmedEmail || !password)) {
      setAuthFeedback({ type: 'error', message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' });
      return;
    }

    setAuthSubmitting(true);
    setAuthFeedback(null);

    try {
      let redirectTo: string;
      try {
        redirectTo = getAuthCallbackUrl();
      } catch (redirectError) {
        setAuthFeedback({
          type: 'error',
          message:
            redirectError instanceof Error
              ? redirectError.message
              : 'تعذّر تجهيز إعداد التسجيل. تحقق من NEXT_PUBLIC_APP_URL.',
        });
        return;
      }

      if (isSignUp) {
        const normalizedEmail = trimmedEmail.toLowerCase();
        setEmailCheckPending(true);
        const emailCheck = await checkEmailRegistered(normalizedEmail);
        setEmailCheckPending(false);

        if (!emailCheck.ok) {
          setAuthFeedback({ type: 'error', message: emailCheck.message });
          return;
        }

        if (emailCheck.exists) {
          setEmailDuplicateError(DUPLICATE_EMAIL_MESSAGE);
          return;
        }

        setEmailDuplicateError(null);
        logAuthRedirectDiagnostics(redirectTo);

        let signUpResult;
        try {
          signUpResult = await executeSignUp({
            email: normalizedEmail,
            password,
            emailRedirectTo: redirectTo,
          });
        } catch (signUpError) {
          console.error('[signUp]', signUpError);
          setAuthFeedback({
            type: 'error',
            message:
              signUpError instanceof Error
                ? signUpError.message
                : 'تعذّر إنشاء الحساب. حاول مجدداً.',
          });
          return;
        }

        const { data, error, recoveredAfterServerError, emailSentViaFirebase } = signUpResult;
        const flow = resolveSignUpFlow(data, error, {
          emailRedirectTo: redirectTo,
          recoveredAfterServerError,
        });

        if (flow.kind === 'error') {
          if (isDuplicateEmailMessage(flow.message)) {
            setEmailDuplicateError(DUPLICATE_EMAIL_MESSAGE);
            setAuthFeedback(null);
          } else {
            setAuthFeedback({ type: 'error', message: flow.message });
          }
          setPassword('');
          return;
        }

        if (flow.kind === 'logged_in') {
          setAuthFeedback({
            type: 'success',
            message: 'تم إنشاء حسابك وتسجيل دخولك بنجاح.',
          });
          onVerified();
          setPassword('');
          return;
        }

        const confirmMessage = emailSentViaFirebase
          ? AUTH_CONFIRMATION_SENT
          : recoveredAfterServerError
            ? 'تم إنشاء حسابك، لكن إرسال رابط التفعيل قد يكون فشل. استخدم «إعادة الإرسال».'
            : undefined;

        beginConfirmationPhase(confirmMessage);
        return;
      }

      try {
        const credential = await firebaseSignInWithPassword(trimmedEmail, password);
        const signedInUser = credential.user;

        if (!isEmailVerifiedUser(signedInUser)) {
          await firebaseSignOut().catch(() => undefined);
          beginConfirmationPhase();
          setAuthFeedback({ type: 'success', message: AUTH_UNCONFIRMED_LOGIN });
          return;
        }

        setAuthFeedback({ type: 'success', message: 'تم التحقق من بياناتك وتسجيل الدخول بنجاح.' });
        await refreshOrganization();
        onVerified();
        setPassword('');
      } catch (loginError: unknown) {
        const err = loginError as { message?: string; code?: string } | null;
        const authError = err
          ? { message: err.message ?? 'فشل تسجيل الدخول.', code: err.code ?? '' }
          : null;

        setAuthFeedback({
          type: 'error',
          message: mapAuthErrorToArabic(authError, 'login'),
        });
      }
    } catch (unexpected) {
      console.error('[handleAuth]', unexpected);
      setAuthFeedback({
        type: 'error',
        message: 'حدث خطأ غير متوقع أثناء المعالجة. حاول مجدداً.',
      });
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleDevDeleteAuthUser = async () => {
    const targetEmail = 'rraddad@hotmail.com';
    if (!window.confirm(`[DEV] حذف نهائي للمستخدم ${targetEmail} من Firebase Auth؟`)) {
      return;
    }

    setDevDeleteLoading(true);
    setDevDeleteStatus(null);
    try {
      const res = await fetch('/api/dev/delete-auth-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; userId?: string };
      const line = data.ok
        ? `[DEV] ✅ ${data.message}${data.userId ? ` (id: ${data.userId})` : ''}`
        : `[DEV] ℹ️ ${data.message ?? 'فشل غير معروف'} — (ليست رسالة تسجيل دخول)`;
      setDevDeleteStatus(line);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setDevDeleteStatus(`❌ ${msg}`);
    } finally {
      setDevDeleteLoading(false);
    }
  };

  const resetAuthForm = () => {
    setAuthPhase('form');
    setAuthFeedback(null);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isSignUp,
    loginMethod,
    setLoginMethod,
    authPhase,
    authFeedback,
    setAuthFeedback,
    emailDuplicateError,
    setEmailDuplicateError,
    emailCheckPending,
    authSubmitting,
    otpResendCooldown,
    devDeleteStatus,
    devDeleteLoading,
    switchAuthMode,
    handleAuth,
    handleCheckEmailVerified,
    handleResendVerificationLink,
    handleDevDeleteAuthUser,
    resetAuthForm,
    oauthLoadingProvider,
    handleOAuthSignIn,
  };
}
