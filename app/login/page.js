'use client';
// react
import React, { useContext, useState } from 'react';
// next
import { useRouter } from 'next/navigation';
// antd
import { Button, Form, Input, message, Spin } from 'antd';
// api
import axios from 'axios';
import { BASE_URL } from '@/utils/config';
import { AuthContext } from '@/context/auth/authContext';

const Page = () => {
    const router = useRouter();
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading] = useState(false);
    const { authFunc } = useContext(AuthContext);
    const onFinish = async (values) => {
        try {
            setLoading(true);
            let url = BASE_URL + 'admin/auth/login';
            let res = await axios.post(url, values);
            if (res?.status == 201) {
                authFunc.setUser(res);
                messageApi.open({
                    type: 'success',
                    content: 'Амжилттай',
                });
                router.replace('/dashboard/hotel');
            } else {
                messageApi.open({
                    type: 'error',
                    content: 'Амжилтгүй',
                });
            }
            setLoading(false);
        } catch (e) {
            setLoading(false);
            messageApi.open({
                type: 'error',
                content: 'Амжилтгүй',
            });
        }
    };
    return (
        <>
            {contextHolder}
            <div className={'bg-[#2c3e50]'}>
                <div className="flex justify-center items-center h-[100vh] mx-auto">
                    <div className={'bg-[#fff] rounded-[20px] w-[450px] p-[30px]'}>
                        <Form name="basic" layout="vertical" onFinish={onFinish} autoComplete="off" className="w-full">
                            <Form.Item label="Нэвтрэх нэр" name="email" rules={[{ required: true, message: 'Нэрээ оруулна уу!' }]}>
                                <Input />
                            </Form.Item>

                            <Form.Item label="Нууц үг" name="password" rules={[{ required: true, message: 'Нууц үгээ оруулна уу!' }]}>
                                <Input.Password />
                            </Form.Item>

                            <Form.Item label={null}>
                                {loading ? (
                                    <Spin spinning={true} />
                                ) : (
                                    <Button type="primary" htmlType="submit">
                                        Нэвтрэх
                                    </Button>
                                )}
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </div>
        </>
    );
};
export default Page;
