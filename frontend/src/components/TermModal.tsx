import { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, App } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { Term, TermCreateRequest, TermName } from '../types/term';
import { NAME_TYPE_LABELS } from '../types/term';
import { createTerm, updateTerm } from '../api/terms';

interface TermModalProps {
  open: boolean;
  term: Term | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TermModal({ open, term, onClose, onSuccess }: TermModalProps) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = term !== null;

  useEffect(() => {
    if (open) {
      if (term) {
        form.setFieldsValue({
          domain: term.domain,
          status: term.status,
          names: term.names.map((n) => ({ ...n })),
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, term, form]);

  const handleFinish = async (values: { domain: string; status: string; names: TermName[] }) => {
    try {
      if (isEdit) {
        await updateTerm(term!.id, values as TermCreateRequest);
        message.success('术语已更新');
      } else {
        await createTerm(values as TermCreateRequest);
        message.success('术语已创建');
      }
      onSuccess();
      onClose();
    } catch {
      message.error('操作失败');
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑术语' : '新建术语'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ status: 'draft', names: [{}] }}>
        <Space style={{ width: '100%' }} size="middle">
          <Form.Item name="domain" label="领域" rules={[{ required: true, message: '请输入领域' }]} style={{ width: 200 }}>
            <Input placeholder="如 医学、IT" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]} style={{ width: 160 }}>
            <Select
              options={[
                { value: 'draft', label: '草稿' },
                { value: 'approved', label: '已审核' },
                { value: 'deprecated', label: '已废弃' },
              ]}
            />
          </Form.Item>
        </Space>

        <Form.List name="names" rules={[{ validator: async (_, names) => {
          if (!names || names.length < 1) return Promise.reject(new Error('至少需要一个名称'));
        }}]}>
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(({ key, name, ...rest }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item {...rest} name={[name, 'language']} rules={[{ required: true, message: '必填' }]}>
                    <Select placeholder="语言" style={{ width: 100 }}
                      options={[
                        { value: 'zh', label: '中文' },
                        { value: 'en', label: 'English' },
                        { value: 'ja', label: '日本語' },
                        { value: 'ko', label: '한국어' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'name_type']} rules={[{ required: true, message: '必填' }]}>
                    <Select placeholder="类型" style={{ width: 100 }}
                      options={Object.entries(NAME_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                    />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'name']} rules={[{ required: true, message: '请输入名称' }]}>
                    <Input placeholder="名称" style={{ width: 160 }} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'definition']}>
                    <Input placeholder="定义（可选）" style={{ width: 200 }} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'id']} hidden>
                    <Input />
                  </Form.Item>
                  {fields.length > 1 && (
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  )}
                </Space>
              ))}
              <Form.ErrorList errors={errors} />
              <Button type="dashed" onClick={() => add({ language: 'zh', name_type: 'full_name' })} block icon={<PlusOutlined />}>
                添加名称
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
