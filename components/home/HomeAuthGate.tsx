'use client';

import { AuthScreen } from '@/components/home/AuthScreen';
import { useOrganization } from '@/components/organization/OrganizationProvider';
import { useAuthFlow } from '@/hooks/home/useAuthFlow';
import type { useAppSession } from '@/hooks/home/useAppSession';

type SessionApi = ReturnType<typeof useAppSession>;

type HomeAuthGateProps = {
  session: SessionApi;
};

/** شاشة الدخول فقط — بدون تحميل لوحة الفواتير أو الماسح. */
export function HomeAuthGate({ session }: HomeAuthGateProps) {
  const { refreshOrganization } = useOrganization();

  const auth = useAuthFlow({
    refreshOrganization,
    onVerified: () => session.setShowWelcomeSuccess(true),
  });

  return (
    <AuthScreen
      sessionCheckPending={false}
      sessionFeedback={session.authFeedback}
      authPhase={auth.authPhase}
      email={auth.email}
      setEmail={auth.setEmail}
      password={auth.password}
      setPassword={auth.setPassword}
      isSignUp={auth.isSignUp}
      loginMethod={auth.loginMethod}
      setLoginMethod={auth.setLoginMethod}
      authFeedback={auth.authFeedback}
      setAuthFeedback={auth.setAuthFeedback}
      emailDuplicateError={auth.emailDuplicateError}
      setEmailDuplicateError={auth.setEmailDuplicateError}
      emailCheckPending={auth.emailCheckPending}
      authSubmitting={auth.authSubmitting}
      otpResendCooldown={auth.otpResendCooldown}
      devDeleteStatus={auth.devDeleteStatus}
      devDeleteLoading={auth.devDeleteLoading}
      switchAuthMode={auth.switchAuthMode}
      onSubmitAuth={(e) => void auth.handleAuth(e)}
      onCheckEmailVerified={() => void auth.handleCheckEmailVerified()}
      onResendVerificationLink={() => void auth.handleResendVerificationLink()}
      onBackFromConfirm={auth.resetAuthForm}
      onEnterGuest={session.enterGuestMode}
      onDevDelete={() => void auth.handleDevDeleteAuthUser()}
      oauthLoadingProvider={auth.oauthLoadingProvider}
      onOAuthSignIn={(provider) => void auth.handleOAuthSignIn(provider)}
    />
  );
}
