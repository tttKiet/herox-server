"use client";

import React from "react";
import { HiHome, HiOutlineNewspaper, HiOutlinePhoto } from "react-icons/hi2";
import Link from "next/link";

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
    label: <div className="text-xs font-bold">Prompt</div>,
    children: [
      {
        label: <Link href="/prompt/post">Post</Link>,
        icon: <HiOutlineNewspaper />,
        key: "POST",
      },
      {
        label: <Link href="/prompt/image">Image</Link>,
        icon: <HiOutlinePhoto />,
        key: "IMAGE",
      },
    ],
  },
];

function MainLayout({ children }: { children: React.ReactNode }) {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

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
                  defaultSelectedKeys={["1"]}
                  defaultOpenKeys={["sub1"]}
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
