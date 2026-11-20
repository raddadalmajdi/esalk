'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthBootScreen } from '@/components/auth/AuthBootScreen';
import { ContactDetailDrawer } from '@/components/contacts/ContactDetailDrawer';
import { ContactFormModal } from '@/components/contacts/ContactFormModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useOrganization } from '@/components/organization/OrganizationProvider';
import { resolveClientSession } from '@/lib/auth-session-client';
import {
  CONTACT_CSV_TEMPLATE,
  contactsToCsv,
  contactsToExcelTsv,
  downloadTextFile,
  parseContactsCsv,
} from '@/lib/contacts-csv';
import {
  createContactApi,
  deleteContactApi,
  fetchContacts,
  getContactApi,
  seedDemoContactsApi,
  updateContactApi,
} from '@/lib/contacts-api';
import { DEFAULT_CONTACT_CATEGORIES, type ContactInput, type ContactRecord, type ContactInvoiceStats } from '@/lib/contacts-types';
import { isFirebaseConfigured } from '@/lib/firebase-auth-client';
import { upsertTailorCustomer } from '@/lib/tailor-customers';
import { formatGregorianDateAr } from '@/lib/format-app-date';

type ViewMode = 'cards' | 'table';

export function ContactsPageClient() {
  const searchParams = useSearchParams();
  const { organizationId } = useOrganization();
  const { pushToast } = useToast();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('الكل');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContactRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<ContactRecord | null>(null);
  const [selectedStats, setSelectedStats] = useState<ContactInvoiceStats | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContactRecord | null>(null);
  const [importing, setImporting] = useState(false);

  const extraCategories = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (!DEFAULT_CONTACT_CATEGORIES.includes(c.category as (typeof DEFAULT_CONTACT_CATEGORIES)[number])) {
        set.add(c.category);
      }
    });
    return [...set];
  }, [contacts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      if (categoryFilter !== 'الكل' && c.category !== categoryFilter) return false;
      if (favoritesOnly && !c.is_favorite) return false;
      if (!q) return true;
      const hay = `${c.full_name} ${c.phone} ${c.company ?? ''} ${c.email ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [contacts, query, categoryFilter, favoritesOnly]);

  const loadContacts = useCallback(async () => {
    if (!accessToken) return;
    const list = await fetchContacts(accessToken);
    setContacts(list);
  }, [accessToken]);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setBooting(false);
      return;
    }
    void (async () => {
      const session = await resolveClientSession();
      if (!session.ok) {
        setBooting(false);
        return;
      }
      setAccessToken(session.accessToken);
      setUserId(session.userId);
      try {
        const list = await fetchContacts(session.accessToken);
        setContacts(list);
      } catch (err) {
        pushToast('error', err instanceof Error ? err.message : 'تعذّر التحميل.');
      } finally {
        setBooting(false);
      }
    })();
  }, [pushToast]);

  useEffect(() => {
    const id = searchParams.get('id')?.trim();
    if (!id || !accessToken || contacts.length === 0) return;
    const found = contacts.find((c) => c.id === id);
    if (found) void openDetail(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, accessToken, contacts.length]);

  const syncTailorCustomer = async (contact: ContactRecord) => {
    if (!userId) return;
    await upsertTailorCustomer(userId, contact.phone, contact.full_name, organizationId);
  };

  const handleSave = async (input: ContactInput) => {
    if (!accessToken) return;
    if (editing) {
      const updated = await updateContactApi(accessToken, editing.id, input);
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      pushToast('success', 'تم تحديث جهة الاتصال.');
      await syncTailorCustomer(updated);
    } else {
      const created = await createContactApi(accessToken, input);
      setContacts((prev) => [created, ...prev]);
      pushToast('success', 'تمت إضافة جهة الاتصال.');
      await syncTailorCustomer(created);
    }
    setEditing(null);
  };

  const openDetail = async (contact: ContactRecord) => {
    setSelected(contact);
    setDrawerOpen(true);
  setDetailLoading(true);
    setSelectedStats(null);
    if (!accessToken) return;
    try {
      const { stats } = await getContactApi(accessToken, contact.id);
      setSelectedStats(stats);
    } catch {
      pushToast('error', 'تعذّر تحميل إحصاءات الفواتير.');
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !accessToken) return;
    try {
      await deleteContactApi(accessToken, deleteTarget.id);
      setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      pushToast('success', 'تم الحذف.');
      setDeleteTarget(null);
      setDrawerOpen(false);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'تعذّر الحذف.');
    }
  };

  const handleImportFile = async (file: File) => {
    if (!accessToken) return;
    setImporting(true);
    try {
      const text = await file.text();
      const { rows, skipped } = parseContactsCsv(text);
      let added = 0;
      for (const row of rows) {
        try {
          const created = await createContactApi(accessToken, { ...row, organization_id: organizationId });
          await syncTailorCustomer(created);
          added++;
        } catch {
          /* duplicate skipped */
        }
      }
      await loadContacts();
      pushToast('success', `تم استيراد ${added} جهة. تم تجاهل ${skipped} صف.`);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'فشل الاستيراد.');
    } finally {
      setImporting(false);
    }
  };

  if (booting) return <AuthBootScreen message="جاري فتح دفتر جهات الاتصال..." />;

  if (!isFirebaseConfigured()) {
    return (
      <EmptyState
        title="يتطلب حساباً"
        description="سجّل الدخول على esalk.com لاستخدام دفتر جهات الاتصال."
        icon={<span>📒</span>}
      />
    );
  }

  if (!accessToken) {
    return (
      <EmptyState
        title="يجب تسجيل الدخول"
        description={
          <>
            <Link href="/" className="text-primary underline">
              العودة لتسجيل الدخول
            </Link>
          </>
        }
        icon={<span>🔒</span>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-mistara-espresso">جهات الاتصال</h1>
          <p className="text-sm font-bold text-mistara-brown/70">دفتر عملاءك ومورديك — خاص بك فقط</p>
          <p className="mt-1 text-xs font-bold text-primary">
            الإجمالي: <span className="tnum">{contacts.length}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white shadow-lg active:scale-[0.98]"
        >
          + إضافة جهة اتصال
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث: الاسم، الجوال، الشركة..."
          className="auth-field-input min-h-[2.75rem] flex-1 min-w-[12rem]"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="auth-field-input min-h-[2.75rem] w-auto min-w-[8rem]"
        >
          <option value="الكل">كل التصنيفات</option>
          {[...DEFAULT_CONTACT_CATEGORIES, ...extraCategories].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-mistara-brown/15 bg-white px-3 text-sm font-bold">
          <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
          المفضّلون فقط
        </label>
        <div className="flex rounded-xl border border-mistara-brown/15 bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${viewMode === 'cards' ? 'bg-primary/12 text-primary' : ''}`}
          >
            بطاقات
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${viewMode === 'table' ? 'bg-primary/12 text-primary' : ''}`}
          >
            جدول
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <label className="cursor-pointer rounded-xl border border-mistara-gold/30 bg-mistara-cream px-3 py-2 font-bold">
          استيراد CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={importing}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImportFile(f);
              e.target.value = '';
            }}
          />
        </label>
        <button
          type="button"
          className="rounded-xl border border-mistara-gold/30 bg-mistara-cream px-3 py-2 font-bold"
          onClick={() => downloadTextFile('contacts-template.csv', 'text/csv;charset=utf-8', CONTACT_CSV_TEMPLATE)}
        >
          تنزيل قالب CSV
        </button>
        <button
          type="button"
          className="rounded-xl border border-mistara-gold/30 bg-mistara-cream px-3 py-2 font-bold"
          onClick={() => downloadTextFile(`contacts-${Date.now()}.csv`, 'text/csv;charset=utf-8', contactsToCsv(filtered))}
        >
          تصدير CSV
        </button>
        <button
          type="button"
          className="rounded-xl border border-mistara-gold/30 bg-mistara-cream px-3 py-2 font-bold"
          onClick={() =>
            downloadTextFile(`contacts-${Date.now()}.xls`, 'application/vnd.ms-excel', contactsToExcelTsv(filtered))
          }
        >
          تصدير Excel
        </button>
        <button
          type="button"
          disabled
          title="قريباً"
          className="rounded-xl border border-dashed border-mistara-brown/25 px-3 py-2 font-bold text-mistara-brown/50"
        >
          استيراد vCard — TODO
        </button>
        {contacts.length === 0 && (
          <button
            type="button"
            className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 font-bold text-sky-900"
            onClick={() =>
              void seedDemoContactsApi(accessToken, organizationId)
                .then(() => loadContacts())
                .then(() => pushToast('success', 'تمت إضافة 3 جهات تجريبية.'))
                .catch((err) => pushToast('error', err instanceof Error ? err.message : 'فشل'))
            }
          >
            تجربة: 3 جهات وهمية
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="لا توجد جهات اتصال بعد"
          description="ابدأ بإضافة عميل أو مورد، أو استورد ملف CSV."
          icon={<span>📒</span>}
          action={
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-white"
            >
              + إضافة جهة اتصال
            </button>
          }
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => void openDetail(c)}
              className="glass-panel rounded-2xl border border-mistara-gold/20 p-4 text-right transition-transform active:scale-[0.99]"
            >
              <ContactCardPreview contact={c} />
            </button>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-mistara-gold/20 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-mistara-cream text-mistara-gold">
              <tr>
                <th className="px-3 py-2 text-right font-black">الاسم</th>
                <th className="px-3 py-2 text-right font-black">الجوال</th>
                <th className="px-3 py-2 text-right font-black">الشركة</th>
                <th className="px-3 py-2 text-right font-black">التصنيف</th>
                <th className="px-3 py-2 text-right font-black">آخر تعديل</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer border-t border-mistara-brown/10 hover:bg-primary/5"
                  onClick={() => void openDetail(c)}
                >
                  <td className="px-3 py-2 font-bold">
                    {c.is_favorite ? '⭐ ' : ''}
                    {c.full_name}
                  </td>
                  <td className="px-3 py-2 tnum" dir="ltr">
                    +{c.phone_country}
                    {c.phone_local}
                  </td>
                  <td className="px-3 py-2">{c.company ?? '—'}</td>
                  <td className="px-3 py-2">{c.category}</td>
                  <td className="px-3 py-2 text-xs">{formatGregorianDateAr(c.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ContactFormModal
        open={formOpen}
        initial={editing}
        organizationId={organizationId}
        extraCategories={extraCategories}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSave}
      />

      <ContactDetailDrawer
        open={drawerOpen}
        contact={selected}
        stats={selectedStats}
        loading={detailLoading}
        onClose={() => setDrawerOpen(false)}
        onEdit={() => {
          if (!selected) return;
          setEditing(selected);
          setFormOpen(true);
        }}
        onDelete={() => selected && setDeleteTarget(selected)}
      />

      {deleteTarget && (
        <DeleteConfirmDialog
          confirm={() => void confirmDelete()}
          cancel={() => setDeleteTarget(null)}
          name={deleteTarget.full_name}
        />
      )}
    </div>
  );
}

function ContactCardPreview({ contact }: { contact: ContactRecord }) {
  return (
    <>
      <p className="text-base font-black text-mistara-espresso">
        {contact.is_favorite && <span className="ml-1">⭐</span>}
        {contact.full_name}
      </p>
      <p className="mt-1 tnum text-xs font-bold text-mistara-brown/80" dir="ltr">
        +{contact.phone_country}
        {contact.phone_local}
      </p>
      {contact.company && <p className="mt-1 text-xs text-mistara-brown/70">{contact.company}</p>}
      <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
        {contact.category}
      </span>
    </>
  );
}

function DeleteConfirmDialog({
  name,
  confirm,
  cancel,
}: {
  name: string;
  confirm: () => void;
  cancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4">
      <div className="glass-panel max-w-sm rounded-2xl p-5 text-center">
        <p className="text-sm font-black text-red-800">هل أنت متأكد؟</p>
        <p className="mt-2 text-sm text-mistara-brown/80">سيتم حذف «{name}» نهائياً.</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={cancel} className="flex-1 rounded-xl border py-2 text-sm font-bold">
            إلغاء
          </button>
          <button type="button" onClick={confirm} className="flex-1 rounded-xl bg-red-700 py-2 text-sm font-bold text-white">
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}