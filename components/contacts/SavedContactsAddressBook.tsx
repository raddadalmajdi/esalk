'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchContacts } from '@/lib/contacts-api';
import type { ContactRecord } from '@/lib/contacts-types';
import { resolveClientSession } from '@/lib/auth-session-client';
import { isFirebaseConfigured } from '@/lib/firebase-auth-client';

type SavedContactsAddressBookProps = {
  /** يُحمَّل عند فتح إعدادات المحل */
  active: boolean;
};

/** دفتر أسماء العملاء — أرقام وأسماء كما في جهات اتصال الهاتف. */
export function SavedContactsAddressBook({ active }: SavedContactsAddressBookProps) {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !isFirebaseConfigured()) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const session = await resolveClientSession();
        if (!session.ok) {
          if (!cancelled) setError('سجّل الدخول لعرض دفتر العملاء.');
          return;
        }
        const list = await fetchContacts(session.accessToken);
        if (!cancelled) setContacts(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'تعذّر تحميل الدفتر.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [active]);

  if (!isFirebaseConfigured()) {
    return (
      <p className="rounded-xl border border-mistara-brown/15 bg-mistara-beige/50 px-3 py-2 text-xs font-bold text-mistara-brown/75">
        دفتر العملاء متاح بعد تسجيل الدخول بحساب إيصالك.
      </p>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-black text-primary-dark">دفتر العملاء المحفوظين</h4>
          <p className="mt-0.5 text-[11px] leading-relaxed text-mistara-brown/75">
            أرقام وأسماء كما في جهات اتصال الهاتف — للاستدعاء السريع من لوحة العمل.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/contacts#import-phone"
            className="shrink-0 rounded-xl border border-primary/30 bg-white px-3 py-2 text-xs font-black text-primary-dark"
          >
            نسخ من الهاتف
          </Link>
          <Link
            href="/dashboard/contacts"
            className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-black text-white"
          >
            إدارة الدفتر
          </Link>
        </div>
      </div>

      {loading && (
        <p className="text-xs font-bold text-mistara-brown/70">جاري تحميل الأسماء والأرقام…</p>
      )}
      {error && (
        <p role="alert" className="text-xs font-bold text-red-800">
          {error}
        </p>
      )}

      {!loading && !error && contacts.length === 0 && (
        <p className="text-xs font-bold leading-relaxed text-mistara-brown/75">
          لا يوجد عملاء بعد. أضف أسماءاً من{' '}
          <Link href="/dashboard/contacts" className="text-primary underline">
            جهات الاتصال
          </Link>
          .
        </p>
      )}

      {contacts.length > 0 && (
        <ul className="max-h-52 space-y-1 overflow-y-auto overscroll-y-contain rounded-xl border border-mistara-brown/12 bg-white p-1.5">
          {contacts.map((c) => (
            <li key={c.id}>
              <Link
                href={`/?contactId=${encodeURIComponent(c.id)}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-primary/8 active:bg-primary/12"
              >
                <span className="min-w-0 truncate text-sm font-black text-mistara-espresso">
                  {c.is_favorite ? '⭐ ' : ''}
                  {c.full_name}
                  {c.company?.trim() ? (
                    <span className="mr-1 text-[10px] font-bold text-mistara-brown/60">({c.company.trim()})</span>
                  ) : null}
                </span>
                <span className="shrink-0 tnum text-xs font-bold text-mistara-brown/70" dir="ltr">
                  +{c.phone_country}
                  {c.phone_local}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}