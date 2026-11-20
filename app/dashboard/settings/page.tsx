import { Suspense } from 'react';
import { AuthBootScreen } from '@/components/auth/AuthBootScreen';
import { ShopSettingsPageClient } from '@/components/settings/ShopSettingsPageClient';

export default function ShopSettingsPage() {
  return (
    <Suspense fallback={<AuthBootScreen message="جاري فتح إعدادات المحل..." />}>
      <ShopSettingsPageClient />
    </Suspense>
  );
}