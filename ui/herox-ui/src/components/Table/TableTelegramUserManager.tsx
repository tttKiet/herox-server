"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Input,
  Pagination,
  Spinner,
  Chip,
  Select,
  SelectItem,
} from "@heroui/react";
import { toast } from "react-toastify";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

interface TelegramUser {
  _id: string;
  userId: string;
  username: string;
  chatId: string;
  registeredUsernames: string[];
  createdAt: string;
  updatedAt: string;
}

// Define columns for the table

const columns = [
  { name: "User ID", uid: "userId" },
  { name: "Username", uid: "username" },
  { name: "Chat ID", uid: "chatId" },
  { name: "Registered Usernames", uid: "registeredUsernames" },
  { name: "Created At", uid: "createdAt" },
  { name: "Updated At", uid: "updatedAt" },
];

export default function TableTelegramUserManager() {
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchMode, setSearchMode] = useState<
    "username" | "userId" | "chatId"
  >("username");
  const [filters, setFilters] = useState({
    username: "",
    userId: "",
    chatId: "",
    interact: "",
  });

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

  const debouncedSearchValue = useDebounce(searchInput, 500);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      [searchMode]: debouncedSearchValue,
    }));
  }, [debouncedSearchValue, searchMode, setFilters]);

  const fetchUsers = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("page", pageNum.toString());
        queryParams.append("limit", rowsPerPage.toString());

        if (filters.username) queryParams.append("username", filters.username);
        if (filters.userId) queryParams.append("userId", filters.userId);
        if (filters.chatId) queryParams.append("chatId", filters.chatId);
        if (filters.interact) queryParams.append("interact", filters.interact);

        const response = await fetch(
          `/api/v1/telegram/users?${queryParams.toString()}`
        );
        const data = await response.json();

        if (!data.ok) {
          throw new Error(data.message || "Failed to fetch users");
        }

        setUsers(data.data);
        setPage(data.pagination.page);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to fetch Telegram users");
      } finally {
        setLoading(false);
      }
    },
    [
      filters,
      rowsPerPage,
      setLoading,
      setUsers,
      setPage,
      setTotal,
      setTotalPages,
    ]
  );

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  // Format dates like HH:MM:SS DD/MM/YYYY
  const formatDate = (dateValue: string | Date | undefined) => {
    if (!dateValue) return "-";
    // Format: HH:MM:SS DD/MM/YYYY
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const time = date.toLocaleTimeString();
    const day = date.toLocaleDateString();
    return `${time} ${day}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex items-center gap-6">
            <Input
              size="md"
              label="Search"
              placeholder="Search users..."
              value={searchInput}
              startContent={
                <HiOutlineMagnifyingGlass className="text-gray-400" />
              }
              onValueChange={(value) => {
                setSearchInput(value);
                setPage(1); // Reset to page 1 when changing search
              }}
              className="w-48"
            />

            <Select
              size="md"
              label="Search by"
              aria-label="Search field"
              defaultSelectedKeys={["username"]}
              selectedKeys={[searchMode]}
              onSelectionChange={(keys) => {
                setSearchMode(
                  (Array.from(keys)[0] as "username" | "userId" | "chatId") ||
                    "username"
                );
                setPage(1);
              }}
              className="w-40"
            >
              <SelectItem key="username">Username</SelectItem>
              <SelectItem key="userId">User ID</SelectItem>
              <SelectItem key="chatId">Chat ID</SelectItem>
            </Select>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="flex flex-wrap gap-2 mb-3">
        {filters.username && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              setFilters((prev) => ({ ...prev, username: "" }));
              if (searchMode === "username") setSearchInput("");
            }}
          >
            Username: {filters.username}
          </Chip>
        )}
        {filters.userId && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              setFilters((prev) => ({ ...prev, userId: "" }));
              if (searchMode === "userId") setSearchInput("");
            }}
          >
            User ID: {filters.userId}
          </Chip>
        )}
        {filters.chatId && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              setFilters((prev) => ({ ...prev, chatId: "" }));
              if (searchMode === "chatId") setSearchInput("");
            }}
          >
            Chat ID: {filters.chatId}
          </Chip>
        )}
      </div>

      <div className="">
        <Table
          aria-label="Telegram Users Table"
          selectionMode="none"
          isHeaderSticky
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} align={"start"}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={users}
            isLoading={loading}
            loadingContent={<Spinner size="md" />}
            emptyContent={!loading && "No telegram users found."}
          >
            {(user) => (
              <TableRow key={user._id}>
                <TableCell>{user.userId}</TableCell>
                <TableCell>{user.username || "-"}</TableCell>
                <TableCell>{user.chatId}</TableCell>
                <TableCell>
                  {user.registeredUsernames?.length > 0
                    ? user.registeredUsernames.join(", ")
                    : "-"}
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>{formatDate(user.updatedAt)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex justify-between items-center mt-4">
        <div>
          <span className="text-sm text-gray-700">
            {total > 0
              ? `Showing ${(page - 1) * rowsPerPage + 1} to ${Math.min(
                  page * rowsPerPage,
                  total
                )} of ${total} results`
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
}
