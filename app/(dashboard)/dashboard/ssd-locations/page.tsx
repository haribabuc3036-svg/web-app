'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ssdLocationsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, RefreshCw, Upload } from 'lucide-react';
import type { SsdLocation } from '@/lib/types';

const emptyForm: Partial<SsdLocation> = {
  name: '',
  area: '',
  timings: '',
  note: '',
  maps_url: '',
  tag: '',
  sort_order: 0,
  is_active: true,
};

export default function SsdLocationsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | 'image' | null>(null);
  const [selected, setSelected] = useState<SsdLocation | null>(null);
  const [form, setForm] = useState<Partial<SsdLocation>>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ssd-locations'],
    queryFn: () => ssdLocationsApi.getAll(),
  });

  const create = useMutation({
    mutationFn: (payload: Partial<SsdLocation>) => ssdLocationsApi.create(payload),
    onSuccess: () => { toast.success('Location created'); qc.invalidateQueries({ queryKey: ['ssd-locations'] }); setModal(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<SsdLocation> }) =>
      ssdLocationsApi.update(id, payload),
    onSuccess: () => { toast.success('Location updated'); qc.invalidateQueries({ queryKey: ['ssd-locations'] }); setModal(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: number) => ssdLocationsApi.delete(id),
    onSuccess: () => { toast.success('Location deleted'); qc.invalidateQueries({ queryKey: ['ssd-locations'] }); setModal(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadImage = useMutation({
    mutationFn: () => ssdLocationsApi.uploadImage(selected!.id, imageFile!),
    onSuccess: () => { toast.success('Image uploaded'); qc.invalidateQueries({ queryKey: ['ssd-locations'] }); setModal(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  function openCreate() { setForm(emptyForm); setModal('create'); }
  function openEdit(loc: SsdLocation) { setSelected(loc); setForm({ ...loc }); setModal('edit'); }
  function openDelete(loc: SsdLocation) { setSelected(loc); setModal('delete'); }
  function openImage(loc: SsdLocation) { setSelected(loc); setImageFile(null); setModal('image'); }

  const locations = data?.data ?? [];

  const FormBody = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Name" value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        <Input label="Area" value={form.area ?? ''} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} required />
      </div>
      <Input label="Timings" value={form.timings ?? ''} onChange={(e) => setForm((f) => ({ ...f, timings: e.target.value }))} placeholder="6:00 AM – 8:00 PM" required />
      <Input label="Google Maps URL" value={form.maps_url ?? ''} onChange={(e) => setForm((f) => ({ ...f, maps_url: e.target.value }))} required />
      <Textarea label="Note" value={form.note ?? ''} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Tag" value={form.tag ?? ''} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} placeholder="Open Now" />
        <Input label="Sort Order" type="number" value={form.sort_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
        Active
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SSD Locations</h1>
          <p className="text-sm text-gray-500 mt-1">SSD token counter pickup points</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw size={14} />Refresh</Button>
          <Button size="sm" onClick={openCreate}><Plus size={14} />Add Location</Button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['#', 'Name', 'Area', 'Timings', 'Tag', 'Sort', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{loc.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {loc.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={loc.image_url} alt={loc.name} className="w-8 h-8 rounded-md object-cover" />
                        )}
                        {loc.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{loc.area}</td>
                    <td className="px-4 py-3 text-gray-600">{loc.timings}</td>
                    <td className="px-4 py-3">{loc.tag && <Badge variant="indigo">{loc.tag}</Badge>}</td>
                    <td className="px-4 py-3 text-gray-400">{loc.sort_order}</td>
                    <td className="px-4 py-3">
                      <Badge variant={loc.is_active ? 'green' : 'red'}>{loc.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openImage(loc)}><Upload size={13} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(loc)}><Pencil size={13} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openDelete(loc)}><Trash2 size={13} className="text-red-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {locations.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No locations yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Modal */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Add SSD Location" size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(form); }}>
          <FormBody />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={`Edit: ${selected?.name}`} size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); update.mutate({ id: selected!.id, payload: form }); }}>
          <FormBody />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={update.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Delete Location" size="sm">
        <p className="text-sm text-gray-600 mb-4">Delete <strong>{selected?.name}</strong>?</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
          <Button variant="danger" loading={del.isPending} onClick={() => del.mutate(selected!.id)}>Delete</Button>
        </div>
      </Modal>

      {/* Image Upload Modal */}
      <Modal open={modal === 'image'} onClose={() => setModal(null)} title={`Upload Image: ${selected?.name}`} size="sm">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); uploadImage.mutate(); }}>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Image</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700" required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={uploadImage.isPending} disabled={!imageFile}><Upload size={14} />Upload</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
