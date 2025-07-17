"use client";

import React from "react";
import {
  HiHome,
  HiOutlineNewspaper,
  HiTag,
  HiFolderOpen,
} from "react-icons/hi2";
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
    return [];
  };

  return (
    <div>
      <HeaderCustom />
      <div style={{ padding: "0 120px" }} className="my-4">
        {/* <Breadcrumb
          style={{ margin: "16px 0" }}
          items={[
            { title: "Home" },
            { title: "List" },
            { title: "MainLayout" },
          ]}
        /> */}
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
