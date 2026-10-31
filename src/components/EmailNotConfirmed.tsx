import React, { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useToast } from '../lib/toast';

interface EmailNotConfirmedProps {
  email: string;
  onBackToLogin: () => void;
  resendLabel?: string;
  title?: string;
  message?: string;
}

export const EmailNotConfirmed: React.FC<EmailNotConfirmedProps> = ({
  email,
  onBackToLogin,
  resendLabel = 'Resend confirmation email',
  title = 'Please confirm your email',
  message = 'We sent a verification link to your inbox. Please check your email to activate your account.',
}) => {
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();

  const handleResend = () => {
    setSent(true);
    showToast('Confirmation email resent', 'success');
  };

  return (
    <div className="card text-center p-6 space-y-4">
      <div
        className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-[var(--accent)]"
        style={{ backgroundColor: 'var(--card-subtle)' }}
      >
        <Mail className="w-6 h-6" />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-1">{title}</h2>
        <p className="text-sm text-[var(--muted)]">{email}</p>
      </div>
      <p className="text-sm text-[var(--muted)] leading-relaxed">{message}</p>

      {sent ? (
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--success)] py-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Email sent! Check spam folder if not received.</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          className="w-full min-h-[44px] py-2.5 rounded-lg text-sm font-semibold transition-opacity"
          style={{ backgroundColor: 'var(--card-subtle)', color: 'var(--text)' }}
        >
          {resendLabel}
        </button>
      )}

      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full min-h-[44px] py-2 text-sm font-medium text-[var(--accent)]"
      >
        Back to Sign in
      </button>
    </div>
  );
};
