import { useEffect } from 'react';
import { Modal, Form, Input, Select, Space, App } from 'antd';
import type { Term, TermCreateRequest } from '../types/term';
import { createTerm, updateTerm } from '../api/terms';

interface TermModalProps {
  open: boolean;
  term: Term | null;
  onClose: () => void;
  onSuccess: () => void;
}

const requiredRule = { required: true, message: '必填' };

export default function TermModal({ open, term, onClose, onSuccess }: TermModalProps) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = term !== null;

  useEffect(() => {
    if (open) {
      if (term) {
        form.setFieldsValue(term);
      } else {
        form.resetFields();
      }
    }
  }, [open, term, form]);

  const handleFinish = async (values: TermCreateRequest) => {
    try {
      if (isEdit) {
        await updateTerm(term!.id, values);
        message.success('术语已更新');
      } else {
        await createTerm(values);
        message.success('术语已创建');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const detail = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      message.error(detail || '操作失败');
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
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ status: 'draft' }}>
        <Space style={{ width: '100%' }} size="middle">
          <Form.Item name="domain" label="领域" rules={[requiredRule]} style={{ width: 180 }}>
            <Input placeholder="如 医学、IT" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[requiredRule]} style={{ width: 140 }}>
            <Select
              options={[
                { value: 'draft', label: '草稿' },
                { value: 'approved', label: '已审核' },
                { value: 'deprecated', label: '已废弃' },
              ]}
            />
          </Form.Item>
        </Space>

        <Space style={{ width: '100%' }} size="middle">
          <Form.Item name="abbr_zh" label="中文简写" rules={[requiredRule]} style={{ width: 140 }}>
            <Input placeholder="中文简写" />
          </Form.Item>
          <Form.Item name="name_zh" label="中文全称" rules={[requiredRule]} style={{ width: 180 }}>
            <Input placeholder="中文全称" />
          </Form.Item>
          <Form.Item name="def_zh" label="中文描述" style={{ width: 260 }}>
            <Input placeholder="中文描述（可选）" />
          </Form.Item>
        </Space>

        <Space style={{ width: '100%' }} size="middle">
          <Form.Item name="abbr_en" label="英文简写" rules={[requiredRule]} style={{ width: 140 }}>
            <Input placeholder="英文简写" />
          </Form.Item>
          <Form.Item name="name_en" label="英文全称" rules={[requiredRule]} style={{ width: 180 }}>
            <Input placeholder="英文全称" />
          </Form.Item>
          <Form.Item name="def_en" label="英文描述" style={{ width: 260 }}>
            <Input placeholder="英文描述（可选）" />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
}
