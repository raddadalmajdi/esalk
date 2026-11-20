'use client';

import { useMemo, useState } from 'react';
import {
  detectMerchantDevicePlatform,
  pickContactsFromDevicePicker,
  platformLabelAr,
  supportsContactPickerApi,
} from '@/lib/device-contacts-platform';
import { parseVCardText } from '@/lib/contacts-vcard';
import { mapPickerContactsToInputs } from '@/lib/contacts-picker-map';
import { importContactRows } from '@/lib/contacts-import-rows';
import { upsertTailorCustomer } from '@/lib/tailor-customers';

type ImportPhoneContactsPanelProps = {
  accessToken: string;
  organizationId: string | null;
  userId: string;
  onImported: () => void;
  defaultCountry?: '966' | '965';
};

export function ImportPhoneContactsPanel({
  accessToken,
  organizationId,
  userId,
  onImported,
  defaultCountry = '965',
}: ImportPhoneContactsPanelProps) {
  const platform = useMemo(() => detectMerchantDevicePlatform(), []);
  const pickerReady = supportsContactPickerApi();
  const [busy, setBusy] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const runImport = async (rows: Parameters<typeof importContactRows>[1], label: string) => {
    if (!rows.length) {
      setLastMessage('لم يُعثر على جهات صالحة (اسم + جوال سعودي/كويتي).');
      return;
    }
    setBusy(true);
    setLastMessage(null);
    try {
      const result = await importContactRows(accessToken, rows, organizationId, async (created) => {
        await upsertTailorCustomer(userId, created.phone, created.full_name, organizationId);
      });
      setLastMessage(
        `${label}: أُضيف ${result.added}، مكرر ${result.duplicates}، تُجاهَل ${result.invalid}.`
      );
      onImported();
    } catch (err) {
      setLastMessage(err instanceof Error ? err.message : 'فشل الاستيراد.');
    } finally {
      setBusy(false);
    }
  };

  const handlePicker = async () => {
    try {
      const picked = await pickContactsFromDevicePicker();
      const { rows, skipped } = mapPickerContactsToInputs(picked, defaultCountry);
      await runImport(rows, `اختيار من الهاتف (تُجاهَل ${skipped})`);
    } catch (err) {
      setLastMessage(err instanceof Error ? err.message : 'تعذّر فتح دفتر الهاتف.');
    }
  };

  const handleVCardFile = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const { rows, skipped } = parseVCardText(text);
      await runImport(rows, `ملف vCard (تُجاهَل ${skipped})`);
    } catch (err) {
      setLastMessage(err instanceof Error ? err.message : 'ملف غير صالح.');
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-mistara-gold/25 bg-mistara-cream/60 p-3 sm:p-4">
      <ImportPhoneContactsHeader platform={platform} pickerReady={pickerReady} />

      <div className="flex flex-wrap gap-2">
        {pickerReady && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handlePicker()}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
          >
            {busy ? 'جاري الحفظ…' : 'اختيار من دفتر الهاتف'}
          </button>
        )}

        <label className="cursor-pointer rounded-xl border border-primary/30 bg-white px-4 py-2.5 text-sm font-black text-primary-dark">
          رفع ملف جهات (.vcf)
          <input
            type="file"
            accept=".vcf,text/vcard,text/x-vcard"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleVCardFile(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {lastMessage && (
        <p role="status" className="text-xs font-bold leading-relaxed text-mistara-brown/85">
          {lastMessage}
        </p>
      )}
    </section>
  );
}

function ImportPhoneContactsHeader({
  platform,
  pickerReady,
}: {
  platform: ReturnType<typeof detectMerchantDevicePlatform>;
  pickerReady: boolean;
}) {
  return (
    <div>
      <h2 className="text-sm font-black text-mistara-espresso">نسخ جهات الاتصال من الهاتف</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-mistara-brown/75">
        تعرّفت المنصة على جهازك:{' '}
        <span className="font-black text-primary-dark">{platformLabelAr(platform)}</span>. المتصفح لا يسمح
        بسحب كل الدفتر تلقائياً بدون إذنك — نستخدم الطريقة المناسبة لجهازك ثم نحفظ في لوحة التحكم.
      </p>
      {platform === 'ios' && (
        <p className="mt-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-[11px] font-bold leading-relaxed text-amber-950">
          على الآيفون: صدّر جهات الاتصال كملف <span dir="ltr">.vcf</span> من تطبيق «الملفات» أو iCloud، ثم اضغط «رفع
          ملف جهات». أو أضف جهاتاً عدة عبر مشاركة كل جهة كـ vCard ثم ادمج الملفات.
        </p>
      )}
      {platform === 'android' && !pickerReady && (
        <p className="mt-2 text-[11px] font-bold text-mistara-brown/75">
          للاختيار المباشر من الدفتر استخدم <span className="text-primary">Chrome</span> على أندرويد. أو ارفع ملف{' '}
          <span dir="ltr">.vcf</span> من تطبيق جهات الاتصال → مشاركة → حفظ.
        </p>
      )}
      {platform === 'android' && pickerReady && (
        <p className="mt-2 text-[11px] font-bold text-mistara-brown/75">
          اضغط «اختيار من دفتر الهاتف» وامنح الإذن — يمكنك تحديد عدة جهات دفعة واحدة.
        </p>
      )}
    </div>
  );
}