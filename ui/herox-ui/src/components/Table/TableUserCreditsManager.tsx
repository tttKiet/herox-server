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
import { getNimorKey } from "@/hook";
import { IInteractXUserCredit } from "@/api/userCredits";
import { userCreditsService } from "@/api/userCredits.service";

// Define columns for the table
const columns = [
  { name: "Telegram User ID", uid: "telegramUserId" },
  { name: "X Username", uid: "xUsername" },
  { name: "Available Credits", uid: "availableCredits" },
  { name: "Total Earned", uid: "totalEarnedCredits" },
  { name: "Total Used", uid: "totalUsedCredits" },
  { name: "Last Task ID", uid: "lastTaskId" },
  { name: "Created At", uid: "createdAt" },
  { name: "Updated At", uid: "updatedAt" },
];

const TableUserCreditsManager: React.FC = () => {
  // States
  const [userCredits, setUserCredits] = useState<IInteractXUserCredit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [telegramUserIdInput, setTelegramUserIdInput] = useState<string>("");
  const [xUsernameInput, setXUsernameInput] = useState<string>("");
  const [filters, setFilters] = useState({
    telegramUserId: "",
    xUsername: "",
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

  // Function to fetch user credits
  const fetchUserCredits = useCallback(async () => {
    if (!apiKey) {
      toast.error("API key not found. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const filter = {
        ...(filters.telegramUserId && {
          telegramUserId: filters.telegramUserId,
        }),
        ...(filters.xUsername && { xUsername: filters.xUsername }),
      };

      const response = await userCreditsService.getUserCredits({
        apiKey,
        filter,
        page,
        limit: rowsPerPage,
      });

      if (response.ok) {
        setUserCredits(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error fetching user credits:", error);
      toast.error("Failed to fetch user credits data");
    } finally {
      setLoading(false);
    }
  }, [apiKey, page, rowsPerPage, filters]);

  // Initial fetch on component mount and when filters or pagination changes
  useEffect(() => {
    fetchUserCredits();
  }, [fetchUserCredits]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex gap-4 flex-wrap items-center">
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
      </div>{" "}
      <div className="">
        <Table
          aria-label="User Credits Table"
          selectionMode="none"
          isHeaderSticky={false}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid}>{column.name}</TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={userCredits}
            isLoading={loading}
            loadingContent={<Spinner size="md" />}
            emptyContent={!loading && "No user credits found."}
          >
            {(credit) => (
              <TableRow key={credit._id}>
                <TableCell>{credit.telegramUserId || "-"}</TableCell>
                <TableCell>{credit.xUsername || "-"}</TableCell>
                <TableCell>{credit.availableCredits || 0}</TableCell>
                <TableCell>{credit.totalEarnedCredits || 0}</TableCell>
                <TableCell>{credit.totalUsedCredits || 0}</TableCell>
                <TableCell>{credit.lastTaskId || "-"}</TableCell>
                <TableCell>{formatDate(credit.createdAt)}</TableCell>
                <TableCell>{formatDate(credit.updatedAt)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
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

export default TableUserCreditsManager;
