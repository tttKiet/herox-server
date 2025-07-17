// app/providers.tsx
"use client";

import { HeroUIProvider } from "@heroui/react";
import { ToastContainer } from "react-toastify";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="font-medium"
        toastClassName="toast-smaller"
        style={{ fontSize: "0.85rem", width: "320px" }}
      />
      {children}
    </HeroUIProvider>
  );
}
