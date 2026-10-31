import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  ariaLabelledBy?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  ariaLabelledBy = 'modal-title',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Handle ESC key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? ariaLabelledBy : undefined}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Sheet / Dialog Container */}
      <div
        ref={modalRef}
        className="relative z-10 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        style={{ backgroundColor: 'var(--card)', color: 'var(--text)' }}
      >
        {/* Grab Handle for Mobile */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div
            className="w-10 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--muted)', opacity: 0.4 }}
          />
        </div>

        {/* Header */}
        {title && (
          <div className="px-5 pt-3 pb-2 flex items-center justify-between">
            <h2 id={ariaLabelledBy} className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-sm text-[var(--muted)] hover:text-[var(--text)]"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto safe-bottom">
          {children}
        </div>
      </div>
    </div>
  );
};
