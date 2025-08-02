"use client";

import { apiKeyService } from "@/api/api-keys";

import { DeleteIcon } from "@/utils/icons";
import { TiPlus } from "react-icons/ti";
import { notificationFetch } from "@/utils";
import { toast } from "react-toastify";
import type { IApiKey, IFilterApiKey } from "@/api/api-keys";
import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
  Select,
  SelectItem,
  Input,
  Pagination,
  Spinner,
  Textarea,
} from "@heroui/react";
import React, { useCallback, useEffect, useState } from "react";
import ModalCustom from "../Modal/Modal";
import ModalConfirm from "../Modal/ModalConfirm";

const columns = [
  { name: "Name", uid: "name" },
  { name: "API Key", uid: "apiKey" },
  { name: "Status", uid: "status" },
  { name: "Created At", uid: "createdAt" },
  { name: "Actions", uid: "actions" },
];

// Status badge colors
const statusColorMap = {
  active: "success",
  inactive: "default",
  rate_limited: "warning",
  expired: "danger",
  error: "danger",
};

// Mask API key for security
const maskApiKey = (key: string) => {
  if (!key) return "";
  if (key.length <= 8) return "*".repeat(key.length);
  return `${key.substring(0, 4)}${"*".repeat(key.length - 8)}${key.substring(
    key.length - 4
  )}`;
};

