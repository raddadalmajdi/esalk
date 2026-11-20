import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';
import { normalizeStoredPhone, phonesMatch } from '@/lib/tailor-customers';
import type { ContactInput, ContactRecord, ContactInvoiceStats } from '@/lib/contacts-types';
import { validateContactPhone, type PhoneValidationResult } from '@/lib/contacts-phone';

const COLLECTION = 'contacts';

function mapContactDoc(id: string, data: FirebaseFirestore.DocumentData): ContactRecord {
  return {
    id,
    user_id: String(data.user_id ?? ''),
    organization_id: data.organization_id != null ? String(data.organization_id) : null,
    full_name: String(data.full_name ?? ''),
    phone: String(data.phone ?? ''),
    phone_country: String(data.phone_country ?? ''),
    phone_local: String(data.phone_local ?? ''),
    email: data.email != null ? String(data.email) : null,
    company: data.company != null ? String(data.company) : null,
    category: String(data.category ?? 'عميل'),
    notes: data.notes != null ? String(data.notes) : null,
    is_favorite: Boolean(data.is_favorite),
    created_at: String(data.created_at ?? ''),
    updated_at: String(data.updated_at ?? ''),
  };
}

function buildWriteRow(
  userId: string,
  input: ContactInput,
  phone: Extract<PhoneValidationResult, { ok: true }>
): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    organization_id: input.organization_id?.trim() || null,
    full_name: input.full_name.trim(),
    phone: phone.fullPhone,
    phone_country: phone.countryCode,
    phone_local: phone.localPhone,
    email: input.email?.trim() || null,
    company: input.company?.trim() || null,
    category: (input.category?.trim() || 'عميل').slice(0, 64),
    notes: input.notes?.trim() || null,
    is_favorite: Boolean(input.is_favorite),
    updated_at: now,
  };
}

async function findDuplicatePhone(userId: string, fullPhone: string, excludeId?: string): Promise<boolean> {
  const db = getFirebaseAdminFirestore();
  const snap = await db.collection(COLLECTION).where('user_id', '==', userId).limit(500).get();
  const target = normalizeStoredPhone(fullPhone);
  return snap.docs.some((doc) => {
    if (excludeId && doc.id === excludeId) return false;
    const rowPhone = normalizeStoredPhone(String(doc.data().phone ?? ''));
    return phonesMatch(target, rowPhone);
  });
}

export async function listContactsForUser(userId: string): Promise<ContactRecord[]> {
  const db = getFirebaseAdminFirestore();
  const snap = await db.collection(COLLECTION).where('user_id', '==', userId).limit(1000).get();
  const rows = snap.docs.map((d) => mapContactDoc(d.id, d.data()));
  rows.sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
    return b.updated_at.localeCompare(a.updated_at);
  });
  return rows;
}

export async function getContactForUser(userId: string, contactId: string): Promise<ContactRecord | null> {
  const db = getFirebaseAdminFirestore();
  const snap = await db.collection(COLLECTION).doc(contactId).get();
  if (!snap.exists) return null;
  const row = mapContactDoc(snap.id, snap.data()!);
  if (row.user_id !== userId) return null;
  return row;
}

export async function searchContactsForUser(userId: string, q: string): Promise<ContactRecord[]> {
  const needle = q.trim().toLowerCase();
  if (!needle) return listContactsForUser(userId);
  const all = await listContactsForUser(userId);
  return all.filter((c) => {
    const hay = `${c.full_name} ${c.phone} ${c.phone_local} ${c.company ?? ''} ${c.email ?? ''}`.toLowerCase();
    return hay.includes(needle);
  });
}

