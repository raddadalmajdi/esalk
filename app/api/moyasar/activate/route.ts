import { NextResponse } from 'next/server';
import {
  assertEmailVerifiedForSensitiveApi,
  BillingAuthError,
  getUserFromBearerToken,
  requireBillingOwner,
} from '@/lib/billing-auth-server';
import {
  activateMoyasarMonthlySubscription,
  logBillingEvent,
} from '@/lib/subscription-server';
import {
  assertMoyasarMonthlyPayment,
  assertMoyasarPaymentForOrganization,
  fetchMoyasarPayment,
} from '@/lib/moyasar-server';
import { findOrganizationIdByMoyasarPaymentId } from '@/lib/subscription-server';

export const runtime = 'nodejs';

function isMoyasarConfigured(): boolean {
  return Boolean(process.env.MOYASAR_SECRET_KEY?.trim());
}

/** يتحقق من دفع ميسر ويفعّل اشتراك monthly_9sar في Firestore. */
export async function POST(request: Request) {
  if (!isMoyasarConfigured()) {
    return NextResponse.json(
      { ok: false, message: 'بوابة ميسر غير مضبوطة (MOYASAR_SECRET_KEY).' },
      { status: 501 }
    );
  }

  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'يجب تسجيل الدخول.' }, { status: 401 });
  }

  try {
    assertEmailVerifiedForSensitiveApi(user);
  } catch (error) {
    if (error instanceof BillingAuthError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 403 });
    }
    throw error;
  }

  let body: { paymentId?: string; organizationId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: 'طلب غير صالح.' }, { status: 400 });
  }

  const paymentId = body.paymentId?.trim() ?? '';
  const organizationId = body.organizationId?.trim() ?? '';

  if (!paymentId || !organizationId) {
    return NextResponse.json(
      { ok: false, message: 'paymentId و organizationId مطلوبان.' },
      { status: 400 }
    );
  }

  try {
    await requireBillingOwner(user.id, organizationId);

    const payment = await fetchMoyasarPayment(paymentId);
    assertMoyasarMonthlyPayment(payment);
    assertMoyasarPaymentForOrganization(payment, organizationId);

    const priorOrgId = await findOrganizationIdByMoyasarPaymentId(payment.id);
    if (priorOrgId && priorOrgId !== organizationId) {
      return NextResponse.json(
        { ok: false, message: 'معرّف الدفع مستخدم مسبقاً لمحل آخر.' },
        { status: 409 }
      );
    }

    await activateMoyasarMonthlySubscription({
      organizationId,
      paymentId: payment.id,
      ownerUserId: user.id,
    });

    await logBillingEvent({
      organizationId,
      planId: 'monthly_9sar',
      eventType: 'moyasar_activate_api',
      payload: { paymentId: payment.id, status: payment.status },
    });

    return NextResponse.json({ ok: true, paymentId: payment.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذّر تفعيل الاشتراك.';
    const status =
      message === 'FORBIDDEN_NOT_OWNER' ||
      message.includes('لا يخص') ||
      message.includes('معرّف المحل')
        ? 403
        : message.includes('حالة الدفع')
          ? 402
          : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
