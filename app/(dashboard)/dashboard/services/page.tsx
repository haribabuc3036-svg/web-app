'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Card } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Pencil, RefreshCw, Upload, Search } from 'lucide-react';
import type { ServiceCatalogItem } from '@/lib/types';

export default function ServicesPage() {
  const qc = useQueryClient();
  const [editTarget, setEditTarget] = useState<ServiceCatalogItem | null>(null);
  const [imgTarget, setImgTarget] = useState<ServiceCatalogItem | null>(null);
  const [form, setForm] = useState<Partial<ServiceCatalogItem>>({});
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getCatalog(),
  });

  const update = useMutation({
    mutationFn: ({ id, p }: { id: string; p: Partial<ServiceCatalogItem> }) => servicesApi.update(id, p),
    onSuccess: () => { toast.success('Service updated'); qc.invalidateQueries({ queryKey: ['services'] }); setEditTarget(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadImg = useMutation({
    mutationFn: () => servicesApi.uploadCategoryImage(imgTarget!.category_id, imgFile!),
    onSuccess: () => { toast.success('Image uploaded'); qc.invalidateQueries({ queryKey: ['services'] }); setImgTarget(null); setImgFile(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const services = data?.data ?? [];

  const filtered = services.filter((s) =>
    search === '' ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.category_heading.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, ServiceCatalogItem[]>>((acc, s) => {
    const cat = s.category_heading || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">TTD service catalog — {services.length} items</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw size={14} />Refresh</Button>
      </div>

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter services..."
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <Card key={cat} className="p-0 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{cat}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Image', 'Title', 'Description', 'Tag', ''].map((h) => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          {s.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.image} alt={s.title} className="w-9 h-9 rounded-lg object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Upload size={12} className="text-gray-300" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{s.title}</td>
                        <td className="px-4 py-2.5 text-gray-500 max-w-xs truncate">{s.description || '---'}</td>
                        <td className="px-4 py-2.5 text-gray-500">{s.tag || '---'}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" title="Upload category image" onClick={() => { setImgTarget(s); setImgFile(null); }}>
                              <Upload size={13} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditTarget(s);
                              setForm({ title: s.title, description: s.description, tag: s.tag, tag_color: s.tag_color, sort_order: s.sort_order });
                            }}>
                              <Pencil size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="py-12 text-center text-gray-400">No services found</div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit: ${editTarget?.title}`} size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); update.mutate({ id: editTarget!.id, p: form }); }}>
          <Input label="Title" value={form.title ?? ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <Textarea label="Description" value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tag" value={form.tag ?? ''} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} />
            <Input label="Tag Color" value={form.tag_color ?? ''} onChange={(e) => setForm((f) => ({ ...f, tag_color: e.target.value }))} placeholder="#22c55e" />
          </div>
          <Input label="Sort Order" type="number" value={form.sort_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="submit" loading={update.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Upload Image Modal */}
      <Modal open={!!imgTarget} onClose={() => setImgTarget(null)} title={`Upload Image: ${imgTarget?.category_heading}`} size="sm">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); uploadImg.mutate(); }}>
          <p className="text-xs text-gray-500">
            This sets the image for the entire category: <strong>{imgTarget?.category_heading}</strong>
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Category Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImgFile(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setImgTarget(null)}>Cancel</Button>
            <Button type="submit" loading={uploadImg.isPending} disabled={!imgFile}>
              <Upload size={14} />Upload
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}