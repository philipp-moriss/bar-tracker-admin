import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'he';
  
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("common.deleteTitle")}
      description={t(textKey)}
      footer={
        <div className={`flex gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {t("common.delete")}
          </Button>
        </div>
      }
    >
      <></>
    </Modal>
  );
};

export default DeleteConfirmModal;