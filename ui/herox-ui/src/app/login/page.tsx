"use client";

import { useState } from "react";
import { Input, Button, Card } from "@heroui/react";
import { authService } from "../../api/auth";
import { notificationFetch } from "../../utils";
import { saveNimorKey, saveNimorData, NimorData } from "../../hook";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [keyNimo, setKeyNimo] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyNimo) return;
    setLoading(true);
    const data = await notificationFetch({
      promiseRunner: authService.login(keyNimo),
      toastSetting: { position: "top-right" },
    });
    if (data.ok && data.data) {
      saveNimorKey(keyNimo);
      saveNimorData(data.data as NimorData);
      router.replace("/");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen ">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Authorization</h2>
        <form className="space-y-6 mt-4" onSubmit={handleLogin}>
          <Input
            label="Key Nimo"
            id="key-nimo"
            name="key-nimo"
            placeholder="Enter Key Nimo"
            isRequired
            autoFocus
            size="lg"
            value={keyNimo}
            onChange={(e) => setKeyNimo(e.target.value)}
          />
          <Button
            type="submit"
            variant="solid"
            color="primary"
            className="w-full mt-2"
            disabled={!keyNimo || loading}
            isLoading={loading}
          >
            Enter
          </Button>
        </form>
      </Card>
    </div>
  );
}
