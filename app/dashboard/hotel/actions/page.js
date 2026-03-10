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
import { PlusOutlined } from "@ant-design/icons";
import { FILE_URL } from "@/utils/config";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const FIXED_PHONE = "89196371";
const FIXED_EMAIL = "info@etuga.mn";

const AMENITY_OPTIONS = [
  {
    value: "smoke",
    label: "Тамхи татах боломжтой",
    mn: "Тамхи татах боломжтой өрөө",
    en: "Smoking room available",
  },
  {
    value: "wifi",
    label: "Wi-Fi",
    mn: "Үнэгүй Wi-Fi",
    en: "Free Wi-Fi",
  },
  {
    value: "parking",
    label: "Зогсоол",
    mn: "Үнэгүй зогсоол",
    en: "Free parking",
  },
  {
    value: "rooms",
    label: "Гэр бүлийн өрөө",
    mn: "Гэр бүлийн өрөө",
    en: "Family rooms",
  },
  {
    value: "hub",
    label: "Нийтлэг амрах хэсэг",
    mn: "Нийтлэг амрах хэсэг",
    en: "Common lounge",
  },
  {
    value: "tv",
    label: "ТВ",
    mn: "ТВ, кино үзэх боломжтой",
    en: "TV available",
  },
  {
    value: "washingmachine",
    label: "Угаалгын машин",
    mn: "Угаалгын машин",
    en: "Washing machine",
  },
  {
    value: "kitchen",
    label: "Гал тогоо",
    mn: "Гал тогоо ашиглах боломжтой",
    en: "Kitchen access",
  },
  {
    value: "airport",
    label: "Нисэхийн тосолт",
    mn: "Нисэхийн трансфер",
    en: "Airport shuttle",
  },
  {
    value: "towels",
    label: "Алчуур/даавуу",
    mn: "Алчуур, орны даавуу",
    en: "Towels & linens",
  },
];

function getAmenityDefaults(value) {
  return AMENITY_OPTIONS.find((opt) => opt.value === value) || {};
}

