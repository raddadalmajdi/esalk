import { notFound } from 'next/navigation';
import { FirebaseEmailVerificationTrialClient } from './FirebaseEmailVerificationTrialClient';

/** صفحة تطوير — غير متاحة في الإنتاج. */
export default function FirebaseEmailVerificationTrialPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <FirebaseEmailVerificationTrialClient />;
}
