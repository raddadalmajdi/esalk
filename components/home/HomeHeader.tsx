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
  onOpenSettings: () => void;
  trialDaysRemaining?: number | null;
};

export function HomeHeader({
  organizationName,
  profileLoading,
  tailorShopName,
  tailorAvatarUrl,
  pendingAvatarPreview,
  onOpenSettings,
  trialDaysRemaining,
}: HomeHeaderProps) {
  const displayAvatar = normalizeAvatarSrc(pendingAvatarPreview || tailorAvatarUrl);
  const merchantLabel =
    tailorShopName.trim() || organizationName?.trim() || (profileLoading ? '…' : 'محلّي');

  return (
    <header className="glass-header z-40 shrink-0 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-2 sm:max-w-2xl sm:gap-3 lg:max-w-4xl">
        <div className="flex min-w-0 items-center gap-2.5">
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {trialDaysRemaining != null && (
            <span
              className="inline-flex max-w-[4.75rem] shrink-0 items-center truncate rounded-full border border-sky-200 bg-sky-50 px-1.5 py-1 text-[9px] font-black text-sky-900 sm:max-w-none sm:px-2 sm:text-[10px]"
              title="أيام متبقية من الفترة التجريبية المجانية"
            >
              تجربة: {trialDaysRemaining} يوم
            </span>
          )}
          <Link
            href="/dashboard/contacts"
            className="inline-flex shrink-0 items-center rounded-xl border border-mistara-gold/30 bg-mistara-cream px-2 py-2 text-[10px] font-black text-mistara-gold sm:px-2.5 sm:text-[11px]"
          >
            الدفتر
          </Link>
          <Link
            href="/billing"
            className="inline-flex shrink-0 items-center rounded-xl border border-primary/25 bg-primary/8 px-2 py-2 text-[10px] font-black text-primary-dark transition-colors hover:bg-primary/12 active:scale-[0.99] sm:px-3 sm:text-xs"
          >
            الاشتراك
          </Link>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="فتح إعدادات المحل"
            className="rounded-full transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mistara-cream"
          >
            <UserProfileAvatar src={displayAvatar} size="sm" />
          </button>
        </div>
      </div>
    </header>
  );
}