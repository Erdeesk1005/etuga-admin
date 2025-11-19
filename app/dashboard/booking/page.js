"use client";

// react
import React, { useEffect, useState } from "react";
// antd
import { Table, Typography, Spin, Tag, message, Select } from "antd";

const { Title } = Typography;
const { Option } = Select;

// огноо форматлагч (ISO -> уншихад амар)
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

// огноо + цаг форматлагч (created_at гэх мэтэд)
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

const statusColorMap = {
  PENDING: "gold",
  CONFIRMED: "green",
  CANCELLED: "volcano",
};

// 🔹 Backend руу явуулах боломжтой төлбөрийн төлөвүүд
const editablePaymentStatuses = ["PAID", "REFUNDED", "FAILED"];

// UNPAID байж болохоор map-ийг өргөн үлдээе
const paymentStatusColorMap = {
  UNPAID: "red",
  PAID: "green",
  REFUNDED: "geekblue",
  FAILED: "volcano",
};

// жижиг туслах fetch wrapper – /api rewrite ашиглана (GET-үүд)
async function apiGet(path) {
  const res = await fetch(`/api/${path}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

// 🔹 payment UPDATE – POST /api/admin/bookings/:id/payment
async function apiPostPayment(bookingId, body) {
  const res = await fetch(`/api/admin/bookings/${bookingId}/payment`, {
    method: "POST", // 👈 ЧИНИЙ ХЭЛСНЭЭР POST-ООР
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

const Page = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // дэлгэрэнгүй data cache
  const [details, setDetails] = useState({}); // { [bookingId]: detail }
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  // яг одоо төлбөрийн төлөв update хийж байгаа id
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);

  const getList = async () => {
    setLoading(true);
    try {
      const json = await apiGet("admin/bookings");
      setData(Array.isArray(json) ? json : json.data || []);
    } catch (err) {
      console.error(err);
      setData([]);
      messageApi.open({
        type: "error",
        content: "Захиалга ачааллахад алдаа гарлаа",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getList();
  }, []);

  const fetchDetail = async (bookingId) => {
    setDetailLoadingId(bookingId);
    try {
      const json = await apiGet(`admin/bookings/${bookingId}`);
      setDetails((prev) => ({
        ...prev,
        [bookingId]: json,
      }));
    } catch (err) {
      console.error(err);
      messageApi.open({
        type: "error",
        content: "Дэлгэрэнгүй мэдээлэл ачааллахад алдаа гарлаа",
      });
    } finally {
      setDetailLoadingId(null);
    }
  };

  const handlePaymentStatusChange = async (bookingId, newStatus) => {
    setUpdatingPaymentId(bookingId);
    try {
      await apiPostPayment(bookingId, { payment_status: newStatus });

      // list data шинэчлэх
      setData((prev) =>
        prev.map((row) =>
          row.id === bookingId ? { ...row, payment_status: newStatus } : row
        )
      );

      // details cache шинэчлэх
      setDetails((prev) => {
        if (!prev[bookingId]) return prev;
        return {
          ...prev,
          [bookingId]: {
            ...prev[bookingId],
            payment_status: newStatus,
          },
        };
      });

      messageApi.success("Төлбөрийн төлөв амжилттай шинэчлэгдлээ");
    } catch (err) {
      console.error(err);
      messageApi.error("Төлбөрийн төлөв шинэчлэхэд алдаа гарлаа");
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const columns = [
    {
      title: "Захиалгын дугаар",
      dataIndex: "public_ref",
      key: "public_ref",
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Буудал",
      dataIndex: "name_mn",
      key: "name_mn",
      render: (text, record) => (
        <span>{text || record.name_en || record.hotel_id}</span>
      ),
    },
    {
      title: "Check-in",
      dataIndex: "check_in",
      key: "check_in",
      render: (value) => formatDate(value),
    },
    {
      title: "Check-out",
      dataIndex: "check_out",
      key: "check_out",
      render: (value) => formatDate(value),
    },
    {
      title: "Зочин",
      dataIndex: "contact_name",
      key: "contact_name",
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div className="text-xs text-gray-500">
            {record.contact_phone} · {record.contact_email}
          </div>
        </div>
      ),
    },
    {
      title: "Хүн",
      dataIndex: "guests",
      key: "guests",
      width: 80,
      render: (value) => <span>{value}</span>,
    },
    {
      title: "Нийт төлбөр",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (value) => <span>{value?.toLocaleString("mn-MN")} ₮</span>,
    },
    {
      title: "Төлөв",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag color={statusColorMap[value] || "default"}>{value}</Tag>
      ),
    },
    {
      title: "Төлбөрийн төлөв",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (value, record) => {
        const selectValue = editablePaymentStatuses.includes(value)
          ? value
          : undefined;

        return (
          // ⬇️ ЭНЭ wrapper div-ийг нэмж өгнө
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Select
              size="small"
              value={selectValue}
              placeholder={value || "Сонгох"}
              style={{ minWidth: 100 }}
              onChange={(v) => handlePaymentStatusChange(record.id, v)}
              loading={updatingPaymentId === record.id}
              disabled={updatingPaymentId === record.id}
            >
              {editablePaymentStatuses.map((key) => (
                <Option key={key} value={key}>
                  <Tag color={paymentStatusColorMap[key] || "default"}>
                    {key}
                  </Tag>
                </Option>
              ))}
            </Select>
          </div>
        );
      },
    },
    {
      title: "Үүсгэсэн",
      dataIndex: "created_at",
      key: "created_at",
      render: (value) => formatDateTime(value),
    },
  ];

  const renderExpandedRow = (record) => {
    const detail = details[record.id];

    if (detailLoadingId === record.id && !detail) {
      return <div className="py-4">Дэлгэрэнгүй мэдээлэл ачаалж байна...</div>;
    }

    if (!detail) {
      return (
        <div className="py-4 text-gray-500">
          Дэлгэрэнгүй мэдээлэл олдсонгүй.
        </div>
      );
    }

    const roomColumns = [
      {
        title: "Room ID",
        dataIndex: "room_id",
        key: "room_id",
      },
      {
        title: "Гарчиг (MN)",
        dataIndex: "title_mn",
        key: "title_mn",
      },
      {
        title: "Гарчиг (EN)",
        dataIndex: "title_en",
        key: "title_en",
      },
      {
        title: "Шөнө",
        dataIndex: "nights",
        key: "nights",
      },
      {
        title: "Хүн",
        dataIndex: "guests",
        key: "guests",
      },
      {
        title: "Үнэ / шөнө",
        dataIndex: "pricePerNightMNT",
        key: "pricePerNightMNT",
        render: (v) => `${v?.toLocaleString("mn-MN")} ₮`,
      },
      {
        title: "Дүн",
        key: "subtotal",
        render: (_, r) =>
          `${(r.pricePerNightMNT * r.nights).toLocaleString("mn-MN")} ₮`,
      },
    ];

    return (
      <div className="py-4 px-2 bg-[#fafafa] rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* Ерөнхий мэдээлэл */}
          <div>
            <div className="font-semibold mb-2">Ерөнхий мэдээлэл</div>
            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">Захиалгын дугаар: </span>
                {detail.public_ref}
              </div>
              <div>
                <span className="font-medium">Буудал: </span>
                {detail.name_mn || detail.name_en || detail.hotel_id}
              </div>
              <div>
                <span className="font-medium">Check-in: </span>
                {formatDate(detail.check_in)}
              </div>
              <div>
                <span className="font-medium">Check-out: </span>
                {formatDate(detail.check_out)}
              </div>
              <div>
                <span className="font-medium">Нийт зочин: </span>
                {detail.guests}
              </div>
              <div>
                <span className="font-medium">Нийт төлбөр: </span>
                {detail.total_amount?.toLocaleString("mn-MN")} ₮
              </div>
              <div>
                <span className="font-medium">Төлөв: </span>
                <Tag color={statusColorMap[detail.status] || "default"}>
                  {detail.status}
                </Tag>
              </div>
              <div>
                <span className="font-medium ">Төлбөрийн төлөв: </span>
                <Tag
                  color={
                    paymentStatusColorMap[detail.payment_status] || "default"
                  }
                >
                  {detail.payment_status}
                </Tag>
              </div>
            </div>
          </div>

          {/* Холбоо барих */}
          <div>
            <div className="font-semibold mb-2">Холбоо барих мэдээлэл</div>
            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">Нэр: </span>
                {detail.contact_name}
              </div>
              <div>
                <span className="font-medium">Утас: </span>
                {detail.contact_phone}
              </div>
              <div>
                <span className="font-medium">Имэйл: </span>
                {detail.contact_email}
              </div>
              <div>
                <span className="font-medium">Үүсгэсэн: </span>
                {formatDateTime(detail.created_at)}
              </div>
              <div>
                <span className="font-medium">Сүүлд шинэчилсэн: </span>
                {formatDateTime(detail.updated_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Өрөөний жагсаалт */}
        <div>
          <div className="font-semibold mb-2">Өрөөний мэдээлэл</div>
          <Table
            columns={roomColumns}
            dataSource={detail.rooms || []}
            rowKey="id"
            size="small"
            pagination={false}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <div>
        <div className="my-[40px] flex justify-between items-center">
          <Title level={4}>Захиалгын жагсаалт</Title>
        </div>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            expandable={{
              expandedRowRender: renderExpandedRow,
              expandedRowKeys,
              onExpand: async (expanded, record) => {
                if (expanded) {
                  setExpandedRowKeys((prev) =>
                    prev.includes(record.id) ? prev : [...prev, record.id]
                  );
                  if (!details[record.id]) {
                    await fetchDetail(record.id);
                  }
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
    </>
  );
};

export default Page;
