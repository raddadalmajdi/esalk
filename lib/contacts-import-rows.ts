import type { ContactInput } from '@/lib/contacts-types';
import { createContactApi } from '@/lib/contacts-api';

export type ImportContactsResult = {
  added: number;
  duplicates: number;
  invalid: number;
};

export async function importContactRows(
  accessToken: string,
  rows: ContactInput[],
  organizationId: string | null,
  onEachCreated?: (contact: Awaited<ReturnType<typeof createContactApi>>) => Promise<void>
): Promise<ImportContactsResult> {
  let added = 0;
  let duplicates = 0;
  let invalid = 0;

  for (const row of rows) {
    if (!row.full_name?.trim() || !row.phone_local?.trim()) {
      invalid++;
      continue;
    }
    try {
      const created = await createContactApi(accessToken, {
        ...row,
        organization_id: organizationId,
        category: row.category ?? 'عميل',
      });
      if (onEachCreated) await onEachCreated(created);
      added++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('محفوظ') || msg.includes('مسبق')) {
        duplicates++;
      } else {
        invalid++;
      }
    }
  }

  return { added, duplicates, invalid };
}