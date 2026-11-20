import { Suspense } from 'react';
import { AuthBootScreen } from '@/components/auth/AuthBootScreen';
import { ContactsPageClient } from '@/components/contacts/ContactsPageClient';

export default function ContactsPage() {
  return (
    <Suspense fallback={<AuthBootScreen message="جاري فتح دفتر جهات الاتصال..." />}>
      <ContactsPageClient />
    </Suspense>
  );
}