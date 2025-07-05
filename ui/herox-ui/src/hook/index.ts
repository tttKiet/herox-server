import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../api/auth";
import { notificationFetch } from "../utils";

const NIMOR_KEY = "nimor_key";
const NIMOR_DATA = "nimor_data";

export function saveNimorKey(key: string) {
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
  const [user, setUser] = useState<NimorData | null>(getNimorData());
  const router = useRouter();

  useEffect(() => {
    const key = getNimorKey();
    if (!key) {
      router.replace("/login");
      return;
    }
    authService
      .login(key)
      .then((res) => {
        const result = res.data; // Lấy dữ liệu thực tế từ AxiosResponse
        if (result.ok && result.data) {
          setUser(result.data);
          saveNimorData(result.data);
        } else {
          notificationFetch({
            promiseRunner: Promise.resolve(result),
            toastSetting: { position: "top-center" },
          });
          router.replace("/login");
        }
      })
      .catch((err) => {
        notificationFetch({
          promiseRunner: Promise.reject(err),
          toastSetting: { position: "top-center" },
        });
        router.replace("/login");
      });
    // eslint-disable-next-line
  }, []);

  return user;
}
