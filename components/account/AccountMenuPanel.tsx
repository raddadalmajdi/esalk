'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TailorAvatarPicker } from '@/components/account/TailorAvatarPicker';
import { UserProfileAvatar } from '@/components/account/UserProfileAvatar';
import { hasDisplayAvatar, normalizeAvatarSrc } from '@/lib/avatar-src';

export type AvatarSaveFeedback = { type: 'success' | 'error'; message: string } | null;

type AccountMenuPanelProps = {
  open: boolean;
  email?: string | null;
  organizationName?: string | null;
  tailorShopName: string;
  isTailorRegistered: boolean;
  profileLoading?: boolean;
  tailorCountryCode: string;
  tailorLocalPhone: string;
  avatarUrl: string;
  pendingAvatarPreview: string | null;
  hasPendingAvatar: boolean;
  savingAvatar: boolean;
  avatarFeedback: AvatarSaveFeedback;
  onAvatarFilePick: (file: File) => void;
  onSaveAvatar: () => void;
  onRemoveAvatar: () => void;
  onDiscardPendingAvatar: () => void;
  onCloseMenu?: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
};

function AccountAvatarHero({
  src,
  alt,
  saving,
  pending,
}: {
  src: string;
  alt: string;
  saving: boolean;
  pending: boolean;
}) {
  const normalized = normalizeAvatarSrc(src);
  const hasImage = hasDisplayAvatar(normalized);

  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <div
        className={`relative flex h-[7.5rem] w-[7.5rem] shrink-0 items-center justify-center overflow-hidden rounded-full border-4 bg-primary/5 shadow-lg sm:h-32 sm:w-32 ${
          pending ? 'border-primary/50 ring-4 ring-primary/20' : 'border-primary/25 ring-4 ring-primary/10'
        }`}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={normalized} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <UserProfileAvatar src={null} alt={alt} size="md" className="h-full w-full border-0 shadow-none ring-0" />
        )}
        {saving && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/80">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </span>
        )}
      </div>
      <p className="text-center text-xs font-bold text-mistara-brown/70">صورة الحساب — تظهر في أيقونة الهيدر</p>
    </div>
  );
}

