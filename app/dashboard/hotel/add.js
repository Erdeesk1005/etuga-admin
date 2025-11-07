import { useContext, useEffect, useState } from 'react';
import { Modal, Form, Input, Spin, Button, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { AuthContext } from '@/context/auth/authContext';
import { v4 as uuidv4 } from 'uuid';
const { TextArea } = Input;
const Add = ({ onClose, getRefresh, selected }) => {
    const [messageApi, contextHolder] = message.useMessage();

    const {
        authFunc: { POST, PUT },
    } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selected !== null) {
            form.setFieldsValue(selected);
        }
    }, [selected]);
    const onFinish = async (values) => {
        if (loading) return;
        setLoading(true);
        if (selected === null) {
            values['id'] = uuidv4();
        } else {
            values['id'] = selected.id;
        }
        let res = null;
        if (selected) {
            res = await PUT(`admin/hotels/${selected.id}`, values);
        } else {
            res = await POST('admin/hotels', values);
        }
        if (res?.status === 201 || res?.status === 200) {
            messageApi.open({
                type: 'success',
                content: 'Амжилттай',
            });
            getRefresh();
            onClose();
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
            <Modal
                title={selected ? `${selected.name_mn} засах` : 'Шинээр нэмэх'}
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={true}
                footer={null}
                onCancel={onClose}
                width={'80%'}
            >
                <Spin spinning={loading}>
                    <Form name="basic" form={form} layout="vertical" onFinish={onFinish} autoComplete="off" className="w-full">
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
                            <Form.Item label="Байршил" name="city_name" rules={[{ required: true, message: 'Байршил оруулна уу!' }]}>
                                <Input placeholder={'Улаанбаатар, Төв аймаг гэх мэт'} />
                            </Form.Item>
                            <Form.Item
                                label="Дэлгэрэнгүй хаяг"
                                name="address_line1"
                                rules={[{ required: true, message: 'Дэлгэрэнгүй хаяг оруулна уу!' }]}
                            >
                                <Input placeholder={'СБД, 1-р хороо гэх мэт'} />
                            </Form.Item>
                        </div>
                        <Form.List name="amenities" rules={[]}>
                            {(fields, { add, remove }, { errors }) => (
                                <>
                                    {fields.map((field, index) => (
                                        <Form.Item label={index === 0 ? 'Таатай байдал' : ''} required={false} key={field.key}>
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

                        <Form.Item label={null}>
                            <div className={'flex justify-end'}>
                                <Button type="primary" htmlType="submit">
                                    {selected ? 'Засах' : 'Хадгалах'}
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
        </>
    );
};
export default Add;
