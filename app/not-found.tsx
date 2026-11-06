import Link from 'next/link';
import { AppBrand } from '@/components/brand/AppBrand';

export default function NotFound() {
  return (
    <main
      className="min-h-screen bg-mistara-sand flex flex-col items-center justify-center gap-6 px-6 text-center"
      dir="rtl"
    >
      <AppBrand size="md" layout="column" showTitle subtitle={null} />
      <div className="space-y-2 max-w-sm">
        <h1 className="text-xl font-black text-mistara-espresso">الصفحة غير موجودة</h1>
        <p className="text-sm font-bold text-mistara-brown/75">
          الرابط الذي فتحته غير صحيح أو نُقل المحتوى. ارجع إلى لوحة التحكم.
        </p>
      </div>
      <Link
        href="/"
        className="auth-primary-btn inline-block rounded-xl px-8 py-3 text-sm font-black"
      >
        العودة للرئيسية
      </Link>
    </main>
  );
}
