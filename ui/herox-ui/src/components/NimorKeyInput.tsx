"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";
import { setNimorKey } from "@/hook";

interface NimorKeyInputProps {
  onSave: (success: boolean) => void;
}

export default function NimorKeyInput({ onSave }: NimorKeyInputProps) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!apiKey) {
      setError("Please enter an API key");
      return;
    }

    setLoading(true);
    setError("");

    // Validate the API key format - simple validation, adjust as needed
    if (apiKey.length < 6) {
      setError("API key must be at least 6 characters");
      setLoading(false);
      return;
    }

    // Save the API key
    setNimorKey(apiKey);
    setLoading(false);
    onSave(true);
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-3">API Key</h2>
      <div className="flex gap-2 flex-col sm:flex-row">
        <Input
          type="password"
          placeholder="Enter your API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="flex-1"
          color={error ? "danger" : "default"}
          errorMessage={error || undefined}
        />
        <Button
          color="primary"
          onPress={handleSubmit}
          isLoading={loading}
          className="sm:w-auto w-full"
        >
          Save Key
        </Button>
      </div>
    </div>
  );
}
