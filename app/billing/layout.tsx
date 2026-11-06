import Script from 'next/script';

const MOYASAR_CSS = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
const MOYASAR_JS = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://cdn.moyasar.com" />
      <link rel="stylesheet" href={MOYASAR_CSS} />
      <Script src={MOYASAR_JS} strategy="afterInteractive" />
      {children}
    </>
  );
}
