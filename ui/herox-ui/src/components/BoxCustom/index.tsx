import React from "react";

interface BoxCustomProps {
  children: React.ReactNode;
  className?: string;
}

export default function BoxCustom({
  children,
  className = "",
}: BoxCustomProps) {
  return (
    <div
      className={`rounded-sm box-shadow-main bg-white p-4 px-6 ${className}`}
    >
      {children}
    </div>
  );
}
