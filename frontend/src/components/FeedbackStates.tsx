import React from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Loading data...' }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
    <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export const EmptyState: React.FC<{ title: string; description: string; action?: React.ReactNode }> = ({
  title,
  description,
  action
}) => (
  <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center flex flex-col items-center gap-2">
    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
      <Inbox className="w-6 h-6" />
    </div>
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    <p className="text-sm text-slate-500 max-w-md">{description}</p>
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export const ErrorBanner: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex flex-wrap items-center justify-between gap-3 text-rose-800">
    <div className="flex items-center gap-2.5 text-sm font-medium">
      <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
      <span>{message}</span>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-100"
      >
        Retry
      </button>
    )}
  </div>
);
