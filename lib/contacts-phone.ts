import { normalizeStoredPhone } from '@/lib/tailor-customers';

export type PhoneValidationResult =
  | { ok: true; fullPhone: string; countryCode: string; localPhone: string }
  | { ok: false; message: string };

/** تحقق من جوال سعودي (966) أو كويتي (965). */
export function validateContactPhone(countryCode: string, localPhone: string): PhoneValidationResult {
  const cc = normalizeStoredPhone(countryCode);
  const local = normalizeStoredPhone(localPhone);
  if (!cc || !local) {
    return { ok: false, message: 'رقم الجوال مطلوب.' };
  }

  if (cc === '966') {
    if (local.length !== 9) {
      return { ok: false, message: 'الجوال السعودي: 9 أرقام تبدأ بـ 5 (مثال: 501234567).' };
    }
    if (!local.startsWith('5')) {
      return { ok: false, message: 'الجوال السعودي يجب أن يبدأ بالرقم 5.' };
    }
    return { ok: true, fullPhone: `${cc}${local}`, countryCode: cc, localPhone: local };
  }

  if (cc === '965') {
    if (local.length !== 8) {
      return { ok: false, message: 'الجوال الكويتي: 8 أرقام (مثال: 50123456).' };
    }
    return { ok: true, fullPhone: `${cc}${local}`, countryCode: cc, localPhone: local };
  }

  return {
    ok: false,
    message: 'حالياً ندعم رموز +966 (السعودية) و +965 (الكويت) فقط.',
  };
}

/** استخراج رمز الدولة والجزء المحلي من رقم دولي أو محلي (دفتر الهاتف / vCard). */
export function phoneStringToContactFields(
  raw: string,
  defaultCountry: '966' | '965' = '965'
): { countryCode: string; localPhone: string } | null {
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  digits = normalizeStoredPhone(digits);
  if (!digits) return null;

  if (digits.startsWith('966') && digits.length >= 12) {
    const local = digits.slice(3);
    const v = validateContactPhone('966', local);
    return v.ok ? { countryCode: v.countryCode, localPhone: v.localPhone } : null;
  }
  if (digits.startsWith('965') && digits.length >= 11) {
    const local = digits.slice(3);
    const v = validateContactPhone('965', local);
    return v.ok ? { countryCode: v.countryCode, localPhone: v.localPhone } : null;
  }
  if (digits.startsWith('00966')) {
    return phoneStringToContactFields(digits.slice(2), defaultCountry);
  }
  if (digits.startsWith('00965')) {
    return phoneStringToContactFields(digits.slice(2), defaultCountry);
  }

  const vDefault = validateContactPhone(defaultCountry, digits);
  if (vDefault.ok) return { countryCode: vDefault.countryCode, localPhone: vDefault.localPhone };

  const other = defaultCountry === '965' ? '966' : '965';
  const vOther = validateContactPhone(other, digits);
  if (vOther.ok) return { countryCode: vOther.countryCode, localPhone: vOther.localPhone };

  return null;
}