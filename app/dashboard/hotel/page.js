"use client";
// react
import React, { useEffect, useState } from "react";
// next
import { useRouter } from "next/navigation";
// antd
import {
  Space,
  Table,
  Tag,
  Button,
  Popconfirm,
  message,
  Spin,
  Typography,
} from "antd";

const { Title } = Typography;

// /api → https://api.etuga.mn/api/v1 рүү rewrite хийгдэнэ
async function apiRequest(path, options = {}) {
  const res = await fetch(`/api/${path}`, {
    credentials: "include", // cookie-ээр auth хийж байгаа бол
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res;
}

const Page = () => {
  const router = useRouter();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    getList();
  }, []);

  const getList = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("admin/hotels");
      const json = await res.json();

      // backend яг шууд массив буцааж байвал json нь массив байна
      // харин { data: [...] } гэж буцааж байвал json.data-г ашиглана
      if (Array.isArray(json)) {
        setData(json);
      } else if (Array.isArray(json.data)) {
        setData(json.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      setData([]);
      messageApi.open({
        type: "error",
        content: "Буудлын жагсаалт ачааллахад алдаа гарлаа",
      });
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await apiRequest(`admin/hotels/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await getList();
        messageApi.open({
          type: "success",
          content: "Амжилттай устгалаа",
        });
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      messageApi.open({
        type: "error",
        content: "Устгах үед алдаа гарлаа",
      });
    }
  };

  const columns = [
    {
      title: "Нэр",
      dataIndex: "name_mn",
      key: "name_mn",
      render: (text) => <p>{text}</p>,
    },
    {
      title: "Утас",
      dataIndex: "phone",
      key: "phone",
      render: (text) => <p>{text}</p>,
    },
    {
      title: "Имэйл",
      dataIndex: "email",
      key: "email",
      render: (text) => <p>{text}</p>,
    },
    {
      title: "Вэбсайт",
      dataIndex: "website",
      key: "website",
      render: (text) => <p>{text}</p>,
    },
    {
      title: "Төрөл",
      key: "amenities",
      dataIndex: "amenities",
      render: (list, record) => (
        <>
          {list?.map((tag, idx) => {
            let color = tag.length > 5 ? "geekblue" : "green";
            if (tag === "loser") {
              color = "volcano";
            }
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
      title: "Үйлдэл",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            onClick={() =>
              router.push(`/dashboard/hotel/actions?id=${record.id}`)
            }
          >
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

  return (
    <>
      {contextHolder}
      <div>
        <div className="my-[40px] flex justify-between items-center">
          <Title level={4}>Буудлын жагсаалт</Title>
          <Button
            type="primary"
            onClick={() => router.push("/dashboard/hotel/actions")}
          >
            Нэмэх
          </Button>
        </div>
        <Spin spinning={loading}>
          <Table columns={columns} dataSource={data} rowKey="id" />
        </Spin>
      </div>
    </>
  );
};

export default Page;
