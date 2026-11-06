'use client';

import Link from 'next/link';

type OrganizationGateBannerProps = {
  loading: boolean;
  organizationId: string | null;
  userSignedIn: boolean;
  onRetry: () => void;
  retrying?: boolean;
};

/** يظهر عندما يكون المستخدم مسجّلاً لكن المحل لم يُحمَّل بعد. */
export function OrganizationGateBanner({
  loading,
  organizationId,
  userSignedIn,
  onRetry,
  retrying = false,
}: OrganizationGateBannerProps) {
  if (!userSignedIn || loading || organizationId) {
    return null;
  }

  return (
    <div
      className="mx-auto mb-4 max-w-lg rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950 shadow-sm"
      role="alert"
    >
      <p>جاري تجهيز محلّك على المنصة… إن استمر التأخير، أعد المحاولة أو تواصل مع الدعم.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={retrying}
          onClick={() => void onRetry()}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-black text-white disabled:opacity-60"
        >
          {retrying ? 'جاري الربط...' : 'ربط المحل الآن'}
        </button>
        <Link href="/billing" className="rounded-xl border border-primary/30 px-4 py-2 text-xs font-black text-primary-dark">
          الاشتراك والفوترة
        </Link>
      </div>
    </div>
  );
}
