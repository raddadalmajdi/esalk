import { NextResponse } from 'next/server';
import { getUserFromBearerToken } from '@/lib/billing-auth-server';
import {
  deleteContactForUser,
  getContactForUser,
  getContactInvoiceStats,
  updateContactForUser,
} from '@/lib/contacts-server';
import type { ContactInput } from '@/lib/contacts-types';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'يجب تسجيل الدخول.' }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const contact = await getContactForUser(user.id, id);
    if (!contact) {
      return NextResponse.json({ ok: false, message: 'غير موجود.' }, { status: 404 });
    }
    const stats = await getContactInvoiceStats(user.id, contact);
    return NextResponse.json({ ok: true, contact, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذّر التحميل.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'يجب تسجيل الدخول.' }, { status: 401 });
  }

  const { id } = await context.params;
  let body: ContactInput;
  try {
    body = (await request.json()) as ContactInput;
  } catch {
    return NextResponse.json({ ok: false, message: 'طلب غير صالح.' }, { status: 400 });
  }

  try {
    const contact = await updateContactForUser(user.id, id, body);
    return NextResponse.json({ ok: true, contact });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذّر التحديث.';
    const status = message.includes('غير موجودة') ? 404 : message.includes('محفوظ مسبقاً') ? 409 : 400;
    return NextResponse.json({ ok: false, message }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'يجب تسجيل الدخول.' }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await deleteContactForUser(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذّر الحذف.';
    const status = message.includes('غير موجودة') ? 404 : 400;
    return NextResponse.json({ ok: false, message }, { status });
  }
}