'use client';
// react
import { useContext, useEffect, useState } from 'react';
// next
import { useRouter, useSearchParams } from 'next/navigation';
// antd
import { Typography, Form, Input, Spin, Button, message, InputNumber } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
// context
import { AuthContext } from '@/context/auth/authContext';
//utils
import { v4 as uuidv4 } from 'uuid';
// map
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const { TextArea } = Input;
const { Title } = Typography;

const Page = () => {
    const searchParams = useSearchParams();
    const [messageApi, contextHolder] = message.useMessage();
    const router = useRouter();
    const {
        authFunc: { POST, PUT, GET },
    } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
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
            form.setFieldsValue(res.data);
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
    };
    const onFinish = async (values) => {
        if (loading) return;
        // setLoading(true);
        let res = null;
        if (id) {
            values['id'] = id;
            res = await PUT(`admin/hotels/${id}`, values);
        } else {
            res = await POST('admin/hotels', values);
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
    return (
        <>
            {contextHolder}
            <div>
                <Spin spinning={loading}>
                    <div>
                        <Title level={4}>{id ? `${id} засах` : 'Шинээр нэмэх'}</Title>
                    </div>
                    <Form name="basic" form={form} layout="vertical" onFinish={onFinish} autoComplete="off" className="w-full">
                        <Form.Item label="" name="lat" hidden />
                        <Form.Item label="" name="lng" hidden />
                        <div className={'grid grid-cols-2 gap-[20px] mb-[20px]'}>
                            <Form.Item label="Нэр (MN)" name="name_mn" rules={[{ required: true, message: 'Нэр оруулна уу!' }]}>
                                <Input placeholder={'Нэр (MN)'} />
                            </Form.Item>
                            <Form.Item label="Нэр (EN)" name="name_en" rules={[{ required: true, message: 'Нэр оруулна уу!' }]}>
                                <Input placeholder={'Нэр (EN)'} />
                            </Form.Item>
                        </div>
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
                        <Form.List name="images" rules={[]}>
                            {(fields, { add, remove }, { errors }) => (
                                <>
                                    {fields.map((field, index) => (
                                        <Form.Item label={index === 0 ? 'Зураг' : ''} required={false} key={uuidv4()}>
                                            <div className={'flex justify-between items-center gap-x-[20px]'}>
                                                <Form.Item
                                                    {...field}
                                                    validateTrigger={['onChange', 'onBlur']}
                                                    rules={[
                                                        {
                                                            required: true,
                                                            whitespace: true,
                                                            message: "Please input passenger's name or delete this field.",
                                                        },
                                                    ]}
                                                    noStyle
                                                >
                                                    <Input placeholder="Зураг" style={{ width: '100%' }} />
                                                </Form.Item>
                                                <MinusCircleOutlined className="dynamic-delete-button" onClick={() => remove(field.name)} />
                                            </div>
                                        </Form.Item>
                                    ))}
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} style={{ width: '100%' }} icon={<PlusOutlined />}>
                                            Зураг
                                        </Button>
                                        <Form.ErrorList errors={errors} />
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                        <Form.List name="amenities" rules={[]}>
                            {(fields, { add, remove }, { errors }) => (
                                <>
                                    {fields.map((field, index) => (
                                        <Form.Item label={index === 0 ? 'Таатай байдал' : ''} required={false} key={uuidv4()}>
                                            <div className={'flex justify-between items-center gap-x-[20px]'}>
                                                <Form.Item
                                                    {...field}
                                                    validateTrigger={['onChange', 'onBlur']}
                                                    rules={[
                                                        {
                                                            required: true,
                                                            whitespace: true,
                                                            message: "Please input passenger's name or delete this field.",
                                                        },
                                                    ]}
                                                    noStyle
                                                >
                                                    <Input placeholder="Таатай байдал" style={{ width: '100%' }} />
                                                </Form.Item>
                                                <MinusCircleOutlined className="dynamic-delete-button" onClick={() => remove(field.name)} />
                                            </div>
                                        </Form.Item>
                                    ))}
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} style={{ width: '100%' }} icon={<PlusOutlined />}>
                                            Таатай байдал
                                        </Button>
                                        <Form.ErrorList errors={errors} />
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                        <div className="flex flex-col mt-[20px]">
                            <p className="text-[16px] mb-[20px]">Газрын зураг</p>
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
