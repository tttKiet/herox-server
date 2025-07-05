import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import React from "react";

interface ModalCustomProps {
  isOpen: boolean;
  onClose: () => void;
  size?:
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "full";
  title?: React.ReactNode;
  children?: React.ReactNode;
}

const ModalCustom: React.FC<ModalCustomProps> = ({
  isOpen,
  onClose,
  size = "md",
  title = "Modal Title",
  children,
}) => {
  return (
    <Modal isOpen={isOpen} size={size} onClose={onClose}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <ModalBody>{children}</ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalCustom;
