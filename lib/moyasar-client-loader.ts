'use client';

const MOYASAR_CDN_VERSION = '1.14.0';
const MOYASAR_CSS_ID = 'moyasar-mpf-css';
const MOYASAR_SCRIPT_ID = 'moyasar-mpf-js';
const LOAD_TIMEOUT_MS = 20_000;

let loadPromise: Promise<void> | null = null;

function appendStylesheet(): void {
  if (document.getElementById(MOYASAR_CSS_ID)) return;
  const link = document.createElement('link');
  link.id = MOYASAR_CSS_ID;
  link.rel = 'stylesheet';
  link.href = `https://cdn.moyasar.com/mpf/${MOYASAR_CDN_VERSION}/moyasar.css`;
  document.head.appendChild(link);
}

function appendPreconnect(): void {
  if (document.querySelector('link[data-moyasar-preconnect="1"]')) return;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = 'https://cdn.moyasar.com';
  link.setAttribute('data-moyasar-preconnect', '1');
  document.head.appendChild(link);
}

function waitForMoyasarGlobal(timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.Moyasar?.init) {
        resolve();
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error('انتهت مهلة انتظار مكتبة ميسر.'));
        return;
      }
      window.setTimeout(tick, 40);
    };
    tick();
  });
}

/** يحمّل CSS/JS لميسr عند الحاجة فقط (صفحة الاشتراك). */
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
    appendPreconnect();
    appendStylesheet();

    const existing = document.getElementById(MOYASAR_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      void waitForMoyasarGlobal(LOAD_TIMEOUT_MS).then(resolve).catch(reject);
      return;
    }

    const script = document.createElement('script');
    script.id = MOYASAR_SCRIPT_ID;
    script.src = `https://cdn.moyasar.com/mpf/${MOYASAR_CDN_VERSION}/moyasar.js`;
    script.async = true;
    script.onload = () => {
      void waitForMoyasarGlobal(LOAD_TIMEOUT_MS).then(resolve).catch(reject);
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('تعذّر تحميل مكتبة ميسر من CDN.'));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    loadPromise = null;
    throw error;
  });

  return loadPromise;
}
