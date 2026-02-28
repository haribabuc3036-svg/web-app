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

      <Card>
        {isLoading ? (
          <PageLoader />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Date', 'Pilgrims', 'Tonsures', 'Hundi', 'Waiting', 'Darshan Time', 'Created', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.date}</td>
                    <td className="px-4 py-3 text-gray-600">{row.pilgrims}</td>
                    <td className="px-4 py-3 text-gray-600">{row.tonsures}</td>
                    <td className="px-4 py-3 text-gray-600">{row.hundi}</td>
                    <td className="px-4 py-3 text-gray-600">{row.waiting}</td>
                    <td className="px-4 py-3 text-gray-600">{row.darshan_time}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDateTime(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => openUpsert(row)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
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
      </Card>

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
