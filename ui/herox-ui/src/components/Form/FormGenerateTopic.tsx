"use client";

import {
  Button,
  NumberInput,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import React, { useState, useEffect } from "react";
import { topicService } from "@/api/topic";
import { projectService } from "@/api/project";
import type { IProject } from "@/api/project";
import { getNimorKey } from "@/hook";
import { notificationFetch } from "@/utils";

interface FormGenerateTopicProps {
  onSubmit: (data: {
    projectName: string;
    quantities: number;
  }) => Promise<void>;
  onCancel: () => void;
}

const FormGenerateTopic: React.FC<FormGenerateTopicProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [projects, setProjects] = useState<{ key: string; label: string }[]>(
    []
  );
  const [projectName, setProjectName] = useState<string>("");
  const [quantities, setQuantities] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingState, setLoadingState] = useState<string>("idle"); // idle, fetching, generating
  const [errors, setErrors] = useState<{
    projectName?: string;
    quantities?: string;
  }>({});

  // Fetch projects from the server
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setLoadingState("fetching");
        const apiKey = getNimorKey();
        if (!apiKey) return;

        const res = await projectService.getProjects({
          apiKey,
        });

        if (res && res.ok && Array.isArray(res.data)) {
          const projectList = res.data.map((project: IProject) => ({
            key: project.name,
            label: project.name,
          }));
          setProjects(projectList);

          // Set default project if available
          if (projectList.length > 0) {
            setProjectName(projectList[0].key);
          }
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const validateForm = () => {
    const newErrors: {
      projectName?: string;
      quantities?: string;
    } = {};

    if (!projectName || projectName.trim() === "") {
      newErrors.projectName = "Project name is required";
    }

    if (!quantities || quantities < 1 || quantities > 100) {
      newErrors.quantities = "Must be between 1 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const apiKey = getNimorKey();
      if (!apiKey) {
        throw new Error("API Key not found");
      }

      await notificationFetch({
        promiseRunner: topicService.generateTopics({
          apiKey,
          projectName,
          count: quantities,
        }),
        toastSetting: {
          position: "top-right",
          autoClose: 5000, // 5 seconds
          toastId: "generate-topics",
        },
        loadingMessage: `Generating ${quantities} topics for project "${projectName}". This may take up to 3 minutes as our AI works...`,
        successMessage: `Successfully generated topics for ${projectName}!`,
        errorMessage:
          "Failed to generate topics. The AI service might be busy or your request timed out. Please try again with fewer topics or try later.",
      });

      await onSubmit({
        projectName,
        quantities,
      });

      // Reset form
      if (projects.length > 0) {
        setProjectName(projects[0].key);
      }
      setQuantities(1);
      setErrors({});
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative">
      <div className="space-y-4">
        <Select
          label="Project Name"
          placeholder="Select project"
          selectedKeys={projectName ? [projectName] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setProjectName(selected);
            // Clear the error when a project is selected
            if (selected && errors.projectName) {
              setErrors((prev) => ({ ...prev, projectName: undefined }));
            }
          }}
          errorMessage={errors.projectName}
          isInvalid={!!errors.projectName}
        >
          {isLoading ? (
            <SelectItem key="loading" textValue="Loading projects...">
              <div className="flex items-center gap-2">
                <Spinner size="md" />
                <span>Loading projects...</span>
              </div>
            </SelectItem>
          ) : projects.length === 0 ? (
            <SelectItem key="no-projects" textValue="No projects available">
              <div className="flex items-center gap-2 text-gray-500">
                <span>No projects available</span>
              </div>
            </SelectItem>
          ) : (
            projects.map((project) => (
              <SelectItem key={project.key}>{project.label}</SelectItem>
            ))
          )}
        </Select>

        <NumberInput
          label="Number of Topics"
          placeholder="How many topics to generate"
          value={quantities}
          onValueChange={(value) => {
            const numValue = Number(value);
            setQuantities(numValue);
            // Clear error if value is now valid
            if (numValue >= 1 && numValue <= 100 && errors.quantities) {
              setErrors((prev) => ({ ...prev, quantities: undefined }));
            }
          }}
          min={1}
          max={10}
          errorMessage={errors.quantities}
          isInvalid={!!errors.quantities}
        />
      </div>

      <div className="flex gap-3 justify-end mt-2 mb-4">
        <Button type="button" variant="light" onPress={onCancel} color="danger">
          Cancel
        </Button>
        <Button type="submit" color="primary" isLoading={isSubmitting}>
          Generate Topics
        </Button>
      </div>
    </form>
  );
};

export default FormGenerateTopic;
