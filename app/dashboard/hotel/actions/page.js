'use client';
// react
import { useEffect, useState } from 'react';
// next
import { useRouter, useSearchParams } from 'next/navigation';
// antd
import {
  Typography,
  Form,
  Input,
  Spin,
  Button,
  message,
  InputNumber,
  Select,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
// third / utils
import { FILE_URL } from '@/utils/config';

const { TextArea } = Input;
const { Title } = Typography;
const { Option } = Select;

// --- API helper-ууд (/api → api.etuga.mn рүү rewrite хийгдэнэ) ---
async function apiGet(path) {
  const res = await fetch(`/api/${path}`, {
    credentials: 'include',
  });

  const data = await res.json().catch(() => null);

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}

async function apiPost(path, body) {
  const res = await fetch(`/api/${path}`, {
    method: 'POST',
    body,
    credentials: 'include',
  });

  const data = await res.json().catch(() => null);

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}

async function apiPut(path, body) {
  const res = await fetch(`/api/${path}`, {
    method: 'PUT',
    body,
    credentials: 'include',
  });

  const data = await res.json().catch(() => null);

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}

const Page = () => {
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // зураг
  const [files, setFiles] = useState([]);
  // map iframe src
  const [mapSrc, setMapSrc] = useState('');

  const id = searchParams.get('id');

  // -----------------------------
  // MAP SRC үүсгэх function
  // -----------------------------
  const updateMap = (lat, lng) => {
    if (!lat || !lng) {
      setMapSrc('');
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

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  useEffect(() => {
    if (id) {
      onDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // -----------------------------
  // DETAIL АВАХ
  // -----------------------------
  const onDetail = async () => {
    if (loading) return;
    setLoading(true);

    const res = await apiGet(`admin/hotels/${id}`);

    if (res.status === 200 && res.data) {
      const cloned = JSON.parse(JSON.stringify(res.data));

      // -----------------------------
      // AMENITIES parse (аюулгүй JS хувилбар)
      // -----------------------------
      if (!cloned?.AMENITIES) {
        cloned.AMENITIES = [];
      } else if (Array.isArray(cloned.AMENITIES)) {
        const first = cloned.AMENITIES[0];

        if (first && first.title !== undefined) {
          // [{ title, mn, en }] хэлбэртэй байвал шууд хэрэглэнэ
        } else {
          // [{ wifi: { mn, en } }] → [{ title: 'wifi', mn, en }]
          const arr = [];
          cloned.AMENITIES.forEach((el) => {
            Object.entries(el).forEach(([key, value]) => {
              arr.push({ title: key, mn: value.mn, en: value.en });
            });
          });
          cloned.AMENITIES = arr;
        }
      } else if (typeof cloned.AMENITIES === 'string') {
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
              arr.push({ title: key, mn: value.mn, en: value.en });
            });
          });
          cloned.AMENITIES = arr;
        }
      }

      // floors -> rooms (backend structure-аа дагана, хэрэггүй бол авч хаяж болно)
      if (cloned?.floors?.length > 0) {
        cloned.rooms = cloned.floors;
      }

      // images (server-ээс ирсэн path preview)
      if (cloned.images?.length > 0) {
        const arr = cloned.images.map((el) => ({
          localUrl: `${FILE_URL}${el}`,
        }));
        setFiles(arr);
      }

      form.setFieldsValue(cloned);

      // lat/lng байвал map дээр харагдуулах
      if (cloned.lat && cloned.lng) {
        updateMap(Number(cloned.lat), Number(cloned.lng));
      }
    } else {
      messageApi.open({
        type: 'error',
        content: 'Амжилтгүй',
      });
    }
    setLoading(false);
  };

  // -----------------------------
  // FORM SUBMIT
  // -----------------------------
  const onFinish = async (values) => {
    if (loading) return;
    setLoading(true);

    let res = null;
    const cloned = JSON.parse(JSON.stringify(values));

    // AMENITIES-г backend structure руу
    if (cloned.AMENITIES) {
      const arr = cloned.AMENITIES.map((el) => ({
        [el.title]: { mn: el.mn, en: el.en },
      }));
      cloned.AMENITIES = arr;
    }

    const formData = new FormData();

    for (const [key, value] of Object.entries(cloned)) {
      if (value === undefined || value === null || value === '') continue;

      if (key === 'rooms' || key === 'AMENITIES') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }

    // олон зураг formData руу
    if (files?.length > 0) {
      files.forEach((el) => {
        // server-ээс ирсэн хуучин зураг File биш -> name байхгүй
        if (el.name) {
          formData.append('files', el);
        }
      });
    }

    if (id) {
      res = await apiPut(`admin/hotels/${id}`, formData);
    } else {
      res = await apiPost('admin/hotels', formData);
    }

    if (res?.status === 201 || res?.status === 200) {
      messageApi.open({
        type: 'success',
        content: 'Амжилттай',
      });
      router.push('/dashboard/hotel');
    } else {
      messageApi.open({
        type: 'error',
        content: 'Амжилтгүй',
      });
    }

    setLoading(false);
  };

  // -----------------------------
  // IMAGE HANDLERS (ОЛОН ЗУРАГ)
  // -----------------------------
  const handleChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    const mapped = selectedFiles.map((file) => {
      file.localUrl = URL.createObjectURL(file);
      return file;
    });

    setFiles((prev) => [...prev, ...mapped]);

    e.target.value = '';
  };

  const onDeleteFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <>
      {contextHolder}
      <div>
        <Spin spinning={loading}>
          <div className="mb-[50px]">
            <Title level={4}>{id ? `${id} засах` : 'Шинээр нэмэх'}</Title>
          </div>

          <Form
            name="basic"
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            className="w-full"
          >
            {/* ───────── Ерөнхий мэдээлэл ───────── */}
            <Title level={5}>Ерөнхий мэдээлэл</Title>
            <div className="grid grid-cols-1 gap-[20px] mb-[20px]">
              <Form.Item
                label="Төрөл"
                name="type"
                rules={[{ required: true, message: 'Төрөл оруулна уу!' }]}
              >
                <Select placeholder="Төрөл сонгох">
                  <Option value="guesthouse">Guest House</Option>
                  <Option value="apartment">Apartment</Option>
                </Select>
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-[20px] mb-[20px]">
              <Form.Item
                label="Нэр (MN)"
                name="name_mn"
                rules={[{ required: true, message: 'Нэр оруулна уу!' }]}
              >
                <Input placeholder="Нэр (MN)" />
              </Form.Item>
              <Form.Item
                label="Нэр (EN)"
                name="name_en"
                rules={[{ required: true, message: 'Нэр оруулна уу!' }]}
              >
                <Input placeholder="Нэр (EN)" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-3 gap-[20px] mb-[20px]">
              <Form.Item
                label="Давхар"
                name="floors"
                rules={[{ required: true, message: 'Давхар оруулна уу!' }]}
              >
                <InputNumber placeholder="Давхар" className="w-full" />
              </Form.Item>
              <Form.Item
                label="Багтаамж"
                name="max_guests"
                rules={[{ required: true, message: 'Багтаамж оруулна уу!' }]}
              >
                <InputNumber placeholder="Багтаамж" className="w-full" />
              </Form.Item>
              <Form.Item
                label="Өрөөний тоо"
                name="bedrooms"
                rules={[
                  { required: true, message: 'Өрөөний тоо оруулна уу!' },
                ]}
              >
                <InputNumber placeholder="Өрөөний тоо" className="w-full" />
              </Form.Item>
              <Form.Item
                label="Орны тоо"
                name="beds"
                rules={[{ required: true, message: 'Орны тоо оруулна уу!' }]}
              >
                <InputNumber placeholder="Орны тоо" className="w-full" />
              </Form.Item>
              <Form.Item
                label="Үнэ"
                name="price"
                rules={[{ required: true, message: 'Үнэ оруулна уу!' }]}
              >
                <InputNumber placeholder="Үнэ" className="w-full" />
              </Form.Item>
              <Form.Item
                label="Үнэлгээ"
                name="rating"
                rules={[
                  { required: true, message: 'Үнэлгээ оруулна уу!' },
                ]}
              >
                <InputNumber placeholder="Үнэлгээ" className="w-full" />
              </Form.Item>
            </div>

            {/* ───────── Холбогдох мэдээлэл ───────── */}
            <Title level={5}>Холбогдох мэдээлэл</Title>
            <div className="grid grid-cols-3 gap-[20px] mb-[20px]">
              <Form.Item
                label="Утас"
                name="phone"
                rules={[{ required: true, message: 'Утас оруулна уу!' }]}
              >
                <Input placeholder="Утас" />
              </Form.Item>
              <Form.Item
                label="Имэйл"
                name="email"
                rules={[{ required: true, message: 'Имэйл оруулна уу!' }]}
              >
                <Input placeholder="Имэйл" />
              </Form.Item>
              <Form.Item
                label="Вэбсайт"
                name="website"
                rules={[
                  { required: true, message: 'Вэбсайт оруулна уу!' },
                ]}
              >
                <Input placeholder="Вэбсайт" />
              </Form.Item>
            </div>

            {/* ───────── Тайлбар ───────── */}
            <div className="grid grid-cols-2 gap-[20px] mb-[20px]">
              <Form.Item
                label="Тайлбар (MN)"
                name="description_mn"
                rules={[
                  { required: true, message: 'Тайлбар оруулна уу!' },
                ]}
              >
                <TextArea rows={4} placeholder="Тайлбар (MN)" />
              </Form.Item>
              <Form.Item
                label="Тайлбар (EN)"
                name="description_en"
                rules={[
                  { required: true, message: 'Тайлбар оруулна уу!' },
                ]}
              >
                <TextArea rows={4} placeholder="Тайлбар (EN)" />
              </Form.Item>
            </div>

            {/* ───────── Хаяг ───────── */}
            <Title level={5}>Хаягийн мэдээлэл</Title>
            <div className="grid grid-cols-2 gap-[20px] mb-[20px]">
              <Form.Item
                label="Байршил (MN)"
                name="city_name"
                rules={[
                  { required: true, message: 'Байршил оруулна уу!' },
                ]}
              >
                <Input placeholder="Улаанбаатар, Төв аймаг гэх мэт" />
              </Form.Item>
              <Form.Item
                label="Байршил (EN)"
                name="city_name_en"
                rules={[
                  { required: true, message: 'Байршил оруулна уу!' },
                ]}
              >
                <Input placeholder="Ulaanbaatar, Tuv aimag etc." />
              </Form.Item>
              <Form.Item
                label="Дэлгэрэнгүй хаяг (MN)"
                name="address_line1"
                rules={[
                  {
                    required: true,
                    message: 'Дэлгэрэнгүй хаяг оруулна уу!',
                  },
                ]}
              >
                <Input placeholder="СБД, 1-р хороо гэх мэт" />
              </Form.Item>
              <Form.Item
                label="Дэлгэрэнгүй хаяг (EN)"
                name="address_line1_en"
                rules={[
                  {
                    required: true,
                    message: 'Дэлгэрэнгүй хаяг оруулна уу!',
                  },
                ]}
              >
                <Input placeholder="Sukhbaatar district etc." />
              </Form.Item>
            </div>

            {/* ───────── Байршлын координат + MAP ───────── */}
            <Title level={5}>Байршлын координат (lat / lng)</Title>
            <div className="grid grid-cols-2 gap-[20px] mb-[20px]">
              <Form.Item
                label="Latitude (lat)"
                name="lat"
                rules={[{ required: true, message: 'Lat утга оруулна уу!' }]}
              >
                <InputNumber
                  className="w-full"
                  placeholder="Жишээ: 47.9188"
                  step={0.000001}
                  onChange={(val) => {
                    const lng = form.getFieldValue('lng');
                    if (val && lng) {
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
                rules={[{ required: true, message: 'Lng утга оруулна уу!' }]}
              >
                <InputNumber
                  className="w-full"
                  placeholder="Жишээ: 106.9175"
                  step={0.000001}
                  onChange={(val) => {
                    const lat = form.getFieldValue('lat');
                    if (lat && val) {
                      updateMap(Number(lat), Number(val));
                    } else {
                      updateMap(null, null);
                    }
                  }}
                />
              </Form.Item>
            </div>

            <Title level={5}>Газрын зураг</Title>
            <div className="w-full h-[400px] mb-[30px] rounded-xl overflow-hidden border">
              {mapSrc ? (
                <iframe
                  src={mapSrc}
                  width="100%"
                  height="100%"
                  loading="lazy"
                  style={{ border: 0 }}
                ></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Байршлын координат оруулаад газрын зургийг харна уу
                </div>
              )}
            </div>

            {/* ───────── Давуу тал ───────── */}
            <Title level={5}>Давуу талын мэдээлэл</Title>
            <Form.List name="AMENITIES">
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field, index) => {
                    const { key, name, ...restField } = field;
                    return (
                      <Form.Item
                        label={index === 0 ? 'Таатай байдал' : ''}
                        required={false}
                        key={key}
                      >
                        <div className="flex justify-between items-center gap-x-[20px] bg-[#dfe6e9] rounded-[12px] shadow-2xl p-[20px]">
                          <Form.Item
                            {...restField}
                            name={[name, 'title']}
                            rules={[{ required: true, message: '' }]}
                            noStyle
                          >
                            <Input placeholder="Таатай байдал гарчиг" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'mn']}
                            rules={[{ required: true, message: '' }]}
                            noStyle
                          >
                            <Input placeholder="MN" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'en']}
                            rules={[{ required: true, message: '' }]}
                            noStyle
                          >
                            <Input placeholder="EN" />
                          </Form.Item>

                          <MinusCircleOutlined
                            className="dynamic-delete-button"
                            onClick={() => remove(name)}
                          />
                        </div>
                      </Form.Item>
                    );
                  })}
                  <Form.Item>
                    <Button
                      type="primary"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                    >
                      Давуу тал нэмэх
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>

            {/* ───────── Өрөө ───────── */}
            <Title level={5}>Өрөөний мэдээлэл</Title>
            <Form.List name="rooms">
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field) => {
                    const { key, name, ...restField } = field;

                    return (
                      <Form.Item label="" required={false} key={key}>
                        <div className="bg-[#dfe6e9] rounded-[12px] shadow-2xl p-[20px]">
                          {/* Гарчиг */}
                          <div className="flex justify-between items-center gap-x-[20px] ">
                            <Form.Item
                              {...restField}
                              name={[name, 'title', 'mn']}
                              rules={[{ required: true, message: '' }]}
                              label="Өрөөний гарчиг MN"
                              className="w-full"
                            >
                              <Input placeholder="MN" />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'title', 'en']}
                              rules={[{ required: true, message: '' }]}
                              label="Өрөөний гарчиг EN"
                              className="w-full"
                            >
                              <Input placeholder="EN" />
                            </Form.Item>
                          </div>

                          {/* Тоон үзүүлэлт */}
                          <div className="grid grid-cols-4 gap-x-[20px] my-[20px]">
                            <Form.Item
                              {...restField}
                              name={[name, 'floor']}
                              rules={[{ required: true, message: '' }]}
                              label="Давхарын тоо"
                              className="w-full"
                            >
                              <InputNumber
                                placeholder="Давхар"
                                className="w-full"
                              />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'capacity']}
                              rules={[{ required: true, message: '' }]}
                              label="Багтаамж хүний тоо"
                              className="w-full"
                            >
                              <InputNumber
                                placeholder="Багтаамж хүний тоо"
                                className="w-full"
                              />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'beds']}
                              rules={[{ required: true, message: '' }]}
                              label="Нийт орны тоо"
                              className="w-full"
                            >
                              <InputNumber
                                placeholder="Нийт ор"
                                className="w-full"
                              />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'areaM2']}
                              rules={[{ required: true, message: '' }]}
                              label="Нийт хэмжээ мк"
                              className="w-full"
                            >
                              <InputNumber
                                placeholder="Нийт хэмжээ"
                                className="w-full"
                              />
                            </Form.Item>
                          </div>

                          {/* Үнэ */}
                          <div className="flex justify-between items-center gap-x-[20px] my-[20px]">
                            <Form.Item
                              {...restField}
                              name={[name, 'pricePerNightMNT']}
                              rules={[{ required: true, message: '' }]}
                              label="Нэг хоногийн төлбөр"
                              className="w-full"
                            >
                              <InputNumber
                                placeholder="Нэг хоногийн төлбөр"
                                className="w-full"
                              />
                            </Form.Item>
                          </div>

                          {/* Хөнгөлөлт */}
                          <Form.List name={[name, 'discounts']}>
                            {(discountFields, { add: addDiscount, remove: removeDiscount }) => (
                              <>
                                <div className="mb-[10px] font-semibold">
                                  Хөнгөлөлтийн мэдээлэл
                                </div>
                                {discountFields.map((dField) => {
                                  const { key: dKey, name: dName, ...restDiscountField } = dField;

                                  return (
                                    <div
                                      key={dKey}
                                      className="flex items-end gap-x-[12px] mb-[10px]"
                                    >
                                      <Form.Item
                                        {...restDiscountField}
                                        name={[dName, 'nights']}
                                        label="Хоног"
                                        className="w-full"
                                        rules={[
                                          {
                                            required: true,
                                            message: 'Хоногийн тоо оруулна уу',
                                          },
                                        ]}
                                      >
                                        <InputNumber
                                          placeholder="Хоногийн тоо"
                                          className="w-full"
                                        />
                                      </Form.Item>

                                      <Form.Item
                                        {...restDiscountField}
                                        name={[dName, 'percent']}
                                        label="Хөнгөлөлт %"
                                        className="w-full"
                                        rules={[
                                          {
                                            required: true,
                                            message:
                                              'Хөнгөлөлтийн хувь оруулна уу',
                                          },
                                        ]}
                                      >
                                        <InputNumber
                                          placeholder="Хөнгөлөлтийн хувь"
                                          className="w-full"
                                        />
                                      </Form.Item>

                                      <MinusCircleOutlined
                                        className="cursor-pointer mb-[8px]"
                                        onClick={() => removeDiscount(dName)}
                                      />
                                    </div>
                                  );
                                })}

                                <Form.Item>
                                  <Button
                                    type="dashed"
                                    onClick={() => addDiscount()}
                                    icon={<PlusOutlined />}
                                  >
                                    Хөнгөлөлт нэмэх
                                  </Button>
                                </Form.Item>
                              </>
                            )}
                          </Form.List>

                          {/* Товч танилцуулга */}
                          <div className="flex justify-between items-center gap-x-[20px] mt-[10px]">
                            <Form.Item
                              {...restField}
                              name={[name, 'blurb', 'mn']}
                              rules={[{ required: true, message: '' }]}
                              label="Товч танилцуулга MN"
                              className="w-full"
                            >
                              <Input placeholder="Товч танилцуулга MN" />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'blurb', 'en']}
                              rules={[{ required: true, message: '' }]}
                              label="Товч танилцуулга EN"
                              className="w-full"
                            >
                              <Input placeholder="Товч танилцуулга EN" />
                            </Form.Item>

                            <MinusCircleOutlined
                              className="dynamic-delete-button mb-[8px]"
                              onClick={() => remove(name)}
                            />
                          </div>
                        </div>
                      </Form.Item>
                    );
                  })}
                  <Form.Item>
                    <Button
                      type="primary"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                    >
                      Өрөө нэмэх
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>

            {/* ───────── Зураг ───────── */}
            <Title level={5}>Зураг</Title>

            <div className="space-y-4">
              {/* File Input */}
              <label className="block w-fit cursor-pointer">
                <div className="bg-[#f7f7f7] hover:bg-[#efefef] transition-all border border-dashed rounded-xl px-6 py-3 text-sm">
                  Зураг сонгох
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </label>

              {/* Image preview list */}
              <div className="flex flex-wrap gap-5">
                {files.map((el, index) => (
                  <div
                    key={el.id || el.localUrl || index}
                    className="relative w-[250px] rounded-xl overflow-hidden shadow hover:shadow-lg transition-all bg-white"
                  >
                    <img
                      src={el.localUrl}
                      alt="uploaded"
                      className="w-full h-[150px] object-cover"
                    />
                    <button
                      onClick={() => onDeleteFile(index)}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-red-500 hover:text-white transition-all text-xs px-3 py-1 rounded-full shadow"
                    >
                      Устгах
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ───────── SUBMIT ───────── */}
            <Form.Item>
              <div className="flex justify-end">
                <Button type="primary" htmlType="submit">
                  {id ? 'Засах' : 'Хадгалах'}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </>
  );
};

export default Page;
