"use client";

import React, { useState, useEffect } from "react";
import { PageLoader } from "@/components/Loading";

interface WithPageLoadingProps {
  children: React.ReactNode;
  loadingTime?: number; // Thời gian giả lập loading (ms)
  message?: string;
}

/**
 * Component wrapper để hiển thị loading khi page đang tải
 * Đây là một ví dụ để bạn có thể sử dụng trong các page components
 */
export const WithPageLoading: React.FC<WithPageLoadingProps> = ({
  children,
  loadingTime = 1000, // Default 1 giây cho demo
  message = "Đang tải nội dung trang...",
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Giả lập thời gian loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, loadingTime);

    return () => clearTimeout(timer);
  }, [loadingTime]);

  // Khi đang loading, hiển thị PageLoader
  if (isLoading) {
    return <PageLoader message={message} />;
  }

  // Khi đã load xong, hiển thị nội dung
  return <>{children}</>;
};

export default WithPageLoading;

/**
 * Hướng dẫn sử dụng:
 *
 * Trong page component của bạn:
 *
 * import { WithPageLoading } from "@/components/WithPageLoading";
 *
 * export default function YourPage() {
 *   return (
 *     <WithPageLoading>
 *       <YourPageContent />
 *     </WithPageLoading>
 *   );
 * }
 */
