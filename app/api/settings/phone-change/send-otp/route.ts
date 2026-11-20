import { NextResponse } from 'next/server';
import { getUserFromBearerToken } from '@/lib/billing-auth-server';
import { getFirebaseAdminAuth } from '@/lib/firebase-admin';
import { sendMerchantPhoneChangeOtp } from '@/lib/settings-phone-change-server';
import { isEmailVerifiedUser } from '@/lib/auth-confirmation-guard';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const authUser = await getUserFromBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ ok: false, message: 'يجب تسجيل الدخول.' }, { status: 401 });
  }

  const adminUser = await getFirebaseAdminAuth().getUser(authUser.id);
  const email = adminUser.email?.trim().toLowerCase() ?? '';
  if (!email) {
    return NextResponse.json(
      { ok: false, message: 'لا يوجد بريد على الحساب — لا يمكن إرسال رمز التأكيد.' },
      { status: 400 }
    );
  }

  if (
    !isEmailVerifiedUser({
      emailVerified: adminUser.emailVerified,
      providerData: adminUser.providerData,
    })
  ) {
    return NextResponse.json(
      { ok: false, message: 'فعّل البريد أو سجّل الدخول بحساب Google/Apple قبل تغيير الرقم.' },
      { status: 403 }
    );
  }

  const result = await sendMerchantPhoneChangeOtp({ userId: authUser.id, email });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ ok: true, message: 'أُرسل رمز التأكيد إلى بريدك.' });
}