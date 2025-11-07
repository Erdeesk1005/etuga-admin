'use client';
import React, { useEffect, useContext, useState } from 'react';
import { Space, Table, Tag, Button, Popconfirm, message, Spin } from 'antd';
import { Typography } from 'antd';
import { AuthContext } from '@/context/auth/authContext';
import Add from './add';

const { Title } = Typography;

const Page = () => {
    const {
        authFunc: { GET, DELETE },
    } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const [messageApi, contextHolder] = message.useMessage();
    useEffect(() => {
        getList();
    }, []);

    const getList = async () => {
        setLoading(true);
        let res = await GET('admin/hotels');
        if (res?.data) {
            setData(res.data);
        }
        setLoading(false);
    };
    const columns = [
        {
            title: 'Нэр',
            dataIndex: 'name_mn',
            key: 'name_mn',
            render: (text) => <p>{text}</p>,
        },
        {
            title: 'Утас',
            dataIndex: 'phone',
            key: 'phone',
            render: (text) => <p>{text}</p>,
        },
        {
            title: 'Имэйл',
            dataIndex: 'email',
            key: 'email',
            render: (text) => <p>{text}</p>,
        },
        {
            title: 'Вэбсайт',
            dataIndex: 'website',
            key: 'website',
            render: (text) => <p>{text}</p>,
        },
        {
            title: 'Төрөл',
            key: 'amenities',
            dataIndex: 'amenities',
            render: (text) => (
                <>
                    {text?.map((tag) => {
                        let color = tag.length > 5 ? 'geekblue' : 'green';
                        if (tag === 'loser') {
                            color = 'volcano';
                        }
                        return (
                            <Tag color={color} key={tag}>
                                {tag.toUpperCase()}
                            </Tag>
                        );
                    })}
                </>
            ),
        },
        {
            title: 'Үйлдэл',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button info onClick={() => onDetail(record.id)}>
                        Засах
                    </Button>
                    <Popconfirm
                        title="Буудал устгах"
                        description="Та устгахдаа итгэлтэй байна уу?"
                        onConfirm={() => onDelete(record.id)}
                        onCancel={() => false}
                        okText="Тийм"
                        cancelText="Үгүй"
                    >
                        <Button danger>Устгах</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];
    const onDetail = async (id) => {
        if (loading) return;
        setLoading(true);
        let res = await GET(`admin/hotels/${id}`);
        if (res?.status === 200) {
            setSelected(res.data);
            setShow(true);
        } else {
            messageApi.open({
                type: 'error',
                content: 'Амжилтгүй',
            });
        }
        setLoading(false);
    };
    const onDelete = async (id) => {
        if (loading) return;
        setLoading(true);
        let res = await DELETE(`admin/hotels/${id}`);
        if (res?.status === 200) {
            getList();
            messageApi.open({
                type: 'success',
                content: 'Амжилттай',
            });
        } else {
            setLoading(false);
            messageApi.open({
                type: 'error',
                content: 'Амжилтгүй',
            });
        }
    };
    const onClose = () => {
        setShow(false);
        setSelected(null);
    };
    return (
        <>
            {contextHolder}
            <div>
                <div className={'my-[40px] flex justify-between items-center'}>
                    <Title level={4}>Буудлын жагсаалт</Title>
                    <Button type={'primary'} onClick={() => setShow(true)}>
                        Нэмэх
                    </Button>
                </div>
                <Spin spinning={loading}>
                    <Table columns={columns} dataSource={data} />
                </Spin>
                {show && <Add onClose={onClose} getRefresh={getList} selected={selected} />}
            </div>
        </>
    );
};
export default Page;
