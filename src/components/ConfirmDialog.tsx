interface Props {
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ message, confirmLabel = 'Hapus', onConfirm, onCancel }: Props) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="confirm-modal" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon-badge">⚠️</div>
        <h3 className="confirm-title">Konfirmasi Tindakan</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions-row">
          <button type="button" className="action-btn-secondary" onClick={onCancel}>
            Batal
          </button>
          <button type="button" className="action-btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
