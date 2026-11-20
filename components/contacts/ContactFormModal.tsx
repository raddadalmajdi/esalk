'use client';

import { useEffect, useState } from 'react';
import { COUNTRY_CODES } from '@/lib/home/constants';
import { DEFAULT_CONTACT_CATEGORIES, type ContactInput, type ContactRecord } from '@/lib/contacts-types';
import { normalizeStoredPhone } from '@/lib/tailor-customers';

type ContactFormModalProps = {
  open: boolean;
  initial?: ContactRecord | null;
  organizationId?: string | null;
  extraCategories: string[];
  onClose: () => void;
  onSubmit: (input: ContactInput) => Promise<void>;
};

const emptyForm: ContactInput = {
  full_name: '',
  phone_country: '966',
  phone_local: '',
  email: '',
  company: '',
  category: 'عميل',
  notes: '',
  is_favorite: false,
};

export function ContactFormModal({
  open,
  initial,
  organizationId,
  extraCategories,
  onClose,
  onSubmit,
}: ContactFormModalProps) {
  const [form, setForm] = useState<ContactInput>(emptyForm);
  const [customCategory, setCustomCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        full_name: initial.full_name,
        phone_country: initial.phone_country,
        phone_local: initial.phone_local,
        email: initial.email ?? '',
        company: initial.company ?? '',
        category: initial.category,
        notes: initial.notes ?? '',
        is_favorite: initial.is_favorite,
        organization_id: initial.organization_id,
      });
      setCustomCategory('');
    } else {
      setForm({ ...emptyForm, organization_id: organizationId ?? null, phone_country: '966' });
      setCustomCategory('');
    }
    setError(null);
  }, [open, initial, organizationId]);

  if (!open) return null;

  const categories = [...new Set([...DEFAULT_CONTACT_CATEGORIES, ...extraCategories])];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const category =
      form.category === 'آخر' && customCategory.trim() ? customCategory.trim() : form.category;
    try {
      await onSubmit({ ...form, category, organization_id: organizationId ?? null });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر الحفظ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4" dir="rtl">
      <div
        role="dialog"
        aria-modal="true"
        className="glass-panel max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-mistara-gold/25 p-5 shadow-2xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-black text-mistara-gold">{initial ? 'تعديل جهة اتصال' : 'إضافة جهة اتصال'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm font-bold text-mistara-brown">
            إلغاء
          </button>
        </header>

        {error && (
          <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
            {error}
          </p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label className="auth-field-label block">الاسم الكامل *</label>
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="auth-field-input"
            />
          </div>

          <div>
            <label className="auth-field-label block">رقم الجوال *</label>
            <div className="auth-phone-row">
              <input
                required
                type="tel"
                inputMode="numeric"
                dir="ltr"
                className="auth-phone-input--hero tnum text-right font-mono"
                value={form.phone_local}
                onChange={(e) => setForm((f) => ({ ...f, phone_local: normalizeStoredPhone(e.target.value) }))}
                placeholder={form.phone_country === '966' ? '512345678' : '50123456'}
              />
              <select
                className="auth-phone-select--hero tnum font-mono"
                value={form.phone_country}
                onChange={(e) => setForm((f) => ({ ...f, phone_country: e.target.value }))}
              >
                {COUNTRY_CODES.filter((c) => c.code === '966' || c.code === '965').map((c) => (
                  <option key={c.code} value={c.code}>
                    +{c.code}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-[11px] font-bold text-mistara-brown/65">السعودية +966 (9 أرقام تبدأ بـ 5) · الكويت +965 (8 أرقام)</p>
          </div>

          <div>
            <label className="auth-field-label block">البريد الإلكتروني</label>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="auth-field-input"
            />
          </div>

          <div>
            <label className="auth-field-label block">اسم الشركة / المحل</label>
            <input
              value={form.company ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              className="auth-field-input"
            />
          </div>

          <div>
            <label className="auth-field-label block">التصنيف</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="auth-field-input"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {form.category === 'آخر' && (
              <input
                className="auth-field-input mt-2"
                placeholder="اكتب تصنيفاً جديداً"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            )}
          </div>

          <div>
            <label className="auth-field-label block">ملاحظات</label>
            <textarea
              rows={3}
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="auth-field-input resize-y"
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-bold text-mistara-espresso">
            <input
              type="checkbox"
              checked={Boolean(form.is_favorite)}
              onChange={(e) => setForm((f) => ({ ...f, is_favorite: e.target.checked }))}
            />
            مفضل ⭐ (تثبيت في الأعلى)
          </label>

          <button
            type="submit"
            disabled={saving}
            className="auth-primary-btn w-full rounded-2xl py-3.5 text-sm font-black disabled:opacity-50"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </form>
      </div>
    </div>
  );
}