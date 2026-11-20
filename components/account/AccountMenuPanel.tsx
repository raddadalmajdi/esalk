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
  /** اسم المحل على المنصة (Firestore organizations) — يُستخدم إن لم يُحفظ ملف الخياط بعد. */
  organizationName?: string | null;
  tailorShopName: string;
  isTailorRegistered: boolean;
  profileLoading?: boolean;
  tailorCountryCode: string;
  tailorLocalPhone: string;
  /** الرابط المحفوظ فعلياً (يظهر في أيقونة الهيدر). */
  avatarUrl: string;
  /** معاينة الصورة المختارة قبل الحفظ — إن وُجدت. */
  pendingAvatarPreview: string | null;
  hasPendingAvatar: boolean;
  savingAvatar: boolean;
  avatarFeedback: AvatarSaveFeedback;
  onAvatarFilePick: (file: File) => void;
  onSaveAvatar: () => void;
  onRemoveAvatar: () => void;
  onDiscardPendingAvatar: () => void;
  /** يُغلق القائمة قبل أي انتقال (اختياري). */
  onCloseMenu?: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
};

function AccountMenuPanelContent({
  email,
  organizationName,
  tailorShopName,
  isTailorRegistered,
  profileLoading = false,
  tailorCountryCode,
  tailorLocalPhone,
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
}: Omit<AccountMenuPanelProps, 'open'> & { layout: 'sheet' | 'popover' }) {
  const shopFromProfile = tailorShopName.trim();
  const shopFromOrg = organizationName?.trim() ?? '';
  const displayShopName = shopFromProfile || shopFromOrg;
  const shopNeedsSetup = !shopFromProfile;
  const phoneLabel = isTailorRegistered
    ? `+${tailorCountryCode}${tailorLocalPhone}`
    : 'لم يُضف بعد — من إعدادات المحل';
  const displayAvatar = normalizeAvatarSrc(pendingAvatarPreview || avatarUrl);

  const panelClass =
    layout === 'sheet'
      ? 'fixed z-[60] inset-x-3 max-h-[min(82dvh,calc(100dvh-1.25rem))] overflow-y-auto overscroll-y-contain rounded-2xl border border-mistara-gold/30 glass-panel p-4 shadow-2xl backdrop-blur-md space-y-4'
      : 'absolute end-0 top-full mt-2 w-80 sm:w-[22rem] max-h-[min(70dvh,calc(100dvh-5rem))] overflow-y-auto overscroll-y-contain rounded-2xl border border-mistara-gold/30 glass-panel p-4 shadow-2xl backdrop-blur-md z-50 space-y-4';

  const sheetPosition =
    layout === 'sheet'
      ? {
          top: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        }
      : undefined;

  return (
    <div className={panelClass} style={sheetPosition} role="dialog" aria-modal={layout === 'sheet'}>
      {layout === 'sheet' && (
        <div className="flex items-center justify-between gap-2 border-b border-mistara-brown/15 pb-3">
          <p className="text-sm font-black text-mistara-gold">قائمة الحساب</p>
          <button
            type="button"
            onClick={() => onCloseMenu?.()}
            className="rounded-lg px-2 py-1 text-xs font-black text-mistara-brown/80 hover:bg-mistara-brown/5"
          >
            إغلاق
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 border-b border-mistara-brown/15 pb-3">
        <UserProfileAvatar
          src={displayAvatar}
          alt="صورة صاحب المحل"
          size="md"
          className={hasPendingAvatar ? 'border-primary/45 ring-primary/30' : undefined}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-mistara-gold">حساب صاحب المحل</p>
          <p className="truncate text-sm font-bold text-mistara-espresso">
            {profileLoading
              ? 'جاري التحميل…'
              : displayShopName || 'أكمل اسم المحل في الإعدادات'}
          </p>
          <p className="truncate text-xs text-mistara-brown/80">{email || 'ضيف'}</p>
        </div>
      </div>

      <TailorAvatarPicker
        avatarUrl={avatarUrl}
        pendingPreview={pendingAvatarPreview}
        hasPendingCloudSync={hasPendingAvatar}
        savingAvatar={savingAvatar}
        feedback={avatarFeedback}
        compact
        onPickFile={onAvatarFilePick}
        onSaveCloud={onSaveAvatar}
        onRemove={hasDisplayAvatar(displayAvatar) ? onRemoveAvatar : undefined}
        onDiscardPending={onDiscardPendingAvatar}
      />

      {(shopNeedsSetup || !isTailorRegistered) && !profileLoading && (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs font-bold leading-relaxed text-amber-950">
          {shopNeedsSetup && !isTailorRegistered
            ? 'اسم المحل ورقم الجوال يظهران للعملاء بعد حفظ «إعدادات المحل». يمكنك تعديل الاسم الافتراضي للمنصة الآن.'
            : shopNeedsSetup
              ? 'يمكنك تخصيص اسم المحل بدل الاسم الافتراضي للمنصة.'
              : 'أضف رقم جوال المحل ليظهر في الفواتير والمشاركة.'}
        </p>
      )}

      <div className="rounded-xl border border-mistara-brown/15 bg-mistara-cream/60 px-3 py-2.5 space-y-2">
        <div>
          <span className="text-xs font-bold text-mistara-gold">اسم المحل</span>
          <p className="truncate text-sm font-bold text-mistara-espresso">
            {profileLoading ? '…' : displayShopName || '—'}
          </p>
          {shopFromOrg && shopNeedsSetup && !profileLoading && (
            <p className="mt-0.5 text-[10px] font-bold text-mistara-brown/65">اسم مؤقت من المنصة</p>
          )}
        </div>
        <div>
          <span className="text-xs font-bold text-mistara-gold">جوال المحل (للتواصل)</span>
          <p
            className={`truncate text-sm font-bold tnum ${isTailorRegistered ? 'text-mistara-espresso' : 'text-mistara-brown/70'}`}
            dir="ltr"
          >
            {phoneLabel}
          </p>
        </div>
      </div>

      <nav
        aria-label="إجراءات الحساب"
        className="border-t border-mistara-brown/15 pt-3 space-y-2"
      >
        <button
          type="button"
          onClick={() => {
            onCloseMenu?.();
            onOpenSettings();
          }}
          className="w-full rounded-xl bg-mistara-gold py-3 text-sm font-black text-mistara-cream shadow-md shadow-mistara-gold/15 transition-colors hover:bg-mistara-gold/95 active:scale-[0.99]"
        >
          {shopNeedsSetup || !isTailorRegistered ? 'أكمل إعدادات المحل' : 'إعدادات المحل'}
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
          aria-label="إغلاق قائمة الحساب"
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
      aria-label="فتح قائمة الحساب"
      aria-haspopup="dialog"
      className="rounded-full transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mistara-cream"
    >
      <UserProfileAvatar src={avatarUrl} size="sm" />
    </button>
  );
}