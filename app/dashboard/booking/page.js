"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Table, Typography, Spin, Tag, message, Select, Input, Button, Tooltip } from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

/* ---------------- helpers ---------------- */

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function apiGet(path) {
  const res = await fetch(`/api/${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiPostPayment(bookingId, body) {
  const res = await fetch(`/api/admin/bookings/${bookingId}/payment`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/* ---------------- payment maps ---------------- */

const paymentStatusColorMap = {
  UNPAID: "red",
  PAID: "green",
  REFUNDED: "geekblue",
  FAILED: "volcano",
};

// backend руу явуулах payment сонголтууд
const editablePaymentStatuses = ["PAID", "FAILED", "REFUNDED"];
const lockedPaymentStatuses = ["PAID", "FAILED"];

/* ---------------- UI small parts ---------------- */

function PaymentTag({ value }) {
  const color = paymentStatusColorMap[value] || "default";
  const label = value || "—";

  const icon =
    value === "PAID" ? (
      <CheckCircleOutlined />
    ) : value === "FAILED" ? (
      <CloseCircleOutlined />
    ) : value === "UNPAID" ? (
      <ClockCircleOutlined />
    ) : (
      <CreditCardOutlined />
    );

  return (
    <Tag
      color={color}
      style={{
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 12,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {icon} {label}
    </Tag>
  );
}

/* ---------------- page ---------------- */

export default function Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [q, setQ] = useState("");

  const [details, setDetails] = useState({});
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);

  const getList = async () => {
    setLoading(true);
    try {
      const json = await apiGet("admin/bookings");
      setData(Array.isArray(json) ? json : json.data || []);
    } catch (err) {
      console.error(err);
      setData([]);
      messageApi.error("Захиалгын жагсаалт ачааллахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return (data || []).filter((x) => {
      const ref = String(x?.public_ref ?? "").toLowerCase();
      const hotel = String(x?.name_mn ?? x?.name_en ?? "").toLowerCase();
      const name = String(x?.contact_name ?? "").toLowerCase();
      const phone = String(x?.contact_phone ?? "").toLowerCase();
      const email = String(x?.contact_email ?? "").toLowerCase();
      const pay = String(x?.payment_status ?? "").toLowerCase();
      return (
        ref.includes(s) ||
        hotel.includes(s) ||
        name.includes(s) ||
        phone.includes(s) ||
        email.includes(s) ||
        pay.includes(s)
      );
    });
  }, [data, q]);

  const fetchDetail = async (bookingId) => {
    setDetailLoadingId(bookingId);
    try {
      const json = await apiGet(`admin/bookings/${bookingId}`);
      setDetails((prev) => ({ ...prev, [bookingId]: json }));
    } catch (err) {
      console.error(err);
      messageApi.error("Дэлгэрэнгүй мэдээлэл ачааллахад алдаа гарлаа");
    } finally {
      setDetailLoadingId(null);
    }
  };

  const patchRowLocal = (bookingId, patch) => {
    setData((prev) =>
      prev.map((row) => (row.id === bookingId ? { ...row, ...patch } : row))
    );
    setDetails((prev) => {
      if (!prev[bookingId]) return prev;
      return {
        ...prev,
        [bookingId]: { ...prev[bookingId], ...patch },
      };
    });
  };

  // ✅ Payment change (status өөрчлөх логик байхгүй)
  const handlePaymentStatusChange = async (bookingId, newStatus) => {
    setUpdatingPaymentId(bookingId);
    try {
      await apiPostPayment(bookingId, { payment_status: newStatus });
      patchRowLocal(bookingId, { payment_status: newStatus });
      messageApi.success("Төлбөрийн төлөв шинэчлэгдлээ");
    } catch (err) {
      console.error(err);
      messageApi.error("Төлбөрийн төлөв шинэчлэхэд алдаа гарлаа");
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const columns = [
    {
      title: "Захиалгын №",
      dataIndex: "public_ref",
      key: "public_ref",
      width: 170,
      render: (text) => (
        <span className="font-semibold text-zinc-900">{text || "—"}</span>
      ),
    },
    {
      title: "Буудал",
      dataIndex: "name_mn",
      key: "name_mn",
      width: 260,
      render: (text, record) => (
        <div className="flex flex-col">
          <div className="font-medium text-zinc-900">
            {text || record.name_en || record.hotel_id || "—"}
          </div>
          <div className="text-xs text-zinc-500">
            ID: <span className="font-mono">{record.hotel_id || "—"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Огноо",
      key: "dates",
      width: 220,
      render: (_, record) => (
        <div className="text-[13px] text-zinc-700">
          <div>
            <span className="text-zinc-500">Ирэх:</span>{" "}
            <span className="font-medium">{formatDate(record.check_in)}</span>
          </div>
          <div>
            <span className="text-zinc-500">Гарах:</span>{" "}
            <span className="font-medium">{formatDate(record.check_out)}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Зочин",
      dataIndex: "contact_name",
      key: "contact_name",
      width: 260,
      render: (text, record) => (
        <div>
          <div className="font-medium text-zinc-900">{text || "—"}</div>
          <div className="text-xs text-zinc-500">
            {record.contact_phone || "—"} · {record.contact_email || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Хүн",
      dataIndex: "guests",
      key: "guests",
      width: 70,
      render: (v) => <span className="font-medium">{v ?? "—"}</span>,
    },
    {
      title: "Нийт төлбөр",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 140,
      render: (v) => (
        <span className="font-semibold text-zinc-900">
          {typeof v === "number" ? v.toLocaleString("mn-MN") : v || "—"} ₮
        </span>
      ),
    },
    {
      title: "Төлбөр",
      dataIndex: "payment_status",
      key: "payment_status",
      width: 220,
      render: (value, record) => {
        const isLocked = lockedPaymentStatuses.includes(value);
        const isUpdating = updatingPaymentId === record.id;

        return (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center gap-2"
          >
            <PaymentTag value={value} />

            <Tooltip
              title={
                isLocked
                  ? "Энэ төлөв дээр түгжигдсэн (өөрчлөхгүй)"
                  : "Төлбөрийн төлөв өөрчлөх"
              }
            >
              <Select
                size="small"
                value={undefined}
                placeholder={isLocked ? "Түгжигдсэн" : "Өөрчлөх"}
                style={{ minWidth: 150 }}
                onChange={(v) => handlePaymentStatusChange(record.id, v)}
                loading={isUpdating}
                disabled={isUpdating || isLocked}
              >
                {editablePaymentStatuses.map((key) => (
                  <Option key={key} value={key} disabled={key === value}>
                    <Tag
                      color={paymentStatusColorMap[key] || "default"}
                      style={{
                        borderRadius: 999,
                        padding: "0px 8px",
                        fontSize: 12,
                        marginInlineStart: 0,
                      }}
                    >
                      {key}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "Үүсгэсэн",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (v) => <span className="text-zinc-700">{formatDateTime(v)}</span>,
    },
  ];

  const renderExpandedRow = (record) => {
    const detail = details[record.id];

    if (detailLoadingId === record.id && !detail) {
      return <div className="py-4">Дэлгэрэнгүй мэдээлэл ачаалж байна...</div>;
    }
    if (!detail) {
      return (
        <div className="py-4 text-gray-500">Дэлгэрэнгүй мэдээлэл олдсонгүй.</div>
      );
    }

    return (
      <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-sm space-y-1 text-zinc-700">
            <div className="font-semibold text-zinc-900 mb-2">Ерөнхий мэдээлэл</div>
            <div>
              <span className="text-zinc-500">Захиалгын №:</span>{" "}
              <span className="font-medium">{detail.public_ref}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Төлбөр:</span>
              <PaymentTag value={detail.payment_status} />
            </div>
          </div>

          <div className="text-sm space-y-1 text-zinc-700">
            <div className="font-semibold text-zinc-900 mb-2">Холбоо барих</div>
            <div>
              <span className="text-zinc-500">Нэр:</span>{" "}
              <span className="font-medium">{detail.contact_name}</span>
            </div>
            <div>
              <span className="text-zinc-500">Утас:</span>{" "}
              <span className="font-medium">{detail.contact_phone}</span>
            </div>
            <div>
              <span className="text-zinc-500">Имэйл:</span>{" "}
              <span className="font-medium">{detail.contact_email}</span>
            </div>
            <div>
              <span className="text-zinc-500">Үүсгэсэн:</span>{" "}
              <span className="font-medium">{formatDateTime(detail.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {contextHolder}

      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-lime-300/25 blur-3xl" />

        <div className="relative p-4 sm:p-6 lg:p-8">
          <div className="mb-5 rounded-3xl border border-emerald-100 bg-white/70 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Захиалгын жагсаалт
                </Title>
                <Text className="text-zinc-500 text-[13px]">
                  Төлбөрийн төлөв шинэчлэх (PAID / FAILED / REFUNDED)
                </Text>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  allowClear
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Хайх: захиалгын №, буудал, зочин, утас, имэйл…"
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
              </div>
            </div>
          </div>

          <div className="rounded-3xl p-5 border border-emerald-100 bg-white/70 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={filtered}
                rowKey="id"
                pagination={{ pageSize: 10, showSizeChanger: true }}
                rowClassName={() =>
                  "cursor-pointer transition-all hover:bg-emerald-50/70"
                }
                expandable={{
                  expandedRowRender: renderExpandedRow,
                  expandedRowKeys,
                  onExpand: async (expanded, record) => {
                    if (expanded) {
                      setExpandedRowKeys((prev) =>
                        prev.includes(record.id) ? prev : [...prev, record.id]
                      );
                      if (!details[record.id]) await fetchDetail(record.id);
                    } else {
                      setExpandedRowKeys((prev) =>
                        prev.filter((id) => id !== record.id)
                      );
                    }
                  },
                  expandRowByClick: true,
                }}
              />
            </Spin>
          </div>

          <div className="mt-4 text-[12px] text-zinc-500">
            Tip: PAID / FAILED болсон мөр дээр төлбөрийн төлөв түгжигдэнэ.
          </div>
        </div>
      </div>
    </>
  );
}
