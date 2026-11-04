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

/** يجلب تفاصيل دفعة من ميسر (يتطلب MOYASAR_SECRET_KEY). */
export async function fetchMoyasarPayment(paymentId: string): Promise<MoyasarPayment> {
  const secret = process.env.MOYASAR_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error('MOYASAR_SECRET_KEY غير مضبوط على الخادم.');
  }

  const auth = Buffer.from(`${secret}:`).toString('base64');
  const res = await fetch(`https://api.moyasar.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`تعذّر التحقق من الدفع (${res.status}): ${text.slice(0, 200)}`);
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
