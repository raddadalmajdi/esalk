import type { ContactInput, ContactRecord, ContactInvoiceStats } from '@/lib/contacts-types';

async function authHeaders(accessToken: string): Promise<HeadersInit> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

type ApiContactList = { ok: boolean; contacts?: ContactRecord[]; message?: string };
type ApiContactOne = {
  ok: boolean;
  contact?: ContactRecord;
  stats?: ContactInvoiceStats;
  message?: string;
};

export async function fetchContacts(
  accessToken: string,
  params?: { q?: string; category?: string; favorite?: boolean }
): Promise<ContactRecord[]> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set('q', params.q);
  if (params?.category) sp.set('category', params.category);
  if (params?.favorite) sp.set('favorite', '1');
  const qs = sp.toString();
  const res = await fetch(`/api/contacts${qs ? `?${qs}` : ''}`, {
    headers: await authHeaders(accessToken),
    credentials: 'include',
  });
  const json = (await res.json()) as ApiContactList;
  if (!res.ok || !json.ok) throw new Error(json.message ?? 'تعذّر جلب جهات الاتصال.');
  return json.contacts ?? [];
}

export async function searchContactsApi(accessToken: string, q: string): Promise<ContactRecord[]> {
  const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(q)}`, {
    headers: await authHeaders(accessToken),
    credentials: 'include',
  });
  const json = (await res.json()) as ApiContactList;
  if (!res.ok || !json.ok) throw new Error(json.message ?? 'تعذّر البحث.');
  return json.contacts ?? [];
}

export async function createContactApi(accessToken: string, input: ContactInput): Promise<ContactRecord> {
  const res = await fetch('/api/contacts', {
    method: 'POST',
    headers: await authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as ApiContactOne;
  if (!res.ok || !json.ok || !json.contact) {
    throw new Error(json.message ?? 'تعذّر إضافة جهة الاتصال.');
  }
  return json.contact;
}

export async function updateContactApi(
  accessToken: string,
  id: string,
  input: ContactInput
): Promise<ContactRecord> {
  const res = await fetch(`/api/contacts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: await authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as ApiContactOne;
  if (!res.ok || !json.ok || !json.contact) {
    throw new Error(json.message ?? 'تعذّر تحديث جهة الاتصال.');
  }
  return json.contact;
}

export async function deleteContactApi(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`/api/contacts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: await authHeaders(accessToken),
    credentials: 'include',
  });
  const json = (await res.json()) as { ok?: boolean; message?: string };
  if (!res.ok || !json.ok) throw new Error(json.message ?? 'تعذّر الحذف.');
}

export async function getContactApi(
  accessToken: string,
  id: string
): Promise<{ contact: ContactRecord; stats: ContactInvoiceStats }> {
  const res = await fetch(`/api/contacts/${encodeURIComponent(id)}`, {
    headers: await authHeaders(accessToken),
    credentials: 'include',
  });
  const json = (await res.json()) as ApiContactOne;
  if (!res.ok || !json.ok || !json.contact || !json.stats) {
    throw new Error(json.message ?? 'تعذّر تحميل التفاصيل.');
  }
  return { contact: json.contact, stats: json.stats };
}

export async function seedDemoContactsApi(accessToken: string, organizationId?: string | null): Promise<void> {
  const res = await fetch('/api/contacts/seed', {
    method: 'POST',
    headers: await authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify({ organizationId: organizationId ?? null }),
  });
  const json = (await res.json()) as { ok?: boolean; message?: string };
  if (!res.ok || !json.ok) throw new Error(json.message ?? 'تعذّر إنشاء البيانات التجريبية.');
}