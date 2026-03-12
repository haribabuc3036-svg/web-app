'use client';

import { useState, useEffect } from 'react';
import { notificationsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Card, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Send,
  Smartphone,
  Clock,
  RefreshCw,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ successCount: number; failureCount: number } | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  function fetchCount() {
    setLoadingCount(true);
    notificationsApi
      .count()
      .then((r) => setDeviceCount(r.count))
      .catch(() => setDeviceCount(null))
      .finally(() => setLoadingCount(false));
  }

  useEffect(() => { fetchCount(); }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      const result = await notificationsApi.send({ title: title.trim(), body: body.trim() });
      setLastResult(result);
      toast.success(
        `Sent to ${result.successCount} device${result.successCount !== 1 ? 's' : ''}` +
          (result.failureCount > 0 ? ` · ${result.failureCount} failed` : '')
      );
      setTitle('');
      setBody('');
      fetchCount();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  }

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !sending;

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Broadcast messages to all registered devices
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCount} disabled={loadingCount}>
          <RefreshCw size={14} className={loadingCount ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Registered Devices"
          value={deviceCount ?? '—'}
          subtitle={loadingCount ? 'Loading…' : 'FCM tokens in Firebase RTDB'}
          icon={<Smartphone size={20} />}
          color="indigo"
        />
        <StatCard
          title="Last Broadcast"
          value={lastResult ? lastResult.successCount : '—'}
          subtitle={
            lastResult
              ? lastResult.failureCount > 0
                ? `${lastResult.failureCount} failed`
                : 'All delivered'
              : 'No broadcast yet this session'
          }
          icon={<CheckCircle2 size={20} />}
          color="green"
        />
        <StatCard
          title="Auto Reminders"
          value="Active"
          subtitle="1 hr + 5 min before booking dates"
          icon={<Clock size={20} />}
          color="blue"
        />
      </div>

      {/* ── Main two-column layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Compose form (3 cols) ──────────────────────────────────────── */}
        <Card className="lg:col-span-3 p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone size={17} className="text-indigo-500" />
            <h2 className="text-base font-semibold text-gray-800">Compose Broadcast</h2>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Important Darshan Update"
                maxLength={100}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg
                           text-sm text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           transition-colors"
              />
              <p className="text-xs text-gray-400 text-right">{title.length}/100</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your notification message here…"
                rows={5}
                maxLength={500}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg
                           text-sm text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           transition-colors resize-none"
              />
              <p className="text-xs text-gray-400 text-right">{body.length}/500</p>
            </div>

            <Button type="submit" disabled={!canSend} className="w-full" size="lg">
              <Send size={15} />
              {sending
                ? `Sending to ${deviceCount ?? '…'} device${deviceCount !== 1 ? 's' : ''}…`
                : `Send to All Devices${deviceCount !== null ? ` (${deviceCount})` : ''}`}
            </Button>
          </form>
        </Card>

        {/* ── Right column (2 cols) ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Phone preview */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Preview</h3>
            <div className="bg-gray-100 rounded-2xl p-3">
              <div className="bg-white rounded-xl shadow-sm p-3 flex items-start gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <Bell size={16} className="text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {title || <span className="text-gray-400 font-normal">Notification title</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {body || <span className="text-gray-400">Your message will appear here…</span>}
                  </p>
                </div>
                <p className="text-[10px] text-gray-400 shrink-0">now</p>
              </div>
              <p className="text-center text-[10px] text-gray-400 mt-2">Tirumala App · Android / iOS</p>
            </div>
          </Card>

          {/* Auto-reminder info */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-700">Automatic Reminders</h3>
              <Badge variant="blue">Auto</Badge>
            </div>
            <div className="space-y-2">
              {[
                { label: '1 hour before', desc: 'Booking opens in 1 hour' },
                { label: '5 mins before', desc: 'Booking opens in 5 minutes!' },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg"
                >
                  <div>
                    <p className="text-xs font-medium text-blue-800">{r.label}</p>
                    <p className="text-xs text-blue-600">&ldquo;{r.desc}&rdquo;</p>
                  </div>
                  <Badge variant="green">On</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Warning */}
          <div className="flex gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Broadcasts go to <strong>all registered devices</strong>. Use sparingly for urgent
              updates only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
