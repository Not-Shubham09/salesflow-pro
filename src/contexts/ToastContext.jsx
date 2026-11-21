import React, { createContext, useContext, useState, useCallback } from 'react';
import Icon from '../components/AppIcon';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 5000),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning', 4500),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div 
        aria-live="polite" 
        className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-200 animate-slide-up ${
                isSuccess
                  ? 'bg-surface/95 text-text-primary border-emerald-500/30 shadow-emerald-500/10'
                  : isError
                  ? 'bg-surface/95 text-text-primary border-rose-500/30 shadow-rose-500/10'
                  : isWarning
                  ? 'bg-surface/95 text-text-primary border-amber-500/30 shadow-amber-500/10'
                  : 'bg-surface/95 text-text-primary border-border shadow-black/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSuccess
                      ? 'bg-emerald-50 text-emerald-600'
                      : isError
                      ? 'bg-rose-50 text-rose-600'
                      : isWarning
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  <Icon
                    name={
                      isSuccess
                        ? 'CheckCircle2'
                        : isError
                        ? 'AlertCircle'
                        : isWarning
                        ? 'AlertTriangle'
                        : 'Info'
                    }
                    size={16}
                  />
                </div>
                <p className="text-xs font-medium text-text-primary leading-snug">
                  {t.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-3 text-text-tertiary hover:text-text-primary p-1 rounded-md transition-colors"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => console.log('[Toast success]', msg),
      error: (msg) => console.error('[Toast error]', msg),
      info: (msg) => console.log('[Toast info]', msg),
      warning: (msg) => console.warn('[Toast warning]', msg),
    };
  }
  return context;
};

export default ToastContext;
