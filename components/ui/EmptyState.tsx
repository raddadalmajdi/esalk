'use client';

import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div
      className="glass-panel rounded-2xl border border-mistara-gold/25 px-4 py-8 text-center space-y-3"
      role="status"
    >
      {icon && <div className="mx-auto flex h-12 w-12 items-center justify-center text-2xl">{icon}</div>}
      <h3 className="text-base font-black text-mistara-espresso">{title}</h3>
      <p className="text-sm font-bold leading-relaxed text-mistara-brown/75">{description}</p>
      {action}
    </div>
  );
}
