"use client";

import { projectService } from "@/api/project";
import { getNimorKey } from "@/hook";
import { DeleteIcon } from "@/utils/icons";
import { TiPlus } from "react-icons/ti";

import { notificationFetch } from "@/utils";
import type { IProject } from "@/api/project";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from "@heroui/react";
import React, { useCallback, useEffect, useState } from "react";
import ModalCustom from "../Modal/Modal";
import ModalConfirm from "../Modal/ModalConfirm";
import FormAddProject from "../Form/FormAddProject";

const columns = [
  { name: "Project Name", uid: "name" },
  { name: "Created At", uid: "createdAt" },
  { name: "Actions", uid: "actions" },
];

export default function TableProjectManager() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedKeys, setSelectedKeys] = useState(new Set<string>());

  // Modal confirm delete
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [projectsToDelete, setProjectsToDelete] = useState<string[]>([]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const apiKey = getNimorKey();
      if (!apiKey) return;

      const res = await projectService.getProjects({
        apiKey,
      });

      if (res && res.ok && Array.isArray(res.data)) {
        setProjects(res.data);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDeleteSelected = () => {
    if (selectedKeys.size === 0) return;
    setProjectsToDelete(Array.from(selectedKeys) as string[]);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (projectsToDelete.length === 0) return;

    try {
      const apiKey = getNimorKey();
      if (!apiKey) return;

      await notificationFetch({
        promiseRunner: projectService.deleteProjects({
          apiKey,
          projectIds: projectsToDelete,
        }),
        toastSetting: {
          position: "top-right",
          autoClose: 3000,
        },
      });

      // Clear selection and refresh data
      setSelectedKeys(new Set());
      await fetchProjects();
      setIsConfirmOpen(false);
    } catch (err) {
      console.error("Error deleting projects:", err);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          {selectedKeys.size > 0 && (
            <Button
              color="danger"
              variant="light"
              startContent={<DeleteIcon />}
              onPress={handleDeleteSelected}
            >
              Delete Selected ({selectedKeys.size})
            </Button>
          )}
        </div>

        <Button color="primary" startContent={<TiPlus />} onPress={onOpen}>
          Add Project
        </Button>
      </div>

      <Table
        aria-label="Projects table"
        selectionMode="multiple"
        isHeaderSticky
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) => {
          // Handle different selection types with proper type checking
          if (typeof keys === "string") {
            if (keys === "all") {
              setSelectedKeys(new Set(projects.map((project) => project._id)));
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
          items={projects}
          isLoading={loading}
          loadingContent={<div>Loading projects...</div>}
          emptyContent={!loading && "No projects found"}
        >
          {(project) => (
            <TableRow key={project._id}>
              <TableCell>
                <div className="font-medium">{project.name}</div>
              </TableCell>
              <TableCell>{formatDate(project.createdAt)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => {
                      setProjectsToDelete([project._id]);
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

      {/* Modal for adding new project */}
      <ModalCustom isOpen={isOpen} onClose={onClose} title="Add New Project">
        <FormAddProject
          onSubmit={async (data: { name: string }) => {
            try {
              const apiKey = getNimorKey();
              if (!apiKey) return;

              await notificationFetch({
                promiseRunner: projectService.createProject({
                  apiKey,
                  name: data.name,
                }),
                toastSetting: {
                  position: "top-right",
                  autoClose: 3000,
                },
              });

              await fetchProjects();
              onClose();
            } catch (err) {
              console.error("Error creating project:", err);
            }
          }}
          onCancel={onClose}
        />
      </ModalCustom>

      {/* Confirm delete modal */}
      <ModalConfirm
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Projects"
        description={`Are you sure you want to delete ${projectsToDelete.length} selected project(s)? This will also delete all topics associated with these projects.`}
      />
    </div>
  );
}
