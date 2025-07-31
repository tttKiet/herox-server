"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Select,
  SelectItem,
  Pagination,
  Spinner,
  Input,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DatePicker,
} from "@heroui/react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { type ZonedDateTime } from "@internationalized/date";
import { toast } from "react-toastify";
import { getNimorKey } from "@/hook";
import { IInteractXTask } from "@/api/tasks";
import { tasksService } from "@/api/tasks.service";

// Note: This helper function is kept for potential future use
// Hàm trợ giúp để chuyển đổi từ chuỗi ISO sang đối tượng ZonedDateTime
/* const isoStringToCalendarDate = (isoString: string | null | undefined) => {
  if (!isoString || isoString === "") return null;
  try {
    return parseAbsolute(isoString, "Asia/Bangkok"); // Using Bangkok timezone (GMT+7)
  } catch (error) {
    console.error("Error converting ISO to ZonedDateTime:", error);
    return null;
  }
}; */

// Helper function to convert ZonedDateTime to ISO string
const calendarDateToIsoString = (date: ZonedDateTime | null | undefined) => {
  if (!date) return "";
  try {
    // Chuyển ZonedDateTime thành JavaScript Date và lấy ISO string
    const jsDate = date.toDate();

    // Format date as YYYY-MM-DD to ignore time portion
    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, "0");
    const day = String(jsDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error converting ZonedDateTime to ISO:", error);
    return "";
  }
};

// Define columns for the table
const columns = [
  { name: "Task ID", uid: "_id" },
  { name: "Telegram User ID", uid: "telegramUserId" },
  { name: "X Username", uid: "xUsername" },
  { name: "Min Links Required", uid: "minimumLinksForTask" },
  { name: "Total Links", uid: "totalLinks" },
  { name: "Completed Links", uid: "completedLinks" },
  { name: "Status", uid: "status" },
  { name: "Created At", uid: "createdAt" },
  { name: "Actions", uid: "actions" },
];

const statusColors = {
  todo: "warning",
  done: "success",
} as const;

