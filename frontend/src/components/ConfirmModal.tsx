import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
          <div className="modal-header border-0 pb-0 pt-4 px-4">
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: danger ? '#fee2e2' : '#ccfbf1',
                  color: danger ? '#b91c1c' : '#0d9488'
                }}
              >
                <i className={`bi ${danger ? 'bi-exclamation-triangle-fill' : 'bi-question-circle-fill'} fs-5`}></i>
              </div>
              <h5 className="modal-title fw-bold" style={{ color: '#0f766e', fontSize: '1.15rem' }}>{title}</h5>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onCancel}
              disabled={loading}
            ></button>
          </div>
          <div className="modal-body px-4 py-3" style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.5' }}>
            {message}
          </div>
          <div className="modal-footer border-0 px-4 pb-4 pt-1 gap-2">
            <button
              type="button"
              className="btn btn-light"
              style={{ borderRadius: '0.65rem', fontWeight: 500 }}
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn ${danger ? 'btn-danger' : 'btn-primary-custom'}`}
              style={{ borderRadius: '0.65rem', fontWeight: 600, padding: '0.5rem 1.25rem' }}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
