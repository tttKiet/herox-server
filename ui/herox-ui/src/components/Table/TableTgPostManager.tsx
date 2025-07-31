"use client";

import { IInteractXTgPost } from "@/api/tg-posts";
import { tgPostsService } from "@/api/tg-posts/tg-posts.service";
import { getNimorKey } from "@/hook";
import {
  Button,
  Chip,
  DatePicker,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from "@heroui/react";
import { type ZonedDateTime } from "@internationalized/date";
import React, { useCallback, useEffect, useState } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { toast } from "react-toastify";

// Define columns for the table
const columns = [
  { name: "Post ID", uid: "postId" },
  { name: "Post URL", uid: "postUrl" },
  { name: "Username", uid: "username" },
  { name: "Interaction Count", uid: "interactionCount" },
  { name: "Required Interaction Count", uid: "requiredInteractionCount" },
  { name: "Pending Task Count", uid: "pendingTaskCount" },
  { name: "Type", uid: "type" },
  { name: "Created At", uid: "createdAt" },
  { name: "Actions", uid: "actions" },
];

const typeColors = {
  admin: "primary",
  member: "success",
} as const;

const TableTgPostManager: React.FC = () => {
  // States
  const [posts, setPosts] = useState<IInteractXTgPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [usernameInput, setUsernameInput] = useState("");
  const [postIdInput, setPostIdInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [taskDate, setTaskDate] = useState<ZonedDateTime | null>(null);

  const [filters, setFilters] = useState({
    username: "",
    postId: "",
    type: "",
    taskDate: "",
  });

  // New post form states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newPost, setNewPost] = useState({
    postId: "",
    postUrl: "",
    username: "",
    content: "",
    type: "admin" as "admin" | "member",
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
  const debouncedUsername = useDebounce(usernameInput, 500);
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

  // Update filters when debounced values change
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      username: debouncedUsername,
    }));
    setPage(1); // Reset to first page when search changes
  }, [debouncedUsername]);

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

  // Function to fetch posts
  const fetchPosts = useCallback(async () => {
    if (!apiKey) {
      toast.error("API key not found. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      // Build filter object
      const filter = {
        ...(filters.username && { username: filters.username }),
        ...(filters.postId && { postId: filters.postId }),
        ...(filters.type && { type: filters.type }),
        ...(filters.taskDate && { taskDate: filters.taskDate }),
      };

      console.log("Sending filter to server:", filter);

      const response = await tgPostsService.getTgPosts({
        apiKey,
        filter,
        page,
        limit: rowsPerPage,
      });

      console.log("Server response:", response);

      if (response.ok) {
        setPosts(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      } else {
        toast.error(response.message || "Error fetching posts");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  }, [apiKey, filters, page, rowsPerPage]);

  // Function to create new post
  const handleCreatePost = async () => {
    if (!apiKey) {
      toast.error("API key not found. Please log in again.");
      return;
    }

    try {
      if (!newPost.postId || !newPost.postUrl || !newPost.username) {
        toast.error("Post ID, URL, and username are required");
        return;
      }

      const response = await tgPostsService.createTgPost({
        apiKey,
        postData: newPost,
      });

      if (response.ok) {
        toast.success("Post created successfully");
        onClose();
        setNewPost({
          postId: "",
          postUrl: "",
          username: "",
          content: "",
          type: "admin",
        });
        fetchPosts();
      } else {
        toast.error(response.message || "Error creating post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    }
  };

  // Function to delete post
  const handleDeletePost = async (postId: string) => {
    if (!apiKey) {
      toast.error("API key not found. Please log in again.");
      return;
    }

    try {
      const response = await tgPostsService.deleteTgPost({
        apiKey,
        postId,
      });

      if (response.ok) {
        toast.success("Post deleted successfully");
        fetchPosts(); // Refresh data after delete
      } else {
        toast.error(response.message || "Error deleting post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  // Initial fetch on component mount and when filters or pagination changes
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Telegram X Posts</h2>
      </div>

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex gap-4 flex-wrap items-center justify-between w-full">
          <div className="flex items-center gap-6">
            <Input
              size="md"
              label="Username"
              placeholder="Filter by username..."
              value={usernameInput}
              onValueChange={setUsernameInput}
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
              className="w-48"
            >
              <SelectItem key="">All Types</SelectItem>
              <SelectItem key="admin">Admin</SelectItem>
              <SelectItem key="member">Member</SelectItem>
            </Select>
            <DatePicker
              label="Task Date"
              value={taskDate}
              onChange={(date) => setTaskDate(date)}
              className="w-48"
            />
          </div>
          <div>
            <Button color="primary" onPress={onOpen}>
              Add New Post
            </Button>
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
              setUsernameInput("");
            }}
          >
            Username: {filters.username}
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

      {/* Posts Table */}
      <div className="">
        <Table
          aria-label="Telegram Posts Table"
          selectionMode="none"
          isHeaderSticky={false}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid}>{column.name}</TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={posts}
            isLoading={loading}
            loadingContent={<Spinner size="md" />}
            emptyContent={!loading && "No posts found."}
          >
            {(post) => (
              <TableRow key={post._id}>
                <TableCell>{post.postId}</TableCell>
                <TableCell>
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {post.postUrl.length > 30
                      ? post.postUrl.substring(0, 30) + "..."
                      : post.postUrl}
                  </a>
                </TableCell>
                <TableCell>{post.username}</TableCell>
                <TableCell>{post.interactionCount}</TableCell>
                <TableCell>{post?.requiredInteractionCount || "-"}</TableCell>
                <TableCell>{post?.pendingTaskCount || "-"}</TableCell>
                <TableCell>{getTypeDisplay(post.type)}</TableCell>
                <TableCell>{formatDate(post.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Button
                      color="danger"
                      size="sm"
                      onPress={() => handleDeletePost(post._id!)}
                    >
                      Delete
                    </Button>
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

      {/* Add New Post Modal */}
      <Modal isOpen={isOpen} onOpenChange={onClose} size="lg">
        <ModalContent>
          <ModalHeader>Add New Post</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Post ID"
                placeholder="Enter post ID"
                value={newPost.postId}
                onValueChange={(value) =>
                  setNewPost({ ...newPost, postId: value })
                }
              />
              <Input
                label="Post URL"
                placeholder="Enter post URL"
                value={newPost.postUrl}
                onValueChange={(value) =>
                  setNewPost({ ...newPost, postUrl: value })
                }
              />
              <Input
                label="Username"
                placeholder="Enter username"
                value={newPost.username}
                onValueChange={(value) =>
                  setNewPost({ ...newPost, username: value })
                }
              />
              <Input
                label="Content (optional)"
                placeholder="Enter post content"
                value={newPost.content}
                onValueChange={(value) =>
                  setNewPost({ ...newPost, content: value })
                }
              />
              <Select
                label="Type"
                placeholder="Select post type"
                selectedKeys={[newPost.type]}
                onSelectionChange={(keys) => {
                  const type = Array.from(keys)[0] as "admin" | "member";
                  setNewPost({ ...newPost, type });
                }}
              >
                <SelectItem key="admin">Admin</SelectItem>
                <SelectItem key="member">Member</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleCreatePost}>
              Add Post
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TableTgPostManager;