export async function createContactForUser(userId: string, input: ContactInput): Promise<ContactRecord> {
  if (!input.full_name?.trim()) {
    throw new Error('الاسم الكامل مطلوب.');
  }
  const phone = validateContactPhone(input.phone_country, input.phone_local);
  if (!phone.ok) throw new Error(phone.message);

  if (await findDuplicatePhone(userId, phone.fullPhone)) {
    throw new Error('هذا الرقم محفوظ مسبقاً');
  }

  const db = getFirebaseAdminFirestore();
  const now = new Date().toISOString();
  const row = { ...buildWriteRow(userId, input, phone), created_at: now };
  const ref = await db.collection(COLLECTION).add(row);
  return mapContactDoc(ref.id, { ...row });
}

export async function updateContactForUser(
  userId: string,
  contactId: string,
  input: ContactInput
): Promise<ContactRecord> {
  const existing = await getContactForUser(userId, contactId);
  if (!existing) throw new Error('جهة الاتصال غير موجودة.');

  if (!input.full_name?.trim()) throw new Error('الاسم الكامل مطلوب.');
  const phone = validateContactPhone(input.phone_country, input.phone_local);
  if (!phone.ok) throw new Error(phone.message);

  if (await findDuplicatePhone(userId, phone.fullPhone, contactId)) {
    throw new Error('هذا الرقم محفوظ مسبقاً');
  }

  const db = getFirebaseAdminFirestore();
  const row = buildWriteRow(userId, input, phone);
  await db.collection(COLLECTION).doc(contactId).set(row, { merge: true });
  const updated = await getContactForUser(userId, contactId);
  if (!updated) throw new Error('تعذّر تحديث جهة الاتصال.');
  return updated;
}

export async function deleteContactForUser(userId: string, contactId: string): Promise<void> {
  const existing = await getContactForUser(userId, contactId);
  if (!existing) throw new Error('جهة الاتصال غير موجودة.');
  const db = getFirebaseAdminFirestore();
  await db.collection(COLLECTION).doc(contactId).delete();
}

export async function getContactInvoiceStats(userId: string, contact: ContactRecord): Promise<ContactInvoiceStats> {
  const db = getFirebaseAdminFirestore();
  const snap = await db.collection('invoices').where('user_id', '==', userId).limit(500).get();
  const matches = snap.docs.filter((doc) => {
    const phone = String(doc.data().customer_phone ?? '');
    return phonesMatch(contact.phone, phone);
  });
  matches.sort((a, b) => {
    const at = String(a.data().created_at ?? '');
    const bt = String(b.data().created_at ?? '');
    return bt.localeCompare(at);
  });
  const last = matches[0];
  return {
    invoice_count: matches.length,
    last_invoice_at: last ? String(last.data().created_at ?? '') : null,
    total_amount_note: 'المبالغ غير مسجّلة في الفواتير حالياً — يُعرض العدد فقط.',
  };
}

export async function seedDemoContactsForUser(userId: string, organizationId?: string | null): Promise<ContactRecord[]> {
  const db = getFirebaseAdminFirestore();
  const markerRef = db.collection('contacts_seed_meta').doc(userId);
  const marker = await markerRef.get();
  if (marker.exists) {
    return listContactsForUser(userId);
  }

  const demos: ContactInput[] = [
    {
      full_name: 'أحمد العتيبي',
      phone_country: '966',
      phone_local: '512345678',
      company: 'محل الأناقة',
      category: 'عميل',
      notes: 'يفضّل واتساب',
      organization_id: organizationId,
    },
    {
      full_name: 'سارة المطيري',
      phone_country: '966',
      phone_local: '551122334',
      email: 'sara.demo@example.com',
      category: 'مورد',
      organization_id: organizationId,
    },
    {
      full_name: 'محمد الخالدي',
      phone_country: '965',
      phone_local: '50123456',
      company: 'شركة الخليج',
      category: 'عميل',
      is_favorite: true,
      organization_id: organizationId,
    },
  ];

  const created: ContactRecord[] = [];
  for (const demo of demos) {
    try {
      created.push(await createContactForUser(userId, demo));
    } catch {
      /* قد يكون الرقم موجوداً */
    }
  }
  await markerRef.set({ seeded_at: FieldValue.serverTimestamp() });
  return created.length ? created : listContactsForUser(userId);
}