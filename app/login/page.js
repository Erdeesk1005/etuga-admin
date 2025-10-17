'use client';
// react
import React from 'react';
// antd
import { Button, Form, Input } from 'antd';

const Page = () => {
    const onFinish = (values) => {
        console.log('Success:', values);
    };
    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };
    return (
        <div className="flex justify-center items-center h-[100%] w-[450px] mx-auto">
            <Form name="basic" layout="vertical" onFinish={onFinish} onFinishFailed={onFinishFailed} autoComplete="off" className="w-full">
                <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
                    <Input />
                </Form.Item>

                <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
                    <Input.Password />
                </Form.Item>

                <Form.Item label={null}>
                    <Button type="primary" htmlType="submit">
                        Нэвтрэх
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};
export default Page;
