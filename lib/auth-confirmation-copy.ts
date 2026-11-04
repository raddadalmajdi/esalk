import { OTP_LENGTH_AR } from '@/lib/otp-config';

/** نصوص تأكيد الحساب عبر رابط Firebase في البريد. */
export const AUTH_CONFIRMATION_SENT =
  'أرسلنا رابط تفعيل إلى بريدك عبر Firebase (قد يتأخر دقيقة). افتح الرابط ثم اضغط «فعّلت بريدي» أدناه. راجع Spam إن لم تظهر الرسالة.';

export const AUTH_CONFIRMATION_RESENT =
  'أُرسل رابط تفعيل جديد إلى بريدك. تحقق من مجلد الرسائل غير المرغوبة (Spam) أيضاً.';

export const AUTH_CONFIRMATION_LINK_HINT =
  'بعد الضغط على الرابط في البريد، عد إلى هذه الصفحة واضغط «فعّلت بريدي — تسجيل الدخول».';

export const AUTH_LOGIN_LINK_SENT =
  'أرسلنا رابط تسجيل دخول إلى بريدك عبر Firebase. افتحه من نفس الجهاز لإكمال الدخول.';

export const AUTH_OTP_OPTIONAL_LABEL = 'رمز التحقق المرسل إلى بريدك الإلكتروني';

export const AUTH_OTP_INCOMPLETE = `أدخل الرمز كاملاً (${OTP_LENGTH_AR}) المرسل إلى بريدك لتفعيل الحساب.`;

export const AUTH_UNCONFIRMED_LOGIN =
  'حسابك لم يُفعَّل بعد. افتح رابط التفعيل في بريدك، أو اطلب رابطاً جديداً ثم سجّل الدخول.';
