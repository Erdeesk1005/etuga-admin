"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Typography,
  Form,
  Input,
  Spin,
  Button,
  message,
  InputNumber,
  Select,
  Card,
  Divider,
  Affix,
  Tag,
  Tooltip,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { FILE_URL } from "@/utils/config";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

// ==== ТОГТМОЛ ХОЛБОО БАРИХ (ӨӨРЧЛӨХГҮЙ) ====
const FIXED_PHONE = "89196371";
const FIXED_EMAIL = "info@etuga.mn";

// AMENITY option-ууд
const AMENITY_OPTIONS = [
  { value: "smoke", label: "Тамхи татах боломжтой", mn: "Тамхи татах боломжтой өрөө", en: "Smoking room available" },
  { value: "wifi", label: "Wi-Fi", mn: "Үнэгүй Wi-Fi", en: "Free Wi-Fi" },
  { value: "parking", label: "Зогсоол", mn: "Үнэгүй зогсоол", en: "Free parking" },
  { value: "rooms", label: "Гэр бүлийн өрөө", mn: "Гэр бүлийн өрөө", en: "Family rooms" },
  { value: "hub", label: "Нийтлэг амрах хэсэг", mn: "Нийтлэг амрах хэсэг", en: "Common lounge" },
  { value: "tv", label: "ТВ", mn: "ТВ, кино үзэх боломжтой", en: "TV available" },
  { value: "washingmachine", label: "Угаалгын машин", mn: "Угаалгын машин", en: "Washing machine" },
  { value: "kitchen", label: "Гал тогоо", mn: "Гал тогоо ашиглах боломжтой", en: "Kitchen access" },
  { value: "airport", label: "Нисэхийн тосолт", mn: "Нисэхийн трансфер", en: "Airport shuttle" },
  { value: "towels", label: "Алчуур/даавуу", mn: "Алчуур, орны даавуу", en: "Towels & linens" },
];

function getAmenityDefaults(value) {
  return AMENITY_OPTIONS.find((opt) => opt.value === value) || {};
}

// --- API helper ---
async function apiGet(path) {
  const res = await fetch(`/api/${path}`, { credentials: "include" });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}
async function apiPost(path, body) {
  const res = await fetch(`/api/${path}`, { method: "POST", body, credentials: "include" });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}
