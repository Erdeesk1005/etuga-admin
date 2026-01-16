"use client";
// react
import React, { useMemo, useState, useContext } from "react";
// next
import { usePathname, useRouter } from "next/navigation";
import { DashboardIcon, HotelIcon, BookingIcon } from "@/components/icons";
// antd
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,

  LogoutOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme } from "antd";
import { ConfigProvider } from "antd";
// utils
import { removeCookie } from "@/context/auth/utils";
// context
import { AuthContext } from "@/context/auth/authContext";

const { Header, Sider, Content } = Layout;

const RootLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const {
    authFunc: { POST },
  } = useContext(AuthContext);

  const [collapsed, setCollapsed] = useState(false);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // cookie-оос refresh_token унших
  const getRefreshTokenFromCookie = () => {
    if (typeof document === "undefined") return null;
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("refresh_token="));
    if (!match) return null;
    return match.split("=")[1] || null;
  };

  const onLogOut = async () => {
    try {
      const refreshToken = getRefreshTokenFromCookie();
      if (refreshToken) {
        await POST("admin/auth/logout", { refresh_token: refreshToken });
      }
    } catch (e) {
      console.error("Logout API error:", e);
    } finally {
      removeCookie();
      router.replace("/login");
    }
  };

  const selectedKey = useMemo(() => {
    if (!pathname) return "/dashboard";
    if (pathname.startsWith("/dashboard/hotel")) return "/dashboard/hotel";
    if (pathname.startsWith("/dashboard/booking")) return "/dashboard/booking";
    if (pathname.startsWith("/dashboard")) return "/dashboard";
    return "/dashboard";
  }, [pathname]);

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardIcon />,
      label: "Dashboard",
    },
    {
      key: "/dashboard/hotel",
      icon: <HotelIcon />,
      label: "Буудал",
    },
    {
      key: "/dashboard/booking",
      icon: <BookingIcon />,
      label: "Захиалга",
    },
  ];

  return (
    <Layout className="min-h-screen bg-zinc-50">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        theme="light"
        style={{
          background: "#fff",

          borderRight: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Logo */}
        <div
          className={`px-4 py-4 ${collapsed ? "flex justify-center" : "flex items-center gap-3"
            }`}
        >
          <img
            src="/logo.png"
            alt="logo"
            className="h-10 w-10 rounded-xl object-contain"
          />
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-zinc-900 font-semibold text-[14px]">
                Etuga Admin
              </div>
              <div className="text-zinc-500 text-[12px]">
                Hotels & bookings
              </div>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="px-2">
          <ConfigProvider
            theme={{
              components: {
                Menu: {
                  itemBorderRadius: 14,
                  itemHeight: 46,

                  itemSelectedBg: "#16a34a",
                  itemSelectedColor: "#ffffff",

                  itemHoverBg: "rgba(22, 163, 74, 0.10)",
                  itemHoverColor: "#0f172a",

                  itemActiveBg: "rgba(22, 163, 74, 0.16)",

                  // submenu bg (хэрвээ цааш нэмэх бол)
                  subMenuItemBg: "transparent",
                },
              },
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              onClick={(e) => router.push(e.key)}
              items={menuItems}
              style={{
                background: "transparent",
                border: "none",
                padding: 16,
              }}
              className="etuga-menu"
            />
          </ConfigProvider>
        </div>


        {/* Footer */}
        <div className="absolute bottom-3 left-0 right-0 px-3">
          <div
            className={`rounded-xl border border-black/5 bg-zinc-50 px-3 py-2 text-zinc-500 ${collapsed ? "text-center text-[11px]" : "text-[12px]"
              }`}
          >
            {collapsed ? "v1" : "Etuga Platform • v1"}
          </div>
        </div>
      </Sider>

      <Layout className="bg-zinc-50">
        <Header
          style={{ padding: 0, background: "transparent" }}
          className="px-3 sm:px-5 pt-3"
        >
          <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white shadow-sm px-2 sm:px-3 h-[60px]">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-xl"
              style={{ width: 44, height: 44 }}
            />

            <div className="flex items-center gap-2 pr-1">
              <Button
                icon={<LogoutOutlined />}
                onClick={onLogOut}
                className="rounded-full"
              >
                Гарах
              </Button>
            </div>
          </div>
        </Header>

        <Content className="p-3 sm:p-5">
          <div
            style={{
              padding: 18,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
            className="rounded-3xl border border-black/5 bg-white shadow-sm"
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default RootLayout;
