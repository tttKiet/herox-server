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
  Tooltip,
} from "@heroui/react";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import { chatService, IChatWithAdmin, IFilterChat } from "@/api/chat";
import { getNimorKey } from "@/hook";

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

const columns = [
  { name: "User Message", uid: "userMessage" },
  { name: "AI Response", uid: "aiContent" },
  { name: "Member", uid: "memberId" },
  { name: "Status", uid: "status" },
  { name: "Created At", uid: "createdAt" },
];

export default function TableChatManager() {
  const [chats, setChats] = useState<IChatWithAdmin[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [filterMemberId, setFilterMemberId] = useState<string>("");
  const [filterUserMessage, setFilterUserMessage] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [memberList, setMemberList] = useState<
    { key: string; label: string }[]
  >([]);

  // Apply debounce to the search input with 500ms delay
  const debouncedSearchValue = useDebounce(filterUserMessage, 500);

  // Fetch members for filter dropdown
  const fetchMembers = useCallback(async () => {
    // This would ideally be an API call to get all members/admins
    // For now, we'll populate it from the chat data we get
    try {
      const apiKey = getNimorKey();
      if (!apiKey) return;

      const res = await chatService.getChats({
        apiKey,
        page: 1,
        limit: 100, // Get a large sample to extract member data
      });

      if (res && res.ok && Array.isArray(res.data)) {
        // Extract unique members from chat data
        const uniqueMembers = new Map();

        res.data.forEach((chat) => {
          if (chat.admin && chat.admin._id && chat.admin.fullName) {
            uniqueMembers.set(chat.admin._id, {
              key: chat.admin._id,
              label: chat.admin.fullName,
            });
          }
        });

        setMemberList(Array.from(uniqueMembers.values()));
      }
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  }, []);

  // Main fetch function for chats
  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      const apiKey = getNimorKey();
      if (!apiKey) return;

      const filter: Partial<IFilterChat> = {};
      if (filterMemberId) filter.memberId = filterMemberId;
      if (debouncedSearchValue) filter.userMessage = debouncedSearchValue;
      if (
        filterStatus &&
        ["pending", "error", "success"].includes(filterStatus)
      ) {
        filter.status = filterStatus as "pending" | "error" | "success";
      }
      if (filterStartDate) filter.startDate = filterStartDate;
      if (filterEndDate) filter.endDate = filterEndDate;

      const res = await chatService.getChats({
        apiKey,
        filter: Object.keys(filter).length ? filter : undefined,
        page,
        limit: rowsPerPage,
      });

      if (res && res.ok && Array.isArray(res.data)) {
        setChats(res.data);

        // Update pagination state
        if (res.pagination) {
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
        } else {
          // Fallback if server doesn't provide pagination info
          setTotal(res.data.length);
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    } finally {
      setLoading(false);
    }
  }, [
    filterMemberId,
    debouncedSearchValue, // Using debounced value instead of direct state
    filterStatus,
    filterStartDate,
    filterEndDate,
    page,
    rowsPerPage,
  ]);

  useEffect(() => {
    fetchMembers();
    fetchChats();
  }, [fetchMembers, fetchChats]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    // Format: HH:MM:SS DD/MM/YYYY
    const date = new Date(dateString);
    const time = date.toLocaleTimeString();
    const day = date.toLocaleDateString();
    return `${time} ${day}`;
  };

  const getStatusColor = (
    status: string
  ): "success" | "danger" | "warning" | "default" => {
    switch (status) {
      case "success":
        return "success";
      case "error":
        return "danger";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const truncateText = (text: string | undefined, maxLength: number = 100) => {
    if (!text) return { content: "-", isTruncated: false };
    const isTruncated = text.length > maxLength;
    const content = isTruncated ? `${text.substring(0, maxLength)}...` : text;
    return { content, isTruncated, fullContent: text };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex gap-4 flex-wrap">
          {/* Member Filter */}
          <Select
            size="md"
            labelPlacement="outside"
            defaultSelectedKeys={[""]}
            placeholder="All Members"
            className="w-48"
            selectedKeys={filterMemberId ? [filterMemberId] : [""]}
            onSelectionChange={(keys) => {
              setFilterMemberId((Array.from(keys)[0] as string) || "");
              setPage(1); // Reset to page 1 when changing filters
            }}
            renderValue={(items) => {
              return items.length === 0 ||
                (items.length === 1 && !items[0].key) ? (
                <div className="flex items-center gap-2">All Members</div>
              ) : (
                items.map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    {item.textValue || item.key}
                  </div>
                ))
              );
            }}
          >
            <>
              <SelectItem key="" textValue="All Members">
                All Members
              </SelectItem>
              {memberList.map((member) => (
                <SelectItem key={member.key} textValue={member.label}>
                  {member.label}
                </SelectItem>
              ))}
            </>
          </Select>

          {/* Status Filter */}
          <Select
            size="md"
            labelPlacement="outside"
            defaultSelectedKeys={[""]}
            placeholder="All Statuses"
            className="w-40"
            selectedKeys={filterStatus ? [filterStatus] : [""]}
            onSelectionChange={(keys) => {
              setFilterStatus((Array.from(keys)[0] as string) || "");
              setPage(1); // Reset to page 1 when changing filters
            }}
          >
            <>
              <SelectItem key="" textValue="All Statuses">
                All Statuses
              </SelectItem>
              <SelectItem key="success" textValue="Success">
                <Chip color="success" size="sm" variant="flat">
                  Success
                </Chip>
              </SelectItem>
              <SelectItem key="error" textValue="Error">
                <Chip color="danger" size="sm" variant="flat">
                  Error
                </Chip>
              </SelectItem>
              <SelectItem key="pending" textValue="Pending">
                <Chip color="warning" size="sm" variant="flat">
                  Pending
                </Chip>
              </SelectItem>
            </>
          </Select>

          {/* Date Filter */}
          <div className="flex gap-2 items-center">
            <div className="flex items-center">
              <HiOutlineCalendarDays className="text-gray-500 mr-2" />
              <Input
                size="md"
                type="date"
                placeholder="From date"
                value={filterStartDate}
                onValueChange={(value) => {
                  setFilterStartDate(value);
                  setPage(1);
                }}
                className="w-32"
              />
            </div>
            <span className="text-gray-500">to</span>
            <Input
              size="md"
              type="date"
              placeholder="To date"
              value={filterEndDate}
              onValueChange={(value) => {
                setFilterEndDate(value);
                setPage(1);
              }}
              className="w-32"
            />
          </div>
        </div>

        {/* Message Search */}
        <div className="flex-1 max-w-md ml-4">
          <Input
            size="md"
            placeholder="Search in messages & responses..."
            value={filterUserMessage}
            startContent={
              <HiOutlineMagnifyingGlass className="text-gray-400" />
            }
            onValueChange={(value) => {
              setFilterUserMessage(value);
              setPage(1); // Reset to page 1 when changing search
            }}
            className="w-full"
          />
          {loading && filterUserMessage && (
            <div className="text-xs text-gray-500 mt-1 ml-1">
              Searching in both user messages and AI responses...
            </div>
          )}
        </div>
      </div>

      <Table
        aria-label="Chats table"
        selectionMode="none" // No selection needed as per requirements
        isHeaderSticky
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={
                column.uid === "userMessage" || column.uid === "aiContent"
                  ? "start"
                  : "center"
              }
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>

        <TableBody
          items={chats}
          isLoading={loading}
          loadingContent={<Spinner size="md"></Spinner>}
          emptyContent={!loading && "No chats found"}
        >
          {(chat) => (
            <TableRow key={chat._id}>
              <TableCell className="max-w-[300px]">
                {(() => {
                  const { content, isTruncated, fullContent } = truncateText(
                    chat.userMessage,
                    80
                  );
                  return isTruncated ? (
                    <Tooltip
                      content={fullContent}
                      color="foreground"
                      placement="bottom"
                      className="max-w-md whitespace-normal"
                    >
                      <div className="font-medium cursor-help">{content}</div>
                    </Tooltip>
                  ) : (
                    <div className="font-medium">{content}</div>
                  );
                })()}
              </TableCell>
              <TableCell className="max-w-[300px]">
                {(() => {
                  const { content, isTruncated, fullContent } = truncateText(
                    chat.aiContent,
                    80
                  );
                  return isTruncated ? (
                    <Tooltip
                      content={fullContent}
                      color="foreground"
                      placement="bottom"
                      className="max-w-md whitespace-normal"
                    >
                      <div className="cursor-help">{content}</div>
                    </Tooltip>
                  ) : (
                    <div>{content}</div>
                  );
                })()}
              </TableCell>
              <TableCell align="center">
                {chat.admin ? (
                  <div className="text-center">
                    <div className="font-medium">{chat.admin.fullName}</div>
                  </div>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </TableCell>
              <TableCell align="center">
                <Chip
                  color={getStatusColor(chat.status)}
                  variant="flat"
                  size="sm"
                >
                  {chat.status}
                </Chip>
              </TableCell>
              <TableCell align="center">{formatDate(chat.createdAt)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