async function apiGet(path) {
  const res = await fetch(`/api/${path}`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

async function apiPost(path, body) {
  const res = await fetch(`/api/${path}`, {
    method: "POST",
    body,
    credentials: "include",
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

async function apiPut(path, body) {
  const res = await fetch(`/api/${path}`, {
    method: "PUT",
    body,
    credentials: "include",
  });
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
  const [files, setFiles] = useState([]);
  const [mapSrc, setMapSrc] = useState("");

  const isEdit = Boolean(id);

  const updateMap = (lat, lng) => {
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
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

  useEffect(() => {
    if (id) {
      onDetail(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    return () => {
      files.forEach((item) => {
        if (item.kind === "new" && item.localUrl && item.localUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.localUrl);
        }
      });
    };
  }, [files]);

  const normalizeAmenitiesForForm = (rawAmenities) => {
    if (!rawAmenities) return [];

    if (Array.isArray(rawAmenities)) {
      const first = rawAmenities[0];

      if (first && first.title !== undefined) {
        return rawAmenities;
      }

      const arr = [];
      rawAmenities.forEach((el) => {
        if (el && typeof el === "object") {
          Object.entries(el).forEach(([key, value]) => {
            arr.push({
              title: key,
              mn: value && value.mn ? value.mn : "",
              en: value && value.en ? value.en : "",
            });
          });
        }
      });
      return arr;
    }

    if (typeof rawAmenities === "object") {
      const arr = [];
      Object.entries(rawAmenities).forEach(([key, value]) => {
        if (value === true) {
          const d = getAmenityDefaults(key);
          arr.push({
            title: key,
            mn: d.mn || "",
            en: d.en || "",
          });
        } else if (value && typeof value === "object") {
          arr.push({
            title: key,
            mn: value.mn || "",
            en: value.en || "",
          });
        }
      });
      return arr;
    }

    if (typeof rawAmenities === "string") {
      try {
        const parsed = JSON.parse(rawAmenities);
        return normalizeAmenitiesForForm(parsed);
      } catch (error) {
        return [];
      }
    }

    return [];
  };

  const normalizeRoomsForForm = (rawRooms) => {
    if (!rawRooms) return [];

    if (Array.isArray(rawRooms)) return rawRooms;

    if (typeof rawRooms === "string") {
      try {
        const parsed = JSON.parse(rawRooms);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    return [];
  };

  const normalizeImagesForFiles = (rawImages) => {
    if (!rawImages) return [];

    let images = rawImages;

    if (typeof rawImages === "string") {
      try {
        images = JSON.parse(rawImages);
      } catch (error) {
        images = [];
      }
    }

    if (!Array.isArray(images)) return [];

    return images
      .map((img) => {
        const path = typeof img === "string" ? img : img && img.path ? img.path : null;
        if (!path) return null;

        return {
          kind: "existing",
          path,
          localUrl: `${FILE_URL}${path}`,
        };
      })
      .filter(Boolean);
  };

  const onDetail = async (hotelId) => {
    if (loading) return;
    setLoading(true);

    const res = await apiGet(`admin/hotels/${hotelId}`);

    if (res.status === 200 && res.data) {
      const cloned = JSON.parse(JSON.stringify(res.data));

      cloned.AMENITIES = normalizeAmenitiesForForm(cloned.AMENITIES);
      cloned.rooms = normalizeRoomsForForm(cloned.rooms);

      setFiles(normalizeImagesForFiles(cloned.images));

      cloned.phone = cloned.phone || FIXED_PHONE;
      cloned.email = cloned.email || FIXED_EMAIL;

      form.setFieldsValue({
        ...cloned,
        phone: cloned.phone,
        email: cloned.email,
      });

      if (cloned.lat && cloned.lng) {
        updateMap(Number(cloned.lat), Number(cloned.lng));
      }
    } else {
      messageApi.open({
        type: "error",
        content: "Мэдээлэл татахад алдаа гарлаа",
      });
    }

    setLoading(false);
  };

  const buildFormData = (values, currentFiles) => {
    const cloned = JSON.parse(JSON.stringify(values || {}));

    cloned.phone = cloned.phone || FIXED_PHONE;
    cloned.email = cloned.email || FIXED_EMAIL;

    if (cloned.AMENITIES) {
      const arr = cloned.AMENITIES.map((el) => {
        const defaults = getAmenityDefaults(el.title);
        const mn = el.mn || defaults.mn || "";
        const en = el.en || defaults.en || "";
        return { [el.title]: { mn, en } };
      });
      cloned.AMENITIES = arr;
    }

    const existingImagePaths = currentFiles
      .filter((item) => item.kind === "existing")
      .map((item) => item.path);

    const newFiles = currentFiles.filter((item) => item.kind === "new");

    const formData = new FormData();

    Object.entries(cloned).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;

      if (key === "rooms" || key === "AMENITIES" || key === "settings") {
        formData.append(key, JSON.stringify(value));
        return;
      }

      if (key === "images") {
        return;
      }

      if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
        return;
      }

      formData.append(key, String(value));
    });

    formData.append("images", JSON.stringify(existingImagePaths));

    newFiles.forEach((item) => {
      formData.append("files", item.file);
    });

    return formData;
  };

  const onFinish = async (values) => {
    if (loading) return;
    setLoading(true);

    try {
      const formData = buildFormData(values, files);

      const res = id
        ? await apiPut(`admin/hotels/${id}`, formData)
        : await apiPost("admin/hotels", formData);

      if (res.status === 200 || res.status === 201) {
        messageApi.open({
          type: "success",
          content: "Амжилттай хадгаллаа",
        });
        router.push("/dashboard/hotel");
      } else {
        messageApi.open({
          type: "error",
          content: (res.data && res.data.message) || "Хадгалах үед алдаа гарлаа",
        });
      }
    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Хадгалах үед алдаа гарлаа",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    const mapped = selectedFiles.map((file) => ({
      kind: "new",
      file,
      name: file.name,
      localUrl: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const onDeleteFile = async (index) => {
    const target = files[index];
    if (!target) return;

    if (target.kind === "new") {
      if (target.localUrl && target.localUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.localUrl);
      }

      setFiles((prev) => prev.filter((_, i) => i !== index));
      messageApi.open({
        type: "success",
        content: "Шинээр нэмсэн зураг жагсаалтаас хасагдлаа",
      });
      return;
    }

    if (!id) {
      setFiles((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    const nextFiles = files.filter((_, i) => i !== index);

    try {
      setLoading(true);

      const currentValues = form.getFieldsValue(true);
      const formData = buildFormData(currentValues, nextFiles);

      const res = await apiPut(`admin/hotels/${id}`, formData);

      if (res.status === 200 || res.status === 201) {
        setFiles(nextFiles);
        messageApi.open({
          type: "success",
          content: "Зураг амжилттай устлаа",
        });
      } else {
        messageApi.open({
          type: "error",
          content: (res.data && res.data.message) || "Зураг устгах үед алдаа гарлаа",
        });
      }
    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Зураг устгах үед алдаа гарлаа",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAmenity = (val) => {
    const current = form.getFieldValue("AMENITIES") || [];
    const used = current.map((x) => x && x.title).filter(Boolean);

    if (used.includes(val)) return;

    const d = getAmenityDefaults(val);

    form.setFieldsValue({
      AMENITIES: [
        ...current,
        {
          title: val,
          mn: d.mn || "",
          en: d.en || "",
        },
      ],
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
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {isEdit ? "Буудлын мэдээлэл засах" : "Шинэ буудал нэмэх"}
            </Title>
            <Text type="secondary">Заавал биш хэсгийг дараа нь бөглөж болно.</Text>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => router.push("/dashboard/hotel")}>Буцах</Button>
            <Button
              type="primary"
              className="bg-emerald-600 hover:!bg-emerald-700"
              onClick={() => form.submit()}
            >
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
            <div className="lg:col-span-8 space-y-6">
              <Card className="rounded-2xl" title="1) Ерөнхий мэдээлэл">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item
                    label="Төрөл"
                    name="type"
                    rules={[{ required: true, message: "Төрөл сонгоно уу!" }]}
                  >
                    <Select placeholder="Төрөл сонгох">
                      <Option value="guesthouse">Гэстхаус</Option>
                      <Option value="apartment">Апартмент</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Вэбсайт / Линк (сонголт)" name="website">
                    <Input placeholder="https://..." />
                  </Form.Item>
                </div>

                <Divider className="my-3" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item
                    label="Нэр (MN)"
                    name="name_mn"
                    rules={[{ required: true, message: "Нэр (MN) оруулна уу!" }]}
                  >
                    <Input placeholder="Монгол нэр" />
                  </Form.Item>

                  <Form.Item label="Нэр (EN) (сонголт)" name="name_en">
                    <Input placeholder="English name" />
                  </Form.Item>
                </div>

                <Divider className="my-3" />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Form.Item label="Давхар (сонголт)" name="floors">
                    <InputNumber className="w-full" min={0} placeholder="Жишээ: 3" />
                  </Form.Item>

                  <Form.Item label="Нийт багтаамж (сонголт)" name="max_guests">
                    <InputNumber className="w-full" min={0} placeholder="Жишээ: 10" />
                  </Form.Item>

                  <Form.Item label="Өрөөний тоо (сонголт)" name="bedrooms">
                    <InputNumber className="w-full" min={0} placeholder="Жишээ: 4" />
                  </Form.Item>

                  <Form.Item label="Орны тоо (сонголт)" name="beds">
                    <InputNumber className="w-full" min={0} placeholder="Жишээ: 6" />
                  </Form.Item>

                  <Form.Item label="Үнэ (сонголт)" name="price">
                    <InputNumber className="w-full" min={0} placeholder="₮" />
                  </Form.Item>

                  <Form.Item label="Үнэлгээ (сонголт)" name="rating">
                    <InputNumber className="w-full" min={0} max={10} step={0.1} placeholder="0-10" />
                  </Form.Item>
                </div>
              </Card>

              <Divider className="my-3" />

              <Card className="rounded-2xl" title="2) Холбоо барих мэдээлэл">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item label="Утас" name="phone">
                    <Input />
                  </Form.Item>

                  <Form.Item label="Имэйл" name="email">
                    <Input />
                  </Form.Item>
                </div>
              </Card>

              <Divider className="my-3" />

              <Card className="rounded-2xl" title="3) Тайлбар">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item
                    label="Тайлбар (MN)"
                    name="description_mn"
                    rules={[{ required: true, message: "Тайлбар (MN) оруулна уу!" }]}
                  >
                    <TextArea rows={4} placeholder="Монгол тайлбар" />
                  </Form.Item>

                  <Form.Item label="Тайлбар (EN) (сонголт)" name="description_en">
                    <TextArea rows={4} placeholder="English description" />
                  </Form.Item>
                </div>
              </Card>

              <Divider className="my-3" />

              <Card className="rounded-2xl" title="4) Хаяг ба газрын зураг">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item
                    label="Аймаг/Хот (MN)"
                    name="city_name"
                    rules={[{ required: true, message: "Аймаг/Хот оруулна уу!" }]}
                  >
                    <Input placeholder="Улаанбаатар" />
                  </Form.Item>

                  <Form.Item label="Аймаг/Хот (EN) (сонголт)" name="city_name_en">
                    <Input placeholder="Ulaanbaatar" />
                  </Form.Item>

                  <Form.Item
                    label="Дэлгэрэнгүй хаяг (MN)"
                    name="address_line1"
                    rules={[{ required: true, message: "Дэлгэрэнгүй хаяг оруулна уу!" }]}
                  >
                    <Input placeholder="Дүүрэг, хороо..." />
                  </Form.Item>

                  <Form.Item label="Дэлгэрэнгүй хаяг (EN) (сонголт)" name="address_line1_en">
                    <Input placeholder="Optional" />
                  </Form.Item>

                  <Form.Item label="Map link (сонголт)" name="location">
                    <Input placeholder="https://maps.app.goo.gl/..." />
                  </Form.Item>
                </div>

                <Divider className="my-3" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item
                    label="Latitude (lat)"
                    name="lat"
                    rules={[{ required: true, message: "Lat оруулна уу!" }]}
                  >
                    <InputNumber
                      className="w-full"
                      step={0.000001}
                      placeholder="47.9188"
                      onChange={(val) => {
                        const lng = form.getFieldValue("lng");
                        if (val != null && lng != null) {
                          updateMap(Number(val), Number(lng));
                        } else {
                          updateMap(null, null);
                        }
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Longitude (lng)"
                    name="lng"
                    rules={[{ required: true, message: "Lng оруулна уу!" }]}
                  >
                    <InputNumber
                      className="w-full"
                      step={0.000001}
                      placeholder="106.9175"
                      onChange={(val) => {
                        const lat = form.getFieldValue("lat");
                        if (lat != null && val != null) {
                          updateMap(Number(lat), Number(val));
                        } else {
                          updateMap(null, null);
                        }
                      }}
                    />
                  </Form.Item>
                </div>

                <div className="mt-3 w-full h-[360px] rounded-xl overflow-hidden border bg-white">
                  {mapSrc ? (
                    <iframe
                      src={mapSrc}
                      width="100%"
                      height="100%"
                      loading="lazy"
                      style={{ border: 0 }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Lat/Lng оруулсны дараа газрын зураг гарна
                    </div>
                  )}
                </div>
              </Card>

              <div className="my-10" />

              <Card
                className="rounded-2xl"
                title="5) Давуу тал (сонголт)"
                extra={<Text type="secondary">Сонгоод нэмнэ</Text>}
              >
                <Form.List name="AMENITIES">
                  {(fields) => (
                    <>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(form.getFieldValue("AMENITIES") || []).length ? (
                          (form.getFieldValue("AMENITIES") || []).map((a, idx) => {
                            const opt = AMENITY_OPTIONS.find((x) => x.value === (a && a.title));
                            return (
                              <Tag
                                key={`${a && a.title ? a.title : "amenity"}-${idx}`}
                                color="green"
                                closable
                                onClose={(e) => {
                                  e.preventDefault();
                                  removeAmenityByIndex(idx);
                                }}
                                className="rounded-full px-3 py-1"
                              >
                                {opt ? opt.label : a && a.title}
                              </Tag>
                            );
                          })
                        ) : (
                          <Text type="secondary">Одоогоор давуу тал сонгоогүй байна.</Text>
                        )}
                      </div>

                      <Divider className="my-3" />

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

                        <Text type="secondary">MN/EN тайлбар автоматаар тохирно.</Text>
                      </div>

                      <div className="hidden">
                        {fields.map((f) => (
                          <div key={f.key}>
                            <Form.Item name={[f.name, "title"]}>
                              <Input />
                            </Form.Item>
                            <Form.Item name={[f.name, "mn"]}>
                              <Input />
                            </Form.Item>
                            <Form.Item name={[f.name, "en"]}>
                              <Input />
                            </Form.Item>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Form.List>
              </Card>

              <div className="my-10" />

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
                          Одоогоор өрөө нэмээгүй байна.
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
                              <Form.Item name={[field.name, "id"]} label="ID (сонголт)">
                                <Input placeholder="floor1 гэх мэт" />
                              </Form.Item>

                              <Form.Item name={[field.name, "floor"]} label="Давхар">
                                <InputNumber className="w-full" min={0} />
                              </Form.Item>

                              <Form.Item name={[field.name, "capacity"]} label="Багтаамж">
                                <InputNumber className="w-full" min={0} />
                              </Form.Item>

                              <Form.Item name={[field.name, "beds"]} label="Орны тоо">
                                <InputNumber className="w-full" min={0} />
                              </Form.Item>

                              <Form.Item name={[field.name, "pricePerNightMNT"]} label="1 хоногийн үнэ">
                                <InputNumber className="w-full" min={0} />
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
                              id: "",
                              floor: 0,
                              capacity: 0,
                              beds: 0,
                              pricePerNightMNT: 0,
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

              <div className="my-10" />

              <Card className="rounded-2xl mt-20" title="7) Зураг (сонголт)">
                <div className="space-y-4">
                  <label className="block w-fit cursor-pointer">
                    <div className="bg-[#f7f7f7] hover:bg-[#efefef] transition-all border border-dashed rounded-xl px-6 py-3 text-sm">
                      Зураг сонгох (олон зураг)
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleChange}
                      className="hidden"
                    />
                  </label>

                  <div className="flex flex-wrap gap-5">
                    {files.map((el, index) => (
                      <div
                        key={
                          el.kind === "existing"
                            ? `${el.path || "existing"}-${index}`
                            : `${el.name || "new"}-${index}`
                        }
                        className="relative w-[250px] rounded-xl overflow-hidden shadow hover:shadow-lg transition-all bg-white border"
                      >
                        <img src={el.localUrl} alt="uploaded" className="w-full h-[150px] object-cover" />

                        <div className="absolute left-2 top-2">
                          <span
                            className={`text-[11px] px-2 py-1 rounded-full ${
                              el.kind === "existing"
                                ? "bg-blue-500 text-white"
                                : "bg-emerald-500 text-white"
                            }`}
                          >
                            {el.kind === "existing" ? "Хадгалагдсан" : "Шинэ"}
                          </span>
                        </div>

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
                <Text type="secondary">
                  Давуу тал, өрөө, зураг нь сонголт. Дараа засаж нэмэж болно.
                </Text>
              </Card>

              
            </div>
          </div>

          <Form.Item className="hidden">
            <Button htmlType="submit">submit</Button>
          </Form.Item>
        </Form>
      </Spin>
    </>
  );
}