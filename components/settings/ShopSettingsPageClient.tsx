'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthBootScreen } from '@/components/auth/AuthBootScreen';
import { ShopSettingsForm } from '@/components/settings/ShopSettingsForm';
import { useOrganization } from '@/components/organization/OrganizationProvider';
import { useTailorProfile } from '@/hooks/home/useTailorProfile';
import { firebaseSignOut, isFirebaseConfigured, subscribeFirebaseAuth } from '@/lib/firebase-auth-client';
import type { AppUser } from '@/lib/home/types';
import { appUserId } from '@/lib/home/types';

export function ShopSettingsPageClient() {
  const router = useRouter();
  const { organizationId, loading: orgLoading, refreshOrganization } = useOrganization();
  const [user, setUser] = useState<AppUser | null>(null);
  const [booting, setBooting] = useState(true);

  const tailor = useTailorProfile({
    user,
    organizationId,
    setLoading: () => undefined,
  });

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setBooting(false);
      return;
    }

    let cancelled = false;
    const unsub = subscribeFirebaseAuth((authUser) => {
      if (cancelled) return;
      setUser(authUser);
      setBooting(false);
      if (!authUser) {
        router.replace('/');
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [router]);

  useEffect(() => {
    if (!user || orgLoading || organizationId) return;
    void refreshOrganization();
  }, [user, orgLoading, organizationId, refreshOrganization]);

  const handleLogout = async () => {
    await firebaseSignOut().catch(() => undefined);
    router.replace('/');
  };

  if (booting) {
    return <AuthBootScreen message="جاري فتح إعدادات المحل..." />;
  }

  if (!user || appUserId(user) === 'guest-local-user') {
    return <AuthBootScreen message="يجب تسجيل الدخول..." />;
  }

  return (
    <div className="mx-auto w-full max-w-lg pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="mb-5 space-y-2">
        <Link href="/" className="inline-flex text-xs font-black text-primary underline">
          ← العودة للوحة العمل
        </Link>
        <h1 className="text-xl font-black text-mistara-espresso sm:text-2xl">إعدادات المحل</h1>
        <p className="text-sm leading-relaxed text-mistara-brown/75">
          صورة الحساب، بيانات المحل، ودفتر العملاء المحفوظين — صفحة كاملة بدون نوافذ منبثقة.
        </p>
      </header>

      <div className="dashboard-contact-card">
        <ShopSettingsForm
          tailorShopName={tailor.tailorShopName}
          onShopNameChange={tailor.setTailorShopName}
          tailorLocalPhone={tailor.tailorLocalPhone}
          onLocalPhoneChange={tailor.setTailorLocalPhone}
          tailorCountryCode={tailor.tailorCountryCode}
          onCountryCodeChange={tailor.setTailorCountryCode}
          cloudNotes={tailor.cloudNotes}
          onCloudNotesChange={tailor.setCloudNotes}
          tailorAvatarUrl={tailor.tailorAvatarUrl}
          pendingAvatarPreview={tailor.pendingAvatarPreview}
          hasPendingAvatar={tailor.hasPendingAvatar}
          savingAvatar={tailor.savingAvatar}
          avatarFeedback={tailor.avatarFeedback}
          onAvatarFilePick={(file) => void tailor.handleAvatarFilePick(file)}
          onSaveAvatar={() => void tailor.handleSaveAvatar()}
          onRemoveAvatar={tailor.handleRemoveAvatar}
          onDiscardPendingAvatar={tailor.handleDiscardPendingAvatar}
          settingsFeedback={tailor.settingsFeedback}
          savingSettings={tailor.savingSettings}
          onSubmit={(e) => void tailor.handleSaveTailorProfile(e)}
          onLogout={() => void handleLogout()}
        />
      </div>
    </div>
  );
}