function AccountMenuPanelContent({
  email,
  organizationName,
  tailorShopName,
  isTailorRegistered,
  profileLoading = false,
  avatarUrl,
  pendingAvatarPreview,
  hasPendingAvatar,
  savingAvatar,
  avatarFeedback,
  onAvatarFilePick,
  onSaveAvatar,
  onRemoveAvatar,
  onDiscardPendingAvatar,
  onCloseMenu,
  onOpenSettings,
  onLogout,
  layout,
}: Omit<AccountMenuPanelProps, 'open' | 'tailorCountryCode' | 'tailorLocalPhone'> & {
  layout: 'sheet' | 'popover';
}) {
  const shopFromProfile = tailorShopName.trim();
  const shopFromOrg = organizationName?.trim() ?? '';
  const displayShopName = shopFromProfile || shopFromOrg;
  const shopNeedsSetup = !shopFromProfile;
  const displayAvatar = normalizeAvatarSrc(pendingAvatarPreview || avatarUrl);

  const panelClass =
    layout === 'sheet'
      ? 'fixed z-[60] inset-x-3 max-h-[min(88dvh,calc(100dvh-1rem))] overflow-y-auto overscroll-y-contain rounded-2xl border border-mistara-gold/30 glass-panel p-4 shadow-2xl backdrop-blur-md space-y-4'
      : 'absolute end-0 top-full mt-2 w-[min(100vw-2rem,22rem)] max-h-[min(75dvh,calc(100dvh-5rem))] overflow-y-auto overscroll-y-contain rounded-2xl border border-mistara-gold/30 glass-panel p-4 shadow-2xl backdrop-blur-md z-50 space-y-4';

  const sheetPosition =
    layout === 'sheet'
      ? {
          bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        }
      : undefined;

  return (
    <div
      className={panelClass}
      style={sheetPosition}
      role="dialog"
      aria-modal={layout === 'sheet'}
      aria-label="صورة الحساب والملف الشخصي"
    >
      {layout === 'sheet' && (
        <div className="flex items-center justify-between gap-2 border-b border-mistara-brown/15 pb-3">
          <p className="text-sm font-black text-mistara-gold">صورة الحساب</p>
          <button
            type="button"
            onClick={() => onCloseMenu?.()}
            className="rounded-lg px-2 py-1 text-xs font-black text-mistara-brown/80 hover:bg-mistara-brown/5"
          >
            إغلاق
          </button>
        </div>
      )}

      <AccountAvatarHero
        src={displayAvatar}
        alt="صورة صاحب المحل"
        saving={savingAvatar}
        pending={hasPendingAvatar}
      />

      <AccountMenuCaption profileLoading={profileLoading} displayShopName={displayShopName} email={email} />

      <TailorAvatarPicker
        avatarUrl={avatarUrl}
        pendingPreview={pendingAvatarPreview}
        hasPendingCloudSync={hasPendingAvatar}
        savingAvatar={savingAvatar}
        feedback={avatarFeedback}
        compact
        hideInlineAvatar
        onPickFile={onAvatarFilePick}
        onSaveCloud={onSaveAvatar}
        onRemove={hasDisplayAvatar(displayAvatar) ? onRemoveAvatar : undefined}
        onDiscardPending={onDiscardPendingAvatar}
      />

      <nav aria-label="إجراءات الحساب" className="space-y-2 border-t border-mistara-brown/15 pt-3">
        <p className="text-[11px] leading-relaxed text-mistara-brown/65">
          لتعديل اسم المحل ورقم الجوال استخدم إعدادات المحل — وليس من هذه الشاشة.
        </p>
        <button
          type="button"
          onClick={() => {
            onCloseMenu?.();
            onOpenSettings();
          }}
          className="w-full rounded-xl border border-mistara-gold/35 bg-white py-3 text-sm font-black text-mistara-gold transition-colors hover:bg-mistara-gold/5 active:scale-[0.99]"
        >
          {shopNeedsSetup || !isTailorRegistered ? 'إعدادات المحل (الاسم والجوال)' : 'إعدادات المحل'}
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-xl border border-red-800/30 bg-red-800/8 py-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-800/12 active:scale-[0.99]"
        >
          خروج / تسجيل الدخول بحساب آخر
        </button>
      </nav>
    </div>
  );
}

function AccountMenuCaption({
  profileLoading,
  displayShopName,
  email,
}: {
  profileLoading: boolean;
  displayShopName: string;
  email?: string | null;
}) {
  return (
    <div className="text-center">
      <p className="truncate text-sm font-black text-mistara-espresso">
        {profileLoading ? 'جاري التحميل…' : displayShopName || 'حساب صاحب المحل'}
      </p>
      {email ? (
        <p className="truncate text-xs font-bold text-mistara-brown/75" dir="ltr">
          {email}
        </p>
      ) : null}
    </div>
  );
}

export function AccountMenuPanel(props: AccountMenuPanelProps) {
  const { open, onCloseMenu, ...contentProps } = props;
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);

    const prev = document.body.style.overflow;
    if (mq.matches) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      mq.removeEventListener('change', sync);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  if (isMobile && mounted) {
    return createPortal(
      <>
        <button
          type="button"
          aria-label="إغلاق صورة الحساب"
          className="fixed inset-0 z-[55] bg-mistara-espresso/30 backdrop-blur-[1px]"
          onClick={() => onCloseMenu?.()}
        />
        <AccountMenuPanelContent {...contentProps} onCloseMenu={onCloseMenu} layout="sheet" />
      </>,
      document.body
    );
  }

  return <AccountMenuPanelContent {...contentProps} onCloseMenu={onCloseMenu} layout="popover" />;
}

export function AccountMenuTrigger({
  avatarUrl,
  onClick,
}: {
  avatarUrl: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="عرض صورة الحساب وتغييرها"
      aria-haspopup="dialog"
      className="rounded-full transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mistara-cream"
    >
      <UserProfileAvatar src={avatarUrl} size="sm" />
    </button>
  );
}