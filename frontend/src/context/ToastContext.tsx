import React, { createContext, useCallback, useContext, useState } from 'react';

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.random();
    const normalizedVariant: ToastVariant = variant === 'error' ? 'danger' : variant;
    setToasts((prev) => [...prev, { id, message, variant: normalizedVariant }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getBgClass = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return 'bg-success text-white';
      case 'danger':
      case 'error':
        return 'bg-danger text-white';
      case 'warning':
        return 'bg-warning text-dark';
      case 'info':
      default:
        return 'bg-dark text-white';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast show align-items-center border-0 mb-2 shadow-lg ${getBgClass(t.variant)}`}
            role="alert"
            style={{ borderRadius: '0.75rem', minWidth: '280px' }}
          >
            <div className="d-flex p-2">
              <div className="toast-body flex-grow-1" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {t.variant === 'success' && <i className="bi bi-check-circle-fill me-2"></i>}
                {(t.variant === 'danger' || t.variant === 'error') && <i className="bi bi-exclamation-triangle-fill me-2"></i>}
                {t.variant === 'warning' && <i className="bi bi-exclamation-circle-fill me-2"></i>}
                {t.variant === 'info' && <i className="bi bi-info-circle-fill me-2"></i>}
                {t.message}
              </div>
              <button
                type="button"
                className={`btn-close me-2 m-auto ${t.variant === 'warning' ? '' : 'btn-close-white'}`}
                onClick={() => removeToast(t.id)}
                aria-label="Close"
              ></button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
