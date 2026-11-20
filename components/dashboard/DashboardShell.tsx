'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBrand } from '@/components/brand/AppBrand';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/', label: 'لوحة العمل', mobileLabel: 'العمل', icon: '🏠', match: 'exact' as const },
  {
    href: '/dashboard/settings',
    label: 'إعدادات المحل',
    mobileLabel: 'الإعدادات',
    icon: '⚙️',
    match: 'prefix' as const,
  },
  {
    href: '/billing',
    label: 'الاشتراك والفوترة',
    mobileLabel: 'الاشتراك',
    icon: '💳',
    match: 'exact' as const,
  },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] bg-mistara-sand text-mistara-espresso" dir="rtl">
      <div className="mx-auto flex w-full max-w-6xl flex-col lg:min-h-[100dvh] lg:flex-row">
        <aside className="glass-header sticky top-0 z-30 shrink-0 border-b border-mistara-gold/20 mobile-safe-top lg:relative lg:w-56 lg:border-b-0 lg:border-l">
          <div className="mobile-safe-x px-2 py-2 sm:px-4 sm:py-4 lg:py-6">
            <AppBrand size="sm" layout="row" showTitle subtitle={null} />
          </div>
          <nav
            aria-label="قائمة لوحة التحكم"
            className="merchant-mobile-nav mobile-safe-x px-2 pb-3 sm:px-3 lg:pb-6"
          >
            {NAV.map((item) => {
              const active =
                item.match === 'prefix' ? pathname?.startsWith(item.href) : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`merchant-mobile-nav__link transition-colors ${
                    active
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-mistara-brown/85 hover:bg-primary/8 hover:text-primary-dark'
                  }`}
                >
                  <span className="text-base leading-none sm:text-lg" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="sm:hidden">{item.mobileLabel}</span>
                  <span className="hidden sm:inline lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="mobile-safe-x mobile-safe-bottom w-full min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-5">
          {children}
        </main>
      </div>
    </div>
  );
}