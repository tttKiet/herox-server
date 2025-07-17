"use client";

import { Button, Input } from "@heroui/react";
import React, { useState } from "react";

interface FormAddProjectProps {
  onSubmit: (data: { name: string }) => Promise<void>;
  onCancel: () => void;
}

const FormAddProject: React.FC<FormAddProjectProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const validateForm = () => {
    if (!name.trim()) {
      setError("Project name is required");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      await onSubmit({
        name,
      });

      // Reset form
      setName("");
      setError("");
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Project Name"
          placeholder="Enter project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          isInvalid={!!error}
          errorMessage={error}
        />
      </div>

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

export default FormAddProject;
