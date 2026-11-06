'use client';

const MOYASAR_CDN_VERSION = '1.14.0';
const MOYASAR_CSS_ID = 'moyasar-mpf-css';
const MOYASAR_SCRIPT_ID = 'moyasar-mpf-js';

let loadPromise: Promise<void> | null = null;

function appendStylesheet(): void {
  if (document.getElementById(MOYASAR_CSS_ID)) return;
  const link = document.createElement('link');
  link.id = MOYASAR_CSS_ID;
  link.rel = 'stylesheet';
  link.href = `https://cdn.moyasar.com/mpf/${MOYASAR_CDN_VERSION}/moyasar.css`;
  document.head.appendChild(link);
}

/** يحمّل CSS/JS لميسر عند الحاجة فقط (صفحة الاشتراك) — لا يُستدعى من layout العام. */
export function loadMoyasarFormAssets(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.Moyasar?.init) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    appendStylesheet();

    const existing = document.getElementById(MOYASAR_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('تعذّر تحميل مكتبة ميسر.')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.id = MOYASAR_SCRIPT_ID;
    script.src = `https://cdn.moyasar.com/mpf/${MOYASAR_CDN_VERSION}/moyasar.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('تعذّر تحميل مكتبة ميسر.'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
