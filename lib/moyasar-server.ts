import 'server-only';

export type MoyasarPayment = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
};

export const MOYASAR_MONTHLY_HALALAS = 900;
export const MOYASAR_MONTHLY_PLAN_ID = 'monthly_9sar';

function resolveMoyasarSecretKey(): string {
  const secret = process.env.MOYASAR_SECRET_KEY?.trim() ?? '';
  if (!secret) {
    throw new Error('MOYASAR_SECRET_KEY غير مضبوط على الخادم.');
  }
  if (secret.startsWith('pk_')) {
    throw new Error(
      'MOYASAR_SECRET_KEY يحتوي مفتاحاً عاماً (pk_) — استخدم المفتاح السري (sk_test_...) من لوحة ميسر في Vercel.'
    );
  }
  if (!secret.startsWith('sk_test_') && !secret.startsWith('sk_live_')) {
    throw new Error(
      'MOYASAR_SECRET_KEY غير بصيغة صحيحة — يجب أن يبدأ بـ sk_test_ أو sk_live_.'
    );
  }
  return secret;
}

function moyasarBasicAuthHeader(secret: string): string {
  return `Basic ${Buffer.from(`${secret}:`).toString('base64')}`;
}

/** يتحقق من أن المفتاح السري يعمل مع API ميسر (بدون كشف القيمة). */
export async function probeMoyasarSecretKey(): Promise<
  'ok' | 'missing' | 'invalid_format' | 'unauthorized'
> {
  let secret: string;
  try {
    secret = resolveMoyasarSecretKey();
  } catch {
    const raw = process.env.MOYASAR_SECRET_KEY?.trim();
    if (!raw) return 'missing';
    return 'invalid_format';
  }

  const res = await fetch('https://api.moyasar.com/v1/payments?page=1&limit=1', {
    headers: { Authorization: moyasarBasicAuthHeader(secret) },
    cache: 'no-store',
  });
  if (res.status === 401 || res.status === 403) return 'unauthorized';
  if (!res.ok) return 'unauthorized';
  return 'ok';
}

/** يجلب تفاصيل دفعة من ميسر (يتطلب MOYASAR_SECRET_KEY). */
export async function fetchMoyasarPayment(paymentId: string): Promise<MoyasarPayment> {
  const secret = resolveMoyasarSecretKey();

  const res = await fetch(`https://api.moyasar.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: moyasarBasicAuthHeader(secret) },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'مفتاح ميسر السري على الخادم (MOYASAR_SECRET_KEY) غير صحيح. في Vercel ضع sk_test_... من لوحة ميسr (ليس pk_test_) ثم أعد النشر.'
      );
    }
    const text = await res.text().catch(() => '');
    throw new Error(`تعذّر التحقق من الدفع (${res.status}): ${text.slice(0, 120)}`);
  }

  return (await res.json()) as MoyasarPayment;
}

export function assertMoyasarMonthlyPayment(payment: MoyasarPayment): void {
  const okStatus =
    payment.status === 'paid' || payment.status === 'captured' || payment.status === 'authorized';
  if (!okStatus) {
    throw new Error(`حالة الدفع غير مكتملة: ${payment.status}`);
  }
  if (payment.currency !== 'SAR') {
    throw new Error('عملة الدفع غير مدعومة.');
  }
  if (payment.amount !== MOYASAR_MONTHLY_HALALAS) {
    throw new Error('مبلغ الدفع لا يطابق اشتراك 9 ر.س.');
  }
}

/** يمنع استخدام دفعة مرتبطة بمحل آخر أو بدون metadata.organization_id. */
export function assertMoyasarPaymentForOrganization(
  payment: MoyasarPayment,
  organizationId: string
): void {
  const metaOrg = payment.metadata?.organization_id?.trim();
  if (!metaOrg) {
    throw new Error('الدفع لا يحتوي على معرّف المحل — رفض التفعيل.');
  }
  if (metaOrg !== organizationId) {
    throw new Error('الدفع لا يخص هذا المحل.');
  }
}
