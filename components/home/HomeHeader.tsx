'use client';

import Link from 'next/link';
import { UserProfileAvatar } from '@/components/account/UserProfileAvatar';
import { AppBrand } from '@/components/brand/AppBrand';
import { isFirebaseConfigured } from '@/lib/firebase-auth-client';
import { normalizeAvatarSrc } from '@/lib/avatar-src';

type HomeHeaderProps = {
  organizationName?: string | null;
  profileLoading?: boolean;
  tailorShopName: string;
  tailorAvatarUrl: string;
  pendingAvatarPreview: string | null;
  trialDaysRemaining?: number | null;
};

export function HomeHeader({
  organizationName,
  profileLoading,
  tailorShopName,
  tailorAvatarUrl,
  pendingAvatarPreview,
  trialDaysRemaining,
}: HomeHeaderProps) {
  const displayAvatar = normalizeAvatarSrc(pendingAvatarPreview || tailorAvatarUrl);
  const merchantLabel =
    tailorShopName.trim() || organizationName?.trim() || (profileLoading ? '…' : 'محلّي');

  return (
    <header className="glass-header mobile-safe-top z-40 shrink-0 px-3 py-2.5 sm:px-6 lg:px-8">
      <div className="mobile-safe-x mx-auto flex w-full max-w-lg items-center justify-between gap-1.5 sm:max-w-2xl sm:gap-3 lg:max-w-4xl">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <AppBrand size="sm" layout="row" showTitle subtitle={null} />
          {!isFirebaseConfigured() && (
            <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-xs sm:inline">
              وضع التجربة (بلا حساب)
            </span>
          )}
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 sm:flex">
          <UserProfileAvatar src={displayAvatar} alt={merchantLabel} size="sm" />
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-black text-primary-dark">{merchantLabel}</p>
            <p className="truncate text-[10px] font-bold text-mistara-brown/70">لوحة التاجر</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {trialDaysRemaining != null && (
            <span
              className="inline-flex max-w-[4.25rem] shrink-0 items-center truncate rounded-full border border-sky-200 bg-sky-50 px-1.5 py-1 text-[9px] font-black text-sky-900 sm:max-w-none sm:px-2 sm:text-[10px]"
              title="أيام متبقية من الفترة التجريبية المجانية"
            >
              تجربة: {trialDaysRemaining}
            </span>
          )}
          <Link
            href="/dashboard/settings"
            aria-label="فتح إعدادات المحل"
            className="rounded-full transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mistara-cream"
          >
            <UserProfileAvatar src={displayAvatar} size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}