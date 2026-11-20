import { NextResponse } from 'next/server';
import { getUserFromBearerToken } from '@/lib/billing-auth-server';
import { createContactForUser, listContactsForUser, searchContactsForUser } from '@/lib/contacts-server';
import type { ContactInput } from '@/lib/contacts-types';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'يجب تسجيل الدخول.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const category = url.searchParams.get('category')?.trim() ?? '';
  const favoriteOnly = url.searchParams.get('favorite') === '1';

  try {
    let contacts = q ? await searchContactsForUser(user.id, q) : await listContactsForUser(user.id);
    if (category && category !== 'الكل') {
      contacts = contacts.filter((c) => c.category === category);
    }
    if (favoriteOnly) {
      contacts = contacts.filter((c) => c.is_favorite);
    }
    return NextResponse.json({ ok: true, contacts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذّر جلب جهات الاتصال.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'يجب تسجيل الدخول.' }, { status: 401 });
  }

  let body: ContactInput;
  try {
    body = (await request.json()) as ContactInput;
  } catch {
    return NextResponse.json({ ok: false, message: 'طلب غير صالح.' }, { status: 400 });
  }

  try {
    const contact = await createContactForUser(user.id, body);
    return NextResponse.json({ ok: true, contact });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذّر إنشاء جهة الاتصال.';
    const status = message.includes('محفوظ مسبقاً') ? 409 : 400;
    return NextResponse.json({ ok: false, message }, { status });
  }
}