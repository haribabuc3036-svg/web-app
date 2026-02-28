'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { darshanApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Card } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, RefreshCw } from 'lucide-react';
import type { DarshanUpdate } from '@/lib/types';

const emptyForm = {
  date: '',
  pilgrims: '',
  tonsures: '',
  hundi: '',
  waiting: '',
  darshan_time: '',
};

export default function DarshanPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['darshan', page],
    queryFn: () => darshanApi.getPaginated(page, limit),
  });

  const upsert = useMutation({
    mutationFn: (payload: typeof emptyForm) => darshanApi.upsert(payload),
    onSuccess: () => {
      toast.success('Darshan update saved');
      qc.invalidateQueries({ queryKey: ['darshan'] });
      qc.invalidateQueries({ queryKey: ['darshan-all'] });
      setModalOpen(false);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openUpsert(row?: DarshanUpdate) {
    if (row) {
      setForm({
        date: row.date,
        pilgrims: row.pilgrims,
        tonsures: row.tonsures,
        hundi: row.hundi,
        waiting: row.waiting,
        darshan_time: row.darshan_time,
      });
    } else {
      setForm(emptyForm);
    }
    setModalOpen(true);
  }

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Darshan Updates</h1>
          <p className="text-sm text-gray-500 mt-1">TTD daily pilgrim statistics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => openUpsert()}>
            <Plus size={14} />
            Add / Update
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{row.date}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(row.created_at)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => openUpsert(row)}>Edit</Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Pilgrims', value: row.pilgrims },
                  { label: 'Tonsures', value: row.tonsures },
                  { label: 'Hundi', value: row.hundi },
                  { label: 'Waiting', value: row.waiting },
                  { label: 'Darshan Time', value: row.darshan_time },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{value || '—'}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          {rows.length === 0 && (
            <Card className="py-12 text-center text-gray-400 text-sm">No records found</Card>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Page {page} · {rows.length} records
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={rows.length < limit}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Upsert Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.date ? `Edit ${form.date}` : 'Add / Upsert Darshan Update'}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            upsert.mutate(form);
          }}
        >
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Pilgrims"
              value={form.pilgrims}
              onChange={(e) => setForm((f) => ({ ...f, pilgrims: e.target.value }))}
              placeholder="62,483"
            />
            <Input
              label="Tonsures"
              value={form.tonsures}
              onChange={(e) => setForm((f) => ({ ...f, tonsures: e.target.value }))}
              placeholder="21,145"
            />
            <Input
              label="Hundi"
              value={form.hundi}
              onChange={(e) => setForm((f) => ({ ...f, hundi: e.target.value }))}
              placeholder="₹4.2 Cr"
            />
            <Input
              label="Waiting"
              value={form.waiting}
              onChange={(e) => setForm((f) => ({ ...f, waiting: e.target.value }))}
              placeholder="12H"
            />
          </div>
          <Input
            label="Darshan Time"
            value={form.darshan_time}
            onChange={(e) => setForm((f) => ({ ...f, darshan_time: e.target.value }))}
            placeholder="6H"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={upsert.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
