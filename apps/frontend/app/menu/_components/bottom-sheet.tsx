'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { WARM } from '../_lib/theme';

/**
 * Feuille modale ancrée en bas (mobile-first), accessible :
 * - role="dialog" + aria-modal, focus piégé, Escape ferme, scrim cliquable
 * - verrouille le scroll de fond, restaure le focus au déclencheur
 * - animation slide-up (transform/opacity) coupée par prefers-reduced-motion (CSS global)
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  labelledById = 'sheet-title',
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  labelledById?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false); // pilote la transition
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      // Laisse le DOM peindre l'état initial avant d'animer.
      requestAnimationFrame(() => setVisible(true));
      // Focus le panneau
      requestAnimationFrame(() => panelRef.current?.focus());
    } else {
      setVisible(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Escape + focus trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Restaure le focus au déclencheur quand la feuille se referme
  useEffect(() => {
    if (!open && lastFocused.current) {
      lastFocused.current.focus?.();
    }
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Scrim */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(27,25,21,0.6)',
          opacity: visible ? 1 : 0,
          backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? labelledById : undefined}
        tabIndex={-1}
        className="relative flex max-h-[90vh] flex-col rounded-t-3xl shadow-2xl outline-none transition-transform duration-300 ease-out"
        style={{
          backgroundColor: WARM.card,
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Grip */}
        <div className="flex flex-shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full" style={{ backgroundColor: WARM.borderStrong }} />
        </div>

        {title && (
          <div
            className="flex flex-shrink-0 items-center justify-between px-5 py-3"
            style={{ borderBottom: `1px solid ${WARM.border}` }}
          >
            <h2
              id={labelledById}
              className="text-base font-bold"
              style={{ color: WARM.ink }}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-black/[0.05]"
              style={{ backgroundColor: WARM.surfaceAlt }}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" style={{ color: WARM.muted }} />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div
            className="flex-shrink-0 pb-safe-6"
            style={{ borderTop: `1px solid ${WARM.border}`, backgroundColor: WARM.card }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
