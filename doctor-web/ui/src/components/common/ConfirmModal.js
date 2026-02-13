import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Loading from './../common/Loading';

function ConfirmModal({
  open,
  type,
  title,
  body,
  loading = false,
  disable = false,
  confirmButton,
  onConfirm,
  closeButton,
  onClose,
  children,
}) {
  const [show, setShow] = useState(open);

  const handleClose = () => {
    onClose && onClose(false);
  };

  const handleConfirm = () => {
    setShow(false);
    onConfirm && onConfirm(false);
  };

  useEffect(() => {
    setShow(open);
  }, [open]);

  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
        size="md"
        centered
        style={{ borderRadius: '1rem' }}
      >
        <Modal.Body className="pt-3">
          <div className="text-center">
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#1a1a1a',
                lineHeight: '1.5',
              }}
            >
              {body || children}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between gap-4 border-0 pt-0">
          <Button
            variant={`outline-${type || 'primary'}`}
            size="lg"
            disabled={disable}
            onClick={handleConfirm}
            style={{
              flex: 1,
              height: '45px',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '12px',
              borderWidth: '2px',
              textTransform: 'none',
              minWidth: '160px',
            }}
          >
            {loading ? (
              <Loading type="inline" size="small" text="Processing..." />
            ) : (
              confirmButton
            )}
          </Button>
          <Button
            variant="outline-secondary"
            size="lg"
            onClick={handleClose}
            style={{
              flex: 1,
              height: '45px',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '12px',
              borderWidth: '2px',
              textTransform: 'none',
              minWidth: '160px',
            }}
          >
            {closeButton ?? 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ConfirmModal;
