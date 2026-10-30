'use client';

import { useEffect, type ReactNode } from 'react';

/** Full-screen sheet on phones, centered panel on desktop. */
export default function Modal({ open, title, onClose, children, wide = false }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[85] flex items-stretch justify-center bg-night/80 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        className={`flex max-h-[100svh] w-full flex-col overflow-hidden border-bone/15 bg-[#141312] sm:max-h-[88svh] sm:rounded-sm sm:border ${wide ? 'sm:max-w-5xl' : 'sm:max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-bone/10 px-4 py-3 sm:px-6">
          <h2 className="font-display text-xl">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-sm hover:bg-bone/5">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pt-4 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
