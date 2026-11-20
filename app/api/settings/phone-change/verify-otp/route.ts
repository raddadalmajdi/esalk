import { NextResponse } from 'next/server';
import { getUserFromBearerToken } from '@/lib/billing-auth-server';
import { getFirebaseAdminAuth } from '@/lib/firebase-admin';
import {
  normalizeMerchantPhone,
  verifyMerchantPhoneChangeOtp,
} from '@/lib/settings-phone-change-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const authUser = await getUserFromBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ ok: false, message: 'يجب تسجيل الدخول.' }, { status: 401 });
  }

  let body: { code?: string; phone?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: 'طلب غير صالح.' }, { status: 400 });
  }

  const code = body.code?.trim() ?? '';
  const phone = normalizeMerchantPhone(body.phone ?? '');
  if (!code || !phone) {
    return NextResponse.json({ ok: false, message: 'الرمز ورقم المحل مطلوبان.' }, { status: 400 });
  }

  const adminUser = await getFirebaseAdminAuth().getUser(authUser.id);
  const email = adminUser.email?.trim().toLowerCase() ?? '';
  if (!email) {
    return NextResponse.json({ ok: false, message: 'لا يوجد بريد على الحساب.' }, { status: 400 });
  }

  const result = await verifyMerchantPhoneChangeOtp({
    userId: authUser.id,
    email,
    code,
    phone,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: 'تم التأكيد. اضغط «حفظ الإعدادات».' });
}