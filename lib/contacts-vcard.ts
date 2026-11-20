import type { ContactInput } from '@/lib/contacts-types';
import { phoneStringToContactFields } from '@/lib/contacts-phone';

type VCardFields = Record<string, string[]>;

function unfoldVCardLines(raw: string): string[] {
  const physical = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const merged: string[] = [];
  for (const line of physical) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && merged.length > 0) {
      merged[merged.length - 1] += line.slice(1);
    } else if (line.trim()) {
      merged.push(line.trim());
    }
  }
  return merged;
}

function parseVCardBlock(lines: string[]): VCardFields {
  const fields: VCardFields = {};
  for (const line of lines) {
    const sep = line.indexOf(':');
    if (sep < 0) continue;
    const keyRaw = line.slice(0, sep);
    const value = line.slice(sep + 1).trim();
    if (!value) continue;
    const key = keyRaw.split(';')[0]!.toUpperCase();
    if (!fields[key]) fields[key] = [];
    fields[key]!.push(value);
  }
  return fields;
}

function nameFromFields(fields: VCardFields): string {
  const fn = fields.FN?.[0]?.trim();
  if (fn) return fn;
  const n = fields.N?.[0];
  if (n) {
    const parts = n.split(';').map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts.reverse().join(' ').trim();
  }
  return '';
}

function telFromFields(fields: VCardFields): string | null {
  const tels = fields.TEL;
  if (!tels?.length) return null;
  const mobile =
    tels.find((t) => /CELL|MOBILE|IPHONE/i.test(t)) ?? tels.find((t) => /VOICE/i.test(t)) ?? tels[0];
  return mobile?.replace(/^tel:/i, '').trim() ?? null;
}

function emailFromFields(fields: VCardFields): string | null {
  const emails = fields.EMAIL;
  if (!emails?.length) return null;
  return emails[0]!.replace(/^mailto:/i, '').trim() || null;
}

/** تحويل ملف vCard (.vcf) إلى صفوف جهات اتصال للمنصة. */
export function parseVCardText(text: string): { rows: ContactInput[]; skipped: number } {
  const unfolded = unfoldVCardLines(text);
  const blocks: string[][] = [];
  let current: string[] | null = null;

  for (const line of unfolded) {
    if (line.toUpperCase() === 'BEGIN:VCARD') {
      current = [];
      continue;
    }
    if (line.toUpperCase() === 'END:VCARD') {
      if (current && current.length) blocks.push(current);
      current = null;
      continue;
    }
    if (current) current.push(line);
  }

  const rows: ContactInput[] = [];
  let skipped = 0;

  for (const block of blocks) {
    const fields = parseVCardBlock(block);
    const fullName = nameFromFields(fields);
    const telRaw = telFromFields(fields);
    if (!fullName || !telRaw) {
      skipped++;
      continue;
    }
    const phone = phoneStringToContactFields(telRaw);
    if (!phone) {
      skipped++;
      continue;
    }
    rows.push({
      full_name: fullName,
      phone_country: phone.countryCode,
      phone_local: phone.localPhone,
      email: emailFromFields(fields),
      category: 'عميل',
      notes: 'مستورد من دفتر الهاتف (vCard)',
    });
  }

  return { rows, skipped };
}