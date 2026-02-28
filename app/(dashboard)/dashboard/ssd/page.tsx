'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ssdApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { RefreshCw, Edit, Zap } from 'lucide-react';

export default function SsdPage() {
  const qc = useQueryClient();
  const [updateModal, setUpdateModal] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<Record<string, string> | null>(null);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [form, setForm] = useState({ running_slot: '', slot_date: '', balance_tickets: '', balance_date: '' });

  const { data: latest, isLoading } = useQuery({
    queryKey: ['ssd-latest'],
    queryFn: () => ssdApi.getLatest(),
    refetchInterval: 60_000,
  });

  const { data: live } = useQuery({
    queryKey: ['ssd-live'],
    queryFn: () => ssdApi.getLive(),
    refetchInterval: 30_000,
  });

  const update = useMutation({
    mutationFn: (payload: typeof form) => ssdApi.update(payload),
    onSuccess: () => {
      toast.success('SSD status updated');
      qc.invalidateQueries({ queryKey: ['ssd-latest'] });
      qc.invalidateQueries({ queryKey: ['ssd-live'] });
      setUpdateModal(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleScrape() {
    setScrapeLoading(true);
    setScrapeResult(null);
    try {
      const res = await ssdApi.scrape();
      setScrapeResult(res.data as Record<string, string>);
      toast.success('Scrape successful');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Scrape failed');
    } finally {
      setScrapeLoading(false);
    }
  }

  function openUpdate() {
    const d = latest?.data;
    setForm({
      running_slot: (live?.data?.running_slot) ?? d?.running_slot ?? '',
      slot_date: (live?.data?.slot_date) ?? '',
      balance_tickets: (live?.data?.balance_tickets) ?? d?.balance_tickets ?? '',
      balance_date: (live?.data?.balance_date) ?? '',
    });
    setUpdateModal(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SSD Status</h1>
          <p className="text-sm text-gray-500 mt-1">Slotted Sarva Darshan token status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleScrape} loading={scrapeLoading}>
            <Zap size={14} />
            Scrape Live
          </Button>
          <Button size="sm" onClick={openUpdate}>
            <Edit size={14} />
            Update Status
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supabase (latest saved) */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Saved in Database</h2>
              <Badge variant="blue">Supabase</Badge>
            </div>
            {latest?.data ? (
              <dl className="space-y-3">
                {[
                  { label: 'Running Slot', value: latest.data.running_slot },
                  { label: 'Balance Tickets', value: latest.data.balance_tickets },
                  { label: 'Date', value: latest.data.date },
                  { label: 'Last Updated', value: formatDateTime(latest.data.updated_at) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-xs text-gray-400">{label}</dt>
                    <dd className="text-sm font-medium text-gray-900">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-gray-400">No data</p>
            )}
          </Card>

          {/* Firebase (live) */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Live (Firebase RTDB)</h2>
              <Badge variant="green">Real-time</Badge>
            </div>
            {live?.data ? (
              <dl className="space-y-3">
                {[
                  { label: 'Running Slot', value: live.data.running_slot },
                  { label: 'Slot Date', value: live.data.slot_date },
                  { label: 'Balance Tickets', value: live.data.balance_tickets },
                  { label: 'Balance Date', value: live.data.balance_date },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-xs text-gray-400">{label}</dt>
                    <dd className="text-sm font-medium text-gray-900">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-gray-400">No live data</p>
            )}
          </Card>
        </div>
      )}

      {/* Scrape result */}
      {scrapeResult && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Live Scrape Result</h2>
          <dl className="grid grid-cols-2 gap-3">
            {Object.entries(scrapeResult).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs text-gray-400 capitalize">{key.replace(/_/g, ' ')}</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{String(value) || '—'}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* Update Modal */}
      <Modal open={updateModal} onClose={() => setUpdateModal(false)} title="Update SSD Status">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate(form);
          }}
        >
          <Input
            label="Running Slot"
            value={form.running_slot}
            onChange={(e) => setForm((f) => ({ ...f, running_slot: e.target.value }))}
            placeholder="Slot 1A"
          />
          <Input
            label="Slot Date"
            type="date"
            value={form.slot_date}
            onChange={(e) => setForm((f) => ({ ...f, slot_date: e.target.value }))}
          />
          <Input
            label="Balance Tickets"
            value={form.balance_tickets}
            onChange={(e) => setForm((f) => ({ ...f, balance_tickets: e.target.value }))}
            placeholder="1500"
          />
          <Input
            label="Balance Date"
            type="date"
            value={form.balance_date}
            onChange={(e) => setForm((f) => ({ ...f, balance_date: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setUpdateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={update.isPending}>
              Update
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
