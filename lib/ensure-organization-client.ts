'use client';

import type { User } from 'firebase/auth';
import type { OrganizationContext } from '@/lib/organization';
import { getFirebaseIdToken } from '@/lib/firebase-auth-client';

export type EnsureOrganizationResult =
  | { ok: true; context: OrganizationContext }
  | { ok: false; status: number; message: string; code?: string };

/** ينشئ/يجلب محل المستخدم عبر API الخادم. */
export async function ensureOrganizationForUser(user: User): Promise<EnsureOrganizationResult> {
  const token = await getFirebaseIdToken();
  if (!token) {
    return { ok: false, status: 401, message: 'يجب تسجيل الدخول.', code: 'no_token' };
  }

  const response = await fetch('/api/auth/ensure-organization', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      userId: user.uid,
      email: (user.email ?? '').trim().toLowerCase(),
    }),
  });

  let payload: {
    ok?: boolean;
    code?: string;
    message?: string;
    organizationId?: string;
    organization?: OrganizationContext['organization'];
    role?: OrganizationContext['role'];
  } = {};

  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    return {
      ok: false,
      status: response.status,
      message: 'استجابة غير متوقعة من الخادم.',
      code: 'invalid_json',
    };
  }

  if (!response.ok || !payload.ok || !payload.organizationId || !payload.organization) {
    return {
      ok: false,
      status: response.status,
      message: payload.message ?? 'تعذّر ربط المحل.',
      code: payload.code,
    };
  }

  return {
    ok: true,
    context: {
      organizationId: payload.organizationId,
      organization: payload.organization,
      role: payload.role ?? 'owner',
    },
  };
}
