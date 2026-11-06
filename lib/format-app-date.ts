/** تاريخ ميلادي بصياغة عربية — ميسr لا يحدد التقويم؛ العرض من واجهة esalk فقط. */
export function formatGregorianDateAr(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
    calendar: 'gregory',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
