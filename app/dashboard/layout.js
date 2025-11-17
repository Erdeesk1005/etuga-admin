'use client';
// react
import React, { useState, useContext } from 'react';
// next
import { useRouter } from 'next/navigation';
// antd
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FieldNumberOutlined,
  UserOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, theme } from 'antd';
// utils
import { removeCookie } from '@/context/auth/utils';
// context
import { AuthContext } from '@/context/auth/authContext';

const { Header, Sider, Content } = Layout;

const RootLayout = ({ children }) => {
  const router = useRouter();
  const {
    authFunc: { POST },
  } = useContext(AuthContext);

  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // cookie-оос refresh_token унших (refresh_token=... гэсэн cookie гэж тооцлоо)
  const getRefreshTokenFromCookie = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith('refresh_token='));
    if (!match) return null;
    return match.split('=')[1] || null;
  };

  const onLogOut = async () => {
    try {
      const refreshToken = getRefreshTokenFromCookie();

      if (refreshToken) {
        // backend рүү logout хүсэлт
        await POST('admin/auth/logout', {
          refresh_token: refreshToken,
        });
      }
    } catch (e) {
      console.error('Logout API error:', e);
      // алдаа гарсан ч гэсэн доошоо үргэлжлүүлээд локал logout хийнэ
    } finally {
      // локал талдаа cookie / state цэвэрлээд login рүү шилжүүлнэ
      removeCookie();
      router.replace('/login');
    }
  };

  return (
    <Layout className="h-full">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="">
          <img src="/logo.png" alt="logo" />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['/dashboard/hotel']}
          onClick={(e) => router.push(e.key)}
          items={[
            {
              key: '/dashboard/hotel',
              icon: <OrderedListOutlined />,
              label: 'Буудал',
            },
            {
              key: '/dashboard/booking',
              icon: <FieldNumberOutlined />,
              label: 'Захиалга',
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div className="flex justify-between">
            <Button
              type="text"
              icon={
                collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
              }
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <div className="mr-[15px]">
              <Button onClick={onLogOut}>Гарах</Button>
            </div>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default RootLayout;
