'use client';

import type { User } from 'firebase/auth';
import { resolveAccountLoginDisplay } from '@/lib/auth-account-display';

const KIND_ICON: Record<string, string> = {
  google: 'G',
  apple: '',
  email: '@',
  other: '◆',
};

export function MerchantAccountCard({ user }: { user: User }) {
  const account = resolveAccountLoginDisplay(user);
  const icon = KIND_ICON[account.kind] ?? '◆';

  return (
    <div className="settings-account-card">
      <AccountRow icon={icon} account={account} />
    </div>
  );
}

function AccountRow({
  icon,
  account,
}: {
  icon: string;
  account: ReturnType<typeof resolveAccountLoginDisplay>;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-white text-sm font-black text-primary-dark"
        aria-hidden
      >
        {account.kind === 'apple' ? (
          <span className="text-base leading-none"></span>
        ) : (
          icon
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-mistara-brown/70">{account.heading}</p>
        {account.email ? (
          <p className="tnum mt-0.5 break-all text-sm font-black text-mistara-espresso" dir="ltr">
            {account.email}
          </p>
        ) : (
          <p className="mt-0.5 text-sm font-bold text-mistara-brown/80">لا يظهر بريد على هذا الحساب</p>
        )}
      </div>
    </div>
  );
}