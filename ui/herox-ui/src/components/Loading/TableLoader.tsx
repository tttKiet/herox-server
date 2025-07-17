"use client";

import React from "react";
import { Spinner } from "@heroui/react";

interface TableLoaderProps {
  message?: string;
  height?: string;
}

const TableLoader: React.FC<TableLoaderProps> = ({
  message = "Loading data...",
  height = "200px",
}) => {
  return (
    <div
      className="w-full flex flex-col items-center justify-center"
      style={{ height }}
    >
      <Spinner size="md" color="primary" />
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
};

export default TableLoader;
