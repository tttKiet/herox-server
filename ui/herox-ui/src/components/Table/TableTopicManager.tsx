"use client";

import { topicService } from "@/api/topic";
import { projectService } from "@/api/project";
import type { IProject } from "@/api/project";
import { getNimorKey } from "@/hook";
import { DeleteIcon } from "@/utils/icons";
import { TiPlus } from "react-icons/ti";

import { notificationFetch } from "@/utils";
import type { ITopic, IFilterTopic } from "@/api/topic";
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
  Pagination,
  Spinner,
} from "@heroui/react";
import React, { useCallback, useEffect, useState } from "react";
import ModalCustom from "../Modal/Modal";
import ModalConfirm from "../Modal/ModalConfirm";
import FormGenerateTopic from "../../components/Form/FormGenerateTopic";

const columns = [
  { name: "Topic Name", uid: "topicName" },
  { name: "Project Name", uid: "projectName" },
  { name: "Created At", uid: "createdAt" },
  { name: "Actions", uid: "actions" },
];

export default function TableTopicManager() {
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedKeys, setSelectedKeys] = useState(new Set<string>());

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal confirm delete
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [topicsToDelete, setTopicsToDelete] = useState<string[]>([]);

  // Filter state
  const [filterProjectName, setFilterProjectName] = useState<string>("");
  const [projectList, setProjectList] = useState<
    { key: string; label: string }[]
  >([]);

  const fetchProjects = useCallback(async () => {
    try {
      const apiKey = getNimorKey();
      if (!apiKey) return;

      const res = await projectService.getProjects({
        apiKey,
      });

      if (res && res.ok && Array.isArray(res.data)) {
        const projects = res.data.map((project: IProject) => ({
          key: project.name,
          label: project.name,
        }));
        setProjectList(projects);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  }, []);
  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const apiKey = getNimorKey();
      if (!apiKey) return;
      const filter: Partial<IFilterTopic> = {};
      if (filterProjectName) filter.projectName = filterProjectName;

      const res = await topicService.getTopics({
        apiKey,
        filter: Object.keys(filter).length ? filter : undefined,
        page,
        limit: rowsPerPage,
      });

      if (res && res.ok && Array.isArray(res.data)) {
        setTopics(res.data);

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
      console.error("Error fetching topics:", err);
    } finally {
      setLoading(false);
    }
  }, [filterProjectName, page, rowsPerPage]);

  useEffect(() => {
    fetchProjects();
    fetchTopics();
  }, [fetchProjects, fetchTopics]);

  const handleDeleteSelected = () => {
    if (selectedKeys.size === 0) return;
    setTopicsToDelete(Array.from(selectedKeys) as string[]);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (topicsToDelete.length === 0) return;

    try {
      const apiKey = getNimorKey();
      if (!apiKey) return;

      await notificationFetch({
        promiseRunner: topicService.deleteTopics({
          apiKey,
          topicIds: topicsToDelete,
        }),
      });

      // Clear selection and refresh data
      setSelectedKeys(new Set());
      await fetchTopics();
      setIsConfirmOpen(false);
    } catch (err) {
      console.error("Error deleting topics:", err);
    }
  };

  // Removed custom selection handlers as we're using HeroUI's built-in selection

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        {" "}
        <div className="flex gap-4">
          <Select
            size="md"
            labelPlacement="outside"
            defaultSelectedKeys={[""]}
            placeholder="All Projects"
            className="w-48"
            selectedKeys={filterProjectName ? [filterProjectName] : [""]}
            onSelectionChange={(keys) => {
              setFilterProjectName((Array.from(keys)[0] as string) || "");
            }}
            renderValue={(items) => {
              return items.length === 0 ||
                (items.length === 1 && !items[0].key) ? (
                <div className="flex items-center gap-2">All Projects</div>
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
              <SelectItem key="" textValue="All Projects">
                All Projects
              </SelectItem>
              {projectList.map((project) => (
                <SelectItem key={project.key} textValue={project.label}>
                  {project.label}
                </SelectItem>
              ))}
            </>
          </Select>

          {selectedKeys.size > 0 && (
            <Button
              color="danger"
              size="md"
              variant="light"
              startContent={<DeleteIcon />}
              onPress={handleDeleteSelected}
            >
              Delete Selected ({selectedKeys.size})
            </Button>
          )}
        </div>
        <Button color="primary" startContent={<TiPlus />} onPress={onOpen}>
          Generator Topic
        </Button>
      </div>

      <Table
        aria-label="Topics table"
        selectionMode="multiple"
        isHeaderSticky
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) => {
          // Handle different selection types with proper type checking
          if (typeof keys === "string") {
            if (keys === "all") {
              setSelectedKeys(new Set(topics.map((topic) => topic._id)));
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
          items={topics}
          isLoading={loading}
          loadingContent={<Spinner size="md"></Spinner>}
          emptyContent={!loading && "No topics found"}
        >
          {(topic) => (
            <TableRow key={topic._id}>
              <TableCell>
                <div className="font-medium">{topic.topicName}</div>
              </TableCell>
              <TableCell>
                <Chip color="primary" variant="flat">
                  {topic.projectName}
                </Chip>
              </TableCell>
              <TableCell>{formatDate(topic.createdAt)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => {
                      setTopicsToDelete([topic._id]);
                      setIsConfirmOpen(true);
                    }}
                  >
                    <DeleteIcon className="text-[16px]" />
                  </Button>
                </div>
              </TableCell>
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

      {/* Modal for generating topics */}
      <ModalCustom isOpen={isOpen} onClose={onClose} title="Generate Topics">
        <FormGenerateTopic
          onSubmit={async () => {
            await fetchTopics();
            onClose();
          }}
          onCancel={onClose}
        />
      </ModalCustom>

      {/* Confirm delete modal */}
      <ModalConfirm
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Topics"
        description={`Are you sure you want to delete ${topicsToDelete.length} selected topic(s)?`}
      />
    </div>
  );
}
