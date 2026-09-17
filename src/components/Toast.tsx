import React, { useEffect } from 'react';
import { AlertCircle, Bell, CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error' | 'push';
  title: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  onToastClick?: (toast: ToastMessage) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onToastClick,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
          onClick={() => onToastClick && onToastClick(toast)}
        />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: () => void;
  onClick: () => void;
}> = ({ toast, onDismiss, onClick }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isPush = toast.type === 'push';
  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      onClick={onClick}
      className={`pointer-events-auto p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start space-x-3 cursor-pointer transition-all transform hover:scale-[1.02] ${
        isPush
          ? 'bg-[#0c0e14]/90 text-white border-amber-500/40 shadow-amber-500/10'
          : isSuccess
          ? 'bg-[#0c0e14]/90 text-white border-teal-500/40 shadow-teal-500/10'
          : isError
          ? 'bg-[#0c0e14]/90 text-white border-rose-500/40 shadow-rose-500/10'
          : 'bg-[#0c0e14]/90 text-white border-white/15'
      }`}
    >
      <div
        className={`p-1.5 rounded-xl shrink-0 mt-0.5 border ${
          isPush
            ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
            : isSuccess
            ? 'bg-teal-500/20 border-teal-500/30 text-teal-300'
            : isError
            ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
            : 'bg-white/10 border-white/10 text-stone-300'
        }`}
      >
        {isPush ? (
          <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
        ) : isSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
        ) : (
          <AlertCircle className="w-4 h-4 text-rose-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold leading-tight text-white">{toast.title}</h4>
        <p className="text-[11px] text-stone-300 mt-1 leading-snug">{toast.message}</p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
