'use client';

type MerchantPrivacyPrinciplesProps = {
  /** إعدادات = نص أقصر */
  variant?: 'full' | 'compact';
  className?: string;
};

/** مبادئ خصوصية إيصالك — دفتر العميل منفصل عن صور الفواتير، وكل محل معزول. */
export function MerchantPrivacyPrinciples({
  variant = 'full',
  className = '',
}: MerchantPrivacyPrinciplesProps) {
  const summary = variant === 'compact' ? 'خصوصية بيانات محلّك' : 'كيف نحمي بياناتك وبيانات عملائك';

  return (
    <details
      className={`rounded-xl border border-mistara-brown/12 bg-mistara-beige/40 px-3 py-2 text-mistara-brown/85 ${className}`}
    >
      <summary className="cursor-pointer text-xs font-black text-mistara-espresso">{summary}</summary>
      <ul className="mt-2 list-disc space-y-1.5 pr-4 text-[11px] font-bold leading-relaxed marker:text-primary">
        {variant === 'full' && (
          <li>
            على لوحة العمل: <strong>رقم العميل واسمه</strong> (إن كان جديداً)، ثم تصوير الفاتورة — يُحفظ الاسم والرقم
            مع الصورة، ويُنشأ <strong>ملف العميل</strong> تلقائياً. إن كان محفوظاً مسبقاً تُضاف الفاتورة الجديدة لنفس
            ملفه.
          </li>
        )}
        {variant === 'compact' && (
          <li>
            عند حفظ فاتورة: يُحدَّث دفتر العميل (اسم ورقم) ويُربط الأرشيف بنفس الملف تلقائياً.
          </li>
        )}
        <li>
          دفتر جهات الاتصال في <strong>إعدادات محلّك</strong> خاص بحسابك — لا يراه محلّ آخر.
        </li>
        <li>
          صور فواتيرك وأرقام عملائك في الأرشيف <strong>خاصة بك فقط</strong>. يمكنك تغيير <strong>رقم جوال المحل</strong>{' '}
          من إعدادات المحل وقت ما تشاء.
        </li>
        <li>
          إن سجّل محلّ آخر ونفس رقم العميل موجود عند محلّ سابق: يجوز إضافته عنده كعميل جديد{' '}
          <strong>بدون أي صور أو فواتير</strong> من المحلّ الأول — لا دمج ولا مشاركة بين المحلات.
        </li>
      </ul>
    </details>
  );
}