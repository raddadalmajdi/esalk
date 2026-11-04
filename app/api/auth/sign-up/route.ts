import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** @deprecated التسجيل عبر Firebase Client — لم يعد هذا المسار (Resend/OTP) مستخدماً. */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      code: 'deprecated_signup_api',
      message:
        'التسجيل يتم الآن عبر Firebase في المتصفح. حدّث الصفحة — لا حاجة لـ Resend.',
    },
    { status: 410 }
  );
}
