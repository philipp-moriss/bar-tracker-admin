import React from 'react';
import { Modal } from './Modal';
import { Button } from '@/core/components/ui/button';

interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
  showCloseButton?: boolean;
  showCancelButton?: boolean;
  showConfirmButton?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  confirmClassName?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
};

export const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onOpenChange,
  title,
  children,
  className = '',
  size = 'lg',
  showCloseButton = true,
  showCancelButton = true,
  showConfirmButton = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  disabled = false,
  confirmVariant = 'default',
  confirmClassName = '',
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const footer = showCancelButton || showConfirmButton ? (
    <>
      {showCancelButton && (
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
        >
          {cancelText}
        </Button>
      )}
      {showConfirmButton && (
        <Button
          variant={confirmVariant}
          onClick={handleConfirm}
          disabled={loading || disabled}
          className={confirmClassName}
        >
          {loading ? 'Loading...' : confirmText}
        </Button>
      )}
    </>
  ) : null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      className={`${sizeClasses[size]} ${className}`}
      footer={footer}
    >
      {children}
    </Modal>
  );
};
