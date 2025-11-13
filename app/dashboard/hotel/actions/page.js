'use client';
// react
import { useContext, useEffect, useState } from 'react';
// next
import { useRouter, useSearchParams } from 'next/navigation';
// antd
import { Typography, Form, Input, Spin, Button, message, InputNumber, Select } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
// context
import { AuthContext } from '@/context/auth/authContext';
//utils
import { v4 as uuidv4 } from 'uuid';
// map
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// third
import { FILE_URL } from '@/utils/config';

const { TextArea } = Input;
const { Title } = Typography;
const { Option } = Select;

const Page = () => {
    const searchParams = useSearchParams();
    const [messageApi, contextHolder] = message.useMessage();
    const router = useRouter();
    const {
        authFunc: { POST, PUT, GET },
    } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    let id = searchParams.get('id');

    useEffect(() => {
        if (id) {
            onDetail();
        } else {
            initialMap(null);
        }
    }, [searchParams]);

    const onDetail = async () => {
        if (loading) return;
        setLoading(true);
        let res = await GET(`admin/hotels/${id}`);
        if (res?.status === 200) {
            console.log(res);
            let cloned = JSON.parse(JSON.stringify(res.data));
            if (typeof cloned?.AMENITIES === 'object') {
                if (Object.keys(cloned?.AMENITIES)?.length === 0) {
                    cloned.AMENITIES = [];
                }
            } else {
                if (cloned?.AMENITIES?.length > 0) {
                    let parsed = JSON.parse(cloned?.AMENITIES);
                    let arr = [];
                    parsed.forEach((el) => {
                        for (const [key, value] of Object.entries(el)) {
                            arr.push({ title: key, mn: value.mn, en: value.en });
                        }
                        console.log(el);
                    });
                    cloned.AMENITIES = arr;
                }
            }

            if (cloned?.floors?.length > 0) {
                cloned.rooms = cloned?.floors;
            }
            if (cloned.images?.length > 0) {
                let arr = [];
                cloned.images?.forEach((el) => {
                    arr.push({
                        localUrl: `${FILE_URL}${el}`,
                    });
                });
                setFiles(arr);
            }

            form.setFieldsValue(cloned);
            let mark = null;
            if (res?.data?.lat && res?.data?.lng) {
                mark = [res?.data?.lng, res?.data?.lat];
            }
            initialMap(mark);
        } else {
            messageApi.open({
                type: 'error',
                content: 'Амжилтгүй',
            });
        }
        setLoading(false);
    };
    const initialMap = (val) => {
        const style = {
            version: 8,
            sources: {
                osm: {
                    type: 'raster',
                    tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    tileSize: 256,
                    attribution: '&copy; OpenStreetMap Contributors',
                    maxzoom: 19,
                },
            },
            layers: [
                {
                    id: 'osm',
                    type: 'raster',
                    source: 'osm',
                },
            ],
        };

        let center = [106.91757236721207, 47.91882961903147];
        let map = new maplibregl.Map({
            container: 'map',
            style: style,
            center: center,
            zoom: 6,
        });
        let locations = val === null ? center : val;
        let marker = '';
        if (val !== null) {
            map.flyTo({
                center: locations,
            });
        }
        map.on('load', () => {
            marker = new maplibregl.Marker().setLngLat(locations).addTo(map);
            form.setFieldsValue({
                lat: center[1],
                lng: center[0],
            });
        });
        map.on('click', (e) => {
            let newLocations = [e.lngLat?.lng, e?.lngLat?.lat];
            marker.setLngLat(newLocations);
            form.setFieldsValue({
                lat: e.lngLat?.lat,
                lng: e.lngLat?.lng,
            });
        });
        setLoading(false);
    };

    const onFinish = async (values) => {
        if (loading) return;
        setLoading(true);
        let res = null;
        let cloned = JSON.parse(JSON.stringify(values));
        console.log(cloned);
        if (cloned.AMENITIES) {
            let arr = [];
            cloned.AMENITIES?.forEach((el) => {
                let obj = {};
                obj[el.title] = {
                    mn: el.mn,
                    en: el.en,
                };
                arr.push(obj);
            });
            cloned['AMENITIES'] = arr;
        }
        let formData = new FormData();
        for (const [key, value] of Object.entries(cloned)) {
            if (value) {
                if (key === 'rooms' || key === 'AMENITIES') {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, value);
                }
            }
        }
        if (files?.length > 0) {
            files.forEach((el) => {
                if (el.name) {
                    formData.append('files', el);
                }
            });
        }
        if (id) {
            values['id'] = id;
            res = await PUT(`admin/hotels/${id}`, formData, 'multipart/form-data');
        } else {
            res = await POST('admin/hotels', formData, 'multipart/form-data');
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
    const handleChange = (e) => {
        let cloned = JSON.parse(JSON.stringify(files));
        let tmp = e.target.files[0];

        tmp['localUrl'] = URL.createObjectURL(e.target.files[0]);
        cloned.push(tmp);
        setFiles(cloned);
    };
    const onDeleteFile = (index) => {
        setFiles(files.filter((el, i) => i !== index));
    };
    return (
        <>
            {contextHolder}
            <div>
                <Spin spinning={loading}>
                    <div className={'mb-[50px]'}>
                        <Title level={4}>{id ? `${id} засах` : 'Шинээр нэмэх'}</Title>
                    </div>
                    <Form name="basic" form={form} layout="vertical" onFinish={onFinish} autoComplete="off" className="w-full">
                        <Form.Item label="" name="lat" hidden />
                        <Form.Item label="" name="lng" hidden />
                        <Title level={5}>Ерөнхий мэдээлэл</Title>
                        <div className={'grid grid-cols-1 gap-[20px] mb-[20px]'}>
                            <Form.Item label="Төрөл" name="type" rules={[{ required: true, message: 'Төрөл оруулна уу!' }]}>
                                <Select placeholder="Төрөл сонгох">
                                    <Option value="guesthouse">Guest House</Option>
                                </Select>
                            </Form.Item>
                        </div>
                        <div className={'grid grid-cols-2 gap-[20px] mb-[20px]'}>
                            <Form.Item label="Нэр (MN)" name="name_mn" rules={[{ required: true, message: 'Нэр оруулна уу!' }]}>
                                <Input placeholder={'Нэр (MN)'} />
                            </Form.Item>
                            <Form.Item label="Нэр (EN)" name="name_en" rules={[{ required: true, message: 'Нэр оруулна уу!' }]}>
                                <Input placeholder={'Нэр (EN)'} />
                            </Form.Item>
                        </div>
                        <div className={'grid grid-cols-3 gap-[20px] mb-[20px]'}>
                            <Form.Item label="Давхар" name="floors" rules={[{ required: true, message: 'Давхар оруулна уу!' }]}>
                                <InputNumber placeholder={'Давхар'} className={'w-full'} />
                            </Form.Item>
                            <Form.Item label="Багтаамж" name="max_guests" rules={[{ required: true, message: 'Багтаамж оруулна уу!' }]}>
                                <InputNumber placeholder={'Багтаамж'} className={'w-full'} />
                            </Form.Item>

                            <Form.Item label="Өрөөний тоо" name="bedrooms" rules={[{ required: true, message: 'Өрөөний тоо оруулна уу!' }]}>
                                <InputNumber placeholder={'Өрөөний тоо'} className={'w-full'} />
                            </Form.Item>
                            <Form.Item label="Орны тоо" name="beds" rules={[{ required: true, message: 'Орны тоо оруулна уу!' }]}>
                                <InputNumber placeholder={'Орны тоо'} className={'w-full'} />
                            </Form.Item>
                            <Form.Item label="Үнэ" name="price" rules={[{ required: true, message: 'Үнэ оруулна уу!' }]}>
                                <InputNumber placeholder={'Үнэ'} className={'w-full'} />
                            </Form.Item>
                            <Form.Item label="Үнэлгээ" name="rating" rules={[{ required: true, message: 'Үнэлгээ оруулна уу!' }]}>
                                <InputNumber placeholder={'Үнэлгээ'} className={'w-full'} />
                            </Form.Item>
                        </div>

                        <Title level={5}>Холбогдох мэдээлэл</Title>
                        <div className={'grid grid-cols-3 gap-[20px] mb-[20px]'}>
                            <Form.Item label="Утас" name="phone" rules={[{ required: true, message: 'Утас оруулна уу!' }]}>
                                <Input placeholder={'Утас'} />
                            </Form.Item>
                            <Form.Item label="Имэйл" name="email" rules={[{ required: true, message: 'Имэйл оруулна уу!' }]}>
                                <Input placeholder={'Имэйл'} />
                            </Form.Item>
                            <Form.Item label="Вэбсайт" name="website" rules={[{ required: true, message: 'Вэбсайт оруулна уу!' }]}>
                                <Input placeholder={'Вэбсайт'} />
                            </Form.Item>
                        </div>
                        <div className={'grid grid-cols-2 gap-[20px] mb-[20px]'}>
                            <Form.Item label="Тайлбар (MN)" name="description_mn" rules={[{ required: true, message: 'Тайлбар оруулна уу!' }]}>
                                <TextArea rows={4} placeholder={'Нэр монгол'} />
                            </Form.Item>
                            <Form.Item label="Тайлбар (EN)" name="description_en" rules={[{ required: true, message: 'Тайлбар оруулна уу!' }]}>
                                <TextArea rows={4} placeholder={'Нэр (EN)'} />
                            </Form.Item>
                        </div>
                        <Title level={5}>Хаягын мэдээлэл</Title>
                        <div className={'grid grid-cols-2 gap-[20px] mb-[20px]'}>
                            <Form.Item label="Байршил (MN)" name="city_name" rules={[{ required: true, message: 'Байршил оруулна уу!' }]}>
                                <Input placeholder={'Улаанбаатар, Төв аймаг гэх мэт'} />
                            </Form.Item>
                            <Form.Item label="Байршил (EN)" name="city_name_en" rules={[{ required: true, message: 'Байршил оруулна уу!' }]}>
                                <Input placeholder={'Улаанбаатар, Төв аймаг гэх мэт'} />
                            </Form.Item>
                            <Form.Item
                                label="Дэлгэрэнгүй хаяг (MN)"
                                name="address_line1"
                                rules={[{ required: true, message: 'Дэлгэрэнгүй хаяг оруулна уу!' }]}
                            >
                                <Input placeholder={'СБД, 1-р хороо гэх мэт'} />
                            </Form.Item>
                            <Form.Item
                                label="Дэлгэрэнгүй хаяг (EN)"
                                name="address_line1_en"
                                rules={[{ required: true, message: 'Дэлгэрэнгүй хаяг оруулна уу!' }]}
                            >
                                <Input placeholder={'СБД, 1-р хороо гэх мэт'} />
                            </Form.Item>
                        </div>

                        <Title level={5}>Давуу талын мэдээлэл</Title>
                        <Form.List name="AMENITIES" rules={[]}>
                            {(fields, { add, remove }, { errors }) => (
                                <>
                                    {fields.map((field, index) => (
                                        <Form.Item label={index === 0 ? 'Таатай байдал' : ''} required={false} key={uuidv4()}>
                                            <div
                                                className={
                                                    'flex justify-between items-center gap-x-[20px] bg-[#dfe6e9] rounded-[12px] shadow-2xl p-[20px]'
                                                }
                                            >
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'title']}
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message: '',
                                                        },
                                                    ]}
                                                    noStyle
                                                >
                                                    <Input placeholder="Таатай байдал гарчиг" />
                                                </Form.Item>
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'mn']}
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message: '',
                                                        },
                                                    ]}
                                                    noStyle
                                                >
                                                    <Input placeholder="MN" />
                                                </Form.Item>
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'en']}
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message: '',
                                                        },
                                                    ]}
                                                    noStyle
                                                >
                                                    <Input placeholder="EN" />
                                                </Form.Item>

                                                <MinusCircleOutlined className="dynamic-delete-button" onClick={() => remove(field.name)} />
                                            </div>
                                        </Form.Item>
                                    ))}
                                    <Form.Item>
                                        <Button type="primary" onClick={() => add()} icon={<PlusOutlined />}>
                                            Давуу тал нэмэх
                                        </Button>
                                        <Form.ErrorList errors={errors} />
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                        <Title level={5}>Өрөөний мэдээлэл</Title>
                        <Form.List name="rooms" rules={[]}>
                            {(fields, { add, remove }, { errors }) => (
                                <>
                                    {fields.map((field, index) => (
                                        <Form.Item label={''} required={false} key={uuidv4()}>
                                            <div className="bg-[#dfe6e9] rounded-[12px] shadow-2xl p-[20px]">
                                                {/* Гарчиг MN / EN */}
                                                <div className="flex justify-between items-center gap-x-[20px] ">
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, 'title', 'mn']}
                                                        rules={[{ required: true, message: '' }]}
                                                        label="Өрөөний гарчиг MN"
                                                        className="w-full"
                                                    >
                                                        <Input placeholder="MN" />
                                                    </Form.Item>
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, 'title', 'en']}
                                                        rules={[{ required: true, message: '' }]}
                                                        label="Өрөөний гарчиг EN"
                                                        className="w-full"
                                                    >
                                                        <Input placeholder="EN" />
                                                    </Form.Item>
                                                </div>

                                                {/* Үндсэн тоон үзүүлэлтүүд */}
                                                <div className="grid grid-cols-4 gap-x-[20px] my-[20px]">
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, 'floor']}
                                                        rules={[{ required: true, message: '' }]}
                                                        label="Давхарын тоо"
                                                        className="w-full"
                                                    >
                                                        <InputNumber placeholder="Давхар" className="w-full" />
                                                    </Form.Item>
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, 'capacity']}
                                                        rules={[{ required: true, message: '' }]}
                                                        label="Багтаамж хүний тоо"
                                                        className="w-full"
                                                    >
                                                        <InputNumber placeholder="Багтаамж хүний тоо" className="w-full" />
                                                    </Form.Item>
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, 'beds']}
                                                        rules={[{ required: true, message: '' }]}
                                                        label="Нийт орны тоо"
                                                        className="w-full"
                                                    >
                                                        <InputNumber placeholder="Нийт ор" className="w-full" />
                                                    </Form.Item>
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, 'areaM2']}
                                                        rules={[{ required: true, message: '' }]}
                                                        label="Нийт хэмжээ мк-ын тоо"
                                                        className="w-full"
                                                    >
                                                        <InputNumber placeholder="Нийт хэмжээ " />
                                                    </Form.Item>
                                                </div>

                                                {/* Нэг хоногийн үнэ */}
                                                <div className="flex justify-between items-center gap-x-[20px] my-[20px]">
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, 'pricePerNightMNT']}
                                                        rules={[{ required: true, message: '' }]}
                                                        label="Нэг хоногийн төлбөр"
                                                        className="w-full"
                                                    >
                                                        <InputNumber placeholder="Нэг хоногийн төлбөр" className="w-full" />
                                                    </Form.Item>
                                                </div>

                                                {/* Хөнгөлөлтийн dynamic массив (discounts) */}
                                                <Form.List name={[field.name, 'discounts']}>
                                                    {(discountFields, { add: addDiscount, remove: removeDiscount }) => (
                                                        <>
                                                            <div className="mb-[10px] font-semibold">Хөнгөлөлтийн мэдээлэл</div>
                                                            {discountFields.map((dField) => (
                                                                <div key={uuidv4()} className="flex items-end gap-x-[12px] mb-[10px]">
                                                                    <Form.Item
                                                                        {...dField}
                                                                        name={[dField.name, 'nights']}
                                                                        label="Хоног"
                                                                        className="w-full"
                                                                        rules={[{ required: true, message: 'Хоногийн тоо оруулна уу' }]}
                                                                    >
                                                                        <InputNumber placeholder="Хоногын тоо" className="w-full" />
                                                                    </Form.Item>

                                                                    <Form.Item
                                                                        {...dField}
                                                                        name={[dField.name, 'percent']}
                                                                        label="Хөнгөлөлт %"
                                                                        className="w-full"
                                                                        rules={[{ required: true, message: 'Хөнгөлөлтийн хувь оруулна уу' }]}
                                                                    >
                                                                        <InputNumber placeholder="Хөнгөлөлтийн хувь" className="w-full" />
                                                                    </Form.Item>

                                                                    <MinusCircleOutlined
                                                                        className="cursor-pointer mb-[8px]"
                                                                        onClick={() => removeDiscount(dField.name)}
                                                                    />
                                                                </div>
                                                            ))}

                                                            <Form.Item>
                                                                <Button type="dashed" onClick={() => addDiscount()} icon={<PlusOutlined />}>
                                                                    Хөнгөлөлт нэмэх
                                                                </Button>
                                                            </Form.Item>
                                                        </>
                                                    )}
                                                </Form.List>

                                                {/* Товч танилцуулга */}
                                                <div className="flex justify-between items-center gap-x-[20px] mt-[10px]">
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, 'blurb', 'mn']}
                                                        rules={[{ required: true, message: '' }]}
                                                        label="Товч танилцуулга MN"
                                                        className="w-full"
                                                    >
                                                        <Input placeholder="Товч танилцуулга MN" />
                                                    </Form.Item>
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, 'blurb', 'en']}
                                                        rules={[{ required: true, message: '' }]}
                                                        label="Товч танилцуулга EN"
                                                        className="w-full"
                                                    >
                                                        <Input placeholder="Товч танилцуулга EN" />
                                                    </Form.Item>

                                                    <MinusCircleOutlined
                                                        className="dynamic-delete-button mb-[8px]"
                                                        onClick={() => remove(field.name)}
                                                    />
                                                </div>
                                            </div>
                                        </Form.Item>
                                    ))}
                                    <Form.Item>
                                        <Button type="primary" onClick={() => add()} icon={<PlusOutlined />}>
                                            Өрөө нэмэх
                                        </Button>
                                        <Form.ErrorList errors={errors} />
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                        <Title level={5}>Зураг</Title>
                        <div>
                            <input type="file" onChange={handleChange} />
                            <div className={'mt-[20px] flex flex-wrap gap-x-[20px]'}>
                                {files.map((el, index) => {
                                    return (
                                        <div key={uuidv4()} className={'shadow-2xl rounded-[12px] w-[250px] relative'}>
                                            <img src={el.localUrl} className={'w-[250px] h-[150px] object-center rounded-[12px]'} />
                                            <div
                                                className={
                                                    'absolute top-[5] right-[10px] bg-[#fff] rounded-[12px] py-[5px] px-[10px] text-[12px] cursor-pointer'
                                                }
                                                onClick={() => onDeleteFile(index)}
                                            >
                                                Устгах
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex flex-col mt-[20px]">
                            <Title level={5}>Газрын зураг</Title>
                            <div className="w-[100%] h-[400px] mb-[30px]" id="map"></div>
                        </div>
                        <Form.Item label={null}>
                            <div className={'flex justify-end'}>
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
