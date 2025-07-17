"use client";

import { Button, Input, NumberInput } from "@heroui/react";
import React, { useState } from "react";

interface FormAddTopicProps {
  onSubmit: (data: {
    topics: { topicName: string; projectName: string }[];
  }) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  projectName?: string;
  topicCount?: string;
}

interface TopicData {
  topicName: string;
  projectName: string;
}

/**
 * Generates an array of topic objects based on project name and count
 */
const generateTopics = (
  projectName: string,
  topicCount: number
): TopicData[] => {
  return Array(topicCount)
    .fill(0)
    .map((_, index) => ({
      topicName: `${projectName} - Topic ${index + 1}`,
      projectName: projectName,
    }));
};

/**
 * Validates form inputs and returns errors if any
 */
const validateFormInputs = (
  projectName: string,
  topicCount: number
): FormErrors => {
  const errors: FormErrors = {};

  if (!projectName.trim()) {
    errors.projectName = "Project name is required";
  }

  if (topicCount < 1 || topicCount > 100) {
    errors.topicCount = "Must be between 1 and 100";
  }

  return errors;
};

/**
 * Renders the form inputs for project name and topic count
 */
const renderFormInputs = (
  projectName: string,
  setProjectName: (name: string) => void,
  topicCount: number,
  setTopicCount: (count: number) => void,
  errors: FormErrors
) => (
  <div className="space-y-4">
    <Input
      label="Project Name"
      placeholder="Enter project name"
      value={projectName}
      onChange={(e) => setProjectName(e.target.value)}
      errorMessage={errors.projectName}
      isInvalid={!!errors.projectName}
    />

    <NumberInput
      label="Number of Topics"
      placeholder="How many topics to create"
      value={topicCount}
      onValueChange={(value) => setTopicCount(Number(value))}
      min={1}
      max={10}
      errorMessage={errors.topicCount}
      isInvalid={!!errors.topicCount}
    />

    <div className="space-y-4 mt-4">
      <h3 className="text-md font-medium">Kết quả</h3>
      <p className="text-sm text-gray-500">
        {topicCount} topic sẽ được tạo với tên tự động: &ldquo;{projectName} -
        Topic 1&rdquo; đến &ldquo;{projectName} - Topic {topicCount}
        &rdquo;
      </p>
    </div>
  </div>
);

/**
 * Main form component for adding topics
 */
const FormAddTopic: React.FC<FormAddTopicProps> = ({ onSubmit, onCancel }) => {
  const [projectName, setProjectName] = useState("");
  const [topicCount, setTopicCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateFormInputs(projectName, topicCount);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Generate topics based on input
      const generatedTopics = generateTopics(projectName, topicCount);

      await onSubmit({
        topics: generatedTopics,
      });

      // Reset form
      setProjectName("");
      setTopicCount(1);
      setErrors({});
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderFormInputs(
        projectName,
        setProjectName,
        topicCount,
        setTopicCount,
        errors
      )}

      <div className="flex gap-3 justify-end mt-2 mb-4">
        <Button type="button" variant="light" onPress={onCancel} color="danger">
          Cancel
        </Button>
        <Button type="submit" color="primary" isLoading={isSubmitting}>
          Create Project
        </Button>
      </div>
    </form>
  );
};

export default FormAddTopic;
