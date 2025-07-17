"use client";

import React from "react";
import { Spinner } from "@heroui/react";

interface LoadingOverlayProps {
  message?: string;
  isBlocking?: boolean; // Nếu true, người dùng không thể tương tác với phần nằm dưới overlay
  fullScreen?: boolean; // Nếu true, overlay sẽ phủ toàn màn hình
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = "Loading...",
  isBlocking = true,
  fullScreen = false,
}) => {
  // Ngăn cuộn trang khi fullScreen và isBlocking đều true
  React.useEffect(() => {
    if (fullScreen && isBlocking) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [fullScreen, isBlocking]);

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50"
    : "absolute inset-0 z-10";

  const bgClasses = isBlocking
    ? "bg-white/80 dark:bg-gray-900/80"
    : "bg-white/50 dark:bg-gray-900/50";

  const pointerClasses = isBlocking
    ? "pointer-events-auto"
    : "pointer-events-none";

  return (
    <div
      className={`${containerClasses} ${bgClasses} ${pointerClasses} flex flex-col items-center justify-center`}
      onClick={(e) => isBlocking && e.stopPropagation()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg flex flex-col items-center">
        <Spinner size="lg" color="primary" />
        {message && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
