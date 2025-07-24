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
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DatePicker,
} from "@heroui/react";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineUsers,
  HiOutlineClipboardDocument,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import { parseAbsolute, type ZonedDateTime } from "@internationalized/date";

// Hàm trợ giúp để chuyển đổi từ chuỗi ISO sang đối tượng ZonedDateTime
const isoStringToCalendarDate = (isoString: string | null | undefined) => {
  if (!isoString || isoString === "") return null;
  try {
    return parseAbsolute(isoString, "Asia/Bangkok"); // Using Bangkok timezone (GMT+7)
  } catch (error) {
    console.error("Error converting ISO to ZonedDateTime:", error);
    return null;
  }
};

// Hàm trợ giúp để chuyển đổi từ ZonedDateTime sang chuỗi ISO
const calendarDateToIsoString = (date: ZonedDateTime | null | undefined) => {
  if (!date) return "";
  try {
    // Chuyển ZonedDateTime thành JavaScript Date và lấy ISO string
    const jsDate = date.toDate();
    return jsDate.toISOString();
  } catch (error) {
    console.error("Error converting ZonedDateTime to ISO:", error);
    return "";
  }
};
import {
  interactPostService,
  IInteractPost,
  IFilterInteractPost,
} from "@/api/interact-post";
import { getNimorKey } from "@/hook";
import { toast } from "react-toastify";

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
  { name: "Comment ID", uid: "commentId" },
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

  // New filter states
  const [isUsernameModalOpen, setIsUsernameModalOpen] =
    useState<boolean>(false);
  const [usernameList, setUsernameList] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

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

      // Apply username list filter
      if (usernameList.trim()) {
        if (userSearchMode === "author") {
          filter.authorUsernames = usernameList;
        } else {
          filter.targetUsernames = usernameList;
        }
      }

      // Apply date filters with validation
      if (fromDate) {
        try {
          // Kiểm tra xem fromDate có phải là chuỗi ISO date hợp lệ không
          const dateObj = new Date(fromDate);
          if (!isNaN(dateObj.getTime())) {
            filter.fromDate = fromDate;
            console.log("Frontend sending fromDate:", fromDate);
          } else {
            console.error("Invalid fromDate format:", fromDate);
          }
        } catch (error) {
          console.error("Error processing fromDate:", error);
        }
      }

      if (toDate) {
        try {
          // Kiểm tra xem toDate có phải là chuỗi ISO date hợp lệ không
          const dateObj = new Date(toDate);
          if (!isNaN(dateObj.getTime())) {
            filter.toDate = toDate;
            console.log("Frontend sending toDate:", toDate);
          } else {
            console.error("Invalid toDate format:", toDate);
          }
        } catch (error) {
          console.error("Error processing toDate:", error);
        }
      }

      // Debug message for all filters
      console.log("All filters being sent:", JSON.stringify(filter));
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
    usernameList,
    fromDate,
    toDate,
    page,
    rowsPerPage,
  ]);

  useEffect(() => {
    fetchInteractPosts();
  }, [fetchInteractPosts]);

  // Effect để ghi log khi fromDate hoặc toDate thay đổi
  useEffect(() => {
    console.log("fromDate state:", fromDate);
  }, [fromDate]);

  useEffect(() => {
    console.log("toDate state:", toDate);
  }, [toDate]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    // Format: HH:MM:SS DD/MM/YYYY
    const date = new Date(dateString);
    const time = date.toLocaleTimeString();
    const day = date.toLocaleDateString();
    return `${time} ${day}`;
  };

  const formatPostLink = (postId: string, authorUsername: string) => {
    if (!postId || !authorUsername) return "";
    return `https://x.com/${authorUsername}/status/${postId}`;
  };

  const formatCommentLink = (
    postId: string,
    commentId: string,
    authorUsername: string
  ) => {
    if (!commentId || !authorUsername) return "";
    // For comment links on X, the commentId is actually the status ID of the comment
    return `https://x.com/${authorUsername}/status/${commentId}`;
  };

  // Function to copy selected column data to clipboard
  const copyToClipboard = (columnType: string) => {
    if (posts.length === 0) {
      toast.info("No data to copy", {
        position: "bottom-right",
        autoClose: 2000,
      });
      return;
    }

    let textToCopy = "";

    posts.forEach((post) => {
      switch (columnType) {
        case "postId":
          if (post.postId) {
            textToCopy +=
              formatPostLink(post.postId, post.authorUsername) + "\n";
          }
          break;
        case "commentId":
          if (post.commentId) {
            textToCopy +=
              formatCommentLink(
                post.postId,
                post.commentId,
                post.authorUsername
              ) + "\n";
          }
          break;
        case "authorUsername":
          textToCopy += post.authorUsername + "\n";
          break;
        case "targetUsername":
          textToCopy += post.targetUsername + "\n";
          break;
      }
    });

    navigator.clipboard.writeText(textToCopy).then(
      () => {
        toast.success("Copied to clipboard!", {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast.error("Failed to copy to clipboard", {
          position: "bottom-right",
          autoClose: 2000,
        });
      }
    );
  };

  // Function to export data to a text file
  const exportToTxtFile = (columnType: string) => {
    if (posts.length === 0) {
      toast.info("No data to export", {
        position: "bottom-right",
        autoClose: 2000,
      });
      return;
    }

    let textToExport = "";

    posts.forEach((post) => {
      switch (columnType) {
        case "postId":
          if (post.postId) {
            textToExport +=
              formatPostLink(post.postId, post.authorUsername) + "\n";
          }
          break;
        case "commentId":
          if (post.commentId) {
            textToExport +=
              formatCommentLink(
                post.postId,
                post.commentId,
                post.authorUsername
              ) + "\n";
          }
          break;
        case "authorUsername":
          textToExport += post.authorUsername + "\n";
          break;
        case "targetUsername":
          textToExport += post.targetUsername + "\n";
          break;
      }
    });

    const blob = new Blob([textToExport], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${columnType}_export_${new Date()
      .toISOString()
      .slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success toast notification
    toast.success("File exported successfully!", {
      position: "bottom-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  // Username list modal
  const UsernameListModal = () => {
    // Create a local state for the textarea to prevent modal from reopening
    const [localUsernameList, setLocalUsernameList] = useState(usernameList);

    // Update local state when modal opens
    useEffect(() => {
      if (isUsernameModalOpen) {
        setLocalUsernameList(usernameList);
      }
    }, []);

    const handleApplyFilter = () => {
      setUsernameList(localUsernameList);
      setIsUsernameModalOpen(false);
      setPage(1); // Reset to first page
    };

    return (
      <Modal
        isOpen={isUsernameModalOpen}
        onClose={() => setIsUsernameModalOpen(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>Filter by Username List</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm mb-2">Enter one username per line:</p>
                <Textarea
                  placeholder="Example: Enter each username on a separate line"
                  value={localUsernameList}
                  onValueChange={setLocalUsernameList}
                  rows={16}
                  classNames={{
                    input: "resize-y min-h-[280px]",
                  }}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Format: username1, username2, username3... (each on new line)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Applying filter to{" "}
                  <strong>
                    {userSearchMode === "author" ? "Authors" : "Targets"}
                  </strong>{" "}
                  based on selected filter mode.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setIsUsernameModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleApplyFilter}
              className="mb-2"
            >
              Apply Filter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  // No additional helper functions needed

  return (
    <div>
      <UsernameListModal />

      <div className="flex justify-between items-center flex-wrap gap-6 mb-6">
        <div className="flex gap-4 flex-wrap items-center">
          {/* Combined Author/Target Filter */}
          <div className="flex items-center gap-6">
            <Input
              size="md"
              label="Username"
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

            <span> | </span>

            {/* Username List Button */}
            <Button
              size="md"
              color="default"
              startContent={<HiOutlineUsers />}
              onPress={() => setIsUsernameModalOpen(true)}
            >
              Filter username by list
            </Button>

            <Select
              size="md"
              label="Filter type"
              aria-label="Filter by author or target"
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
          {/* Date Filter Controls */}
          <span> | </span>
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <DatePicker
                  aria-label="From date"
                  id="from-date-input"
                  label="From date"
                  className="min-w-[240px]"
                  granularity="second"
                  value={
                    fromDate ? isoStringToCalendarDate(fromDate) : undefined
                  }
                  onChange={(date) => {
                    try {
                      if (date) {
                        const isoString = calendarDateToIsoString(date);
                        console.log("From date changed:", isoString);
                        setFromDate(isoString);
                        setPage(1);
                      } else {
                        console.log("From date cleared");
                        setFromDate("");
                        setPage(1);
                      }
                    } catch (error) {
                      console.error("Error setting date:", error);
                    }
                  }}
                  key={`from-date-picker-${fromDate}`} // Force re-render when fromDate changes
                  endContent={
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      onPress={() => {
                        try {
                          // Sử dụng thời gian hiện tại của máy
                          const now = new Date();
                          const isoString = now.toISOString();

                          if (!isNaN(now.getTime())) {
                            console.log(
                              "Setting fromDate with current time:",
                              isoString
                            );
                            setFromDate(isoString);
                            setPage(1);
                          }
                        } catch (error) {
                          console.error("Error setting current date:", error);
                        }
                      }}
                      className="px-1"
                    >
                      Now
                    </Button>
                  }
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <DatePicker
                  aria-label="To date"
                  id="to-date-input"
                  label="To date"
                  className="min-w-[240px]"
                  granularity="second"
                  value={toDate ? isoStringToCalendarDate(toDate) : undefined}
                  onChange={(date) => {
                    try {
                      if (date) {
                        const isoString = calendarDateToIsoString(date);
                        console.log("To date changed:", isoString);
                        setToDate(isoString);
                        setPage(1);
                      } else {
                        console.log("To date cleared");
                        setToDate("");
                        setPage(1);
                      }
                    } catch (error) {
                      console.error("Error setting date:", error);
                    }
                  }}
                  key={`to-date-picker-${toDate}`} // Force re-render when toDate changes
                  endContent={
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      onPress={() => {
                        try {
                          // Sử dụng thời gian hiện tại của máy
                          const now = new Date();
                          const isoString = now.toISOString();

                          if (!isNaN(now.getTime())) {
                            console.log(
                              "Setting toDate with current time:",
                              isoString
                            );
                            setToDate(isoString);
                            setPage(1);
                          }
                        } catch (error) {
                          console.error("Error setting current date:", error);
                        }
                      }}
                      className="px-1"
                    >
                      Now
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Post ID or URL Search */}
        <div className="flex-1 max-w-md ml-4">
          <Input
            size="md"
            label="Search"
            placeholder="Search by Post/Comment ID or URL..."
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
              Searching in IDs and URLs...
            </div>
          )}
        </div>
      </div>

      {/* Export Buttons */}
      {/* Active Filters Display */}
      <div className="flex flex-wrap gap-2 mb-3">
        {usernameList.trim() && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => setUsernameList("")}
          >
            {userSearchMode === "author" ? "Authors" : "Targets"} List:{" "}
            {usernameList.trim().split("\n").length} usernames
          </Chip>
        )}

        {fromDate && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              // Force DatePicker to update by triggering its value change
              const fromDateInput = document.getElementById("from-date-input");
              if (fromDateInput) {
                // Reset the value on the DatePicker if possible
                const datePickerResetEvent = new Event("reset", {
                  bubbles: true,
                });
                fromDateInput.dispatchEvent(datePickerResetEvent);
              }
              setFromDate(""); // Xóa state fromDate
              setPage(1); // Reset lại trang
              // Refetch data after state update
              setTimeout(() => fetchInteractPosts(), 0);
            }}
          >
            From: {new Date(fromDate).toLocaleString()}
          </Chip>
        )}

        {toDate && (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            onClose={() => {
              // Force DatePicker to update by triggering its value change
              const toDateInput = document.getElementById("to-date-input");
              if (toDateInput) {
                // Reset the value on the DatePicker if possible
                const datePickerResetEvent = new Event("reset", {
                  bubbles: true,
                });
                toDateInput.dispatchEvent(datePickerResetEvent);
              }
              setToDate(""); // Xóa state toDate
              setPage(1); // Reset lại trang
              // Refetch data after state update
              setTimeout(() => fetchInteractPosts(), 0);
            }}
          >
            To: {new Date(toDate).toLocaleString()}
          </Chip>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <Dropdown>
          <DropdownTrigger>
            <Button size="sm" startContent={<HiOutlineClipboardDocument />}>
              Copy to Clipboard
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Copy options">
            <DropdownItem key="post" onPress={() => copyToClipboard("postId")}>
              Copy Post Links
            </DropdownItem>
            <DropdownItem
              key="comment"
              onPress={() => copyToClipboard("commentId")}
            >
              Copy Comment Links
            </DropdownItem>
            <DropdownItem
              key="author"
              onPress={() => copyToClipboard("authorUsername")}
            >
              Copy Author Usernames
            </DropdownItem>
            <DropdownItem
              key="target"
              onPress={() => copyToClipboard("targetUsername")}
            >
              Copy Target Usernames
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger>
            <Button size="sm" startContent={<HiOutlineDocumentText />}>
              Export to File
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Export options">
            <DropdownItem key="post" onPress={() => exportToTxtFile("postId")}>
              Export Post Links
            </DropdownItem>
            <DropdownItem
              key="comment"
              onPress={() => exportToTxtFile("commentId")}
            >
              Export Comment Links
            </DropdownItem>
            <DropdownItem
              key="author"
              onPress={() => exportToTxtFile("authorUsername")}
            >
              Export Author Usernames
            </DropdownItem>
            <DropdownItem
              key="target"
              onPress={() => exportToTxtFile("targetUsername")}
            >
              Export Target Usernames
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
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
                  <span className="text-gray-700 border-b border-dashed border-gray-300">
                    {post.authorUsername}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  <span className="text-gray-700 border-b border-dashed border-gray-300">
                    {post.targetUsername}
                  </span>
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
                {post.commentId ? (
                  <Tooltip
                    content="Click to open comment"
                    placement="bottom"
                    color="foreground"
                  >
                    <a
                      href={formatCommentLink(
                        post.postId,
                        post.commentId,
                        post.authorUsername
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-primary hover:underline cursor-pointer border-b border-dashed border-gray-300"
                    >
                      {post.commentId}
                    </a>
                  </Tooltip>
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
