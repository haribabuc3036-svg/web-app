'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { scraperApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { Play, Eye, RefreshCw, Clock, AlertCircle } from 'lucide-react';

export default function ScraperPage() {
  const [runResult, setRunResult] = useState<Record<string, unknown> | null>(null);
  const [previewResult, setPreviewResult] = useState<Record<string, unknown> | null>(null);

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['scraper-status'],
    queryFn: () => scraperApi.getStatus(),
    refetchInterval: 10_000,
  });

  const run = useMutation({
    mutationFn: () => scraperApi.run(),
    onSuccess: (res) => {
      toast.success(`Scrape complete — ${res.elapsed_ms}ms`);
      setRunResult(res as unknown as Record<string, unknown>);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const preview = useMutation({
    mutationFn: () => scraperApi.preview(),
    onSuccess: (res) => {
      toast.success('Preview complete');
      setPreviewResult(res as Record<string, unknown>);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const s = status?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scraper</h1>
          <p className="text-sm text-gray-500 mt-1">Manual control of the TTD website poller</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          {/* Status card */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Poller Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400">State</p>
                <Badge variant={s?.isRunning ? 'green' : 'gray'} className="mt-1">
                  {s?.isRunning ? 'Running' : 'Idle'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-400">Last Run</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {s?.lastRun ? formatDateTime(s.lastRun) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Next Run</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  <Clock size={12} className="inline mr-1" />
                  {s?.nextRun ? formatDateTime(s.nextRun) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Last Error</p>
                <p className="text-sm font-medium text-red-600 mt-1">
                  {s?.lastError ? (
                    <span className="flex items-center gap-1">
                      <AlertCircle size={12} />
                      {s.lastError}
                    </span>
                  ) : (
                    <span className="text-green-600">None</span>
                  )}
                </p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Run Poll Cycle</h2>
              <p className="text-sm text-gray-500 mb-4">
                Scrape the TTD website immediately and write changes to Firebase + Supabase.
              </p>
              <Button onClick={() => run.mutate()} loading={run.isPending}>
                <Play size={14} />
                Run Now
              </Button>
            </Card>

            <Card className="p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Preview Scrape</h2>
              <p className="text-sm text-gray-500 mb-4">
                Scrape and return raw parsed data <em>without</em> writing to any database. Safe for debugging.
              </p>
              <Button variant="outline" onClick={() => preview.mutate()} loading={preview.isPending}>
                <Eye size={14} />
                Preview
              </Button>
            </Card>
          </div>

          {/* Run result */}
          {runResult && (
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Last Run Result</h2>
              <pre className="text-xs bg-gray-50 rounded-lg p-4 overflow-x-auto text-gray-700 leading-relaxed">
                {JSON.stringify(runResult, null, 2)}
              </pre>
            </Card>
          )}

          {/* Preview result */}
          {previewResult && (
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Preview Result</h2>
              <pre className="text-xs bg-gray-50 rounded-lg p-4 overflow-x-auto text-gray-700 leading-relaxed">
                {JSON.stringify(previewResult, null, 2)}
              </pre>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
