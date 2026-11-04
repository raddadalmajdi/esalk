import { assertValidEmailRedirectTo } from '@/lib/app-env';
import type { AuthErrorLike } from '@/lib/auth-errors';
import { executeFirebaseClientSignUp } from '@/lib/auth-sign-up-firebase-client';
import { isAsyncTimeoutError, logAuthFlowStep, withTimeout } from '@/lib/async-timeout';

const CLIENT_SIGNUP_TOTAL_MS = 65_000;

export type SignUpUserStub = {
  id: string;
  email?: string;
  emailVerified?: boolean;
  identities?: { id: string }[];
};

export type SignUpSessionStub = {
  user: SignUpUserStub | null;
  session: null;
};

export type SignUpExecutionResult = {
  data: SignUpSessionStub | null;
  error: AuthErrorLike | null;
  emailRedirectTo: string;
  recoveredAfterServerError?: boolean;
  /** @deprecated Resend — استخدم emailSentViaFirebase */
  emailSentViaResend?: boolean;
  emailSentViaFirebase?: boolean;
};

/** تسجيل حساب جديد عبر Firebase Auth + بريد التحقق (بدون Resend). */
export async function executeSignUp(params: {
  email: string;
  password: string;
  emailRedirectTo: string;
}): Promise<SignUpExecutionResult> {
  try {
    return await withTimeout(
      executeSignUpInner(params),
      CLIENT_SIGNUP_TOTAL_MS,
      'عملية التسجيل'
    );
  } catch (error) {
    if (isAsyncTimeoutError(error)) {
      return {
        data: null,
        error: { message: error.message, code: 'request_timeout' },
        emailRedirectTo: params.emailRedirectTo,
      };
    }
    throw error;
  }
}

async function executeSignUpInner(params: {
  email: string;
  password: string;
  emailRedirectTo: string;
}): Promise<SignUpExecutionResult> {
  const emailRedirectTo = assertValidEmailRedirectTo(params.emailRedirectTo);
  logAuthFlowStep('client', 'executeSignUp:firebase-client:start');
  const result = await executeFirebaseClientSignUp({
    ...params,
    emailRedirectTo,
  });
  logAuthFlowStep('client', 'executeSignUp:firebase-client:done', {
    hasError: Boolean(result.error),
    emailSentViaFirebase: result.emailSentViaFirebase,
  });
  return result;
}