async function apiPut(path, body) {
  const res = await fetch(`/api/${path}`, { method: "PUT", body, credentials: "include" });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);

  // зураг
  const [files, setFiles] = useState([]);
  // map iframe src
  const [mapSrc, setMapSrc] = useState("");

  // MAP SRC үүсгэх
  const updateMap = (lat, lng) => {
    if (!lat || !lng) {
      setMapSrc("");
      return;
    }
    const dLat = 0.02;
    const dLng = 0.02;
    const minLng = lng - dLng;
    const minLat = lat - dLat;
    const maxLng = lng + dLng;
    const maxLat = lat + dLat;

    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lng}`;
    setMapSrc(url);
  };

  // INITIAL LOAD
  useEffect(() => {
    if (id) onDetail(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // DETAIL
  const onDetail = async (hotelId) => {
    if (loading) return;
    setLoading(true);

    const res = await apiGet(`admin/hotels/${hotelId}`);

    if (res.status === 200 && res.data) {
      const cloned = JSON.parse(JSON.stringify(res.data));

      // AMENITIES parse (хуучин format-уудыг хамгаалах)
      if (!cloned?.AMENITIES) {
        cloned.AMENITIES = [];
      } else if (Array.isArray(cloned.AMENITIES)) {
        const first = cloned.AMENITIES[0];
        if (first && first.title !== undefined) {
          // [{title,mn,en}] бол OK
        } else {
          // [{ wifi: {mn,en}}] -> [{title:'wifi',mn,en}]
          const arr = [];
          cloned.AMENITIES.forEach((el) => {
            Object.entries(el).forEach(([key, value]) => {
              arr.push({ title: key, mn: value?.mn, en: value?.en });
            });
          });
          cloned.AMENITIES = arr;
        }
      } else if (typeof cloned.AMENITIES === "string") {
        let parsed = [];
        try {
          parsed = JSON.parse(cloned.AMENITIES);
        } catch (e) {
          cloned.AMENITIES = [];
        }
        if (Array.isArray(parsed)) {
          const arr = [];
          parsed.forEach((el) => {
            Object.entries(el).forEach(([key, value]) => {
              arr.push({ title: key, mn: value?.mn, en: value?.en });
            });
          });
          cloned.AMENITIES = arr;
        }
      }

      // floors -> rooms (хуучин бүтэцтэй байж магадгүй)
      if (cloned?.floors?.length > 0) {
        cloned.rooms = cloned.floors;
      }
      if (!Array.isArray(cloned.rooms)) cloned.rooms = [];

      // images preview
      if (cloned.images?.length > 0) {
        setFiles(cloned.images.map((el) => ({ localUrl: `${FILE_URL}${el}` })));
      } else {
        setFiles([]);
      }

      // CONTACT FIXED
      cloned.phone = FIXED_PHONE;
      cloned.email = FIXED_EMAIL;

      form.setFieldsValue(cloned);

      if (cloned.lat && cloned.lng) updateMap(Number(cloned.lat), Number(cloned.lng));
    } else {
      messageApi.open({ type: "error", content: "Мэдээлэл татахад алдаа гарлаа" });
    }

    setLoading(false);
  };

  // SUBMIT
  const onFinish = async (values) => {
    if (loading) return;
    setLoading(true);

    const cloned = JSON.parse(JSON.stringify(values));

    // CONTACT override
    cloned.phone = FIXED_PHONE;
    cloned.email = FIXED_EMAIL;

    // AMENITIES -> backend structure [{key:{mn,en}}]
    if (cloned.AMENITIES) {
      const arr = cloned.AMENITIES.map((el) => {
        const defaults = getAmenityDefaults(el.title);
        const mn = el.mn || defaults.mn || "";
        const en = el.en || defaults.en || "";
        return { [el.title]: { mn, en } };
      });
      cloned.AMENITIES = arr;
    }

    const formData = new FormData();

    for (const [key, value] of Object.entries(cloned)) {
      if (value === undefined || value === null || value === "") continue;

      if (key === "rooms" || key === "AMENITIES") {
        // ✅ rooms дотор roomCount бүгд явна
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }

    // олон зураг formData руу
    if (files?.length > 0) {
      files.forEach((el) => {
        if (el?.name) formData.append("files", el);
      });
    }

    let res = null;
    if (id) res = await apiPut(`admin/hotels/${id}`, formData);
    else res = await apiPost("admin/hotels", formData);

    if (res?.status === 201 || res?.status === 200) {
      messageApi.open({ type: "success", content: "Амжилттай хадгаллаа" });
      router.push("/dashboard/hotel");
    } else {
      messageApi.open({ type: "error", content: "Хадгалах үед алдаа гарлаа" });
    }

    setLoading(false);
  };

  // IMAGE HANDLERS
  const handleChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const mapped = selectedFiles.map((file) => {
      file.localUrl = URL.createObjectURL(file);
      return file;
    });
    setFiles((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const onDeleteFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isEdit = Boolean(id);

  // ----------- UI: Давуу тал нэмэх helper -----------
  const addAmenity = (val) => {
    const current = form.getFieldValue("AMENITIES") || [];
    const used = current.map((x) => x?.title).filter(Boolean);
    if (used.includes(val)) return;

    const d = getAmenityDefaults(val);
    form.setFieldsValue({
      AMENITIES: [...current, { title: val, mn: d.mn, en: d.en }],
    });
  };

  const removeAmenityByIndex = (idx) => {
    const current = form.getFieldValue("AMENITIES") || [];
    const next = current.filter((_, i) => i !== idx);
    form.setFieldsValue({ AMENITIES: next });
  };

  return (
    <>
      {contextHolder}

      <Spin spinning={loading}>
        {/* Header */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {isEdit ? "Буудлын мэдээлэл засах" : "Шинэ буудал нэмэх"}
            </Title>
            <Text type="secondary">Заавал биш хэсгийг дараа нь бөглөж болно.</Text>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => router.push("/dashboard/hotel")}>Буцах</Button>
            <Button type="primary" className="bg-emerald-600 hover:!bg-emerald-700" onClick={() => form.submit()}>
              {isEdit ? "Хадгалах" : "Нэмэх"}
            </Button>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{
            phone: FIXED_PHONE,
            email: FIXED_EMAIL,
            AMENITIES: [],
            rooms: [],
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-8 space-y-6">
              {/* 1) Ерөнхий мэдээлэл */}
              <Card className="rounded-2xl" title="1) Ерөнхий мэдээлэл">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item label="Төрөл" name="type" rules={[{ required: true, message: "Төрөл сонгоно уу!" }]}>
                    <Select placeholder="Төрөл сонгох">
                      <Option value="guesthouse">Гэстхаус</Option>
                      <Option value="apartment">Апартмент</Option>
                     
                    </Select>
                  </Form.Item>

                  <Form.Item label="Вэбсайт / Линк (сонголт)" name="website" rules={[]}>
                    <Input placeholder="https://... (заавал биш)" />
                  </Form.Item>
                </div>

                <Divider className="my-3" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item label="Нэр (MN)" name="name_mn" rules={[{ required: true, message: "Нэр (MN) оруулна уу!" }]}>
                    <Input placeholder="Монгол нэр" />
                  </Form.Item>

                  <Form.Item label="Нэр (EN) (сонголт)" name="name_en" rules={[]}>
                    <Input placeholder="English name (сонголт)" />
                  </Form.Item>
                </div>

                <Divider className="my-3" />

                {/* тоон үзүүлэлтүүд (сонголт болгосон) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Form.Item label="Давхар (сонголт)" name="floors" rules={[]}>
                    <InputNumber className="w-full" min={0} placeholder="Жишээ: 3" />
                  </Form.Item>
                  <Form.Item label="Нийт багтаамж (сонголт)" name="max_guests" rules={[]}>
                    <InputNumber className="w-full" min={0} placeholder="Жишээ: 10" />
                  </Form.Item>
                  <Form.Item label="Өрөөний тоо (сонголт)" name="bedrooms" rules={[]}>
                    <InputNumber className="w-full" min={0} placeholder="Жишээ: 5" />
                  </Form.Item>
                  <Form.Item label="Орны тоо (сонголт)" name="beds" rules={[]}>
                    <InputNumber className="w-full" min={0} placeholder="Жишээ: 8" />
                  </Form.Item>
                  <Form.Item label="Үнэ (сонголт)" name="price" rules={[]}>
                    <InputNumber className="w-full" min={0} placeholder="₮" />
                  </Form.Item>
                  <Form.Item label="Үнэлгээ (сонголт)" name="rating" rules={[]}>
                    <InputNumber className="w-full" min={0} max={5} step={0.1} placeholder="0-5" />
                  </Form.Item>
                </div>
              </Card>
   <Divider className="my-3" />
              {/* 2) Холбоо барих */}
              <Card className="rounded-2xl" title="2) Холбоо барих мэдээлэл">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item label="Утас (тогтмол)" name="phone">
                    <Input disabled />
                  </Form.Item>
                  <Form.Item label="Имэйл (тогтмол)" name="email">
                    <Input disabled />
                  </Form.Item>
                </div>
              </Card>
   <Divider className="my-3" />
              {/* 3) Тайлбар */}
              <Card className="rounded-2xl" title="3) Тайлбар">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item label="Тайлбар (MN)" name="description_mn" rules={[{ required: true, message: "Тайлбар (MN) оруулна уу!" }]}>
                    <TextArea rows={4} placeholder="Монгол тайлбар" />
                  </Form.Item>

                  <Form.Item label="Тайлбар (EN) (сонголт)" name="description_en" rules={[]}>
                    <TextArea rows={4} placeholder="English description (сонголт)" />
                  </Form.Item>
                </div>
              </Card>
   <Divider className="my-3" />
              {/* 4) Хаяг + Map */}
              <Card className="rounded-2xl" title="4) Хаяг ба газрын зураг">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item label="Аймаг/Хот (MN)" name="city_name" rules={[{ required: true, message: "Аймаг/Хот оруулна уу!" }]}>
                    <Input placeholder="Улаанбаатар гэх мэт" />
                  </Form.Item>

                  <Form.Item label="Аймаг/Хот (EN) (сонголт)" name="city_name_en" rules={[]}>
                    <Input placeholder="Ulaanbaatar (сонголт)" />
                  </Form.Item>

                  <Form.Item label="Дэлгэрэнгүй хаяг (MN)" name="address_line1" rules={[{ required: true, message: "Дэлгэрэнгүй хаяг оруулна уу!" }]}>
                    <Input placeholder="Дүүрэг, хороо, байр..." />
                  </Form.Item>

                  <Form.Item label="Дэлгэрэнгүй хаяг (EN) (сонголт)" name="address_line1_en" rules={[]}>
                    <Input placeholder="Optional (сонголт)" />
                  </Form.Item>
                </div>

                <Divider className="my-3" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item label="Latitude (lat)" name="lat" rules={[{ required: true, message: "Lat оруулна уу!" }]}>
                    <InputNumber
                      className="w-full"
                      step={0.000001}
                      placeholder="47.9188"
                      onChange={(val) => {
                        const lng = form.getFieldValue("lng");
                        if (val && lng) updateMap(Number(val), Number(lng));
                        else updateMap(null, null);
                      }}
                    />
                  </Form.Item>

                  <Form.Item label="Longitude (lng)" name="lng" rules={[{ required: true, message: "Lng оруулна уу!" }]}>
                    <InputNumber
                      className="w-full"
                      step={0.000001}
                      placeholder="106.9175"
                      onChange={(val) => {
                        const lat = form.getFieldValue("lat");
                        if (lat && val) updateMap(Number(lat), Number(val));
                        else updateMap(null, null);
                      }}
                    />
                  </Form.Item>
                </div>

                <div className="mt-3 w-full h-[360px] rounded-xl overflow-hidden border bg-white">
                  {mapSrc ? (
                    <iframe src={mapSrc} width="100%" height="100%" loading="lazy" style={{ border: 0 }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Lat/Lng оруулсны дараа газрын зураг гарна
                    </div>
                  )}
                </div>
              </Card>
<div className="my-10"></div>
              {/* 5) Давуу тал (Card UI эвтэйхэн) */}
              <Card
                className="rounded-2xl"
                title="5) Давуу тал (сонголт)"
                extra={<Text type="secondary">Сонгоод “Нэмэх” дарна</Text>}
              >
                <Form.List name="AMENITIES">
                  {(fields) => (
                    <>
                      {/* Selected tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(form.getFieldValue("AMENITIES") || []).length ? (
                          (form.getFieldValue("AMENITIES") || []).map((a, idx) => {
                            const opt = AMENITY_OPTIONS.find((x) => x.value === a?.title);
                            return (
                              <Tag
                                key={`${a?.title}-${idx}`}
                                color="green"
                                closable
                                onClose={(e) => {
                                  e.preventDefault();
                                  removeAmenityByIndex(idx);
                                }}
                                className="rounded-full px-3 py-1"
                              >
                                {opt?.label || a?.title}
                              </Tag>
                            );
                          })
                        ) : (
                          <Text type="secondary">Одоогоор давуу тал сонгоогүй байна.</Text>
                        )}
                      </div>

                      <Divider className="my-3" />

                      {/* Add row */}
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <Select
                          placeholder="Давуу тал сонгох"
                          style={{ width: 260 }}
                          onChange={(val) => addAmenity(val)}
                        >
                          {AMENITY_OPTIONS.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                              {opt.label}
                            </Option>
                          ))}
                        </Select>

                        <Text type="secondary">
                          MN/EN тайлбар автоматаар тохирно (backend-д зөв бүтэцтэй явна).
                        </Text>
                      </div>

                      {/* Hidden fields for submit */}
                      <div className="hidden">
                        {fields.map((f) => (
                          <div key={f.key}>
                            <Form.Item name={[f.name, "title"]} />
                            <Form.Item name={[f.name, "mn"]} />
                            <Form.Item name={[f.name, "en"]} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Form.List>
              </Card>
<div className="my-10"></div>
              {/* 6) Өрөө (Card UI эвтэйхэн) */}
              <Card
                className="rounded-2xl"
                title="6) Өрөөний мэдээлэл (сонголт)"
                extra={<Text type="secondary">Өрөө бүр тусдаа card</Text>}
              >
                <Form.List name="rooms">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.length === 0 ? (
                        <div className="rounded-xl border border-dashed p-4 text-gray-500">
                          Одоогоор өрөө нэмээгүй байна. Доорх “Өрөө нэмэх” дарж эхлүүлнэ үү.
                        </div>
                      ) : null}

                      <div className="space-y-4 mt-3">
                        {fields.map((field, index) => (
                          <Card
                            key={field.key}
                            className="rounded-xl border"
                            title={`Өрөө #${index + 1}`}
                            extra={
                              <Button danger type="text" onClick={() => remove(field.name)}>
                                Устгах
                              </Button>
                            }
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Form.Item
                                name={[field.name, "title", "mn"]}
                                label="Өрөөний нэр (MN)"
                                rules={[{ required: true, message: "Өрөөний нэр (MN) оруул" }]}
                              >
                                <Input placeholder="Жишээ: Deluxe өрөө" />
                              </Form.Item>

                              <Form.Item name={[field.name, "title", "en"]} label="Өрөөний нэр (EN) (сонголт)" rules={[]}>
                                <Input placeholder="сонголт" />
                              </Form.Item>

                              <Form.Item
                                name={[field.name, "pricePerNightMNT"]}
                                label="1 хоногийн үнэ (₮)"
                                rules={[{ required: true, message: "Үнэ оруул" }]}
                              >
                                <InputNumber className="w-full" min={0} />
                              </Form.Item>

                              <Form.Item
                                name={[field.name, "roomCount"]}
                                label={
                                  <span>
                                    Боломжит өрөөний тоо{" "}
                                    <Tooltip title="Энэ нь тухайн room type-оос хэдэн өрөө сул байгааг илэрхийлнэ.">
                                      <span className="text-gray-400">(?)</span>
                                    </Tooltip>
                                  </span>
                                }
                                rules={[{ required: true, message: "Боломжит өрөөний тоо оруул" }]}
                              >
                                <InputNumber className="w-full" min={0} placeholder="Жишээ: 2" />
                              </Form.Item>

                              <Form.Item
                                name={[field.name, "capacity"]}
                                label="Багтаамж (хүн)"
                                rules={[{ required: true, message: "Багтаамж оруул" }]}
                              >
                                <InputNumber className="w-full" min={0} />
                              </Form.Item>

                              <Form.Item
                                name={[field.name, "beds"]}
                                label="Орны тоо"
                                rules={[{ required: true, message: "Орны тоо оруул" }]}
                              >
                                <InputNumber className="w-full" min={0} />
                              </Form.Item>

                              <Form.Item
                                name={[field.name, "areaM2"]}
                                label="Талбай (м²)"
                                rules={[{ required: true, message: "Талбай оруул" }]}
                              >
                                <InputNumber className="w-full" min={0} />
                              </Form.Item>

                              <Form.Item name={[field.name, "floor"]} label="Давхар" rules={[{ required: true, message: "Давхар оруул" }]}>
                                <InputNumber className="w-full" min={0} />
                              </Form.Item>

                              <Form.Item name={[field.name, "room"]} label="Өрөө №" rules={[{ required: true, message: "Өрөө № оруул" }]}>
                                <InputNumber className="w-full" min={0} />
                              </Form.Item>

                              <Form.Item name={[field.name, "blurb", "mn"]} label="Товч тайлбар (сонголт)" rules={[]}>
                                <Input placeholder="сонголт" />
                              </Form.Item>
                            </div>
                          </Card>
                        ))}
                      </div>

                      <div className="mt-4">
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() =>
                            add({
                              title: { mn: "", en: "" },
                              pricePerNightMNT: 0,
                              capacity: 0,
                              beds: 0,
                              areaM2: 0,
                              roomCount: 0,
                              floor: 0,
                              room: 0,
                              blurb: { mn: "", en: "" },
                              discounts: [],
                            })
                          }
                          className="w-full rounded-xl"
                        >
                          Өрөө нэмэх
                        </Button>
                      </div>
                    </>
                  )}
                </Form.List>
              </Card>
