import React, { useState } from 'react';
import { Modal } from './Modal';
import { useToast } from '../lib/toast';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onReset,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const res = await onReset(email);
    setLoading(false);
    if (res.ok) {
      showToast('Password reset link sent to your email', 'success');
      onClose();
    } else {
      showToast(res.error || 'Failed to send reset link', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Enter your registered email address and we will send you a password reset link.
        </p>

        <div>
          <label htmlFor="reset-email" className="block text-xs font-medium text-[var(--muted)] mb-1">
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nurse@hospital.co.ke"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--card-subtle)] text-[var(--text)]"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--card-subtle)] text-[var(--text)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !email}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
