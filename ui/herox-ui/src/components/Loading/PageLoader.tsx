"use client";

import React from "react";
import { Spinner } from "@heroui/react";

interface PageLoaderProps {
  message?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({
  message = "Loading page content...",
}) => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" color="primary" />
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
};

export default PageLoader;
