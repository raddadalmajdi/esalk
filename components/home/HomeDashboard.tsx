'use client';

import { useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { MutableRefObject } from 'react';
import { CustomerContactSection } from '@/components/home/CustomerContactSection';
import { HomeHeader } from '@/components/home/HomeHeader';
import { InvoiceArchiveSection } from '@/components/home/InvoiceArchiveSection';
import { ScannerFab } from '@/components/home/ScannerFab';
import { WelcomeSuccessOverlay } from '@/components/home/WelcomeSuccessOverlay';
import { useOrganization } from '@/components/organization/OrganizationProvider';
import type { useAppSession } from '@/hooks/home/useAppSession';
import { useCustomerWorkspace } from '@/hooks/home/useCustomerWorkspace';
import { useHomeSubscriptionBadge } from '@/hooks/home/useHomeSubscriptionBadge';
import { useTailorProfile } from '@/hooks/home/useTailorProfile';

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
  const { organizationId } = useOrganization();

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

  const handleLogout = useCallback(async () => {
    await session.performLogout(false);
  }, [session]);

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
        visible={workspace.customerLocalPhone.trim().length >= 1}
        uploadSavePhase={workspace.uploadSavePhase}
        uploadSaveError={workspace.uploadSaveError}
        isUploading={workspace.isUploading}
        onOpenScanner={workspace.handleOpenOpenCvScanner}
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
