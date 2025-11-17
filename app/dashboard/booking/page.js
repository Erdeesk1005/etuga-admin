'use client';

// react
import React, { useEffect, useContext, useState } from 'react';
// next
import { useRouter } from 'next/navigation';
// antd
import {
  Table,
  Typography,
  Spin,
  Tag,
  message,
} from 'antd';
// context
import { AuthContext } from '@/context/auth/authContext';

const { Title } = Typography;

// огноо форматлагч (ISO -> уншихад амар)
function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// огноо + цаг форматлагч (created_at гэх мэтэд)
function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusColorMap = {
  PENDING: 'gold',
  CONFIRMED: 'green',
  CANCELLED: 'volcano',
};

const paymentStatusColorMap = {
  UNPAID: 'red',
  PAID: 'green',
  REFUNDED: 'geekblue',
};

const Page = () => {
  const router = useRouter();
  const {
    authFunc: { GET },
  } = useContext(AuthContext);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // дэлгэрэнгүй data cache
  const [details, setDetails] = useState({}); // { [bookingId]: detail }
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  // bookings list авах
  const getList = async () => {
    setLoading(true);
    const res = await GET('admin/bookings');

    if (res?.data) {
      setData(res.data);
    } else {
      setData([]);
      messageApi.open({
        type: 'error',
        content: 'Захиалга ачааллахад алдаа гарлаа',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    getList();
  }, []);

  // нэг booking-ийн дэлгэрэнгүй авах
  const fetchDetail = async (bookingId) => {
    setDetailLoadingId(bookingId);
    const res = await GET(`admin/bookings/${bookingId}`);
    if (res?.data) {
      setDetails((prev) => ({
        ...prev,
        [bookingId]: res.data,
      }));
    } else {
      messageApi.open({
        type: 'error',
        content: 'Дэлгэрэнгүй мэдээлэл ачааллахад алдаа гарлаа',
      });
    }
    setDetailLoadingId(null);
  };

  const columns = [
    {
      title: 'Захиалгын дугаар',
      dataIndex: 'public_ref',
      key: 'public_ref',
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: 'Буудал',
      dataIndex: 'name_mn',
      key: 'name_mn',
      render: (text, record) => (
        <span>{text || record.name_en || record.hotel_id}</span>
      ),
    },
    {
      title: 'Check-in',
      dataIndex: 'check_in',
      key: 'check_in',
      render: (value) => formatDate(value),
    },
    {
      title: 'Check-out',
      dataIndex: 'check_out',
      key: 'check_out',
      render: (value) => formatDate(value),
    },
    {
      title: 'Зочин',
      dataIndex: 'contact_name',
      key: 'contact_name',
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
      title: 'Хүн',
      dataIndex: 'guests',
      key: 'guests',
      width: 80,
      render: (value) => <span>{value}</span>,
    },
    {
      title: 'Нийт төлбөр',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (value) => (
        <span>{value?.toLocaleString('mn-MN')} ₮</span>
      ),
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      key: 'status',
      render: (value) => (
        <Tag color={statusColorMap[value] || 'default'}>
          {value}
        </Tag>
      ),
    },
    {
      title: 'Төлбөрийн төлөв',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (value) => (
        <Tag color={paymentStatusColorMap[value] || 'default'}>
          {value}
        </Tag>
      ),
    },
    {
      title: 'Үүсгэсэн',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value) => formatDateTime(value),
    },
  ];

  // өргөтгөсөн мөр дотор харагдах UI
  const renderExpandedRow = (record) => {
    const detail = details[record.id];

    // ачаалж байхад
    if (detailLoadingId === record.id && !detail) {
      return <div className="py-4">Дэлгэрэнгүй мэдээлэл ачаалж байна...</div>;
    }

    // detail байхгүй, алдаа гарсан эсвэл хараахан аваагүй байвал
    if (!detail) {
      return (
        <div className="py-4 text-gray-500">
          Дэлгэрэнгүй мэдээлэл олдсонгүй.
        </div>
      );
    }

    // rooms жижиг хүснэгт
    const roomColumns = [
      {
        title: 'Room ID',
        dataIndex: 'room_id',
        key: 'room_id',
      },
      {
        title: 'Гарчиг (MN)',
        dataIndex: 'title_mn',
        key: 'title_mn',
      },
      {
        title: 'Гарчиг (EN)',
        dataIndex: 'title_en',
        key: 'title_en',
      },
      {
        title: 'Шөнө',
        dataIndex: 'nights',
        key: 'nights',
      },
      {
        title: 'Хүн',
        dataIndex: 'guests',
        key: 'guests',
      },
      {
        title: 'Үнэ / шөнө',
        dataIndex: 'pricePerNightMNT',
        key: 'pricePerNightMNT',
        render: (v) => `${v?.toLocaleString('mn-MN')} ₮`,
      },
      {
        title: 'Дүн',
        key: 'subtotal',
        render: (_, r) =>
          `${(r.pricePerNightMNT * r.nights).toLocaleString('mn-MN')} ₮`,
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
                {detail.total_amount?.toLocaleString('mn-MN')} ₮
              </div>
              <div>
                <span className="font-medium">Төлөв: </span>
                <Tag color={statusColorMap[detail.status] || 'default'}>
                  {detail.status}
                </Tag>
              </div>
              <div>
                <span className="font-medium">Төлбөрийн төлөв: </span>
                <Tag
                  color={
                    paymentStatusColorMap[detail.payment_status] ||
                    'default'
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
                  // expand хийгдэж байвал дэлгэрэнгүйг дуудаж cache хийх
                  setExpandedRowKeys((prev) =>
                    prev.includes(record.id)
                      ? prev
                      : [...prev, record.id]
                  );
                  if (!details[record.id]) {
                    await fetchDetail(record.id);
                  }
                } else {
                  // collapse
                  setExpandedRowKeys((prev) =>
                    prev.filter((id) => id !== record.id)
                  );
                }
              },
              expandRowByClick: true, // мөрөн дээр дараад expand/collapse
            }}
          />
        </Spin>
      </div>
    </>
  );
};

export default Page;
