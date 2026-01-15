"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Typography, Spin, message } from "antd";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const { Title, Text } = Typography;

// --- helper: api request (cookie auth) ---
async function apiRequest(path, options = {}) {
  const res = await fetch(`/api/${path}`, {
    credentials: "include",
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res;
}

// --- helpers: date ---
function parseAnyDate(v) {
  if (!v) return null;
  // number timestamp
  if (typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  // string date
  if (typeof v === "string") {
    // ISO or yyyy-mm-dd etc.
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;

    // sometimes "2026-01-15 10:00:00"
    const try2 = new Date(v.replace(" ", "T"));
    if (!isNaN(try2.getTime())) return try2;
  }
  return null;
}

function monthKey(d) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1; // 1..12
  return `${y}-${String(m).padStart(2, "0")}`;
}

function monthLabel(key) {
  // "2026-01" -> "Jan"
  const m = Number(key.split("-")[1]);
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return names[m - 1] || key;
}

function lastNMonthsKeys(n = 6) {
  const now = new Date();
  const keys = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

// --- helpers: hotel type normalization ---
function normalizeType(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "unknown";

  if (s.includes("guest")) return "guesthouse";
  if (s.includes("apartment") || s.includes("apt")) return "apartment";
  if (s.includes("resort")) return "resort";
  if (s.includes("hostel")) return "hostel";
  if (s.includes("hotel")) return "hotel";
  if (s.includes("camp")) return "camp";

  // mn variants (optional)
  if (s.includes("зочин")) return "guesthouse";
  if (s.includes("апарт")) return "apartment";
  if (s.includes("буудал")) return "hotel";
  if (s.includes("жуулчны бааз") || s.includes("ресорт")) return "resort";

  return s; // fallback: keep original
}

function pickHotelType(h) {
  // try common fields
  const candidates = [
    h?.type,
    h?.hotel_type,
    h?.property_type,
    h?.category,
    h?.kind,
    h?.type_slug,
    h?.type_en,
    h?.type_mn,
  ].filter(Boolean);

  if (candidates.length) return normalizeType(candidates[0]);

  // sometimes stored in amenities like ["guesthouse", ...]
  if (Array.isArray(h?.amenities)) {
    const hit = h.amenities.find((x) => {
      const t = normalizeType(x);
      return ["guesthouse", "apartment", "hotel", "resort", "hostel", "camp"].includes(t);
    });
    if (hit) return normalizeType(hit);
  }

  return "unknown";
}

function pickBookingDate(b) {
  // choose most “meaningful” date for trend:
  // created_at OR createdAt OR booking_date OR check_in OR start_date ...
  const fields = [
    b?.created_at,
    b?.createdAt,
    b?.created,
    b?.booking_date,
    b?.bookingDate,
    b?.check_in,
    b?.checkIn,
    b?.start_date,
    b?.startDate,
    b?.date,
    b?.ts,
    b?.timestamp,
  ];

  for (const v of fields) {
    const d = parseAnyDate(v);
    if (d) return d;
  }
  return null;
}

// safe array extraction
function extractArray(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.items)) return json.items;
  if (Array.isArray(json?.results)) return json.results;
  return [];
}

export default function DashboardPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      // ✅ endpoints: өөр байвал доорх 2 мөрийг л солино
      const [hRes, bRes] = await Promise.all([
        apiRequest("admin/hotels"),
        apiRequest("admin/bookings"),
      ]);

      const hJson = await hRes.json();
      const bJson = await bRes.json();

      setHotels(extractArray(hJson));
      setBookings(extractArray(bJson));
    } catch (e) {
      console.error(e);
      messageApi.open({
        type: "error",
        content:
          "Dashboard дата татахад алдаа гарлаа (hotels / bookings endpoint шалгаарай)",
      });
      setHotels([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // --- KPI ---
  const totalHotels = hotels.length;

  const todayBookings = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    return (bookings || []).filter((b) => {
      const bd = pickBookingDate(b);
      if (!bd) return false;
      return (
        bd.getFullYear() === y &&
        bd.getMonth() === m &&
        bd.getDate() === d
      );
    }).length;
  }, [bookings]);

  // --- Pie: hotel types ---
  const hotelTypes = useMemo(() => {
    const map = new Map();
    (hotels || []).forEach((h) => {
      const t = pickHotelType(h);
      map.set(t, (map.get(t) || 0) + 1);
    });

    // nice order: guesthouse, apartment, hotel, resort, hostel, camp, unknown
    const order = [
      "guesthouse",
      "apartment",
      "hotel",
      "resort",
      "hostel",
      "camp",
      "unknown",
    ];

    const arr = Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    arr.sort((a, b) => {
      const ia = order.indexOf(a.name);
      const ib = order.indexOf(b.name);
      if (ia === -1 && ib === -1) return b.value - a.value;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    return arr;
  }, [hotels]);

  // --- Bar: bookings last 6 months ---
  const bookingsData = useMemo(() => {
    const months = lastNMonthsKeys(6);
    const counts = Object.fromEntries(months.map((k) => [k, 0]));

    (bookings || []).forEach((b) => {
      const d = pickBookingDate(b);
      if (!d) return;
      const k = monthKey(d);
      if (k in counts) counts[k] += 1;
    });

    return months.map((k) => ({
      name: monthLabel(k),
      value: counts[k],
      key: k,
    }));
  }, [bookings]);

  // --- optional: energyData (if you don't have real energy, keep mock) ---
  const energyData = useMemo(
    () => [
      { day: "Mon", pv: 12, grid: 6, usage: 14 },
      { day: "Tue", pv: 18, grid: 4, usage: 16 },
      { day: "Wed", pv: 22, grid: 3, usage: 17 },
      { day: "Thu", pv: 17, grid: 5, usage: 15 },
      { day: "Fri", pv: 25, grid: 2, usage: 18 },
      { day: "Sat", pv: 28, grid: 2, usage: 19 },
      { day: "Sun", pv: 21, grid: 4, usage: 16 },
    ],
    []
  );

  // pie colors (subtle)
  const pieColors = ["#10b981", "#84cc16", "#34d399", "#059669", "#0ea5e9", "#f59e0b", "#a1a1aa"];

  return (
    <>
      {contextHolder}

      <Spin spinning={loading}>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Title level={3} style={{ margin: 0 }}>
                Dashboard
              </Title>
              <Text className="text-zinc-500">
                Hotels + Bookings real data (API)
              </Text>
            </div>

            <button
              onClick={loadAll}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-[13px] font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
              type="button"
            >
              Refresh
            </button>
          </div>

          {/* KPI cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Нийт буудал" value={String(totalHotels)} sub="Hotels" />
            <KpiCard title="Өнөөдрийн захиалга" value={String(todayBookings)} sub="Bookings today" />
            <KpiCard title="Сүүлийн 6 сарын захиалга" value={String((bookings || []).length)} sub="Total bookings (loaded)" />
            <KpiCard
              title="Type count"
              value={String(hotelTypes.length)}
              sub="Guesthouse / Apartment / ..."
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Area (optional mock) */}
            <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm lg:col-span-2">
              <div className="mb-2">
                <div className="text-[14px] font-semibold text-zinc-900">
                  Energy overview (placeholder)
                </div>
                <div className="text-[12px] text-zinc-500">
                  Одоохондоо mock • Дараа нь energy API холбоно
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={energyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="pv" />
                    <Area type="monotone" dataKey="grid" />
                    <Area type="monotone" dataKey="usage" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie (real) */}
            <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="mb-2">
                <div className="text-[14px] font-semibold text-zinc-900">
                  Property types (real)
                </div>
                <div className="text-[12px] text-zinc-500">
                  Guesthouse / Apartment / Hotel / ...
                </div>
              </div>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={hotelTypes}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {hotelTypes.map((_, i) => (
                        <Cell key={i} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {hotelTypes.map((x, i) => (
                  <span
                    key={x.name}
                    className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-zinc-50 px-3 py-1 text-[12px] text-zinc-700"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: pieColors[i % pieColors.length] }}
                    />
                    {x.name}: <b>{x.value}</b>
                  </span>
                ))}
              </div>
            </div>

            {/* Bar (real) */}
            <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm lg:col-span-3">
              <div className="mb-2">
                <div className="text-[14px] font-semibold text-zinc-900">
                  Bookings trend (real)
                </div>
                <div className="text-[12px] text-zinc-500">
                  Сүүлийн 6 сар • bookings endpoint-оос
                </div>
              </div>

              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 text-[12px] text-zinc-500">
                Loaded bookings: <b>{bookings.length}</b> • Hotels: <b>{hotels.length}</b>
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </>
  );
}

function KpiCard({ title, value, sub }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="text-[12px] text-zinc-500">{title}</div>
      <div className="mt-1 text-[24px] font-bold text-zinc-900">{value}</div>
      <div className="mt-1 text-[12px] text-zinc-500">{sub}</div>
    </div>
  );
}
