import { NextResponse } from 'next/server';
import { getUserFromBearerToken } from '@/lib/billing-auth-server';
import { searchContactsForUser } from '@/lib/contacts-server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'يجب تسجيل الدخول.' }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  try {
    const contacts = await searchContactsForUser(user.id, q);
    return NextResponse.json({ ok: true, contacts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذّر البحث.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}