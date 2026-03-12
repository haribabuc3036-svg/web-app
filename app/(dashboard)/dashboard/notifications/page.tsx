'use client';

import { useState, useEffect } from 'react';
import { notificationsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Bell, Send, Smartphone } from 'lucide-react';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);

  useEffect(() => {
    notificationsApi
      .count()
      .then((r) => setDeviceCount(r.count))
      .catch(() => setDeviceCount(null));
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setSending(true);
    try {
      const result = await notificationsApi.send({ title: title.trim(), body: body.trim() });
      toast.success(
        `Sent to ${result.successCount} device${result.successCount !== 1 ? 's' : ''}` +
          (result.failureCount > 0 ? ` (${result.failureCount} failed)` : '')
      );
      setTitle('');
      setBody('');
      // Refresh device count after send in case stale tokens were cleaned up
      notificationsApi.count().then((r) => setDeviceCount(r.count)).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Push Notifications</h1>
          <p className="text-sm text-gray-400">Broadcast messages to all registered devices</p>
        </div>
      </div>

      {/* Device count badge */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 rounded-xl border border-gray-700">
        <Smartphone className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-300">
          {deviceCount === null
            ? 'Loading registered devices…'
            : `${deviceCount} device${deviceCount !== 1 ? 's' : ''} registered`}
        </span>
      </div>

      {/* Send form */}
      <form
        onSubmit={handleSend}
        className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-5"
      >
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New Update Available"
            maxLength={100}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white
                       placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your notification message here…"
            rows={4}
            maxLength={500}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white
                       placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500
                       resize-none"
          />
          <p className="text-xs text-gray-600 text-right">{body.length}/500</p>
        </div>

        <button
          type="submit"
          disabled={sending || !title.trim() || !body.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600
                     hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-medium text-sm rounded-xl transition-colors"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Sending…' : 'Send to All Devices'}
        </button>
      </form>

      {/* Info box */}
      <div className="px-4 py-3 bg-amber-900/20 border border-amber-700/40 rounded-xl">
        <p className="text-xs text-amber-400/80 leading-relaxed">
          <strong>Automatic reminders</strong> are also sent by the server: 1 hour and 5 minutes
          before each service booking date. You don&apos;t need to manually send those.
        </p>
      </div>
    </div>
  );
}