export default function TableApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<IApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedKeys, setSelectedKeys] = useState(new Set<string>());

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  // API keys input state
  const [apiKeysText, setApiKeysText] = useState("");

  // Modal confirm delete
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Fetch API keys with filters
  const fetchApiKeys = useCallback(async () => {
    setLoading(true);
    try {
      const filter: Partial<IFilterApiKey> = {};

      if (statusFilter !== "all") {
        filter.status = statusFilter as
          | "active"
          | "inactive"
          | "rate_limited"
          | "expired"
          | "error";
      }

      if (searchText) {
        filter.search = searchText;
      }

      const response = await apiKeyService.getApiKeys({
        page,
        limit: rowsPerPage,
        filter: Object.keys(filter).length ? filter : undefined,
      });

      if (!response.ok) {
        toast.error("Failed to load API keys");
        return;
      }

      setApiKeys(response.data?.keys || []);
      setTotal(response.data?.pagination?.total || 0);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, searchText]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  // Add API key handler
  const handleAddApiKey = async () => {
    if (!apiKeysText.trim()) {
      toast.error("Please enter API keys");
      return;
    }

    await notificationFetch({
      promiseRunner: apiKeyService.createApiKeys(apiKeysText),
    });

    setApiKeysText("");
    onClose();
    fetchApiKeys();
  };

  // Delete selected API keys
  const handleDeleteSelected = async () => {
    if (selectedKeys.size === 0) return;

    await notificationFetch({
      promiseRunner: apiKeyService.deleteApiKeys(Array.from(selectedKeys)),
    });

    setSelectedKeys(new Set());
    onConfirmClose();
    fetchApiKeys();
  };

  // Open confirm modal
  const onConfirmOpen = useCallback(() => {
    setIsConfirmOpen(true);
  }, []);

  // Close confirm modal
  const onConfirmClose = () => {
    setIsConfirmOpen(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  // Render cell content based on column
  const renderCell = useCallback(
    (apiKey: IApiKey, columnKey: string) => {
      switch (columnKey) {
        case "name":
          return <div className="font-medium">{apiKey.name || "Unnamed"}</div>;
        case "apiKey":
          return (
            <div className="font-mono text-sm">{maskApiKey(apiKey.apiKey)}</div>
          );
        case "status":
          return (
            <Chip
              color={
                statusColorMap[apiKey.status as keyof typeof statusColorMap] as
                  | "success"
                  | "default"
                  | "warning"
                  | "danger"
                  | undefined
              }
              variant="flat"
              size="sm"
            >
              {apiKey.status.replace("_", " ")}
            </Chip>
          );
        case "createdAt":
          return <div>{formatDate(apiKey.createdAt)}</div>;
        case "actions":
          return (
            <div className="flex gap-2">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => {
                  setSelectedKeys(new Set([apiKey._id]));
                  onConfirmOpen();
                }}
              >
                <DeleteIcon className="text-[18px]" />
              </Button>
            </div>
          );
        default:
          return <div>-</div>;
      }
    },
    [onConfirmOpen]
  );

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-center">
          <div className="flex gap-3">
            <Select
              placeholder="Filter by status"
              className="max-w-xs"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <SelectItem key="all" textValue="All Statuses">
                All Statuses
              </SelectItem>
              <SelectItem key="active" textValue="Active">
                Active
              </SelectItem>
              <SelectItem key="inactive" textValue="Inactive">
                Inactive
              </SelectItem>
              <SelectItem key="rate_limited" textValue="Rate Limited">
                Rate Limited
              </SelectItem>
              <SelectItem key="expired" textValue="Expired">
                Expired
              </SelectItem>
              <SelectItem key="error" textValue="Error">
                Error
              </SelectItem>
            </Select>

            <Input
              placeholder="Search API keys..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              className="max-w-xs"
            />
          </div>

          <div className="flex gap-3">
            {selectedKeys.size > 0 && (
              <Button
                color="danger"
                variant="light"
                startContent={<DeleteIcon className="text-[18px]" />}
                onPress={onConfirmOpen}
              >
                Delete Selected ({selectedKeys.size})
              </Button>
            )}
            <Button color="primary" startContent={<TiPlus />} onPress={onOpen}>
              Add API Keys
            </Button>
          </div>
        </div>

        <Table
          aria-label="API Keys table"
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => {
            // Handle different selection types with proper type checking
            if (typeof keys === "string") {
              if (keys === "all") {
                setSelectedKeys(new Set(apiKeys.map((key) => key._id)));
              } else {
                // For "none" or any other string values
                setSelectedKeys(new Set());
              }
            } else if (keys instanceof Set) {
              // Convert keys to string[] before creating a new Set
              setSelectedKeys(
                new Set(Array.from(keys).map((key) => String(key)))
              );
            }
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} align="start">
                {column.name}
              </TableColumn>
            )}
          </TableHeader>

          <TableBody
            items={apiKeys}
            isLoading={loading}
            loadingContent={<Spinner size="md"></Spinner>}
            emptyContent={!loading && "No API keys found"}
          >
            {(item) => (
              <TableRow key={item._id}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey as string)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination controls */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">
            {total > 0
              ? `Showing ${(page - 1) * rowsPerPage + 1} to ${Math.min(
                  page * rowsPerPage,
                  total
                )} of ${total} results`
              : "No results found"}
          </span>

          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            showControls
          />
        </div>
      </div>

      {/* Modal for adding API keys */}
      <ModalCustom isOpen={isOpen} onClose={onClose} title="Add API Keys">
        <div className="mt-1">
          <p className="mb-2 text-sm text-gray-600">
            Enter API keys in one of these formats:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mb-4">
            <li>name1 apikey1</li>
            <li>name2 apikey2</li>
            <li>or just apikey1 (name will be auto-generated)</li>
          </ul>
          <Textarea
            minRows={5}
            label="API Keys"
            placeholder="Enter API keys here..."
            value={apiKeysText}
            isRequired
            onChange={(e) => setApiKeysText(e.target.value)}
            className="w-full"
          />

          <div className="flex gap-3 justify-end mt-6 mb-4">
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleAddApiKey}>
              Add API Keys
            </Button>
          </div>
        </div>
      </ModalCustom>

      {/* Confirm delete modal */}
      <ModalConfirm
        isOpen={isConfirmOpen}
        onCancel={onConfirmClose}
        title="Delete API Keys"
        description={`Are you sure you want to delete ${selectedKeys.size} selected API key(s)?`}
        onConfirm={handleDeleteSelected}
      />
    </>
  );
}
