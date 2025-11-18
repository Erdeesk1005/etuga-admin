'use client';

import React, { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Form, Input, message, Spin } from 'antd';
import axios from 'axios';
import { AuthContext } from '@/context/auth/authContext';

const Page = () => {
    const router = useRouter();
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading] = useState(false);

    const { authFunc } = useContext(AuthContext);

    const onFinish = async (values) => {
        try {
            setLoading(true);

            const url = '/api/admin/auth/login';

            const res = await axios.post(url, values, {
                withCredentials: true,
            });

            if (res?.status === 200 || res?.status === 201) {
                authFunc.setUser(res.data);

                messageApi.success("Амжилттай нэвтэрлээ");
                router.replace('/dashboard/hotel');
            } else {
                messageApi.error("Нэвтрэхэд алдаа гарлаа");
            }

            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
            messageApi.error("Нууц үг эсвэл Email буруу байна");
        }
    };

    return (
        <>
            {contextHolder}

            <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
                <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-2xl p-8">
                    
                    {/* Title Section */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white">Etuga Admin</h1>
                        <p className="text-slate-300 text-sm mt-2">
                            Админ хуудас руу нэвтрэх эрх шаардлагатай.
                        </p>
                    </div>

                    {/* Login Form */}
                    <Form
                        name="login"
                        layout="vertical"
                        onFinish={onFinish}
                        className="space-y-3"
                    >
                        <Form.Item
                            label={<span className="text-slate-200">Имэйл</span>}
                            name="email"
                            rules={[{ required: true, message: 'Имэйл оруулна уу!' }]}
                        >
                            <Input
                                className="bg-slate-900/60 text-white border-slate-600 focus:border-emerald-400"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="text-slate-200">Нууц үг</span>}
                            name="password"
                            rules={[{ required: true, message: 'Нууц үг оруулна уу!' }]}
                        >
                            <Input.Password
                                className="bg-slate-900/60 text-white border-slate-600 focus:border-emerald-400"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item>
                            {loading ? (
                                <div className="flex justify-center py-2">
                                    <Spin spinning={true} size="large" />
                                </div>
                            ) : (
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    className="w-full h-[42px] text-[16px] font-medium bg-emerald-500 hover:bg-emerald-400"
                                >
                                    Нэвтрэх
                                </Button>
                            )}
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </>
    );
};

export default Page;
