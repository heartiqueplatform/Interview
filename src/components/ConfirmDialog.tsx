import React, { useState } from 'react';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  requiresTypingDelete?: boolean;
  isDestructive?: boolean;
  variant?: 'danger' | 'default' | string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  description,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  requiresTypingDelete = false,
  isDestructive = true,
  variant,
}) => {
  const [typedValue, setTypedValue] = useState('');

  const handleClose = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  const isDanger = variant === 'danger' || isDestructive;
  const canConfirm = !requiresTypingDelete || typedValue.trim() === 'DELETE';
  const displayMessage = message || description || '';

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      setTypedValue('');
      handleClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--muted)] leading-relaxed">{displayMessage}</p>

        {requiresTypingDelete && (
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--muted)]">
              Type <span className="font-mono font-bold text-[var(--danger)]">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder="DELETE"
              className="w-full p-2.5 rounded-lg text-xs font-mono bg-[var(--card-subtle)] text-[var(--text)] focus:outline-none"
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-[var(--card-subtle)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold text-white transition-opacity disabled:opacity-50 ${
              isDanger ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
