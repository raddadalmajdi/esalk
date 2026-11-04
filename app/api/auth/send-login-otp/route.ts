import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** @deprecated تسجيل الدخول برابط Firebase من المتصفح — لم يعد Resend OTP مستخدماً. */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      code: 'deprecated_login_otp_api',
      message: 'استخدم «رابط بريد» من صفحة الدخول (Firebase) — حدّث الصفحة.',
    },
    { status: 410 }
  );
}
