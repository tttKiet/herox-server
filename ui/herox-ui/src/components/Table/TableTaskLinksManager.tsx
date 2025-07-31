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
import { IInteractXTaskLink } from "@/api/task-links";
import { taskLinksService } from "@/api/task-links/task-links.service";

// Define columns for the table
const columns = [
  { name: "Task ID", uid: "taskId" },
  { name: "Post ID", uid: "postId" },
  { name: "Post URL", uid: "postUrl" },
  { name: "Type", uid: "type" },
  { name: "Interaction Count", uid: "interactionCount" },
  { name: "Required Interactions", uid: "requiredInteractions" },
  { name: "Status", uid: "status" },
  { name: "Created At", uid: "createdAt" },
  { name: "Updated At", uid: "updatedAt" },
  { name: "Actions", uid: "actions" },
];

// Status colors for visual differentiation
const statusColors = {
  pending: "warning",
  completed: "success",
} as const;

// Type colors
const typeColors = {
  admin: "primary",
  member: "success",
} as const;

const TableTaskLinksManager: React.FC = () => {
  // States
  const [taskLinks, setTaskLinks] = useState<IInteractXTaskLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [taskIdInput, setTaskIdInput] = useState("");
  const [postIdInput, setPostIdInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<ZonedDateTime | null>(null);
  const [toDate, setToDate] = useState<ZonedDateTime | null>(null);

  const [filters, setFilters] = useState({
    taskId: "",
    postId: "",
    type: "",
    status: "",
    taskDate: "", // Add taskDate for compatibility with backend
    fromDate: "",
    toDate: "",
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
  const debouncedTaskId = useDebounce(taskIdInput, 500);
  const debouncedPostId = useDebounce(postIdInput, 500);

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
      taskId: debouncedTaskId,
    }));
    setPage(1); // Reset to first page when search changes
  }, [debouncedTaskId]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      postId: debouncedPostId,
    }));
    setPage(1); // Reset to first page when search changes
  }, [debouncedPostId]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      type: typeFilter,
    }));
    setPage(1); // Reset to first page when type filter changes
  }, [typeFilter]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      status: statusFilter,
    }));
    setPage(1); // Reset to first page when status filter changes
  }, [statusFilter]);

  // Helper function to format ZonedDateTime to ISO string format
  const calendarDateToIsoString = (
    date: ZonedDateTime | null | undefined
  ): string => {
    if (!date) return "";
    try {
      // Convert ZonedDateTime to JavaScript Date
      const jsDate = date.toDate();
      // Format date as YYYY-MM-DD
      const year = jsDate.getFullYear();
      const month = String(jsDate.getMonth() + 1).padStart(2, "0");
      const day = String(jsDate.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error converting ZonedDateTime to ISO:", error);
      return "";
    }
  };

  // Process date filter changes
  useEffect(() => {
    let fromDateStr = "";
    let toDateStr = "";
    let taskDateStr = "";

    if (fromDate) {
      // Format dates as YYYY-MM-DD strings
      fromDateStr = calendarDateToIsoString(fromDate);
      // If we only have fromDate, set it as taskDate too
      if (!toDate) {
        taskDateStr = fromDateStr;
      }
    }

    if (toDate) {
      toDateStr = calendarDateToIsoString(toDate);
    }

    // Create ISO strings with proper time components for range filtering
    let fromDateWithTime = "";
    let toDateWithTime = "";

    if (fromDate) {
      const fromDateObj = fromDate.toDate();
      const startOfDay = new Date(
        fromDateObj.getFullYear(),
        fromDateObj.getMonth(),
        fromDateObj.getDate(),
        0,
        0,
        0,
        0
      );
      fromDateWithTime = startOfDay.toISOString();
    }

    if (toDate) {
      const toDateObj = toDate.toDate();
      const endOfDay = new Date(
        toDateObj.getFullYear(),
        toDateObj.getMonth(),
        toDateObj.getDate(),
        23,
        59,
        59,
        999
      );
      toDateWithTime = endOfDay.toISOString();
    }

    // Set specific date filter fields only - don't include the entire filters object
    setFilters((prev) => ({
      ...prev,
      // Reset date filters first
      taskDate: "",
      fromDate: "",
      toDate: "",
      // Then set the new values
      ...(fromDate && { fromDate: fromDateWithTime }),
      ...(toDate && { toDate: toDateWithTime }),
      ...(fromDate && !toDate && { taskDate: taskDateStr }),
    }));

    setPage(1); // Reset to first page when date filters change
    console.log("Date filters updated:", {
      taskDate: taskDateStr,
      fromDate: fromDateStr,
      toDate: toDateStr,
      fromDateWithTime: fromDateWithTime
        ? new Date(fromDateWithTime).toLocaleString()
        : "",
      toDateWithTime: toDateWithTime
        ? new Date(toDateWithTime).toLocaleString()
        : "",
      usingTaskDate: !!(fromDate && !toDate),
    });
  }, [fromDate, toDate]); // Chỉ phụ thuộc vào fromDate và toDate

  // Function to fetch task links
  const fetchTaskLinks = useCallback(async () => {
    if (!apiKey) {
      toast.error("API key not found. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      // Build filter object
      const filter = {
        ...(filters.taskId && { taskId: filters.taskId }),
        ...(filters.postId && { postId: filters.postId }),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        // Include taskDate ONLY if we're not using date range filtering
        ...(filters.taskDate &&
          !filters.fromDate &&
          !filters.toDate && { taskDate: filters.taskDate }),
        // Always include fromDate/toDate if they exist
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
      };

      // Log the actual date values being sent to ensure they're in the right format
      console.log("Sending filter to API:", {
        ...filter,
        taskDate: filter.taskDate,
        fromDate: filter.fromDate
          ? new Date(filter.fromDate).toLocaleString()
          : undefined,
        toDate: filter.toDate
          ? new Date(filter.toDate).toLocaleString()
          : undefined,
        rawFromDate: filter.fromDate,
        rawToDate: filter.toDate,
        hasTaskDate: !!filter.taskDate,
        hasFromDate: !!filter.fromDate,
        hasToDate: !!filter.toDate,
      });

      const response = await taskLinksService.getTaskLinks({
        apiKey,
        filter,
        page,
        limit: rowsPerPage,
      });

      console.log("API response:", response); // Debug log

      if (response.ok) {
        setTaskLinks(response.data);
        console.log("Task links data:", response.data); // Debug log to check actual data
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      } else {
        toast.error(response.message || "Error fetching task links");
      }
    } catch (error) {
      console.error("Error fetching task links:", error);
      toast.error("Failed to fetch task links");
    } finally {
      setLoading(false);
    }
  }, [apiKey, filters, page, rowsPerPage]);

  // Function to update task link status
  const handleUpdateStatus = async (linkId: string, newStatus: string) => {
    if (!apiKey) {
      toast.error("API key not found. Please log in again.");
      return;
    }

    try {
      const response = await taskLinksService.updateTaskLinkStatus({
        apiKey,
        linkId,
        status: newStatus,
      });

      if (response.ok) {
        toast.success("Task link status updated successfully");
        fetchTaskLinks(); // Refresh data after update
      } else {
        toast.error(response.message || "Error updating task link status");
      }
    } catch (error) {
      console.error("Error updating task link status:", error);
      toast.error("Failed to update task link status");
    }
  };

  // Initial fetch on component mount and when filters or pagination changes
  useEffect(() => {
    fetchTaskLinks();
  }, [fetchTaskLinks]);

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

  // Get type display
  const getTypeDisplay = (type: string) => {
    const colorKey = type as keyof typeof typeColors;
    const color = typeColors[colorKey] || "default";
    return (
      <Chip color={color} variant="flat" size="sm">
        {type.toUpperCase()}
      </Chip>
    );
  };

  return (
    <>
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex gap-4 flex-wrap items-center justify-between w-full">
          <div className="flex items-center gap-6">
            <Input
              size="md"
              label="Task ID"
              placeholder="Filter by Task ID..."
              value={taskIdInput}
              onValueChange={setTaskIdInput}
              startContent={
                <HiOutlineMagnifyingGlass className="text-gray-400" />
              }
              className="w-48"
            />

            <span> | </span>

            <Input
              size="md"
              label="Post ID"
              placeholder="Filter by Post ID..."
              value={postIdInput}
              onValueChange={setPostIdInput}
              startContent={
                <HiOutlineMagnifyingGlass className="text-gray-400" />
              }
              className="w-48"
            />

            <span> | </span>

            <Select
              label="Type"
              placeholder="Filter by Type"
              selectedKeys={typeFilter ? [typeFilter] : []}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as string;
                setTypeFilter(key || "");
              }}
              className="w-40"
            >
              <SelectItem key="">All Types</SelectItem>
              <SelectItem key="admin">Admin</SelectItem>
              <SelectItem key="member">Member</SelectItem>
            </Select>

            <span> | </span>

            <Select
              label="Status"
              placeholder="Filter by Status"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as string;
                setStatusFilter(key || "");
              }}
              className="w-40"
            >
              <SelectItem key="">All Statuses</SelectItem>
              <SelectItem key="pending">Pending</SelectItem>
              <SelectItem key="completed">Completed</SelectItem>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <DatePicker
              label="From Date"
              value={fromDate}
              onChange={setFromDate}
              className="w-48"
            />
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={setToDate}
              className="w-48"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="flex flex-wrap gap-2 mb-3">
        {filters.taskId && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              setFilters((prev) => ({ ...prev, taskId: "" }));
              setTaskIdInput("");
            }}
          >
            Task ID: {filters.taskId}
          </Chip>
        )}
        {filters.postId && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              setFilters((prev) => ({ ...prev, postId: "" }));
              setPostIdInput("");
            }}
          >
            Post ID: {filters.postId}
          </Chip>
        )}
        {filters.type && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              setFilters((prev) => ({ ...prev, type: "" }));
              setTypeFilter("");
            }}
          >
            Type: {filters.type.toUpperCase()}
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
        {filters.taskDate && !filters.fromDate && !filters.toDate && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              setFilters((prev) => ({ ...prev, taskDate: "" }));
              setFromDate(null);
            }}
          >
            Date: {filters.taskDate}
          </Chip>
        )}
        {filters.fromDate && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              setFilters((prev) => ({ ...prev, fromDate: "" }));
              setFromDate(null);
            }}
          >
            From: {new Date(filters.fromDate).toLocaleDateString()}
          </Chip>
        )}
        {filters.toDate && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              setFilters((prev) => ({ ...prev, toDate: "" }));
              setToDate(null);
            }}
          >
            To: {new Date(filters.toDate).toLocaleDateString()}
          </Chip>
        )}
      </div>

      {/* Task Links Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          aria-label="Task Links Table"
          selectionMode="none"
          isHeaderSticky={false}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} align="start">
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={taskLinks}
            isLoading={loading}
            loadingContent={<Spinner size="md" />}
            emptyContent={!loading && "No task links found."}
          >
            {(link) => (
              <TableRow
                key={link._id}
                onMouseEnter={() =>
                  console.log(
                    "Task ID:",
                    link.taskId,
                    "Type:",
                    typeof link.taskId
                  )
                }
              >
                <TableCell>{link.taskId || "-"}</TableCell>
                <TableCell>{link.postId}</TableCell>
                <TableCell>
                  <a
                    href={link.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {link.postUrl.length > 30
                      ? link.postUrl.substring(0, 30) + "..."
                      : link.postUrl}
                  </a>
                </TableCell>
                <TableCell>{getTypeDisplay(link.type)}</TableCell>
                <TableCell>{link.interactionCount}</TableCell>
                <TableCell>{link.requiredInteractions || "-"}</TableCell>
                <TableCell>{getStatusDisplay(link.status)}</TableCell>
                <TableCell>{formatDate(link.createdAt)}</TableCell>
                <TableCell>{formatDate(link.updatedAt)}</TableCell>
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
                          key="pending"
                          onPress={() =>
                            handleUpdateStatus(link._id!, "pending")
                          }
                        >
                          Pending
                        </DropdownItem>
                        <DropdownItem
                          key="completed"
                          onPress={() =>
                            handleUpdateStatus(link._id!, "completed")
                          }
                        >
                          Completed
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
          {totalPages > 1 && (
            <Pagination
              page={page}
              total={totalPages}
              onChange={(newPage) => setPage(newPage)}
              showControls
              className="flex-grow"
            />
          )}
        </div>
      </div>
    </>
  );
};

export default TableTaskLinksManager;
