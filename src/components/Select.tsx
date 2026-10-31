import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Modal } from './Modal';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
}) => {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="min-h-[44px] w-full px-3.5 py-2.5 rounded-lg text-left text-sm flex items-center justify-between transition-colors cursor-pointer"
        style={{
          backgroundColor: 'var(--card)',
          color: selectedOption ? 'var(--text)' : 'var(--muted)',
        }}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="w-4 h-4 ml-2 text-[var(--muted)] shrink-0" />
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={label || 'Select option'}>
        <div role="listbox" className="space-y-1">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="min-h-[48px] w-full px-4 py-3 rounded-lg text-left text-sm flex items-center justify-between transition-colors"
                style={{
                  backgroundColor: isSelected ? 'var(--card-subtle)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--text)',
                }}
              >
                <span className="font-medium">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-[var(--accent)] shrink-0" />}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};
