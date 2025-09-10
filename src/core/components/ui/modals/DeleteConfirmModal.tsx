import React from "react";
import { Modal } from "./Modal";
import { Button } from "@/core/components/ui/button";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
  textKey?: string; 
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  loading,
  textKey = "admin.common.deleteConfirm"
}) => {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={"Delete"}
      description={textKey}
      footer={
        <div className={`flex gap-2 justify-end`}>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {"Cancel"}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {"Delete"}
          </Button>
        </div>
      }
    >
      <></>
    </Modal>
  );
};

export default DeleteConfirmModal;