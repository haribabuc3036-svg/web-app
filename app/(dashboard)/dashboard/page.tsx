'use client';

import { useQuery } from '@tanstack/react-query';
import { healthApi, darshanApi, ssdApi, wallpapersApi } from '@/lib/api';
import { StatCard, Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/utils';
import {
  Activity,
  Users,
  Ticket,
  Image,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => healthApi.get(),
    refetchInterval: 30_000,
  });

  const { data: darshan } = useQuery({
    queryKey: ['darshan-all'],
    queryFn: () => darshanApi.getAll(),
  });

  const { data: ssd } = useQuery({
    queryKey: ['ssd-latest'],
    queryFn: () => ssdApi.getLatest(),
  });

  const { data: wallpapers } = useQuery({
    queryKey: ['wallpapers'],
    queryFn: () => wallpapersApi.getAll(),
  });

  const latestDarshan = darshan?.data?.[0];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tirumala TTD backend status and quick stats
        </p>
      </div>

      {/* Health banner */}
      {health && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
            health.status === 'ok'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {health.status === 'ok' ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          Backend is {health.status === 'ok' ? 'healthy' : 'unhealthy'} — {health.env} •{' '}
          Last checked {formatDateTime(health.timestamp)}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Darshan Records"
          value={darshan?.count ?? '—'}
          subtitle="Total entries in DB"
          icon={<Users size={20} />}
          color="indigo"
        />
        <StatCard
          title="Today's Pilgrims"
          value={latestDarshan?.pilgrims ?? '—'}
          subtitle={latestDarshan ? `Date: ${latestDarshan.date}` : 'No data'}
          icon={<Activity size={20} />}
          color="blue"
        />
        <StatCard
          title="SSD Balance Tickets"
          value={ssd?.data?.balance_tickets ?? '—'}
          subtitle={ssd?.data ? `Slot: ${ssd.data.running_slot}` : 'No data'}
          icon={<Ticket size={20} />}
          color="green"
        />
        <StatCard
          title="Wallpapers"
          value={wallpapers?.count ?? '—'}
          subtitle="In Cloudinary"
          icon={<Image size={20} />}
          color="yellow"
        />
      </div>

      {/* Poller status */}
      {health && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Background Pollers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'TTD Poller', status: health.poller },
              { label: 'Schedule Poller', status: (health as unknown as Record<string, unknown>).schedulePoller as typeof health.poller },
              { label: 'Pilgrims Poller', status: (health as unknown as Record<string, unknown>).pilgrimsPoller as typeof health.poller },
              { label: 'Latest Updates', status: (health as unknown as Record<string, unknown>).latestUpdatesPoller as typeof health.poller },
              { label: 'News Poller', status: (health as unknown as Record<string, unknown>).newsPoller as typeof health.poller },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <Badge variant={status?.isRunning ? 'green' : 'gray'}>
                  {status?.isRunning ? 'Running' : 'Idle'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Latest darshan snapshot */}
      {latestDarshan && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Latest Darshan Update</h2>
            <Link href="/dashboard/darshan" className="text-xs text-indigo-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { label: 'Date', value: latestDarshan.date },
              { label: 'Pilgrims', value: latestDarshan.pilgrims },
              { label: 'Tonsures', value: latestDarshan.tonsures },
              { label: 'Hundi', value: latestDarshan.hundi },
              { label: 'Waiting', value: latestDarshan.waiting },
              { label: 'Darshan Time', value: latestDarshan.darshan_time },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{value || '—'}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!health && !darshan && !ssd && <PageLoader />}
    </div>
  );
}
