'use client';

/** لوحة إيصالك — يفصل شاشة الدخول عن لوحة التاجر لتحميل أسرع. */

import { useCallback, useRef } from 'react';
import { AuthBootScreen } from '@/components/auth/AuthBootScreen';
import { HomeAuthGate } from '@/components/home/HomeAuthGate';
import { HomeDashboard } from '@/components/home/HomeDashboard';
import { useAppSession } from '@/hooks/home/useAppSession';
import { isFirebaseConfigured } from '@/lib/firebase-auth-client';

export default function Home() {
  const resetProfileRef = useRef<(() => void) | null>(null);

  const session = useAppSession({
    onSessionCleared: useCallback(() => {
      resetProfileRef.current?.();
    }, []),
  });

  const isResolvingSession = isFirebaseConfigured() && session.sessionCheckPending;

  if (isResolvingSession) {
    return <AuthBootScreen message="جاري فتح لوحة التحكم..." />;
  }

  if (!session.user && isFirebaseConfigured()) {
    return <HomeAuthGate session={session} />;
  }

  return <HomeDashboard session={session} resetProfileRef={resetProfileRef} />;
}
