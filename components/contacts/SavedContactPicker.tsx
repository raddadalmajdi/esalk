'use client';

import { useEffect, useState } from 'react';
import { fetchContacts } from '@/lib/contacts-api';
import type { ContactRecord } from '@/lib/contacts-types';
import { resolveClientSession } from '@/lib/auth-session-client';
import { isFirebaseConfigured } from '@/lib/firebase-auth-client';

type SavedContactPickerProps = {
  onSelect: (contact: ContactRecord) => void;
};

export function SavedContactPicker({ onSelect }: SavedContactPickerProps) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!isFirebaseConfigured()) return;
    setLoading(true);
    try {
      const session = await resolveClientSession();
      if (!session.ok) return;
      const list = await fetchContacts(session.accessToken);
      setContacts(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && contacts.length === 0) void load();
  }, [open, contacts.length]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-primary/25 bg-primary/8 py-2.5 text-sm font-black text-primary-dark"
      >
        {open ? 'إخفاء القائمة' : 'اختر عميلاً محفوظاً من الدفتر'}
      </button>
      {open && (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-mistara-brown/15 bg-white p-2">
          {loading && <li className="px-2 py-2 text-xs font-bold text-mistara-brown/70">جاري التحميل...</li>}
          {!loading && contacts.length === 0 && (
            <li className="px-2 py-2 text-xs font-bold text-mistara-brown/70">
              لا يوجد عملاء محفوظون —{' '}
              <a href="/dashboard/contacts" className="text-primary underline">
                أضف من جهات الاتصال
              </a>
            </li>
          )}
          {contacts.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-right text-sm font-bold hover:bg-primary/8"
                onClick={() => {
                  onSelect(c);
                  setOpen(false);
                }}
              >
                <span>
                  {c.is_favorite ? '⭐ ' : ''}
                  {c.full_name}
                </span>
                <span className="tnum text-xs text-mistara-brown/65" dir="ltr">
                  +{c.phone_country}
                  {c.phone_local}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}