'use client';
// react
import React, { useState } from 'react';
// next
import { useRouter } from 'next/navigation';
// antd
import { MenuFoldOutlined, MenuUnfoldOutlined, FieldNumberOutlined, UserOutlined, OrderedListOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, theme } from 'antd';
// utils
import { removeCookie } from '@/context/auth/utils';

const { Header, Sider, Content } = Layout;

const RootLayout = ({ children }) => {
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const onLogOut = () => {
        removeCookie();
        router.replace('/login');
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
                    defaultSelectedKeys={['1']}
                    onClick={(e) => router.push(e.key)}
                    items={[
                        {
                            key: '/dashboard/static',
                            icon: <UserOutlined />,
                            label: 'Статик текст',
                        },
                        {
                            key: '/dashboard/hotel',
                            icon: <OrderedListOutlined />,
                            label: 'Буудал',
                        },
                        {
                            key: '/dashboard/room',
                            icon: <FieldNumberOutlined />,
                            label: 'Өрөө',
                        },
                    ]}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }}>
                    <div className={'flex justify-between'}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 64,
                                height: 64,
                            }}
                        />
                        <div className={'mr-[15px]'}>
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
