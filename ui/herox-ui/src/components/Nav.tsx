"use client";

import { Card } from "@heroui/react";

export default function Nav() {
  return (
    <Card className="h-full w-56 p-4 flex flex-col gap-2 bg-white shadow-md mr-8">
      <div className="font-bold mb-4">Navigation</div>
      <ul className="space-y-2">
        <li className="cursor-pointer hover:text-blue-600">Dashboard</li>
        <li className="cursor-pointer hover:text-blue-600">Profile</li>
        <li className="cursor-pointer hover:text-blue-600">Settings</li>
      </ul>
    </Card>
  );
}
