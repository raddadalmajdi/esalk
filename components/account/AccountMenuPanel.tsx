'use client';

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

export function AccountMenuPanel({
  open,
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
}: AccountMenuPanelProps) {
  if (!open) return null;

  const shopFromProfile = tailorShopName.trim();
  const shopFromOrg = organizationName?.trim() ?? '';
  const displayShopName = shopFromProfile || shopFromOrg;
  const shopNeedsSetup = !shopFromProfile;
  const phoneLabel = isTailorRegistered
    ? `+${tailorCountryCode}${tailorLocalPhone}`
    : 'لم يُضف بعد — من إعدادات المحل';
  const displayAvatar = normalizeAvatarSrc(pendingAvatarPreview || avatarUrl);

  return (
    <div className="absolute left-0 mt-2 w-80 sm:w-[22rem] rounded-2xl border border-mistara-gold/30 glass-panel p-4 shadow-2xl backdrop-blur-md z-50 space-y-4">
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
      className="rounded-full transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mistara-cream"
    >
      <UserProfileAvatar src={avatarUrl} size="sm" />
    </button>
  );
}
