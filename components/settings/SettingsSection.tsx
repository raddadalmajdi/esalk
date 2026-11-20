import type { ReactNode } from 'react';

export function SettingsSection({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`settings-section space-y-3 ${className}`.trim()}>
      <h2 className="settings-section__title">{title}</h2>
      {children}
    </section>
  );
}