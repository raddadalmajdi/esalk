import { isCoarsePointerDevice, isMobileSafariLike } from '@/lib/device-hints';

export type MerchantDevicePlatform = 'ios' | 'android' | 'desktop';

export function detectMerchantDevicePlatform(): MerchantDevicePlatform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export function platformLabelAr(platform: MerchantDevicePlatform): string {
  switch (platform) {
    case 'ios':
      return 'آيفون / آيباد';
    case 'android':
      return 'أندرويد';
    default:
      return 'كمبيوتر أو متصفح';
  }
}

type ContactPickerNavigator = Navigator & {
  contacts?: {
    select: (
      properties: string[],
      options?: { multiple?: boolean }
    ) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>>;
  };
};

/** واجهة اختيار جهات الاتصال — مدعومة أساساً على Chrome لأندرويد. */
export function supportsContactPickerApi(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as ContactPickerNavigator;
  return typeof nav.contacts?.select === 'function';
}

export async function pickContactsFromDevicePicker(): Promise<
  Array<{ name?: string[]; tel?: string[]; email?: string[] }>
> {
  if (!supportsContactPickerApi()) {
    throw new Error('متصفحك لا يدعم اختيار جهات الاتصال مباشرة. استخدم ملف vCard أو CSV.');
  }
  const nav = navigator as ContactPickerNavigator;
  return nav.contacts!.select(['name', 'tel', 'email'], { multiple: true });
}

/** هل الجهاز جوال (لإظهار إرشادات مناسبة). */
export function isMerchantMobileDevice(): boolean {
  return isCoarsePointerDevice() || isMobileSafariLike() || detectMerchantDevicePlatform() !== 'desktop';
}