<div className="my-10"></div>
              {/* 7) Зураг */}
              <Card className="rounded-2xl mt-20" title="7) Зураг (сонголт)">
                <div className="space-y-4">
                  <label className="block w-fit cursor-pointer">
                    <div className="bg-[#f7f7f7] hover:bg-[#efefef] transition-all border border-dashed rounded-xl px-6 py-3 text-sm">
                      Зураг сонгох (олон зураг)
                    </div>
                    <input type="file" multiple accept="image/*" onChange={handleChange} className="hidden" />
                  </label>

                  <div className="flex flex-wrap gap-5">
                    {files.map((el, index) => (
                      <div key={el.id || el.localUrl || index} className="relative w-[250px] rounded-xl overflow-hidden shadow hover:shadow-lg transition-all bg-white border">
                        <img src={el.localUrl} alt="uploaded" className="w-full h-[150px] object-cover" />
                        <button
                          type="button"
                          onClick={() => onDeleteFile(index)}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-red-500 hover:text-white transition-all text-xs px-3 py-1 rounded-full shadow"
                        >
                          Устгах
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="rounded-2xl" title="Заавал бөглөх мэдээлэл">
                <ul className="m-0 pl-4 text-[13px] text-zinc-600 space-y-1">
                  <li>Төрөл</li>
                  <li>Нэр (MN)</li>
                  <li>Тайлбар (MN)</li>
                  <li>Аймаг/Хот (MN)</li>
                  <li>Дэлгэрэнгүй хаяг (MN)</li>
                  <li>Координат (lat/lng)</li>
                </ul>
                <Divider className="my-3" />
                <Text type="secondary">Давуу тал, өрөө, зураг нь сонголт. Дараа засаж нэмэж болно.</Text>
              </Card>

              <Affix offsetBottom={16}>
                <Card className="rounded-2xl">
                  <div className="flex gap-2">
                    <Button className="w-full" onClick={() => router.push("/dashboard/hotel")}>
                      Болих
                    </Button>
                    <Button type="primary" className="w-full bg-emerald-600 hover:!bg-emerald-700" onClick={() => form.submit()}>
                      {isEdit ? "Хадгалах" : "Нэмэх"}
                    </Button>
                  </div>
                </Card>
              </Affix>
            </div>
          </div>

          {/* Hidden submit */}
          <Form.Item className="hidden">
            <Button htmlType="submit">submit</Button>
          </Form.Item>
        </Form>
      </Spin>
    </>
  );
}
