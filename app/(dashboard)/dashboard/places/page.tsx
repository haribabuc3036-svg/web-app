'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { placesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Card } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, RefreshCw, ChevronRight, Image as ImageIcon } from 'lucide-react';
import type { PlaceRegion, Place } from '@/lib/types';

const emptyRegion = { title: '', subtitle: '' as string | null, sort_order: 0 };
const emptyPlace = { name: '', description: '', maps_url: '', distance_from_tirumala_km: 0, sort_order: 0 };

export default function PlacesPage() {
  const qc = useQueryClient();
  const [selectedRegion, setSelectedRegion] = useState<PlaceRegion | null>(null);
  const [regionModal, setRegionModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [placeModal, setPlaceModal] = useState<'create' | 'edit' | 'delete' | 'photos' | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [regionForm, setRegionForm] = useState(emptyRegion);
  const [placeForm, setPlaceForm] = useState(emptyPlace);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { data: regionsData, isLoading: regLoading, refetch } = useQuery({
    queryKey: ['regions'],
    queryFn: () => placesApi.getRegions(),
  });

  const { data: placesData, isLoading: placesLoading } = useQuery({
    queryKey: ['places', selectedRegion?.id],
    queryFn: () => placesApi.getByRegion(selectedRegion!.id),
    enabled: !!selectedRegion,
  });

  const { data: photosData } = useQuery({
    queryKey: ['place-photos', selectedPlace?.id],
    queryFn: () => placesApi.getPhotos(selectedPlace!.id),
    enabled: !!selectedPlace && placeModal === 'photos',
  });

  const createRegion = useMutation({
    mutationFn: (p: typeof emptyRegion) => placesApi.createRegion(p),
    onSuccess: () => { toast.success('Region created'); qc.invalidateQueries({ queryKey: ['regions'] }); setRegionModal(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRegion = useMutation({
    mutationFn: ({ id, p }: { id: string; p: Partial<PlaceRegion> }) => placesApi.updateRegion(id, p),
    onSuccess: () => { toast.success('Region updated'); qc.invalidateQueries({ queryKey: ['regions'] }); setRegionModal(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRegion = useMutation({
    mutationFn: (id: string) => placesApi.deleteRegion(id),
    onSuccess: () => {
      toast.success('Region deleted');
      qc.invalidateQueries({ queryKey: ['regions'] });
      setSelectedRegion(null);
      setRegionModal(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createPlace = useMutation({
    mutationFn: (p: typeof emptyPlace) => placesApi.create({ ...p, region_id: selectedRegion!.id }),
    onSuccess: () => { toast.success('Place created'); qc.invalidateQueries({ queryKey: ['places', selectedRegion?.id] }); setPlaceModal(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePlace = useMutation({
    mutationFn: ({ id, p }: { id: string; p: Partial<Place> }) => placesApi.update(id, p),
    onSuccess: () => { toast.success('Place updated'); qc.invalidateQueries({ queryKey: ['places', selectedRegion?.id] }); setPlaceModal(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePlace = useMutation({
    mutationFn: (id: string) => placesApi.delete(id),
    onSuccess: () => { toast.success('Place deleted'); qc.invalidateQueries({ queryKey: ['places', selectedRegion?.id] }); setPlaceModal(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadPhoto = useMutation({
    mutationFn: () => placesApi.uploadPhoto(selectedPlace!.id, photoFile!),
    onSuccess: () => { toast.success('Photo uploaded'); qc.invalidateQueries({ queryKey: ['place-photos', selectedPlace?.id] }); setPhotoFile(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePhoto = useMutation({
    mutationFn: (photoId: number) => placesApi.deletePhoto(selectedPlace!.id, photoId),
    onSuccess: () => { toast.success('Photo deleted'); qc.invalidateQueries({ queryKey: ['place-photos', selectedPlace?.id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const regions = regionsData?.data ?? [];
  const places = placesData?.data ?? [];
  const photos = photosData?.data ?? [];

  const RegionForm = () => (
    <div className="space-y-3">
      <Input label="Title" value={regionForm.title} onChange={(e) => setRegionForm((f) => ({ ...f, title: e.target.value }))} required />
      <Input label="Subtitle" value={regionForm.subtitle ?? ''} onChange={(e) => setRegionForm((f) => ({ ...f, subtitle: e.target.value }))} />
      <Input label="Sort Order" type="number" value={regionForm.sort_order} onChange={(e) => setRegionForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
    </div>
  );

  const PlaceForm = () => (
    <div className="space-y-3">
      <Input label="Name" value={placeForm.name} onChange={(e) => setPlaceForm((f) => ({ ...f, name: e.target.value }))} required />
      <Textarea label="Description" value={placeForm.description} onChange={(e) => setPlaceForm((f) => ({ ...f, description: e.target.value }))} />
      <Input label="Google Maps URL" value={placeForm.maps_url} onChange={(e) => setPlaceForm((f) => ({ ...f, maps_url: e.target.value }))} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Distance from Tirumala (km)" type="number" value={placeForm.distance_from_tirumala_km} onChange={(e) => setPlaceForm((f) => ({ ...f, distance_from_tirumala_km: Number(e.target.value) }))} />
        <Input label="Sort Order" type="number" value={placeForm.sort_order} onChange={(e) => setPlaceForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Places</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw size={14} />Refresh</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regions Panel */}
        <Card className="lg:col-span-1 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Regions</h2>
            <Button size="sm" onClick={() => { setRegionForm({ ...emptyRegion }); setRegionModal('create'); }}>
              <Plus size={13} />New
            </Button>
          </div>
          {regLoading ? (
            <div className="p-8 text-center"><PageLoader /></div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {regions.map((r) => (
                <li
                  key={r.id}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedRegion?.id === r.id ? 'bg-indigo-50' : ''}`}
                  onClick={() => setSelectedRegion(r)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.title}</p>
                    {r.subtitle && <p className="text-xs text-gray-400">{r.subtitle}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedRegion(r); setRegionForm({ title: r.title, subtitle: r.subtitle, sort_order: r.sort_order }); setRegionModal('edit'); }}>
                      <Pencil size={12} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedRegion(r); setRegionModal('delete'); }}>
                      <Trash2 size={12} className="text-red-400" />
                    </Button>
                    <ChevronRight size={14} className="text-gray-300 ml-1" />
                  </div>
                </li>
              ))}
              {regions.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-gray-400">No regions</li>
              )}
            </ul>
          )}
        </Card>

        {/* Places Panel */}
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              {selectedRegion ? `Places in "${selectedRegion.title}"` : 'Select a region'}
            </h2>
            {selectedRegion && (
              <Button size="sm" onClick={() => { setPlaceForm({ ...emptyPlace }); setPlaceModal('create'); }}>
                <Plus size={13} />Add Place
              </Button>
            )}
          </div>
          {!selectedRegion ? (
            <div className="p-12 text-center text-gray-400 text-sm">? Choose a region</div>
          ) : placesLoading ? (
            <div className="p-8 text-center"><PageLoader /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Name', 'Description', 'Distance', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {places.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate text-xs">{p.description}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{p.distance_from_tirumala_km} km</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" title="Photos" onClick={() => { setSelectedPlace(p); setPlaceModal('photos'); }}>
                            <ImageIcon size={13} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedPlace(p); setPlaceForm({ name: p.name, description: p.description, maps_url: p.maps_url, distance_from_tirumala_km: p.distance_from_tirumala_km, sort_order: p.sort_order }); setPlaceModal('edit'); }}>
                            <Pencil size={13} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedPlace(p); setPlaceModal('delete'); }}>
                            <Trash2 size={13} className="text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {places.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No places</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Region Modals */}
      <Modal open={regionModal === 'create'} onClose={() => setRegionModal(null)} title="New Region">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createRegion.mutate(regionForm); }}>
          <RegionForm />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setRegionModal(null)}>Cancel</Button>
            <Button type="submit" loading={createRegion.isPending}>Create</Button>
          </div>
        </form>
      </Modal>

      <Modal open={regionModal === 'edit'} onClose={() => setRegionModal(null)} title={`Edit: ${selectedRegion?.title}`}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); updateRegion.mutate({ id: selectedRegion!.id, p: regionForm }); }}>
          <RegionForm />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setRegionModal(null)}>Cancel</Button>
            <Button type="submit" loading={updateRegion.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={regionModal === 'delete'} onClose={() => setRegionModal(null)} title="Delete Region" size="sm">
        <p className="text-sm text-gray-600 mb-4">Delete region <strong>{selectedRegion?.title}</strong>? All its places will also be deleted.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRegionModal(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteRegion.isPending} onClick={() => deleteRegion.mutate(selectedRegion!.id)}>Delete</Button>
        </div>
      </Modal>

      {/* Place Modals */}
      <Modal open={placeModal === 'create'} onClose={() => setPlaceModal(null)} title={`New Place in "${selectedRegion?.title}"`} size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createPlace.mutate(placeForm); }}>
          <PlaceForm />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setPlaceModal(null)}>Cancel</Button>
            <Button type="submit" loading={createPlace.isPending}>Create</Button>
          </div>
        </form>
      </Modal>

      <Modal open={placeModal === 'edit'} onClose={() => setPlaceModal(null)} title={`Edit: ${selectedPlace?.name}`} size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); updatePlace.mutate({ id: selectedPlace!.id, p: placeForm }); }}>
          <PlaceForm />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setPlaceModal(null)}>Cancel</Button>
            <Button type="submit" loading={updatePlace.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={placeModal === 'delete'} onClose={() => setPlaceModal(null)} title="Delete Place" size="sm">
        <p className="text-sm text-gray-600 mb-4">Delete <strong>{selectedPlace?.name}</strong>?</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setPlaceModal(null)}>Cancel</Button>
          <Button variant="danger" loading={deletePlace.isPending} onClick={() => deletePlace.mutate(selectedPlace!.id)}>Delete</Button>
        </div>
      </Modal>

      <Modal open={placeModal === 'photos'} onClose={() => setPlaceModal(null)} title={`Photos: ${selectedPlace?.name}`} size="xl">
        <div className="space-y-4">
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); uploadPhoto.mutate(); }}>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 block mb-1">Upload Photo</label>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="text-sm text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700" />
            </div>
            <Button type="submit" size="sm" loading={uploadPhoto.isPending} disabled={!photoFile}>Upload</Button>
          </form>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((ph) => (
              <div key={ph.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph.image_url} alt="place" className="w-full aspect-square object-cover rounded-lg" />
                <button
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deletePhoto.mutate(ph.id)}
                >x</button>
              </div>
            ))}
            {photos.length === 0 && <p className="col-span-3 text-sm text-gray-400 py-4 text-center">No photos</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
