'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wallpapersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PageLoader } from '@/components/ui/spinner';
import { formatBytes, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { Upload, Trash2, RefreshCw } from 'lucide-react';
import type { Wallpaper } from '@/lib/types';

export default function WallpapersPage() {
  const qc = useQueryClient();
  const [uploadModal, setUploadModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Wallpaper | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['wallpapers'],
    queryFn: () => wallpapersApi.getAll(200),
  });

  const upload = useMutation({
    mutationFn: () => wallpapersApi.upload(file!, title),
    onSuccess: () => {
      toast.success('Wallpaper uploaded');
      qc.invalidateQueries({ queryKey: ['wallpapers'] });
      setUploadModal(false);
      setFile(null);
      setTitle('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => wallpapersApi.delete(id),
    onSuccess: () => {
      toast.success('Wallpaper deleted');
      qc.invalidateQueries({ queryKey: ['wallpapers'] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const wallpapers = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallpapers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.count ?? 0} wallpapers in Cloudinary
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setUploadModal(true)}>
            <Upload size={14} />
            Upload
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {wallpapers.map((w) => (
            <div
              key={w.id}
              className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={w.image_url}
                alt={w.title}
                className="w-full aspect-[9/16] object-cover"
                loading="lazy"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Button
                  variant="danger"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setDeleteTarget(w)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              {/* Title */}
              <div className="p-2">
                <p className="text-xs font-medium text-gray-700 truncate">{w.title}</p>
                <p className="text-xs text-gray-400">{formatBytes(w.bytes)}</p>
              </div>
            </div>
          ))}
          {wallpapers.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400">
              No wallpapers yet. Upload one!
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={uploadModal} onClose={() => setUploadModal(false)} title="Upload Wallpaper">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!file || !title) return;
            upload.mutate();
          }}
        >
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tirumala sunset"
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              required
            />
            {file && (
              <p className="text-xs text-gray-400">
                {file.name} · {formatBytes(file.size)}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setUploadModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={upload.isPending} disabled={!file || !title}>
              <Upload size={14} />
              Upload
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Wallpaper" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Delete <strong>{deleteTarget?.title}</strong>? This will also remove it from Cloudinary.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={del.isPending}
            onClick={() => del.mutate(deleteTarget!.id)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
