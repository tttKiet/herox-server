"use client";

import React from "react";
import {
  HiHome,
  HiOutlineNewspaper,
  HiTag,
  HiFolderOpen,
  HiOutlineChatBubbleBottomCenterText,
} from "react-icons/hi2";
import { RiTwitterXFill } from "react-icons/ri";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { MenuProps } from "antd";
import { Layout, Menu, theme } from "antd";
import HeaderCustom from "./Header";

const { Content, Footer, Sider } = Layout;

const navBarLeft: MenuProps["items"] = [
  {
    key: "DASH_BOARD",
    icon: <HiHome />,
    label: <Link href="/">Dashboard</Link>,
  },
  {
    type: "group",
    label: <div className="text-xs font-bold">MENU</div>,
    children: [
      {
        label: <Link href="/prompt">Prompt</Link>,
        icon: <HiOutlineNewspaper />,
        key: "PROMPT",
      },
      {
        label: <Link href="/project">Project</Link>,
        icon: <HiFolderOpen />,
        key: "PROJECT",
      },
      {
        label: <Link href="/topic">Topic</Link>,
        icon: <HiTag />,
        key: "TOPIC",
      },
    ],
  },
  {
    type: "group",
    label: <div className="text-xs font-bold">VIEW</div>,
    children: [
      {
        label: <Link href="/chat-response">Chat Response</Link>,
        icon: <HiOutlineChatBubbleBottomCenterText />,
        key: "CHAT_RESPONSE",
      },
      {
        label: <Link href="/interact-posts">Interact Posts</Link>,
        icon: <RiTwitterXFill />,
        key: "INTERACT_POSTS",
      },
    ],
  },
];

function MainLayout({ children }: { children: React.ReactNode }) {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const pathname = usePathname();

  // Map pathname to menu key
  const getSelectedKey = () => {
    if (pathname === "/") return ["DASH_BOARD"];
    if (pathname.startsWith("/prompt")) return ["PROMPT"];
    if (pathname.startsWith("/topic")) return ["TOPIC"];
    if (pathname.startsWith("/project")) return ["PROJECT"];
    if (pathname.startsWith("/chat-response")) return ["CHAT_RESPONSE"];
    if (pathname.startsWith("/interact-posts")) return ["INTERACT_POSTS"];
    return [];
  };

  return (
    <div>
      <HeaderCustom />
      <div style={{ padding: "0 120px" }} className="my-4">
        <div className="">
          <div className="flex">
            <div>
              <Sider
                style={{ background: colorBgContainer }}
                width={240}
                className="rounded-md px-4 py-6 shadow"
              >
                <Menu
                  className="rounded-md"
                  mode="inline"
                  selectedKeys={getSelectedKey()}
                  items={navBarLeft}
                />
              </Sider>
            </div>
            <Content style={{ padding: "0 24px", minHeight: 650 }}>
              {children}
            </Content>
          </div>
        </div>
      </div>
      <Footer style={{ textAlign: "center" }}>Created by HeroX ©2025</Footer>
    </div>
  );
}

export default MainLayout;
