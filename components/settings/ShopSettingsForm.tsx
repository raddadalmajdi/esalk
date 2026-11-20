'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { TailorAvatarPicker } from '@/components/account/TailorAvatarPicker';
import type { AvatarSaveFeedback } from '@/lib/avatar-save-feedback';
import { SavedContactsAddressBook } from '@/components/contacts/SavedContactsAddressBook';
import { hasDisplayAvatar } from '@/lib/avatar-src';
import { COUNTRY_CODES } from '@/lib/home/constants';
import type { AuthFeedback } from '@/lib/home/types';
import { MerchantPrivacyPrinciples } from '@/components/legal/MerchantPrivacyPrinciples';
import { MerchantAccountCard } from '@/components/settings/MerchantAccountCard';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { ShopPhoneOtpGate } from '@/components/settings/ShopPhoneOtpGate';
import { resolveAccountLoginDisplay } from '@/lib/auth-account-display';

export type ShopSettingsFormProps = {
  accountUser: User;
  savedFullPhone: string;
  tailorShopName: string;
  onShopNameChange: (value: string) => void;
  tailorLocalPhone: string;
  onLocalPhoneChange: (value: string) => void;
  tailorCountryCode: string;
  onCountryCodeChange: (value: string) => void;
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

export function ShopSettingsForm({
  accountUser,
  savedFullPhone,
  tailorShopName,
  onShopNameChange,
  tailorLocalPhone,
  onLocalPhoneChange,
  tailorCountryCode,
  onCountryCodeChange,
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
}: ShopSettingsFormProps) {
  const [phoneOtpVerifiedFor, setPhoneOtpVerifiedFor] = useState<string | null>(null);
  const account = resolveAccountLoginDisplay(accountUser);

  const fullPhone = useMemo(() => {
    const local = tailorLocalPhone.replace(/\D/g, '');
    if (!local) return '';
    return `${tailorCountryCode}${local}`;
  }, [tailorCountryCode, tailorLocalPhone]);

  const phoneChangeRequired = Boolean(
    savedFullPhone && fullPhone && fullPhone !== savedFullPhone.replace(/\D/g, '')
  );

  useEffect(() => {
    if (phoneOtpVerifiedFor && phoneOtpVerifiedFor !== fullPhone) {
      setPhoneOtpVerifiedFor(null);
    }
  }, [fullPhone, phoneOtpVerifiedFor]);

  return (
    <form onSubmit={onSubmit} className="settings-form divide-y divide-primary/10">
      <SettingsSection title="حساب الدخول" className="settings-form__block">
        <MerchantAccountCard user={accountUser} />
      </SettingsSection>

      <SettingsSection title="صورة المحل" className="settings-form__block">
        <TailorAvatarPicker
          avatarUrl={tailorAvatarUrl}
          pendingPreview={pendingAvatarPreview}
          hasPendingCloudSync={hasPendingAvatar}
          savingAvatar={savingAvatar}
          feedback={avatarFeedback}
          compact
          onPickFile={onAvatarFilePick}
          onSaveCloud={onSaveAvatar}
          onRemove={hasDisplayAvatar(tailorAvatarUrl || pendingAvatarPreview) ? onRemoveAvatar : undefined}
          onDiscardPending={onDiscardPendingAvatar}
        />
      </SettingsSection>

      <SettingsSection title="اسم المحل" className="settings-form__block">
        <input
          id="tailor-shop-name"
          type="text"
          value={tailorShopName}
          onChange={(e) => onShopNameChange(e.target.value)}
          placeholder="مثال: خياطة الأناقة"
          className="auth-field-input font-bold"
        />
      </SettingsSection>

      <SettingsSection title="رقم جوال المحل" className="settings-form__block">
        <p className="text-[11px] font-bold leading-relaxed text-mistara-brown/75">
          يُستخدم للتعريف بمحلّك. عند تغيير رقم مُسجّل مسبقاً يُرسل رمز تأكيد إلى بريدك.
        </p>
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
        {phoneChangeRequired ? (
          <ShopPhoneOtpGate
            accountEmail={account.email}
            fullPhone={fullPhone}
            verifiedForPhone={phoneOtpVerifiedFor}
            onVerified={setPhoneOtpVerifiedFor}
            onClearVerification={() => setPhoneOtpVerifiedFor(null)}
          />
        ) : savedFullPhone ? (
          <p className="text-[11px] font-bold text-mistara-brown/65">الرقم الحالي دون تغيير — لا حاجة لرمز تأكيد.</p>
        ) : null}
      </SettingsSection>

      <SettingsSection title="دفتر أرقام العملاء" className="settings-form__block">
        <SavedContactsAddressBook active />
      </SettingsSection>

      {settingsFeedback ? (
        <div className="settings-form__block">
          <div
            role="alert"
            className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm leading-relaxed ${
              settingsFeedback.type === 'success'
                ? 'border-primary/35 bg-primary/10 text-mistara-espresso'
                : 'border-red-800/35 bg-red-800/8 text-red-900'
            }`}
          >
            <p>{settingsFeedback.message}</p>
          </div>
        </div>
      ) : null}

      <div className="settings-form__block pt-1">
        <button
          type="submit"
          disabled={
            savingSettings ||
            (phoneChangeRequired && phoneOtpVerifiedFor !== fullPhone)
          }
          className="auth-primary-btn w-full rounded-xl py-3.5 text-sm font-black shadow disabled:opacity-50 touch-manipulation"
        >
          {savingSettings ? 'جاري الحفظ…' : 'حفظ الإعدادات'}
        </button>
      </div>

      <div className="settings-form__block space-y-3">
        <MerchantPrivacyPrinciples variant="compact" />
        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-xl border border-red-800/30 bg-red-800/8 py-3 text-sm font-bold text-red-700"
          >
            خروج / تسجيل الدخول بحساب آخر
          </button>
        ) : null}
      </div>
    </form>
  );
}