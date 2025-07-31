"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { settingsService } from "../../api/settings/settings.service";
import { ISettings, IUpdateSettingsRequest } from "../../api/settings";
import {
  Button,
  Form,
  NumberInput,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { useAuthHook } from "@/hook";

// Selection method options
const selectionMethodOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "random", label: "Random" },
  { value: "least-interactions", label: "Least Interactions" },
];

// Additional link source options
const additionalLinkSourceOptions = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
];

const SettingsForm: React.FC = () => {
  const user = useAuthHook();
  console.log(user);

  // Form state
  const [formData, setFormData] = useState<IUpdateSettingsRequest>({
    minimumLinksForTask: 0,
    minimumLinkForAdmin: 0,
    additionalLinks: 0,
    selectionMethod: "oldest" as
      | "newest"
      | "oldest"
      | "random"
      | "least-interactions",
    additionalLinkSource: "admin" as "member" | "admin",
  });
  const [settings, setSettings] = useState<ISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await settingsService.getSettings({
          apiKey: user?._id || "",
        });

        if (response.ok && response.data) {
          setSettings(response.data);
          setFormData({
            minimumLinksForTask: response.data.minimumLinksForTask,
            minimumLinkForAdmin: response.data.minimumLinkForAdmin ?? 0,
            additionalLinks: response.data.additionalLinks,
            selectionMethod: response.data.selectionMethod,
            additionalLinkSource: response.data.additionalLinkSource,
          });
        } else {
          toast.error(
            response.message || "Could not retrieve configuration settings"
          );
        }
      } catch (error) {
        toast.error(`Error: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user?._id]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);

      // Send all form data to the API
      const response = await settingsService.updateSettings({
        apiKey: user?._id || "",
        settings: formData,
      });

      if (response.ok && response.data) {
        // Update settings with the response
        setSettings(response.data);
        toast.success("Successfully updated all settings");
      } else {
        // If update fails, reset form data to original settings
        if (settings) {
          setFormData({
            minimumLinksForTask: settings.minimumLinksForTask,
            minimumLinkForAdmin: settings.minimumLinkForAdmin ?? 0,
            additionalLinks: settings.additionalLinks,
            selectionMethod: settings.selectionMethod,
            additionalLinkSource: settings.additionalLinkSource,
          });
        }
        toast.error(response.message || "Could not update configuration");
      }
    } catch (error) {
      toast.error(`Error: ${error}`);
      // Reset to original settings on error
      if (settings) {
        setFormData({
          minimumLinksForTask: settings.minimumLinksForTask,
          minimumLinkForAdmin: settings.minimumLinkForAdmin ?? 0,
          additionalLinks: settings.additionalLinks,
          selectionMethod: settings.selectionMethod,
          additionalLinkSource: settings.additionalLinkSource,
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  // Handle individual field update - only updates local state
  const handleFieldUpdate = (
    fieldName: keyof IUpdateSettingsRequest,
    value: string | number
  ) => {
    // Only update local state without API call
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-white w-full ">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Telegram Bot Configuration
        </h2>
        <p className="text-gray-500 text-sm">
          Update settings for the X interaction system. Click the &quot;Update
          All Settings&quot; button to save your changes.
        </p>
      </div>

      <Form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Minimum Links For Task */}
          <div className="space-y-2">
            <NumberInput
              id="minimumLinksForTask"
              label="Minimum Links For Task"
              value={formData.minimumLinksForTask}
              min={1}
              onChange={(value) =>
                handleFieldUpdate("minimumLinksForTask", Number(value))
              }
              size="md"
              className="w-full"
            />
            <div className="text-xs text-gray-500">
              Minimum number of links required to complete a task (n)
            </div>
          </div>

          {/* Minimum Link For Admin */}
          <div className="space-y-2">
            <NumberInput
              id="minimumLinkForAdmin"
              label="Minimum Link For Admin"
              value={formData.minimumLinkForAdmin}
              min={0}
              onChange={(value) =>
                handleFieldUpdate("minimumLinkForAdmin", Number(value))
              }
              size="md"
              className="w-full"
            />
            <div className="text-xs text-gray-500">
              Minimum number of links required for admin
            </div>
          </div>

          {/* Additional Links */}
          <div className="space-y-2">
            <NumberInput
              label="Additional Links"
              size="md"
              id="additionalLinks"
              value={formData.additionalLinks}
              min={0}
              onChange={(value) =>
                handleFieldUpdate("additionalLinks", Number(value))
              }
              className="w-full"
            />
            <div className="text-xs text-gray-500">
              Number of additional links (t)
            </div>
          </div>

          {/* Selection Method */}
          <div className="space-y-2">
            <Select
              label="Selection Method"
              id="selectionMethod"
              size="md"
              selectedKeys={
                formData.selectionMethod ? [formData.selectionMethod] : []
              }
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleFieldUpdate("selectionMethod", selected);
              }}
              className="w-full"
            >
              {selectionMethodOptions.map((option) => (
                <SelectItem key={option.value}>{option.label}</SelectItem>
              ))}
            </Select>
            <div className="text-xs text-gray-500">How posts are selected</div>
          </div>

          {/* Additional Link Source */}
          <div className="space-y-2">
            <Select
              label="Additional Link Source"
              id="additionalLinkSource"
              size="md"
              selectedKeys={
                formData.additionalLinkSource
                  ? [formData.additionalLinkSource]
                  : []
              }
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleFieldUpdate("additionalLinkSource", selected);
              }}
              className="w-full"
            >
              {additionalLinkSourceOptions.map((option) => (
                <SelectItem key={option.value}>{option.label}</SelectItem>
              ))}
            </Select>
            <div className="text-xs text-gray-500">
              Source of additional links
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-4">
          <Button
            type="submit"
            color="primary"
            disabled={updating}
            isLoading={updating}
          >
            Update All Settings
          </Button>
        </div>

        {settings && (
          <div className="mt-4 text-xs text-gray-500">
            Last updated: {new Date(settings.updatedAt).toLocaleString()} by{" "}
            {settings.updatedBy}
          </div>
        )}
      </Form>
    </div>
  );
};

export default SettingsForm;
