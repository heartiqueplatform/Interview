import React, { useState, useEffect } from 'react';
import { Smartphone, ShieldCheck, Check, Clock, AlertCircle } from 'lucide-react';
import { PLANS } from '../../lib/constants';
import { Modal } from '../../components/Modal';
import { useToast } from '../../lib/toast';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiatePayment: (planKey: string, phone: string, amount: number) => Promise<{ ok: boolean; ref: string }>;
  userPhone?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onInitiatePayment,
  userPhone = '254712345678',
}) => {
  const [selectedPlanKey, setSelectedPlanKey] = useState<string>('monthly');
  const [phone, setPhone] = useState(userPhone);
  const [step, setStep] = useState<'select' | 'confirm' | 'waiting' | 'timeout'>('select');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const { showToast } = useToast();

  const selectedPlan = PLANS[selectedPlanKey as keyof typeof PLANS] || PLANS.monthly;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'waiting') {
      setSecondsRemaining(60);
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setStep('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const handleStartPayment = async () => {
    // Validate Kenyan Safaricom phone format
    const cleaned = phone.trim().replace(/\D/g, '');
    if (!cleaned.startsWith('254') && !cleaned.startsWith('07') && !cleaned.startsWith('01')) {
      showToast('Please enter a valid Safaricom phone number (e.g. 254712345678)', 'error');
      return;
    }
    const formatted = cleaned.startsWith('0') ? '254' + cleaned.substring(1) : cleaned;
    setPhone(formatted);
    setStep('confirm');
  };

  const handleConfirmPay = async () => {
    setStep('waiting');
    try {
      const res = await onInitiatePayment(selectedPlanKey, phone, selectedPlan.price);
      if (res.ok) {
        setPaymentRef(res.ref);
        showToast('M-Pesa payment confirmed! Scenarios unlocked.', 'success');
        setStep('select');
        onClose();
      } else {
        setPaymentRef(res.ref || 'REF-' + Date.now());
        setStep('timeout');
      }
    } catch {
      setStep('timeout');
    }
  };

  const planKeys = Object.keys(PLANS) as (keyof typeof PLANS)[];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={step === 'waiting' ? 'Processing M-Pesa' : 'Unlock Everything'}>
      {step === 'select' && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            You've reached the 5 free scenario limit. Subscribe for unlimited access to all hospital board questions, audio breakdowns, and full community access.
          </p>

          {/* Plan Selector */}
          <div className="space-y-2">
            {planKeys.map((key) => {
              const p = PLANS[key];
              const isSelected = selectedPlanKey === key;
              return (
                <div
                  key={key}
                  onClick={() => setSelectedPlanKey(key)}
                  className="p-3.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'var(--card-subtle)' : 'var(--card)',
                  }}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text)]">{p.name}</span>
                      {key === 'one-time' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[var(--warning)]/20 text-[var(--warning)]">
                          First 100 only
                        </span>
                      )}
                      {key === 'season' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[var(--accent)]/20 text-[var(--accent)]">
                          Most popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)]">{p.label}</p>
                  </div>

                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent)' : 'var(--card-subtle)',
                      color: isSelected ? '#ffffff' : 'transparent',
                    }}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phone Number Input */}
          <div className="space-y-1.5 pt-1">
            <label htmlFor="mpesa-phone" className="block text-xs font-medium text-[var(--muted)]">
              Safaricom M-Pesa Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--muted)]">
                <Smartphone className="w-4 h-4" />
              </div>
              <input
                id="mpesa-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="2547XXXXXXXX"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-sm bg-[var(--card-subtle)] text-[var(--text)] font-mono"
              />
            </div>
            <p className="text-[11px] text-[var(--muted)] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" />
              Direct STK push via IntaSend. No card details stored.
            </p>
          </div>

          {/* Pay Button */}
          <button
            type="button"
            onClick={handleStartPayment}
            className="w-full min-h-[46px] mt-2 py-3 rounded-lg text-sm font-semibold text-white transition-opacity active:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Pay with M-Pesa (KES {selectedPlan.price})
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4 text-center py-2">
          <div
            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-[var(--accent)]"
            style={{ backgroundColor: 'var(--card-subtle)' }}
          >
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text)]">Confirm M-Pesa STK Push</h3>
            <p className="text-xs text-[var(--muted)] mt-1">
              We will send an instant payment prompt of <strong className="text-[var(--text)]">KES {selectedPlan.price}</strong> to:
            </p>
            <p className="text-sm font-mono font-bold text-[var(--accent)] mt-1">{phone}</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('select')}
              className="flex-1 min-h-[44px] rounded-lg text-sm font-medium bg-[var(--card-subtle)]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmPay}
              className="flex-1 min-h-[44px] rounded-lg text-sm font-semibold text-white bg-[var(--success)]"
            >
              Send STK Prompt
            </button>
          </div>
        </div>
      )}

      {step === 'waiting' && (
        <div className="space-y-4 text-center py-4">
          <div
            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-[var(--accent)] animate-pulse"
            style={{ backgroundColor: 'var(--card-subtle)' }}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--text)]">Check Your Phone</h3>
            <p className="text-xs text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
              Check your phone for the M-Pesa prompt. Enter your M-Pesa PIN to complete payment of KES {selectedPlan.price}.
            </p>
          </div>

          <div className="py-2">
            <span className="text-2xl font-mono font-bold text-[var(--accent)]">
              00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
            </span>
          </div>

          <p className="text-[11px] text-[var(--muted)]">
            Listening for Safaricom confirmation webhook...
          </p>
        </div>
      )}

      {step === 'timeout' && (
        <div className="space-y-4 text-center py-2">
          <div
            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-[var(--warning)]"
            style={{ backgroundColor: 'var(--card-subtle)' }}
          >
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text)]">Payment Pending</h3>
            <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
              We did not receive confirmation yet. If you paid, contact support with reference:
            </p>
            <p className="text-xs font-mono font-bold text-[var(--accent)] mt-2 bg-[var(--card-subtle)] p-2 rounded">
              {paymentRef || 'BP-' + Date.now()}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('select')}
              className="flex-1 min-h-[44px] rounded-lg text-sm font-semibold bg-[var(--card-subtle)] text-[var(--text)]"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-lg text-sm font-semibold text-white bg-[var(--accent)]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
