'use client';

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { TailorAvatarPicker } from '@/components/account/TailorAvatarPicker';
import type { AvatarSaveFeedback } from '@/components/account/AccountMenuPanel';
import { SavedContactsAddressBook } from '@/components/contacts/SavedContactsAddressBook';
import { hasDisplayAvatar } from '@/lib/avatar-src';
import { COUNTRY_CODES } from '@/lib/home/constants';
import type { AuthFeedback } from '@/lib/home/types';

type TailorProfileModalProps = {
  open: boolean;
  onClose: () => void;
  tailorShopName: string;
  onShopNameChange: (value: string) => void;
  tailorLocalPhone: string;
  onLocalPhoneChange: (value: string) => void;
  tailorCountryCode: string;
  onCountryCodeChange: (value: string) => void;
  cloudNotes: string;
  onCloudNotesChange: (value: string) => void;
  tailorAvatarUrl: string;
  pendingAvatarPreview: string | null;
  hasPendingAvatar: boolean;
  savingAvatar: boolean;
  avatarFeedback: AvatarSaveFeedback;
  onAvatarFilePick: (file: File) => void;
  onSaveAvatar: () => void;
  onRemoveAvatar: () => void;
  onDiscardPendingAvatar: () => void;
  settingsFeedback: AuthFeedback;
  savingSettings: boolean;
  onSubmit: (e: FormEvent) => void;
  onLogout?: () => void;
};

function useOverlayViewportHeight(enabled: boolean): CSSProperties | undefined {
  const [heightPx, setHeightPx] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const update = () => {
      if (window.matchMedia('(min-width: 640px)').matches) {
        setHeightPx(null);
        return;
      }
      const viewport = window.visualViewport;
      const h = viewport?.height ?? window.innerHeight;
      setHeightPx(Math.round(h));
    };

    update();
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('orientationchange', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [enabled]);

  if (heightPx == null) return undefined;
  return { height: `${heightPx}px`, minHeight: `${heightPx}px`, maxHeight: `${heightPx}px` };
}

export function TailorProfileModal({
  open,
  onClose,
  tailorShopName,
  onShopNameChange,
  tailorLocalPhone,
  onLocalPhoneChange,
  tailorCountryCode,
  onCountryCodeChange,
  cloudNotes,
  onCloudNotesChange,
  tailorAvatarUrl,
  pendingAvatarPreview,
  hasPendingAvatar,
  savingAvatar,
  avatarFeedback,
  onAvatarFilePick,
  onSaveAvatar,
  onRemoveAvatar,
  onDiscardPendingAvatar,
  settingsFeedback,
  savingSettings,
  onSubmit,
  onLogout,
}: TailorProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const overlayHeight = useOverlayViewportHeight(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  if (!open || !mounted) return null;

  const sheet = (
    <div
      className="tailor-settings-overlay sm:glass-modal-backdrop"
      style={overlayHeight}
      role="dialog"
      aria-modal="true"
      aria-label="إعدادات المحل"
    >
      <button
        type="button"
        className="absolute inset-0 hidden sm:block"
        aria-label="إغلاق الخلفية"
        onClick={onClose}
      />

      <div className="tailor-settings-sheet relative z-[1] sm:static">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-mistara-brown/15 px-4 pb-3 pt-[max(0.875rem,env(safe-area-inset-top))] sm:px-6 sm:pt-4">
          <h3 className="text-[clamp(1.0625rem,4.5vw,1.25rem)] font-black text-mistara-espresso">
            إعدادات المحل
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg text-primary touch-manipulation"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <div className="tailor-settings-scroll px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
          <form onSubmit={onSubmit} className="space-y-[clamp(0.875rem,3.5vw,1.125rem)]">
            <TailorAvatarPicker
              avatarUrl={tailorAvatarUrl}
              pendingPreview={pendingAvatarPreview}
              hasPendingCloudSync={hasPendingAvatar}
              savingAvatar={savingAvatar}
              feedback={avatarFeedback}
              onPickFile={onAvatarFilePick}
              onSaveCloud={onSaveAvatar}
              onRemove={
                hasDisplayAvatar(tailorAvatarUrl || pendingAvatarPreview) ? onRemoveAvatar : undefined
              }
              onDiscardPending={onDiscardPendingAvatar}
            />

            <SavedContactsAddressBook active={open} />

            <p className="text-[clamp(0.6875rem,3vw,0.8125rem)] leading-relaxed text-mistara-brown/80">
              عدّل اسم المحل ورقم الجوال والملاحظات وصورة الشعار. يمكنك إغلاق هذه النافذة والعودة للعمل فوراً.
            </p>

            {settingsFeedback && (
              <div
                role="alert"
                className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[clamp(0.8125rem,3.6vw,0.9375rem)] leading-relaxed ${
                  settingsFeedback.type === 'success'
                    ? 'border-primary/35 bg-primary/10 text-mistara-espresso'
                    : 'border-red-800/35 bg-red-800/8 text-red-900'
                }`}
              >
                <p>{settingsFeedback.message}</p>
              </div>
            )}

            <div>
              <label htmlFor="tailor-shop-name" className="auth-field-label block">
                اسم المحل
              </label>
              <input
                id="tailor-shop-name"
                type="text"
                value={tailorShopName}
                onChange={(e) => onShopNameChange(e.target.value)}
                placeholder="اسم محل الخياطة (اختياري)"
                className="auth-field-input font-bold"
              />
            </div>

            <div>
              <label htmlFor="tailor-phone" className="auth-field-label block">
                رقم جوال التاجر
              </label>
              <div className="flex items-stretch gap-2">
                <input
                  id="tailor-phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="tel-national"
                  enterKeyHint="done"
                  required
                  value={tailorLocalPhone}
                  onChange={(e) => onLocalPhoneChange(e.target.value.replace(/\D/g, ''))}
                  placeholder="50123456"
                  className="auth-phone-input tnum text-right font-mono"
                  dir="ltr"
                />
                <select
                  value={tailorCountryCode}
                  onChange={(e) => onCountryCodeChange(e.target.value)}
                  className="auth-phone-select tnum font-mono"
                  aria-label="رمز الدولة"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      +{c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="tailor-notes" className="auth-field-label block">
                ملاحظات سحابية عامة
              </label>
              <textarea
                id="tailor-notes"
                value={cloudNotes}
                onChange={(e) => onCloudNotesChange(e.target.value)}
                placeholder="اكتب ملاحظات عامة تحفظ في حسابك..."
                rows={3}
                className="auth-field-input resize-none text-[clamp(0.8125rem,3.6vw,0.9375rem)]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-mistara-beige py-[clamp(0.75rem,3vw,0.875rem)] text-[clamp(0.8125rem,3.6vw,0.9375rem)] font-bold text-mistara-espresso touch-manipulation"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={savingSettings}
                className="auth-primary-btn flex-1 rounded-xl font-bold text-[clamp(0.8125rem,3.6vw,0.9375rem)] shadow disabled:opacity-50 touch-manipulation"
              >
                {savingSettings ? 'جاري الحفظ...' : 'حفظ وإكمال التسجيل'}
              </button>
            </div>

            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="w-full rounded-xl border border-red-800/30 bg-red-800/8 py-3 text-sm font-bold text-red-700"
              >
                خروج / تسجيل الدخول بحساب آخر
              </button>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}