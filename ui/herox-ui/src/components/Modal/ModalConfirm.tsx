import React from "react";
import ModalCustom from "./Modal";
import { Button } from "@heroui/react";

interface ModalConfirmProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmColor?:
    | "danger"
    | "primary"
    | "success"
    | "warning"
    | "secondary"
    | "default";
  loading?: boolean;
  children?: React.ReactNode;
}

const ModalConfirm: React.FC<ModalConfirmProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Confirm",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "danger",
  loading = false,
  children,
}) => {
  return (
    <ModalCustom isOpen={isOpen} onClose={onCancel} title={title} size="md">
      <div className="py-4">
        {description && (
          <div className="mb-4 text-center text-lg font-semibold text-danger">
            {description}
          </div>
        )}
        {children && (
          <div className="mb-2 text-center text-sm text-default-500">
            {children}
          </div>
        )}
        <div className="flex justify-center gap-4 mt-6">
          <Button color={confirmColor} onPress={onConfirm} isLoading={loading}>
            {confirmText}
          </Button>
          <Button variant="flat" onPress={onCancel}>
            {cancelText}
          </Button>
        </div>
      </div>
    </ModalCustom>
  );
};

export default ModalConfirm;
