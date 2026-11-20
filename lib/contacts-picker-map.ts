import type { ContactInput } from '@/lib/contacts-types';
import { phoneStringToContactFields } from '@/lib/contacts-phone';

type PickerContact = {
  name?: string[];
  tel?: string[];
  email?: string[];
};

export function mapPickerContactsToInputs(
  picked: PickerContact[],
  defaultCountry: '966' | '965' = '965'
): { rows: ContactInput[]; skipped: number } {
  const rows: ContactInput[] = [];
  let skipped = 0;

  for (const c of picked) {
    const fullName = (c.name?.[0] ?? '').trim() || (c.name?.join(' ') ?? '').trim();
    const tel = (c.tel?.[0] ?? '').trim();
    if (!fullName || !tel) {
      skipped++;
      continue;
    }
    const phone = phoneStringToContactFields(tel, defaultCountry);
    if (!phone) {
      skipped++;
      continue;
    }
    const email = (c.email?.[0] ?? '').trim() || null;
    rows.push({
      full_name: fullName,
      phone_country: phone.countryCode,
      phone_local: phone.localPhone,
      email,
      category: 'عميل',
      notes: 'مستورد من دفتر الهاتف (اختيار مباشر)',
    });
  }

  return { rows, skipped };
}