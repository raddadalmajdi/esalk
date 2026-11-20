import type { User } from 'firebase/auth';

export type AccountLoginKind = 'email' | 'google' | 'apple' | 'other';

export type AccountLoginDisplay = {
  kind: AccountLoginKind;
  heading: string;
  email: string | null;
};

export function resolveAccountLoginDisplay(user: User | null | undefined): AccountLoginDisplay {
  if (!user) {
    return { kind: 'other', heading: 'حساب إيصالك', email: null };
  }

  const email = user.email?.trim() || null;
  const providerIds = new Set(user.providerData.map((entry) => entry.providerId));

  if (providerIds.has('google.com')) {
    return { kind: 'google', heading: 'حساب Google', email };
  }
  if (providerIds.has('apple.com')) {
    return { kind: 'apple', heading: 'حساب Apple', email };
  }
  if (providerIds.has('password') || email) {
    return { kind: 'email', heading: 'البريد المسجّل', email };
  }

  return { kind: 'other', heading: 'حساب إيصالك', email };
}