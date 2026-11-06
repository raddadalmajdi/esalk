'use client';

import { useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { MutableRefObject } from 'react';
import Link from 'next/link';
import { CustomerContactSection } from '@/components/home/CustomerContactSection';
import { HomeHeader } from '@/components/home/HomeHeader';
import { InvoiceArchiveSection } from '@/components/home/InvoiceArchiveSection';
import { ScannerFab } from '@/components/home/ScannerFab';
import { WelcomeSuccessOverlay } from '@/components/home/WelcomeSuccessOverlay';
import { OrganizationGateBanner } from '@/components/organization/OrganizationGateBanner';
import { useOrganization } from '@/components/organization/OrganizationProvider';
import type { useAppSession } from '@/hooks/home/useAppSession';
import { useCustomerWorkspace } from '@/hooks/home/useCustomerWorkspace';
import { useHomeSubscriptionBadge } from '@/hooks/home/useHomeSubscriptionBadge';
import { useTailorProfile } from '@/hooks/home/useTailorProfile';
import { isFirebaseConfigured } from '@/lib/firebase-auth-client';
import { appUserId } from '@/lib/home/types';
import { prefetchOpenCvInBackground } from '@/lib/opencv-loader';
import { isSubscriptionUsable, SUBSCRIPTION_STATUS_LABELS } from '@/lib/subscription';

const OpenCvDocumentScannerModal = dynamic(
  () =>
    import('@/components/scanner/OpenCvDocumentScannerModal').then((m) => m.OpenCvDocumentScannerModal),
  { ssr: false }
);

const TailorProfileModal = dynamic(
  () => import('@/components/home/TailorProfileModal').then((m) => m.TailorProfileModal),
  { ssr: false }
);

const InvoiceLightbox = dynamic(
  () => import('@/components/home/InvoiceLightbox').then((m) => m.InvoiceLightbox),
  { ssr: false }
);

type SessionApi = ReturnType<typeof useAppSession>;

type HomeDashboardProps = {
  session: SessionApi;
  resetProfileRef: MutableRefObject<(() => void) | null>;
};

/** لوحة التاجر بعد تسجيل الدخول — تُحمَّل منفصلة عن شاشة المصادقة. */
export function HomeDashboard({ session, resetProfileRef }: HomeDashboardProps) {
  const {
    organizationId,
    organization,
    loading: orgLoading,
    refreshOrganization,
  } = useOrganization();

  const tailor = useTailorProfile({
    user: session.user,
    organizationId,
    setLoading: session.setLoading,
  });

  useEffect(() => {
    resetProfileRef.current = tailor.resetProfile;
  }, [resetProfileRef, tailor.resetProfile]);

  const workspace = useCustomerWorkspace({
    user: session.user,
    organizationId,
  });

  const subscriptionBadge = useHomeSubscriptionBadge(organizationId ?? null);

  const isCloudMerchant =
    isFirebaseConfigured() &&
    session.user != null &&
    appUserId(session.user) !== 'guest-local-user';

  const subscriptionStatus = subscriptionBadge.summary?.subscription.status;
  const subscriptionBlocked =
    isCloudMerchant &&
    subscriptionStatus != null &&
    !isSubscriptionUsable(subscriptionStatus);

  useEffect(() => {
    if (workspace.showOpenCvScanner) {
      document.documentElement.dataset.scannerActive = '1';
    } else {
      delete document.documentElement.dataset.scannerActive;
    }
    return () => {
      delete document.documentElement.dataset.scannerActive;
    };
  }, [workspace.showOpenCvScanner]);

  const handleOpenScanner = useCallback(() => {
    if (subscriptionBlocked) return;
    workspace.handleOpenOpenCvScanner();
  }, [subscriptionBlocked, workspace]);

  const handleLogout = useCallback(async () => {
    await session.performLogout(false);
  }, [session]);

  useEffect(() => {
    const prefetchTimer = window.setTimeout(() => prefetchOpenCvInBackground(), 1500);
    return () => window.clearTimeout(prefetchTimer);
  }, []);

  useEffect(() => {
    if (!isCloudMerchant || orgLoading || organizationId) return;
    void refreshOrganization();
    const retryTimer = window.setTimeout(() => {
      void refreshOrganization();
    }, 3000);
    return () => window.clearTimeout(retryTimer);
  }, [isCloudMerchant, orgLoading, organizationId, refreshOrganization]);

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col bg-mistara-sand text-mistara-espresso"
      dir="rtl"
    >
      {session.showWelcomeSuccess && (
        <WelcomeSuccessOverlay onDismiss={() => session.setShowWelcomeSuccess(false)} />
      )}

      <HomeHeader
        menuRef={session.menuRef}
        showMenu={session.showMenu}
        setShowMenu={session.setShowMenu}
        userEmail={session.user?.email}
        organizationName={organization?.name}
        profileLoading={tailor.checkingTailor}
        tailorShopName={tailor.tailorShopName}
        isTailorRegistered={tailor.isTailorRegistered}
        tailorCountryCode={tailor.tailorCountryCode}
        tailorLocalPhone={tailor.tailorLocalPhone}
        tailorAvatarUrl={tailor.tailorAvatarUrl}
        pendingAvatarPreview={tailor.pendingAvatarPreview}
        hasPendingAvatar={tailor.hasPendingAvatar}
        savingAvatar={tailor.savingAvatar}
        avatarFeedback={tailor.avatarFeedback}
        onAvatarFilePick={(file) => void tailor.handleAvatarFilePick(file)}
        onSaveAvatar={() => void tailor.handleSaveAvatar()}
        onRemoveAvatar={tailor.handleRemoveAvatar}
        onDiscardPendingAvatar={tailor.handleDiscardPendingAvatar}
        onOpenSettings={() => {
          session.setShowMenu(false);
          tailor.setShowTailorProfileModal(true);
        }}
        onLogout={() => void handleLogout()}
        trialDaysRemaining={
          subscriptionBadge.showTrialBadge ? subscriptionBadge.trialDaysRemaining : null
        }
      />

      <main className="dashboard-main">
        <OrganizationGateBanner
          loading={orgLoading}
          organizationId={organizationId}
          userSignedIn={isCloudMerchant}
          onRetry={() => void refreshOrganization()}
        />

        {subscriptionBlocked && subscriptionStatus && (
          <div
            className="mx-auto mb-4 max-w-lg rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900"
            role="alert"
          >
            <p>
              الاشتراك ({SUBSCRIPTION_STATUS_LABELS[subscriptionStatus]}) — المسح والحفظ السحابي متوقف
              مؤقتاً. جدّد الاشتراك للمتابعة.
            </p>
            <Link
              href="/billing"
              className="mt-2 inline-block rounded-xl bg-primary px-4 py-2 text-xs font-black text-white"
            >
              تجديد الاشتراك
            </Link>
          </div>
        )}

        <CustomerContactSection
          customerLocalPhone={workspace.customerLocalPhone}
          customerCountryCode={workspace.customerCountryCode}
          customerDisplayName={workspace.customerDisplayName}
          onPhoneChange={workspace.handleCustomerPhoneInput}
          onCountryCodeChange={workspace.handleCountryCodeChange}
          onDisplayNameChange={workspace.setCustomerDisplayName}
          customerBookStatus={workspace.customerBookStatus}
          customerNameLocked={workspace.customerNameLocked}
          customerNameEditing={workspace.customerNameEditing}
          onStartNameEdit={() => {
            workspace.setCustomerNameEditing(true);
            workspace.setCustomerNameLocked(false);
          }}
          onSaveContact={() => void workspace.handleSaveCustomerContact()}
          isRefreshingInvoices={workspace.isRefreshingInvoices}
          customerInvoicesCount={workspace.customerInvoices.length}
          uploadSaveError={workspace.uploadSaveError}
          uploadSavePhase={workspace.uploadSavePhase}
        />

        <InvoiceArchiveSection
          customerLocalPhone={workspace.customerLocalPhone}
          customerInvoices={workspace.customerInvoices}
          whatsappMessages={workspace.whatsappMessages}
          onWhatsappMessageChange={(invoiceId, message) =>
            workspace.setWhatsappMessages({ ...workspace.whatsappMessages, [invoiceId]: message })
          }
          onOpenImage={workspace.setActiveImageIndex}
          onSendWhatsApp={workspace.sendViaWhatsApp}
          onDownloadPdf={(invoice, number) => void workspace.handleDownloadInvoicePdf(invoice, number)}
          onPrintPdf={(invoice, number) => void workspace.handlePrintInvoicePdf(invoice, number)}
          exportingPdfId={workspace.exportingPdfId}
        />
      </main>

      <ScannerFab
        visible={workspace.customerLocalPhone.trim().length >= 1 && !subscriptionBlocked}
        uploadSavePhase={workspace.uploadSavePhase}
        uploadSaveError={workspace.uploadSaveError}
        isUploading={workspace.isUploading}
        onOpenScanner={handleOpenScanner}
      />

      {workspace.showOpenCvScanner && (
        <OpenCvDocumentScannerModal
          onClose={() => workspace.setShowOpenCvScanner(false)}
          onConfirm={workspace.handleDocumentCaptured}
        />
      )}

      <TailorProfileModal
        open={tailor.showTailorProfileModal}
        onClose={() => {
          tailor.setShowTailorProfileModal(false);
          tailor.setSettingsFeedback(null);
        }}
        tailorShopName={tailor.tailorShopName}
        onShopNameChange={tailor.setTailorShopName}
        tailorLocalPhone={tailor.tailorLocalPhone}
        onLocalPhoneChange={tailor.setTailorLocalPhone}
        tailorCountryCode={tailor.tailorCountryCode}
        onCountryCodeChange={tailor.setTailorCountryCode}
        cloudNotes={tailor.cloudNotes}
        onCloudNotesChange={tailor.setCloudNotes}
        tailorAvatarUrl={tailor.tailorAvatarUrl}
        pendingAvatarPreview={tailor.pendingAvatarPreview}
        hasPendingAvatar={tailor.hasPendingAvatar}
        savingAvatar={tailor.savingAvatar}
        avatarFeedback={tailor.avatarFeedback}
        onAvatarFilePick={(file) => void tailor.handleAvatarFilePick(file)}
        onSaveAvatar={() => void tailor.handleSaveAvatar()}
        onRemoveAvatar={tailor.handleRemoveAvatar}
        onDiscardPendingAvatar={tailor.handleDiscardPendingAvatar}
        settingsFeedback={tailor.settingsFeedback}
        savingSettings={tailor.savingSettings}
        onSubmit={(e) => void tailor.handleSaveTailorProfile(e)}
      />

      <InvoiceLightbox
        activeIndex={workspace.activeImageIndex}
        invoices={workspace.customerInvoices}
        exportingPdfId={workspace.exportingPdfId}
        onClose={() => workspace.setActiveImageIndex(null)}
        onNavigate={workspace.setActiveImageIndex}
        onDownloadPdf={(invoice, number) => void workspace.handleDownloadInvoicePdf(invoice, number)}
        onPrintPdf={(invoice, number) => void workspace.handlePrintInvoicePdf(invoice, number)}
      />
    </div>
  );
}
