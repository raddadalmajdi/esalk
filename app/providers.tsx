'use client';

import { OrganizationProvider } from '@/components/organization/OrganizationProvider';
import { ToastProvider } from '@/components/ui/Toast';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <OrganizationProvider>{children}</OrganizationProvider>
    </ToastProvider>
  );
}
