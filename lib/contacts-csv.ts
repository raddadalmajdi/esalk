import type { ContactInput, ContactRecord } from '@/lib/contacts-types';
import { validateContactPhone } from '@/lib/contacts-phone';

const CSV_HEADERS = [
  'full_name',
  'phone_country',
  'phone_local',
  'email',
  'company',
  'category',
  'notes',
  'is_favorite',
] as const;

export const CONTACT_CSV_TEMPLATE = `${CSV_HEADERS.join(',')}
أحمد العميل,966,512345678,,محل تجريبي,عميل,,0`;

export function contactsToCsv(contacts: ContactRecord[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const c of contacts) {
    const row = [
      escapeCsv(c.full_name),
      c.phone_country,
      c.phone_local,
      escapeCsv(c.email ?? ''),
      escapeCsv(c.company ?? ''),
      escapeCsv(c.category),
      escapeCsv(c.notes ?? ''),
      c.is_favorite ? '1' : '0',
    ];
    lines.push(row.join(','));
  }
  return '\uFEFF' + lines.join('\n');
}

export function contactsToExcelTsv(contacts: ContactRecord[]): string {
  return contactsToCsv(contacts).replace(/,/g, '\t');
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function parseContactsCsv(text: string): { rows: ContactInput[]; skipped: number } {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return { rows: [], skipped: 0 };

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);

  const rows: ContactInput[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const full_name = cells[idx('full_name')]?.trim() ?? '';
    const phone_country = cells[idx('phone_country')]?.trim() ?? '966';
    const phone_local = cells[idx('phone_local')]?.trim() ?? '';
    if (!full_name || !phone_local) {
      skipped++;
      continue;
    }
    const valid = validateContactPhone(phone_country, phone_local);
    if (!valid.ok) {
      skipped++;
      continue;
    }
    rows.push({
      full_name,
      phone_country: valid.countryCode,
      phone_local: valid.localPhone,
      email: cells[idx('email')]?.trim() || null,
      company: cells[idx('company')]?.trim() || null,
      category: cells[idx('category')]?.trim() || 'عميل',
      notes: cells[idx('notes')]?.trim() || null,
      is_favorite: ['1', 'true', 'نعم'].includes(cells[idx('is_favorite')]?.trim().toLowerCase() ?? ''),
    });
  }

  return { rows, skipped };
}

export function downloadTextFile(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}