const TableTasksManager: React.FC = () => {
  // States
  const [tasks, setTasks] = useState<IInteractXTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [telegramUserIdInput, setTelegramUserIdInput] = useState("");
  const [xUsernameInput, setXUsernameInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [taskDate, setTaskDate] = useState<ZonedDateTime | null>(null);

  const [filters, setFilters] = useState({
    telegramUserId: "",
    xUsername: "",
    status: "",
    taskDate: "",
  });

  const apiKey = getNimorKey();

  // Custom hook for debouncing values
  function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(timer);
      };
    }, [value, delay]);

    return debouncedValue;
  }

  // Debounced search values
  const debouncedTelegramUserId = useDebounce(telegramUserIdInput, 500);
  const debouncedXUsername = useDebounce(xUsernameInput, 500);

  // Format dates like HH:MM:SS DD/MM/YYYY
  const formatDate = (dateValue: string | Date | undefined) => {
    if (!dateValue) return "-";
    // Format: HH:MM:SS DD/MM/YYYY
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const time = date.toLocaleTimeString();
    const day = date.toLocaleDateString();
    return `${time} ${day}`;
  };

  // Update filters when debounced values change
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      telegramUserId: debouncedTelegramUserId,
    }));
    setPage(1); // Reset to first page when search changes
  }, [debouncedTelegramUserId]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      xUsername: debouncedXUsername,
    }));
    setPage(1); // Reset to first page when search changes
  }, [debouncedXUsername]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      status: statusFilter,
    }));
    setPage(1); // Reset to first page when status filter changes
  }, [statusFilter]);

  useEffect(() => {
    if (taskDate) {
      const isoString = calendarDateToIsoString(taskDate);
      console.log("Selected taskDate as ISO:", isoString);
      setFilters((prev) => ({
        ...prev,
        taskDate: isoString,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        taskDate: "",
      }));
    }
    setPage(1); // Reset to first page when date filter changes
  }, [taskDate]);

  // Function to fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!apiKey) {
      toast.error("API key not found. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      // Build filter object
      const filter = {
        ...(filters.telegramUserId && {
          telegramUserId: filters.telegramUserId,
        }),
        ...(filters.xUsername && { xUsername: filters.xUsername }),
        ...(filters.status && { status: filters.status }),
        ...(filters.taskDate && { taskDate: filters.taskDate }),
      };

      console.log("Sending filter to server:", filter);

      const response = await tasksService.getTasks({
        apiKey,
        filter,
        page,
        limit: rowsPerPage,
      });

      console.log("Server response:", response);

      if (response.ok) {
        setTasks(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      } else {
        toast.error(response.message || "Error fetching tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [apiKey, filters, page, rowsPerPage]);

  // Function to update task status
  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    if (!apiKey) {
      toast.error("API key not found. Please log in again.");
      return;
    }

    try {
      const response = await tasksService.updateTaskStatus({
        apiKey,
        taskId,
        status: newStatus,
      });

      if (response.ok) {
        toast.success("Task status updated successfully");
        fetchTasks(); // Refresh data after update
      } else {
        toast.error(response.message || "Error updating task status");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  // Initial fetch on component mount and when filters or pagination changes
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Get status display
  const getStatusDisplay = (status: string) => {
    const colorKey = status as keyof typeof statusColors;
    const color = statusColors[colorKey] || "default";
    return (
      <Chip color={color} variant="flat" size="sm">
        {status.replace("_", " ").toUpperCase()}
      </Chip>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex gap-4 flex-wrap items-center justify-between w-full">
          <div className="flex items-center gap-6">
            <Input
              size="md"
              label="Telegram User ID"
              placeholder="Filter by Telegram User ID..."
              value={telegramUserIdInput}
              onValueChange={setTelegramUserIdInput}
              startContent={
                <HiOutlineMagnifyingGlass className="text-gray-400" />
              }
              className="w-48"
            />

            <span> | </span>

            <Input
              size="md"
              label="X Username"
              placeholder="Filter by X Username..."
              value={xUsernameInput}
              onValueChange={setXUsernameInput}
              startContent={
                <HiOutlineMagnifyingGlass className="text-gray-400" />
              }
              className="w-48"
            />

            <span> | </span>

            <Select
              label="Status"
              placeholder="Filter by Status"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as string;
                setStatusFilter(key || "");
              }}
              className="w-48"
            >
              <SelectItem key="">All Statuses</SelectItem>
              <SelectItem key="todo">Todo</SelectItem>
              <SelectItem key="done">Done</SelectItem>
            </Select>
          </div>
          <div>
            <DatePicker
              label="Task Date"
              value={taskDate}
              onChange={(date) => setTaskDate(date)}
              className="w-48"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="flex flex-wrap gap-2 mb-3">
        {filters.telegramUserId && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              setFilters((prev) => ({ ...prev, telegramUserId: "" }));
              setTelegramUserIdInput("");
            }}
          >
            Telegram User ID: {filters.telegramUserId}
          </Chip>
        )}
        {filters.xUsername && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              setFilters((prev) => ({ ...prev, xUsername: "" }));
              setXUsernameInput("");
            }}
          >
            X Username: {filters.xUsername}
          </Chip>
        )}
        {filters.status && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              setFilters((prev) => ({ ...prev, status: "" }));
              setStatusFilter("");
            }}
          >
            Status: {filters.status.replace("_", " ").toUpperCase()}
          </Chip>
        )}
        {filters.taskDate && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              setFilters((prev) => ({ ...prev, taskDate: "" }));
              setTaskDate(null);
            }}
          >
            Task Date: {new Date(filters.taskDate).toLocaleDateString()} (
            {filters.taskDate})
          </Chip>
        )}
      </div>

      {/* Tasks Table */}
      <div className="">
        <Table
          aria-label="Tasks Table"
          selectionMode="none"
          isHeaderSticky={false}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid}>{column.name}</TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={tasks}
            isLoading={loading}
            loadingContent={<Spinner size="md" />}
            emptyContent={!loading && "No tasks found."}
          >
            {(task) => (
              <TableRow key={task._id}>
                <TableCell>{task._id}</TableCell>
                <TableCell>{task.telegramUserId || "-"}</TableCell>
                <TableCell>{task.xUsername || "-"}</TableCell>
                <TableCell>{task.minimumLinksForTask}</TableCell>
                <TableCell>{task.totalLinks}</TableCell>
                <TableCell>{task.completedLinks}</TableCell>
                <TableCell>{getStatusDisplay(task.status)}</TableCell>
                <TableCell>{formatDate(task.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button variant="bordered" size="sm">
                          Update Status
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Update Status">
                        <DropdownItem
                          key="todo"
                          onPress={() => handleUpdateStatus(task._id!, "todo")}
                        >
                          Todo
                        </DropdownItem>
                        <DropdownItem
                          key="done"
                          onPress={() => handleUpdateStatus(task._id!, "done")}
                        >
                          Done
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div>
          <span className="text-sm text-gray-700">
            {totalItems > 0
              ? `Showing ${(page - 1) * rowsPerPage + 1} to ${Math.min(
                  page * rowsPerPage,
                  totalItems
                )} of ${totalItems} results`
              : "No results found"}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <Select
            selectedKeys={[`${rowsPerPage}`]}
            onSelectionChange={(keys) => {
              const newRowsPerPage = Number(Array.from(keys)[0]);
              setRowsPerPage(newRowsPerPage);
              setPage(1); // Reset to page 1 when changing page size
            }}
            labelPlacement="outside"
            className="w-24"
            aria-label="Rows per page"
            renderValue={(items) => {
              return items.map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  {item.textValue || item.key}
                </div>
              ));
            }}
          >
            {[5, 10, 25, 50].map((size) => (
              <SelectItem key={`${size}`} textValue={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </Select>
          <Pagination
            page={page}
            total={totalPages}
            onChange={(newPage) => setPage(newPage)}
            showControls
            className="flex-grow"
          />
        </div>
      </div>
    </div>
  );
};

export default TableTasksManager;
