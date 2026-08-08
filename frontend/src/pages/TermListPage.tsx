import { useState, useCallback } from 'react';
import type { Term } from '../types/term';
import TermTable from '../components/TermTable';
import TermModal from '../components/TermModal';

export default function TermListPage() {
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = useCallback((term: Term) => {
    setEditingTerm(term);
    setModalOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingTerm(null);
    setModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
    setEditingTerm(null);
  }, []);

  const handleSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 20 }}>术语管理系统</h1>
      <TermTable onEdit={handleEdit} onCreate={handleCreate} refreshKey={refreshKey} />
      <TermModal open={modalOpen} term={editingTerm} onClose={handleClose} onSuccess={handleSuccess} />
    </div>
  );
}
