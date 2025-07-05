"use client";

import { Chip, User } from "@heroui/react";
import { Layout } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthHook } from "../hook";

const { Header } = Layout;

export default function HeaderCustom() {
  const router = useRouter();
  const user = useAuthHook();

  function logout() {
    localStorage.removeItem("nimor_key");
    localStorage.removeItem("nimor_data");
    router.replace("/login");
  }

  return (
    <Header
      className="shadow-md flex justify-between items-center py-2 "
      style={{
        background: "#fff",
        zIndex: 10,
        padding: "0 120px",
      }}
    >
      <Image
        src="/logo/Cầm cờ (1).png"
        alt="Logo"
        width={64}
        height={50}
        style={{ objectFit: "contain" }}
        priority
      />
      <div className="flex items-center gap-3">
        {user && (
          <>
            <User
              avatarProps={{
                src: "https://i.pravatar.cc/150?u=" + user._id,
              }}
              description={<span className="ml-1">{user.permisson}</span>}
              name={<span className="ml-1">{user.fullName}</span>}
            />
            <span className="mx-2">|</span>

            <Chip
              color="danger"
              size="sm"
              className="cursor-pointer transition-all duration-200 hover:bg-red-600 hover:text-white hover:scale-105"
              variant="dot"
              onClick={logout}
            >
              Exit
            </Chip>
          </>
        )}
      </div>
    </Header>
  );
}
