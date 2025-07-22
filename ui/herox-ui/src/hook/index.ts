"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../api/auth";

const NIMOR_KEY = "nimor_key";
const NIMOR_DATA = "nimor_data";

export function saveNimorKey(key: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(NIMOR_KEY, key);
  }
}

export function setNimorKey(key: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(NIMOR_KEY, key);
  }
}

export interface NimorData {
  _id: string;
  permisson: string;
  type: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export function saveNimorData(data: NimorData) {
  if (typeof window !== "undefined") {
    localStorage.setItem(NIMOR_DATA, JSON.stringify(data));
  }
}

export function getNimorKey(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(NIMOR_KEY);
  }
  return null;
}

export function getNimorData(): NimorData | null {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(NIMOR_DATA);
    return data ? (JSON.parse(data) as NimorData) : null;
  }
  return null;
}

export function useAuthHook() {
  const [user, setUser] = useState<NimorData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const key = getNimorKey();
    if (!key) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const res = await authService.login(key);
        const data = res.data;
        if (data) {
          setUser(data);
          saveNimorData(data);
        } else {
          router.replace("/login");
        }
      } catch (err) {
        console.log("Error fetching user data: ", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Lấy user từ localStorage nếu đã có
    const localUser = getNimorData();
    if (localUser) setUser(localUser);
  }, []);

  return user;
}

export { default as useLoading } from "./useLoading";
