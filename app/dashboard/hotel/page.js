'use client';
// react
import React, { useEffect, useContext, useState } from 'react';
// next
import { useRouter } from 'next/navigation';
// antd
import { Space, Table, Tag, Button, Popconfirm, message, Spin, Typography } from 'antd';
// context
import { AuthContext } from '@/context/auth/authContext';

const { Title } = Typography;

const Page = () => {
  const router = useRouter();
  const {
    authFunc: { GET, DELETE },
  } = useContext(AuthContext);

  // 🔹 null биш, хоосон массив байхаар тохирууллаа
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    getList();
  }, []);

  const getList = async () => {
    setLoading(true);
    const res = await GET('admin/hotels');
    if (res?.data) {
      setData(res.data);
    } else {
      setData([]);
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
      render: (list, record) => (
        <>
          {list?.map((tag, idx) => {
            let color = tag.length > 5 ? 'geekblue' : 'green';
            if (tag === 'loser') {
              color = 'volcano';
            }
            // 🔹 Tag бүрт давтагдахгүй key
            return (
              <Tag color={color} key={`${record.id}-${idx}`}>
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
          <Button onClick={() => router.push(`/dashboard/hotel/actions?id=${record.id}`)}>Засах</Button>
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

  const onDelete = async (id) => {
    if (loading) return;
    setLoading(true);
    const res = await DELETE(`admin/hotels/${id}`);
    if (res?.status === 200) {
      await getList();
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

  return (
    <>
      {contextHolder}
      <div>
        <div className="my-[40px] flex justify-between items-center">
          <Title level={4}>Буудлын жагсаалт</Title>
          <Button type="primary" onClick={() => router.push('/dashboard/hotel/actions')}>
            Нэмэх
          </Button>
        </div>
        <Spin spinning={loading}>
          {/* 🔹 Энд rowKey="id" гэж заасан */}
          <Table columns={columns} dataSource={data} rowKey="id" />
        </Spin>
      </div>
    </>
  );
};

export default Page;
