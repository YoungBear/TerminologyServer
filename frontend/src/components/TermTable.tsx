import { useState, useEffect, useCallback } from 'react';
import { Table, Input, Select, Space, Button, Popconfirm, App, Tag, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { Term, TermQueryParams } from '../types/term';
import { STATUS_LABELS } from '../types/term';
import { getTerms, deleteTerm, searchTerms } from '../api/terms';
import type { ColumnsType } from 'antd/es/table';

function getErrorDetail(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { detail?: string } } }).response;
    if (resp?.data?.detail) return resp.data.detail;
  }
  return '操作失败';
}

interface TermTableProps {
  onEdit: (term: Term) => void;
  onCreate: () => void;
  refreshKey: number;
}

export default function TermTable({ onEdit, onCreate, refreshKey }: TermTableProps) {
  const { message } = App.useApp();
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<TermQueryParams>({});
  const [searchText, setSearchText] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (searchText) {
        const res = await searchTerms(searchText, filters.language, filters.domain, filters.status, page, pageSize);
        setTerms(res.items);
        setTotal(res.total);
      } else {
        const res = await getTerms({ ...filters, page, page_size: pageSize });
        setTerms(res.items);
        setTotal(res.total);
      }
    } catch (err) {
      message.error(getErrorDetail(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, searchText, message]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleDelete = async (id: number) => {
    try {
      await deleteTerm(id);
      message.success('已删除');
      fetchData();
    } catch (err) {
      message.error(getErrorDetail(err));
    }
  };

  const columns: ColumnsType<Term> = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: '领域', dataIndex: 'domain', width: 80 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (s: string) => {
        const colors: Record<string, string> = { draft: 'blue', approved: 'green', deprecated: 'orange' };
        return <Tag color={colors[s] || 'default'}>{STATUS_LABELS[s] || s}</Tag>;
      },
    },
    { title: '中文简写', dataIndex: 'abbr_zh', width: 90 },
    {
      title: '中文全称', dataIndex: 'name_zh', width: 160, ellipsis: true,
      render: (v: string) => <Tooltip title={v}>{v}</Tooltip>,
    },
    { title: '英文简写', dataIndex: 'abbr_en', width: 90 },
    {
      title: '英文全称', dataIndex: 'name_en', width: 180, ellipsis: true,
      render: (v: string) => <Tooltip title={v}>{v}</Tooltip>,
    },
    {
      title: '操作', width: 140, fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => onEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space wrap>
          <Input.Search
            placeholder="搜索名称或定义"
            allowClear
            style={{ width: 260 }}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); if (!e.target.value) fetchData(); }}
            onSearch={(v) => { setSearchText(v); setPage(1); }}
          />
          <Select
            placeholder="领域" allowClear style={{ width: 110 }}
            onChange={(v) => { setFilters((f) => ({ ...f, domain: v })); setPage(1); }}
            options={[
              { value: '医学', label: '医学' },
              { value: 'IT', label: 'IT' },
              { value: '法律', label: '法律' },
              { value: '金融', label: '金融' },
            ]}
          />
          <Select
            placeholder="状态" allowClear style={{ width: 110 }}
            onChange={(v) => { setFilters((f) => ({ ...f, status: v })); setPage(1); }}
            options={[
              { value: 'draft', label: '草稿' },
              { value: 'approved', label: '已审核' },
              { value: 'deprecated', label: '已废弃' },
            ]}
          />
          <Select
            placeholder="语言" allowClear style={{ width: 110 }}
            onChange={(v) => { setFilters((f) => ({ ...f, language: v })); setPage(1); }}
            options={[
              { value: 'zh', label: '中文' },
              { value: 'en', label: 'English' },
            ]}
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新建术语</Button>
      </div>
      <Table
        columns={columns}
        dataSource={terms}
        rowKey="id"
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </div>
  );
}
