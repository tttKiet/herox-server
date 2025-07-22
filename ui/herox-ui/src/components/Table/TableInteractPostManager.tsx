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
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import {
  interactPostService,
  IInteractPost,
  IFilterInteractPost,
} from "@/api/interact-post";
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
  { name: "Author", uid: "authorUsername" },
  { name: "Target", uid: "targetUsername" },
  { name: "Post ID", uid: "postId" },
  { name: "Action", uid: "action" },
  { name: "Created At", uid: "createdAt" },
];

export default function TableInteractPostManager() {
  const [posts, setPosts] = useState<IInteractPost[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [filterSearch, setFilterSearch] = useState<string>("");
  const [userSearchText, setUserSearchText] = useState<string>("");
  const [userSearchMode, setUserSearchMode] = useState<"author" | "target">(
    "author"
  );
  // We don't need these state variables anymore

  // Apply debounce to the search inputs with 500ms delay
  const debouncedSearchValue = useDebounce(filterSearch, 500);
  const debouncedUserSearchValue = useDebounce(userSearchText, 500);

  // This function has been removed as it's no longer needed

  // Main fetch function for interact posts
  const fetchInteractPosts = useCallback(async () => {
    setLoading(true);
    try {
      const apiKey = getNimorKey();
      if (!apiKey) return;

      const filter: IFilterInteractPost = {};
      if (debouncedSearchValue) filter.search = debouncedSearchValue;

      // Apply user search filter based on selected mode
      if (debouncedUserSearchValue) {
        if (userSearchMode === "author") {
          filter.authorUsername = debouncedUserSearchValue;
        } else {
          filter.targetUsername = debouncedUserSearchValue;
        }
      }

      const res = await interactPostService.getInteractPosts({
        apiKey,
        filter: Object.keys(filter).length ? filter : undefined,
        page,
        limit: rowsPerPage,
      });

      if (res && res.ok && Array.isArray(res.data)) {
        setPosts(res.data);

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
      console.error("Error fetching interact posts:", err);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearchValue,
    debouncedUserSearchValue,
    userSearchMode,
    page,
    rowsPerPage,
  ]);

  useEffect(() => {
    fetchInteractPosts();
  }, [fetchInteractPosts]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    // Format: HH:MM:SS DD/MM/YYYY
    const date = new Date(dateString);
    const time = date.toLocaleTimeString();
    const day = date.toLocaleDateString();
    return `${time} ${day}`;
  };

  const getActionColor = (
    action: string | null
  ): "success" | "danger" | "warning" | "default" | "primary" => {
    if (!action) return "default";

    switch (action.toLowerCase()) {
      case "like":
      case "retweet":
      case "reply":
        return "success";
      case "follow":
        return "primary";
      case "quote":
        return "warning";
      default:
        return "default";
    }
  };

  const formatPostLink = (postId: string, authorUsername: string) => {
    if (!postId || !authorUsername) return "";
    return `https://x.com/${authorUsername}/status/${postId}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex gap-4 flex-wrap">
          {/* Combined Author/Target Filter */}
          <div className="flex gap-2">
            <Input
              size="md"
              placeholder="Search by username"
              value={userSearchText}
              startContent={
                <HiOutlineMagnifyingGlass className="text-gray-400" />
              }
              onValueChange={(value) => {
                setUserSearchText(value);
                setPage(1); // Reset to page 1 when changing search
              }}
              className="w-48"
            />
            <Select
              size="md"
              defaultSelectedKeys={["author"]}
              selectedKeys={[userSearchMode]}
              onSelectionChange={(keys) => {
                setUserSearchMode(
                  (Array.from(keys)[0] as "author" | "target") || "author"
                );
                setPage(1);
              }}
              className="w-32"
            >
              <SelectItem key="author">Author</SelectItem>
              <SelectItem key="target">Target</SelectItem>
            </Select>
          </div>
        </div>

        {/* Post ID or URL Search */}
        <div className="flex-1 max-w-md ml-4">
          <Input
            size="md"
            placeholder="Search by Post ID or URL..."
            value={filterSearch}
            startContent={
              <HiOutlineMagnifyingGlass className="text-gray-400" />
            }
            onValueChange={(value) => {
              setFilterSearch(value);
              setPage(1); // Reset to page 1 when changing search
            }}
            className="w-full"
          />
          {loading && filterSearch && (
            <div className="text-xs text-gray-500 mt-1 ml-1">
              Searching in post IDs and URLs...
            </div>
          )}
        </div>
      </div>

      <Table
        aria-label="Interact Posts table"
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
          items={posts}
          isLoading={loading}
          loadingContent={<Spinner size="md"></Spinner>}
          emptyContent={!loading && "No interact posts found"}
        >
          {(post) => (
            <TableRow key={post._id}>
              <TableCell>
                <div className="font-medium">
                  <Tooltip
                    content="Open profile"
                    placement="bottom"
                    color="foreground"
                  >
                    <a
                      href={`https://x.com/${post.authorUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-primary hover:underline cursor-pointer border-b border-dashed border-gray-300"
                    >
                      {post.authorUsername}
                    </a>
                  </Tooltip>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  <Tooltip
                    content="Open profile"
                    placement="bottom"
                    color="foreground"
                  >
                    <a
                      href={`https://x.com/${post.targetUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-primary hover:underline cursor-pointer border-b border-dashed border-gray-300"
                    >
                      {post.targetUsername}
                    </a>
                  </Tooltip>
                </div>
              </TableCell>
              <TableCell align="center">
                <Tooltip
                  content="Click to open post"
                  placement="bottom"
                  color="foreground"
                >
                  <a
                    href={formatPostLink(post.postId, post.authorUsername)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-primary hover:underline cursor-pointer border-b border-dashed border-gray-300"
                  >
                    {post.postId}
                  </a>
                </Tooltip>
              </TableCell>
              <TableCell align="center">
                {post.action ? (
                  <Chip
                    color={getActionColor(post.action)}
                    variant="flat"
                    size="sm"
                    className="capitalize"
                  >
                    {post.action}
                  </Chip>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </TableCell>
              <TableCell align="center">{formatDate(post.createdAt)}</TableCell>
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
