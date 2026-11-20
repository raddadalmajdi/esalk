import { NextResponse } from 'next/server';
import { getUserFromBearerToken } from '@/lib/billing-auth-server';
import { seedDemoContactsForUser } from '@/lib/contacts-server';

export const runtime = 'nodejs';

/** بيانات تجريبية (3 جهات) — مرة واحدة لكل مستخدم. */
export async function POST(request: Request) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'يجب تسجيل الدخول.' }, { status: 401 });
  }

  let organizationId: string | null = null;
  try {
    const body = (await request.json()) as { organizationId?: string | null };
    organizationId = body.organizationId?.trim() || null;
  } catch {
    organizationId = null;
  }

  try {
    const contacts = await seedDemoContactsForUser(user.id, organizationId);
    return NextResponse.json({ ok: true, count: contacts.length, contacts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذّر إنشاء البيانات التجريبية.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}