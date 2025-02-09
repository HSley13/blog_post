import { Modal, Button } from "react-bootstrap";

type ConfirmationModalProps = {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  question: string;
};

export const ConfirmationModal = ({
  show,
  onConfirm,
  onCancel,
  question,
}: ConfirmationModalProps) => {
  return (
    <>
      {show && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(5px)",
            zIndex: 1000,
          }}
        ></div>
      )}

      <Modal show={show} onHide={onCancel} centered style={{ zIndex: 1001 }}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>{question}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
