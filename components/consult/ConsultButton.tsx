'use client';

import type { ReactNode } from 'react';
import { useConsult, type ProjectType } from './ConsultProvider';

/** A button that opens the free-call form in place (never a link: the visitor stays here). */
export default function ConsultButton({ trigger, title, projectType, className = 'btn btn-solid', children }: { trigger: string; title?: string; projectType?: ProjectType; className?: string; children: ReactNode }) {
  const { open, preload } = useConsult();
  return (
    <button type="button" className={className} onPointerEnter={preload} onFocus={preload} onTouchStart={preload} onClick={() => open({ trigger, title, projectType })} aria-haspopup="dialog">
      {children}
    </button>
  );
}
