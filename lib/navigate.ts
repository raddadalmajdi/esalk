/** انتقال كامل للصفحة (خارج نطاق React) — للدفع الخارجي. */
export function navigateToExternalUrl(url: string): void {
  window.location.assign(url);
}
