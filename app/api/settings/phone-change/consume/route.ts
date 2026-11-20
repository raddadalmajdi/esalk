import { NextResponse } from 'next/server';
import { getUserFromBearerToken } from '@/lib/billing-auth-server';
import {
  consumePhoneChangeGrant,
  normalizeMerchantPhone,
} from '@/lib/settings-phone-change-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const authUser = await getUserFromBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ ok: false, message: 'يجب تسجيل الدخول.' }, { status: 401 });
  }

  let body: { phone?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: 'طلب غير صالح.' }, { status: 400 });
  }

  const phone = normalizeMerchantPhone(body.phone ?? '');
  if (!phone) {
    return NextResponse.json({ ok: false, message: 'رقم المحل مطلوب.' }, { status: 400 });
  }

  const result = await consumePhoneChangeGrant(authUser.id, phone);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}