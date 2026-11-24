import React from 'react';

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Loading data...' }) => (
  <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
    <div className="spinner-border text-teal mb-3" style={{ color: '#0d9488', width: '2.5rem', height: '2.5rem' }} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#0f766e' }}>{label}</span>
  </div>
);

export const EmptyState: React.FC<{ title: string; description: string; action?: React.ReactNode }> = ({
  title,
  description,
  action
}) => (
  <div className="empty-state">
    <i className="bi bi-inbox"></i>
    <h5 style={{ fontWeight: 700, color: '#0f766e', marginBottom: '0.5rem' }}>{title}</h5>
    <p style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto 1rem', fontSize: '0.9rem' }}>{description}</p>
    {action && <div>{action}</div>}
  </div>
);

export const ErrorBanner: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="alert alert-danger d-flex align-items-center justify-content-between p-3 mb-4" style={{ borderRadius: '0.85rem' }}>
    <div className="d-flex align-items-center gap-2">
      <i className="bi bi-exclamation-triangle-fill fs-5"></i>
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="btn btn-sm btn-outline-danger ms-3"
        style={{ borderRadius: '0.5rem' }}
      >
        Retry
      </button>
    )}
  </div>
);
