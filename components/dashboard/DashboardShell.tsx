'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBrand } from '@/components/brand/AppBrand';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/', label: 'لوحة العمل', icon: '🏠', match: 'exact' as const },
  { href: '/dashboard/settings', label: 'إعدادات المحل', icon: '⚙️', match: 'prefix' as const },
  { href: '/billing', label: 'الاشتراك والفوترة', icon: '💳', match: 'exact' as const },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] bg-mistara-sand text-mistara-espresso" dir="rtl">
      <div className="mx-auto flex w-full max-w-6xl flex-col lg:min-h-[100dvh] lg:flex-row">
        <aside className="glass-header shrink-0 border-b border-mistara-gold/20 lg:w-56 lg:border-b-0 lg:border-l">
          <div className="px-4 py-4 lg:py-6">
            <AppBrand size="sm" layout="row" showTitle subtitle={null} />
          </div>
          <nav aria-label="قائمة لوحة التحكم" className="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:px-3 lg:pb-6">
            {NAV.map((item) => {
              const active =
                item.match === 'prefix' ? pathname?.startsWith(item.href) : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                    active
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-mistara-brown/80 hover:bg-primary/8 hover:text-primary-dark'
                  }`}
                >
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="w-full flex-1 px-4 py-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
}