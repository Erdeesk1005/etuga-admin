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
        <div className="flex justify-center items-center h-[100%]  mx-auto">
            <Form name="basic" layout="vertical" onFinish={onFinish} onFinishFailed={onFinishFailed} autoComplete="off" className="w-full">
                <Form.Item label="Статик утга 1" name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Статик утга 1" name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Статик утга 1" name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Статик утга 1" name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Статик утга 1" name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Статик утга 1" name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
                    <Input />
                </Form.Item>
                <Form.Item label={null}>
                    <Button type="primary" htmlType="submit">
                        Нэмэх
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default Page;
