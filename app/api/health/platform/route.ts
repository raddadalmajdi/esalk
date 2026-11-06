import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** فحص إعداد المنصة (بدون أسرار) — للتشخيص قبل الدفع. */
export async function GET() {
  let firebaseAdmin = false;
  let firebaseAdminError: string | null = null;

  try {
    const { getFirebaseAdminFirestore } = await import('@/lib/firebase-admin');
    getFirebaseAdminFirestore();
    firebaseAdmin = true;
  } catch (error) {
    firebaseAdminError = error instanceof Error ? error.message : 'firebase-admin unavailable';
  }

  const checks = {
    moyasarSecret: Boolean(process.env.MOYASAR_SECRET_KEY?.trim()),
    moyasarPublishable: Boolean(
      process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY?.trim() ||
        process.env.VITE_MOYASAR_PUBLISHABLE_KEY?.trim()
    ),
    firebaseAdmin,
    firebaseAdminError: firebaseAdmin ? null : firebaseAdminError,
    firebaseProjectId: Boolean(
      process.env.FIREBASE_PROJECT_ID?.trim() ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()
    ),
    appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() ?? null,
  };

  return NextResponse.json({
    ok:
      checks.moyasarSecret &&
      checks.moyasarPublishable &&
      checks.firebaseAdmin &&
      checks.firebaseProjectId,
    checks,
  });
}
