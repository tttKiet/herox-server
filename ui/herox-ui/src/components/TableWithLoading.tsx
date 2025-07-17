"use client";

import React from "react";
import { TableLoader } from "@/components/Loading";

interface TableWithLoadingProps<T> {
  data: T[] | null;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  renderTable: (data: T[]) => React.ReactNode;
}

/**
 * Component để hiển thị loading cho bảng dữ liệu
 * Đây là một ví dụ để bạn có thể sử dụng với các bảng dữ liệu
 */
export function TableWithLoading<T>({
  data,
  isLoading = false,
  loadingMessage = "Đang tải dữ liệu...",
  emptyMessage = "Không có dữ liệu",
  renderTable,
}: TableWithLoadingProps<T>) {
  // Nếu đang loading, hiển thị TableLoader
  if (isLoading) {
    return <TableLoader message={loadingMessage} />;
  }

  // Nếu không có dữ liệu
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  // Render bảng với dữ liệu
  return <>{renderTable(data)}</>;
}

/**
 * Hướng dẫn sử dụng:
 *
 * import { TableWithLoading } from "@/components/TableWithLoading";
 * import { useLoading } from "@/hook";
 *
 * export default function YourTable() {
 *   const [data, setData] = useState<YourDataType[]>([]);
 *   const { isLoading, withLoading } = useLoading(true);
 *
 *   useEffect(() => {
 *     const fetchData = async () => {
 *       const result = await withLoading(fetchYourData());
 *       setData(result);
 *     };
 *
 *     fetchData();
 *   }, [withLoading]);
 *
 *   return (
 *     <TableWithLoading
 *       data={data}
 *       isLoading={isLoading}
 *       renderTable={(data) => (
 *         <YourTableComponent data={data} />
 *       )}
 *     />
 *   );
 * }
 */
