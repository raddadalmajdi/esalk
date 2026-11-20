import { createContactApi, fetchContacts, updateContactApi } from '@/lib/contacts-api';
import type { ContactRecord } from '@/lib/contacts-types';
import { phonesMatch } from '@/lib/tailor-customers';

type EnsureContactParams = {
  fullName: string;
  phoneCountry: string;
  phoneLocal: string;
  organizationId?: string | null;
  company?: string | null;
  existingContactId?: string | null;
};

/** يضمن وجود صف في دفتر جهات الاتصال للعميل — إنشاء أو ربط حسب الرقم. */
export async function ensureMerchantContactForCustomer(
  accessToken: string,
  params: EnsureContactParams
): Promise<ContactRecord | null> {
  const name = params.fullName.trim();
  const local = params.phoneLocal.trim();
  const cc = params.phoneCountry.trim();
  if (!name || !local || !cc) return null;

  if (params.existingContactId) {
    return null;
  }

  const fullPhone = `${cc}${local}`;
  const list = await fetchContacts(accessToken);
  const existing = list.find(
    (c) =>
      (c.phone_country === cc && c.phone_local === local) ||
      phonesMatch(c.phone, fullPhone) ||
      phonesMatch(`${c.phone_country}${c.phone_local}`, fullPhone)
  );

  if (existing) {
    if (existing.full_name.trim() !== name && name.length >= 2) {
      try {
        return await updateContactApi(accessToken, existing.id, {
          full_name: name,
          phone_country: existing.phone_country,
          phone_local: existing.phone_local,
          email: existing.email,
          company: params.company?.trim() || existing.company,
          category: existing.category,
          notes: existing.notes,
          is_favorite: existing.is_favorite,
          organization_id: existing.organization_id,
        });
      } catch {
        return existing;
      }
    }
    return existing;
  }

  try {
    return await createContactApi(accessToken, {
      full_name: name,
      phone_country: cc,
      phone_local: local,
      organization_id: params.organizationId ?? null,
      company: params.company?.trim() || null,
      category: 'عميل',
      notes: 'ملف عميل — أُنشئ تلقائياً عند حفظ فاتورة',
    });
  } catch {
    const retry = await fetchContacts(accessToken);
    return (
      retry.find(
        (c) =>
          (c.phone_country === cc && c.phone_local === local) ||
          phonesMatch(c.phone, fullPhone)
      ) ?? null
    );
  }
}