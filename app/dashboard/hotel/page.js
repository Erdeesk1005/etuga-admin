"use client";

// react
import React, { useEffect, useMemo, useState } from "react";
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
  Input,
  Tooltip,
} from "antd";
// icons
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { HotelIcon } from "@/components/icons";
const { Title, Text } = Typography;

async function apiRequest(path, options = {}) {
  const res = await fetch(`/api/${path}`, {
    credentials: "include",
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res;
}

// Green palette tag
function tagColor(tag) {
  const t = String(tag || "").toLowerCase();
  if (t.includes("hotel")) return "green";
  if (t.includes("guest")) return "cyan";
  if (t.includes("hostel")) return "geekblue";
  if (t.includes("resort")) return "lime";
  if (t.includes("apartment")) return "blue";
  if (t.includes("camp")) return "gold";
  return "default";
}

function normalizeUrl(url) {
  if (!url) return "";
  const s = String(url).trim();
  if (!s) return "";
  return s.startsWith("http") ? s : `https://${s}`;
}

const Page = () => {
  const router = useRouter();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [q, setQ] = useState("");

  useEffect(() => {
    getList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getList = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("admin/hotels");
      const json = await res.json();
      if (Array.isArray(json)) setData(json);
      else if (Array.isArray(json.data)) setData(json.data);
      else setData([]);
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
      const res = await apiRequest(`admin/hotels/${id}`, { method: "DELETE" });
      if (res.ok) {
        await getList();
        messageApi.open({ type: "success", content: "Амжилттай устгалаа" });
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error(err);
      messageApi.open({ type: "error", content: "Устгах үед алдаа гарлаа" });
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return (data || []).filter((x) => {
      const name = String(x?.name_mn ?? "").toLowerCase();
      const phone = String(x?.phone ?? "").toLowerCase();
      const email = String(x?.email ?? "").toLowerCase();
      const website = String(x?.website ?? "").toLowerCase();
      return (
        name.includes(s) ||
        phone.includes(s) ||
        email.includes(s) ||
        website.includes(s)
      );
    });
  }, [data, q]);

  const columns = [
    {
      title: "Нэр",
      dataIndex: "name_mn",
      key: "name_mn",
      width: 320,
      render: (text, record) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
           <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 mr-5 p-1  text-emerald-700 shadow-sm">
  <HotelIcon />
</div>
            <div className="flex flex-col">
              <Text className="text-[14px] font-semibold text-zinc-900">
                {text || "—"}
              </Text>
              <Text className="text-[12px] text-zinc-500">
                ID: <span className="font-mono">{record?.id ?? "—"}</span>
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Холбоо барих",
      key: "contact",
      width: 360,
      render: (_, record) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[13px] text-zinc-700">
            <PhoneOutlined className="text-zinc-400" />
            {record?.phone ? (
              <a
                className="hover:underline"
                href={`tel:${record.phone}`}
                onClick={(e) => e.stopPropagation()}
              >
                {record.phone}
              </a>
            ) : (
              <span className="text-zinc-400">—</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[13px] text-zinc-700">
            <MailOutlined className="text-zinc-400" />
            {record?.email ? (
              <a
                className="hover:underline"
                href={`mailto:${record.email}`}
                onClick={(e) => e.stopPropagation()}
              >
                {record.email}
              </a>
            ) : (
              <span className="text-zinc-400">—</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[13px] text-zinc-700">
            <GlobalOutlined className="text-zinc-400" />
            {record?.website ? (
              <a
                className="hover:underline"
                href={normalizeUrl(record.website)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {record.website}
              </a>
            ) : (
              <span className="text-zinc-400">—</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Төрөл / Tag",
      key: "amenities",
      dataIndex: "amenities",
      render: (list, record) => (
        <div className="flex flex-wrap gap-2">
          {(list || []).length ? (
            list.slice(0, 6).map((tag, idx) => (
              <Tag
                key={`${record.id}-${idx}`}
                color={tagColor(tag)}
                style={{
                  borderRadius: 999,
                  padding: "2px 10px",
                  fontSize: 12,
                  lineHeight: "18px",
                }}
              >
                {String(tag).toUpperCase()}
              </Tag>
            ))
          ) : (
            <Text className="text-zinc-400 text-[13px]">—</Text>
          )}
          {(list || []).length > 6 ? (
            <Tag
              style={{
                borderRadius: 999,
                padding: "2px 10px",
                fontSize: 12,
              }}
            >
              +{list.length - 6}
            </Tag>
          ) : null}
        </div>
      ),
    },
    {
      title: "Үйлдэл",
      key: "action",
      align: "right",
      width: 220,
      render: (_, record) => (
        <Space size={10}>
          <Tooltip title="Засах">
            <Button
              icon={<EditOutlined />}
              className="rounded-full px-4"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/hotel/actions?id=${record.id}`);
              }}
            >
              Засах
            </Button>
          </Tooltip>

          <Popconfirm
            title="Буудал устгах"
            description="Та устгахдаа итгэлтэй байна уу?"
            onConfirm={() => onDelete(record.id)}
            okText="Тийм"
            cancelText="Үгүй"
          >
            <Tooltip title="Устгах">
              <Button
                danger
                icon={<DeleteOutlined />}
                className="rounded-full px-4"
                onClick={(e) => e.stopPropagation()}
              >
                Устгах
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      {/* Premium green modern background */}
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
        {/* glow blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-lime-300/25 blur-3xl" />

        <div className="relative p-4 sm:p-6 lg:p-8">
          {/* Top header */}
          <div className="mb-5 rounded-3xl border border-emerald-100 bg-white/70 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
              
                <div>
                  <Title level={3} style={{ margin: 0 }}>
                    Буудлын жагсаалт
                  </Title>
                  <Text className="text-zinc-500 text-[13px]">
                    Удирдлагын хэсэг 
                  </Text>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  allowClear
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Хайх: нэр, утас, имэйл, вэбсайт…"
                  prefix={<SearchOutlined className="text-zinc-400" />}
                  className="w-full sm:w-[420px] rounded-2xl"
                  size="large"
                />

                <Button
                  icon={<ReloadOutlined />}
                  className="rounded-full px-5"
                  size="large"
                  onClick={getList}
                  disabled={loading}
                >
                  Шинэчлэх
                </Button>

                <Button
                type="solid"
                  icon={<PlusOutlined />}
                  size="large"
                  className="rounded-full px-5 bg-green-800"
                  onClick={() => router.push("/dashboard/hotel/actions")}
                >
                  Нэмэх
                </Button>
              </div>
            </div>

            {/* KPI chips */}
            <div className="px-5 pb-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-100 bg-white/70 p-4">
                  <div className="text-[12px] text-zinc-500">Нийт буудал</div>
                  <div className="mt-1 text-[22px] font-bold text-zinc-900">
                    {data?.length ?? 0}
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white/70 p-4">
                  <div className="text-[12px] text-zinc-500">Хайлт үр дүн</div>
                  <div className="mt-1 text-[22px] font-bold text-zinc-900">
                    {filtered?.length ?? 0}
                  </div>
                </div>
             
              </div>
            </div>
          </div>

          {/* Table card */}
          <div className="rounded-3xl border border-emerald-100 bg-white/70 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={filtered}
                rowKey="id"
                pagination={{ pageSize: 10, showSizeChanger: true }}
                className="rounded-3xl mr-10"
                onRow={(record) => ({
                  onClick: () =>
                    router.push(`/dashboard/hotel/actions?id=${record.id}`),
                })}
                rowClassName={() =>
                  "cursor-pointer transition-all hover:bg-emerald-50/70"
                }
                locale={{
                  emptyText: (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-3 h-14 w-14 rounded-3xl bg-emerald-100" />
                      <div className="text-[15px] font-semibold text-zinc-800">
                        Одоогоор жагсаалт хоосон байна
                      </div>
                      <div className="text-[13px] text-zinc-500">
                        “Нэмэх” дарж шинэ буудал бүртгэнэ үү.
                      </div>
                      <div className="mt-5">
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          size="large"
                          className="rounded-full px-6 bg-emerald-600 hover:!bg-emerald-700"
                          onClick={() => router.push("/dashboard/hotel/actions")}
                        >
                          Шинэ буудал нэмэх
                        </Button>
                      </div>
                    </div>
                  ),
                }}
              />
            </Spin>
          </div>

          {/* Bottom hint */}
          <div className="mt-4 text-[12px] text-zinc-500">
            Tip: хайлтаар шүүж, “Шинэчлэх” дарж жагсаалтаа сэргээгээрэй.
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
