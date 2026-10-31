import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  currentToast: ToastMessage | null;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const toast: ToastMessage = {
        id: Math.random().toString(36).substring(2, 9),
        message,
        type,
      };
      setCurrentToast(toast);
      timerRef.current = setTimeout(() => {
        setCurrentToast(null);
      }, 3000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast, currentToast }}>
      {children}
      {currentToast && (
        <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <div
            role={currentToast.type === 'error' ? 'alert' : 'status'}
            aria-live={currentToast.type === 'error' ? 'assertive' : 'polite'}
            className="pointer-events-auto max-w-md w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between"
            style={{
              backgroundColor:
                currentToast.type === 'error'
                  ? 'var(--danger)'
                  : currentToast.type === 'success'
                  ? 'var(--success)'
                  : currentToast.type === 'warning'
                  ? 'var(--warning)'
                  : 'var(--accent)',
              color: '#ffffff',
            }}
          >
            <span>{currentToast.message}</span>
            <button
              onClick={hideToast}
              aria-label="Close notification"
              className="ml-3 text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
