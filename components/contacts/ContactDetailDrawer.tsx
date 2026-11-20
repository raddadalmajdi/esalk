'use client';

import Link from 'next/link';
import { formatGregorianDateAr } from '@/lib/format-app-date';
import type { ContactInvoiceStats, ContactRecord } from '@/lib/contacts-types';

type ContactDetailDrawerProps = {
  open: boolean;
  contact: ContactRecord | null;
  stats: ContactInvoiceStats | null;
  loading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ContactDetailDrawer({
  open,
  contact,
  stats,
  loading,
  onClose,
  onEdit,
  onDelete,
}: ContactDetailDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[75] flex justify-end bg-black/40" dir="rtl">
      <div className="glass-panel h-full w-full max-w-md overflow-y-auto border-l border-mistara-gold/25 p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 className="text-lg font-black text-mistara-gold">تفاصيل جهة الاتصال</h2>
          <button type="button" onClick={onClose} className="text-sm font-bold text-mistara-brown">
            إغلاق
          </button>
        </div>

        {loading && <p className="text-sm font-bold text-mistara-brown/70">جاري التحميل...</p>}

        {contact && (
          <div className="space-y-4">
            <ContactDrawerHeader contact={contact} />

            <dl className="space-y-2 text-sm">
              <Row label="الجوال" value={`+${contact.phone_country}${contact.phone_local}`} dir="ltr" />
              {contact.email && <Row label="البريد" value={contact.email} dir="ltr" />}
              {contact.company && <Row label="الشركة" value={contact.company} />}
              <Row label="التصنيف" value={contact.category} />
              {contact.notes && <Row label="ملاحظات" value={contact.notes} />}
              <Row label="تاريخ الإضافة" value={formatGregorianDateAr(contact.created_at)} />
              <Row label="آخر تعديل" value={formatGregorianDateAr(contact.updated_at)} />
            </dl>

            {stats && (
              <section className="rounded-2xl border border-mistara-gold/20 bg-mistara-cream/70 p-3 space-y-1.5">
                <p className="text-xs font-bold text-mistara-gold">الفواتير</p>
                <p className="text-sm font-black">
                  العدد: <span className="tnum">{stats.invoice_count}</span>
                </p>
                {stats.last_invoice_at && (
                  <p className="text-xs font-bold text-mistara-brown/75">
                    آخر فاتورة: {formatGregorianDateAr(stats.last_invoice_at)}
                  </p>
                )}
                <p className="text-[11px] text-mistara-brown/60">{stats.total_amount_note}</p>
              </section>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Link
                href={`/?contactId=${encodeURIComponent(contact.id)}`}
                className="rounded-xl bg-primary py-3 text-center text-sm font-black text-white"
              >
                إنشاء فاتورة جديدة له
              </Link>
              <button type="button" onClick={onEdit} className="rounded-xl border border-primary/25 py-3 text-sm font-bold text-primary-dark">
                تعديل
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-xl border border-red-200 py-3 text-sm font-bold text-red-700"
              >
                حذف
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactDrawerHeader({ contact }: { contact: ContactRecord }) {
  return (
    <div className="flex items-center gap-2">
      <h3 className="text-xl font-black text-mistara-espresso">{contact.full_name}</h3>
      {contact.is_favorite && <span title="مفضل">⭐</span>}
    </div>
  );
}

function Row({ label, value, dir }: { label: string; value: string; dir?: 'ltr' | 'rtl' }) {
  return (
    <div>
      <dt className="text-xs font-bold text-mistara-gold">{label}</dt>
      <dd className={`font-bold text-mistara-espresso ${dir === 'ltr' ? 'tnum text-left' : ''}`} dir={dir}>
        {value}
      </dd>
    </div>
  );
}