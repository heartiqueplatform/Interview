import React, { useState, useRef } from 'react';
import { useToast } from '../lib/toast';

interface ToggleButtonProps {
  isActive: boolean;
  onToggle: (nextState: boolean) => Promise<boolean> | boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  ariaLabel: string;
  icon?: React.ReactNode;
  activeIcon?: React.ReactNode;
  activeColor?: string;
  inactiveColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  isActive: initialActive,
  onToggle,
  activeLabel,
  inactiveLabel,
  ariaLabel,
  icon,
  activeIcon,
  activeColor = 'var(--accent)',
  inactiveColor = 'var(--muted)',
  className = '',
  children,
}) => {
  const [active, setActive] = useState(initialActive);
  const lastTapRef = useRef<number>(0);
  const { showToast } = useToast();

  // Sync if parent updates
  React.useEffect(() => {
    setActive(initialActive);
  }, [initialActive]);

  const handleTap = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 300) return;
    lastTapRef.current = now;

    const previous = active;
    const next = !previous;

    // Instant optimistic update
    setActive(next);

    try {
      const ok = await onToggle(next);
      if (ok === false) {
        setActive(previous);
        showToast('Action could not be saved', 'error');
      }
    } catch {
      setActive(previous);
      showToast('Action could not be saved', 'error');
    }
  };

  return (
    <button
      type="button"
      onClick={handleTap}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${className}`}
      style={{
        backgroundColor: active ? 'var(--card-subtle)' : 'transparent',
        color: active ? activeColor : inactiveColor,
      }}
    >
      {active ? activeIcon || icon : icon}
      {children || (
        <span>{active ? activeLabel || '' : inactiveLabel || ''}</span>
      )}
    </button>
  );
};
