import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** @deprecated إعادة إرسال التفعيل عبر Firebase من واجهة التأكيد — ليس Resend. */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      code: 'deprecated_resend_api',
      message: 'استخدم «إعادة الإرسال» في شاشة تفعيل البريد (Firebase).',
    },
    { status: 410 }
  );
}
