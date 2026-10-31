import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { EmailNotConfirmed } from '../../components/EmailNotConfirmed';
import { ForgotPasswordModal } from '../../components/ForgotPasswordModal';
import { LegalFooter } from '../../components/LegalFooter';

interface AuthViewProps {
  onSuccess: () => void;
  onNavigateLegal: (slug: string) => void;
  onClose?: () => void;
  promptMessage?: string;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onSuccess,
  onNavigateLegal,
  onClose,
  promptMessage,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [ageConsent, setAgeConsent] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showEmailUnconfirmed, setShowEmailUnconfirmed] = useState(false);

  const { login, signup, loading, authError, setAuthError, resetPassword } = useAuth();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const res = await login(email, password);
    if (res.ok) {
      onSuccess();
    } else if (res.error === 'Email not confirmed') {
      setShowEmailUnconfirmed(true);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (!ageConsent) {
      setAuthError('You must agree to the Terms, Privacy Policy, and confirm you are 18+.');
      return;
    }
    const res = await signup(email, password, name);
    if (res.ok) {
      onSuccess();
    }
  };

  if (showEmailUnconfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--text)]">
        <EmailNotConfirmed
          email={email}
          onBackToLogin={() => setShowEmailUnconfirmed(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-[var(--bg)] text-[var(--text)] safe-top safe-bottom relative">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-[var(--card)] text-[var(--muted)] hover:text-[var(--text)] transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        {promptMessage && (
          <div className="p-3 rounded-lg bg-[var(--card-subtle)] text-center text-xs text-[var(--accent)] font-semibold">
            {promptMessage}
          </div>
        )}
        {/* Brand Lockup */}
        <div className="text-center space-y-1.5">
          <div
            className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center text-white font-black text-xl mb-3"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            BP
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text)]">BOARDPASS</h1>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Every Kenyan nurse. Every shift. Every interview. Ready.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setAuthError(null);
            }}
            className="min-h-[44px] py-2 text-xs font-semibold rounded-md transition-colors"
            style={{
              backgroundColor: tab === 'login' ? 'var(--card-subtle)' : 'transparent',
              color: tab === 'login' ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setAuthError(null);
            }}
            className="min-h-[44px] py-2 text-xs font-semibold rounded-md transition-colors"
            style={{
              backgroundColor: tab === 'signup' ? 'var(--card-subtle)' : 'transparent',
              color: tab === 'signup' ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            Sign up
          </button>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div
            role="alert"
            className="px-3.5 py-2.5 rounded-lg text-xs font-medium text-white"
            style={{ backgroundColor: 'var(--danger)' }}
          >
            {authError}
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="login-email" className="block text-xs font-medium text-[var(--muted)]">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--muted)]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nurse@hospital.co.ke"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-sm bg-[var(--card)] text-[var(--text)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" aria-label="Password" className="block text-xs font-medium text-[var(--muted)]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--muted)]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-sm bg-[var(--card)] text-[var(--text)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full min-h-[46px] rounded-lg text-sm font-semibold text-white transition-opacity active:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="signup-name" className="block text-xs font-medium text-[var(--muted)]">
                Full Name (or Professional Pseudonym)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--muted)]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sister Wangari"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-sm bg-[var(--card)] text-[var(--text)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="signup-email" className="block text-xs font-medium text-[var(--muted)]">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--muted)]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nurse@hospital.co.ke"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-sm bg-[var(--card)] text-[var(--text)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="signup-password" aria-label="Create Password" className="block text-xs font-medium text-[var(--muted)]">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--muted)]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signup-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-sm bg-[var(--card)] text-[var(--text)]"
                />
              </div>
            </div>

            {/* Statutory Age & Legal Consent Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="age-consent"
                type="checkbox"
                required
                checked={ageConsent}
                onChange={(e) => setAgeConsent(e.target.checked)}
                className="mt-1 rounded bg-[var(--card)]"
              />
              <label htmlFor="age-consent" className="text-xs text-[var(--muted)] leading-relaxed cursor-pointer">
                I am 18+ and agree to{' '}
                <button
                  type="button"
                  onClick={() => onNavigateLegal('terms')}
                  className="text-[var(--accent)] underline underline-offset-2"
                >
                  Terms
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={() => onNavigateLegal('privacy')}
                  className="text-[var(--accent)] underline underline-offset-2"
                >
                  Privacy Policy
                </button>
                , and{' '}
                <button
                  type="button"
                  onClick={() => onNavigateLegal('guidelines')}
                  className="text-[var(--accent)] underline underline-offset-2"
                >
                  Community Guidelines
                </button>
                .
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password || !ageConsent}
              className="w-full min-h-[46px] rounded-lg text-sm font-semibold text-white transition-opacity active:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Legal Disclaimer Footer */}
        <p className="text-[11px] text-center text-[var(--muted)] leading-relaxed pt-2">
          By continuing, you agree to{' '}
          <button
            type="button"
            onClick={() => onNavigateLegal('terms')}
            className="text-[var(--muted)] hover:text-[var(--text)] underline underline-offset-2"
          >
            Terms of Service
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={() => onNavigateLegal('privacy')}
            className="text-[var(--muted)] hover:text-[var(--text)] underline underline-offset-2"
          >
            Privacy Policy
          </button>
          .
        </p>
      </div>

      <LegalFooter onNavigate={onNavigateLegal} />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onReset={resetPassword}
      />
    </div>
  );
};
