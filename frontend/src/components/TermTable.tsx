import { useState, useEffect, useCallback } from 'react';
import { Table, Input, Select, Space, Button, Popconfirm, App, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { Term, TermQueryParams } from '../types/term';
import { NAME_TYPE_LABELS, STATUS_LABELS } from '../types/term';
import { getTerms, deleteTerm, searchTerms } from '../api/terms';
import type { ColumnsType } from 'antd/es/table';

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
        const res = await searchTerms(searchText, filters.language, page, pageSize);
        setTerms(res.items);
        setTotal(res.total);
      } else {
        const res = await getTerms({ ...filters, page, page_size: pageSize });
        setTerms(res.items);
        setTotal(res.total);
      }
    } catch {
      message.error('加载失败');
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
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ColumnsType<Term> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '领域', dataIndex: 'domain', width: 100 },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (s: string) => {
        const colors: Record<string, string> = { draft: 'blue', approved: 'green', deprecated: 'orange' };
        return <Tag color={colors[s] || 'default'}>{STATUS_LABELS[s] || s}</Tag>;
      },
    },
    {
      title: '名称', dataIndex: 'names', width: 300,
      render: (names: Term['names']) => (
        <div>
          {names.map((n) => (
            <div key={n.id || `${n.language}-${n.name_type}`} style={{ fontSize: 13, marginBottom: 2 }}>
              <Tag color="cyan" style={{ marginRight: 4 }}>{n.language}</Tag>
              <Tag>{NAME_TYPE_LABELS[n.name_type] || n.name_type}</Tag>
              {n.name}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '操作', width: 140,
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
            onSearch={(v) => { setSearchText(v); setPage(1); }}
          />
          <Select
            placeholder="领域" allowClear style={{ width: 120 }}
            onChange={(v) => { setFilters((f) => ({ ...f, domain: v })); setPage(1); }}
            options={[
              { value: '医学', label: '医学' },
              { value: 'IT', label: 'IT' },
              { value: '法律', label: '法律' },
              { value: '金融', label: '金融' },
            ]}
          />
          <Select
            placeholder="状态" allowClear style={{ width: 120 }}
            onChange={(v) => { setFilters((f) => ({ ...f, status: v })); setPage(1); }}
            options={[
              { value: 'draft', label: '草稿' },
              { value: 'approved', label: '已审核' },
              { value: 'deprecated', label: '已废弃' },
            ]}
          />
          <Select
            placeholder="语言" allowClear style={{ width: 120 }}
            onChange={(v) => { setFilters((f) => ({ ...f, language: v })); setPage(1); }}
            options={[
              { value: 'zh', label: '中文' },
              { value: 'en', label: 'English' },
              { value: 'ja', label: '日本語' },
              { value: 'ko', label: '한국어' },
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
