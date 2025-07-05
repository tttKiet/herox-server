"use client";

import { Input, Button, Card } from "@heroui/react";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen ">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Authorization</h2>
        <form className="space-y-6 mt-4">
          <Input
            label="Key Nimo"
            id="key-nimo"
            name="key-nimo"
            placeholder="Nhập Key Nimo"
            isRequired
            autoFocus
            size="lg"
          />
          <Button
            type="submit"
            variant="solid"
            color="primary"
            className="w-full mt-2"
          >
            Enter
          </Button>
        </form>
      </Card>
    </div>
  );
}
