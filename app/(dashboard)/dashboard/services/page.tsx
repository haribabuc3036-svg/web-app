'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Card } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Pencil, RefreshCw, Upload, Search, Calendar, Plus, Trash2, Images } from 'lucide-react';
import type { ServiceItem } from '@/lib/types';

type EditTarget = ServiceItem & { categoryId: string; categoryHeading: string };
type UploadTarget = { categoryId: string; categoryHeading: string };
type BookingTarget = { id: string; title: string };
type ImagesTarget = { id: string; title: string };

export default function ServicesPage() {
  const qc = useQueryClient();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);
  const [bookingTarget, setBookingTarget] = useState<BookingTarget | null>(null);
  const [imagesTarget, setImagesTarget] = useState<ImagesTarget | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; tag: string; tag_color: string; icon: string }>({ title: '', description: '', tag: '', tag_color: '', icon: '' });
  const [bookingForm, setBookingForm] = useState<{ booking_date: string; instructions: string[] }>({ booking_date: '', instructions: [] });
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [detailImgFile, setDetailImgFile] = useState<File | null>(null);
  const [search, setSearch] = useState('');

  // Add / delete state
  const [addServiceTarget, setAddServiceTarget] = useState<{ categoryId: string; categoryHeading: string } | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [deleteServiceTarget, setDeleteServiceTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<{ id: string; heading: string; serviceIds: string[] } | null>(null);
  const [newSvcForm, setNewSvcForm] = useState({ id: '', title: '', description: '', icon: '', tag: '', tag_color: '', url: '' });
  const [newCatForm, setNewCatForm] = useState({ category_id: '', category_heading: '', category_icon: '', service_id: '', service_title: '' });

  const toSlug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getCatalog(),
  });

  const { data: bookingDetail } = useQuery({
    queryKey: ['service-detail', bookingTarget?.id],
    queryFn: () => servicesApi.getById(bookingTarget!.id),
    enabled: !!bookingTarget,
  });

  const { data: serviceImagesData, refetch: refetchImages } = useQuery({
    queryKey: ['service-images', imagesTarget?.id],
    queryFn: () => servicesApi.getImages(imagesTarget!.id),
    enabled: !!imagesTarget,
  });

  useEffect(() => {
    if (bookingDetail?.data) {
      const d = bookingDetail.data;
      setBookingForm({
        booking_date: d.bookingDate ? new Date(d.bookingDate).toISOString().slice(0, 16) : '',
        instructions: d.instructions ?? [],
      });
    } else if (bookingTarget) {
      setBookingForm({ booking_date: '', instructions: [] });
    }
  }, [bookingDetail, bookingTarget]);

  const update = useMutation({
    mutationFn: ({ id, p }: { id: string; p: Record<string, unknown> }) =>
      servicesApi.update(id, p),
    onSuccess: () => {
      toast.success('Service updated');
      qc.invalidateQueries({ queryKey: ['services'] });
      setEditTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadImg = useMutation({
    mutationFn: () => servicesApi.uploadCategoryImage(uploadTarget!.categoryId, imgFile!),
    onSuccess: () => {
      toast.success('Category image uploaded');
      qc.invalidateQueries({ queryKey: ['services'] });
      setUploadTarget(null);
      setImgFile(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadIconImg = useMutation({
    mutationFn: () => servicesApi.uploadIconImage(editTarget!.id, iconFile!),
    onSuccess: () => {
      toast.success('Icon image uploaded');
      qc.invalidateQueries({ queryKey: ['services'] });
      setIconFile(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadDetailImg = useMutation({
    mutationFn: () => servicesApi.uploadImage(imagesTarget!.id, detailImgFile!),
    onSuccess: () => {
      toast.success('Image added');
      void refetchImages();
      setDetailImgFile(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteDetailImg = useMutation({
    mutationFn: (imageId: number) => servicesApi.deleteImage(imageId),
    onSuccess: () => {
      toast.success('Image deleted');
      void refetchImages();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patchBooking = useMutation({
    mutationFn: (payload: { booking_date?: string | null; instructions?: string[] | null }) =>
      servicesApi.patchBooking(bookingTarget!.id, payload),
    onSuccess: () => {
      toast.success('Booking info saved');
      qc.invalidateQueries({ queryKey: ['service-detail', bookingTarget?.id] });
      setBookingTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createSvc = useMutation({
    mutationFn: (payload: Parameters<typeof servicesApi.createService>[0]) => servicesApi.createService(payload),
    onSuccess: () => {
      toast.success('Service created');
      qc.invalidateQueries({ queryKey: ['services'] });
      setAddServiceTarget(null);
      setShowAddCategory(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSvc = useMutation({
    mutationFn: (id: string) => servicesApi.deleteService(id),
    onSuccess: () => {
      toast.success('Service deleted');
      qc.invalidateQueries({ queryKey: ['services'] });
      setDeleteServiceTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCat = useMutation({
    mutationFn: async (serviceIds: string[]) => {
      await Promise.all(serviceIds.map((id) => servicesApi.deleteService(id)));
    },
    onSuccess: () => {
      toast.success('Category deleted');
      qc.invalidateQueries({ queryKey: ['services'] });
      setDeleteCategoryTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const categories = data?.data ?? [];
  const totalServices = categories.reduce((n, cat) => n + cat.services.length, 0);

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      services: cat.services.filter(
        (s) =>
          search === '' ||
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          cat.heading.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.services.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">
            TTD service catalog � {categories.length} categories, {totalServices} services
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => { setNewCatForm({ category_id: '', category_heading: '', category_icon: '', service_id: '', service_title: '' }); setShowAddCategory(true); }}
          >
            <Plus size={14} />Add Category
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} />Refresh
          </Button>
        </div>
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
          {filteredCategories.map((cat) => (
            <Card key={cat.id} className="p-0 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {cat.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.image} alt={cat.heading} className="w-6 h-6 rounded object-cover" />
                  )}
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{cat.heading}</p>
                  <span className="text-xs text-gray-400">({cat.services.length})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Add service to this category"
                    onClick={() => { setAddServiceTarget({ categoryId: cat.id, categoryHeading: cat.heading }); setNewSvcForm({ id: '', title: '', description: '', icon: '', tag: '', tag_color: '', url: '' }); }}
                  >
                    <Plus size={13} />
                    <span className="text-xs hidden sm:inline">Add service</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Upload category image"
                    onClick={() => { setUploadTarget({ categoryId: cat.id, categoryHeading: cat.heading }); setImgFile(null); }}
                  >
                    <Upload size={13} />
                    <span className="text-xs hidden sm:inline">Category image</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Delete entire category"
                    onClick={() => setDeleteCategoryTarget({ id: cat.id, heading: cat.heading, serviceIds: cat.services.map((s) => s.id) })}
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                    {cat.services.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        {/* Icon */}
                        <div className="shrink-0">
                          {s.iconImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.iconImage} alt={s.title} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center" title={s.icon}>
                              <span className="text-[8px] font-mono text-gray-500 leading-none text-center px-0.5 break-all">{s.icon}</span>
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{s.title}</p>
                          <p className="text-xs text-gray-400 truncate">{s.description || '—'}</p>
                        </div>
                        {/* Tag */}
                        {s.tag && (
                          <span
                            className="hidden sm:inline-block shrink-0 px-2 py-0.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: s.tagColor ?? '#6b7280' }}
                          >
                            {s.tag}
                          </span>
                        )}
                        {/* Actions */}
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Manage detail images"
                            onClick={() => { setImagesTarget({ id: s.id, title: s.title }); setDetailImgFile(null); }}
                          >
                            <Images size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Set booking date & instructions"
                            onClick={() => setBookingTarget({ id: s.id, title: s.title })}
                          >
                            <Calendar size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditTarget({ ...s, categoryId: cat.id, categoryHeading: cat.heading });
                              setForm({
                                title: s.title,
                                description: s.description,
                                tag: s.tag ?? '',
                                tag_color: s.tagColor ?? '',
                                icon: s.icon,
                              });
                              setIconFile(null);
                            }}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete service"
                            onClick={() => setDeleteServiceTarget({ id: s.id, title: s.title })}
                          >
                            <Trash2 size={13} className="text-red-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
            </Card>
          ))}
          {filteredCategories.length === 0 && (
            <div className="py-12 text-center text-gray-400">No services found</div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      <Modal
        open={!!bookingTarget}
        onClose={() => setBookingTarget(null)}
        title={`Booking: ${bookingTarget?.title}`}
        size="lg"
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            patchBooking.mutate({
              booking_date: bookingForm.booking_date
                ? new Date(bookingForm.booking_date).toISOString()
                : null,
              instructions: bookingForm.instructions.length > 0
                ? bookingForm.instructions.filter(Boolean)
                : null,
            });
          }}
        >
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Booking Date &amp; Time</label>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={bookingForm.booking_date}
                onChange={(e) => setBookingForm((f) => ({ ...f, booking_date: e.target.value }))}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
              {bookingForm.booking_date && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setBookingForm((f) => ({ ...f, booking_date: '' }))}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Instructions</label>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setBookingForm((f) => ({ ...f, instructions: [...f.instructions, ''] }))}
              >
                <Plus size={13} />Add step
              </Button>
            </div>
            {bookingForm.instructions.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No instructions yet — click &quot;Add step&quot; to add one.</p>
            ) : (
              <div className="space-y-2">
                {bookingForm.instructions.map((line, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="mt-2 text-xs font-medium text-gray-400 w-5 text-right shrink-0">{i + 1}.</span>
                    <textarea
                      value={line}
                      rows={2}
                      onChange={(e) =>
                        setBookingForm((f) => {
                          const updated = [...f.instructions];
                          updated[i] = e.target.value;
                          return { ...f, instructions: updated };
                        })
                      }
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setBookingForm((f) => ({
                          ...f,
                          instructions: f.instructions.filter((_, j) => j !== i),
                        }))
                      }
                      className="mt-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" type="button" onClick={() => setBookingTarget(null)}>Cancel</Button>
            <Button type="submit" loading={patchBooking.isPending}>
              <Calendar size={14} />Save Booking
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit: ${editTarget?.title}`} size="lg">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate({
              id: editTarget!.id,
              p: {
                title: form.title,
                description: form.description,
                tag: form.tag || null,
                tag_color: form.tag_color || null,
                icon: form.icon || null,
              },
            });
          }}
        >
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tag"
              value={form.tag}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
            />
            <Input
              label="Tag Color"
              value={form.tag_color}
              onChange={(e) => setForm((f) => ({ ...f, tag_color: e.target.value }))}
              placeholder="#22c55e"
            />
          </div>

          {/* Icon */}
          <div className="border border-gray-100 rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Icon</p>
            <div className="flex items-end gap-3">
              <div className="shrink-0">
                {editTarget?.iconImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editTarget.iconImage} alt="icon" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center p-1" title={form.icon}>
                    <span className="text-[8px] font-mono text-gray-500 leading-none text-center break-all">{form.icon || '?'}</span>
                  </div>
                )}
              </div>
              <Input
                label="Icon name (MaterialCommunityIcons)"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="e.g. temple-hindu"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Replace with image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIconFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!iconFile}
                loading={uploadIconImg.isPending}
                onClick={() => uploadIconImg.mutate()}
              >
                <Upload size={13} />Upload
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="submit" loading={update.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Images Modal */}
      <Modal
        open={!!imagesTarget}
        onClose={() => setImagesTarget(null)}
        title={`Images: ${imagesTarget?.title}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Existing images grid */}
          {(serviceImagesData?.data ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No detail images yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {(serviceImagesData?.data ?? []).map((img) => (
                <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.imageUrl} alt="" className="w-full h-32 object-cover" />
                  <button
                    type="button"
                    onClick={() => deleteDetailImg.mutate(img.id)}
                    className="absolute top-1 right-1 p-1 rounded bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete image"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload new image */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Add image</p>
            <form
              className="flex items-end gap-3"
              onSubmit={(e) => { e.preventDefault(); uploadDetailImg.mutate(); }}
            >
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setDetailImgFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700"
                  required
                />
              </div>
              <Button type="submit" disabled={!detailImgFile} loading={uploadDetailImg.isPending}>
                <Upload size={14} />Upload
              </Button>
            </form>
          </div>
        </div>
      </Modal>

      {/* Add Service Modal */}
      <Modal open={!!addServiceTarget} onClose={() => setAddServiceTarget(null)} title={`Add Service to: ${addServiceTarget?.categoryHeading}`} size="lg">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const slug = newSvcForm.id || toSlug(newSvcForm.title);
            createSvc.mutate({
              id: slug,
              title: newSvcForm.title,
              category_id: addServiceTarget!.categoryId,
              category_heading: addServiceTarget!.categoryHeading,
              description: newSvcForm.description || undefined,
              icon: newSvcForm.icon || undefined,
              tag: newSvcForm.tag || null,
              tag_color: newSvcForm.tag_color || null,
              url: newSvcForm.url || undefined,
            });
          }}
        >
          <Input label="Title *" value={newSvcForm.title} onChange={(e) => setNewSvcForm((f) => ({ ...f, title: e.target.value }))} required />
          <Input
            label="ID (auto-generated from title if blank)"
            value={newSvcForm.id}
            onChange={(e) => setNewSvcForm((f) => ({ ...f, id: e.target.value }))}
            placeholder={toSlug(newSvcForm.title) || 'e.g. room-booking'}
          />
          <Textarea label="Description" value={newSvcForm.description} onChange={(e) => setNewSvcForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tag" value={newSvcForm.tag} onChange={(e) => setNewSvcForm((f) => ({ ...f, tag: e.target.value }))} />
            <Input label="Tag Color" value={newSvcForm.tag_color} onChange={(e) => setNewSvcForm((f) => ({ ...f, tag_color: e.target.value }))} placeholder="#22c55e" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Icon (MaterialCommunityIcons)" value={newSvcForm.icon} onChange={(e) => setNewSvcForm((f) => ({ ...f, icon: e.target.value }))} placeholder="temple-hindu" />
            <Input label="URL" value={newSvcForm.url} onChange={(e) => setNewSvcForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setAddServiceTarget(null)}>Cancel</Button>
            <Button type="submit" loading={createSvc.isPending}><Plus size={14} />Create Service</Button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal open={showAddCategory} onClose={() => setShowAddCategory(false)} title="Add New Category" size="lg">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const catId = newCatForm.category_id || toSlug(newCatForm.category_heading);
            const svcId = newCatForm.service_id || toSlug(newCatForm.service_title);
            createSvc.mutate({
              id: svcId,
              title: newCatForm.service_title,
              category_id: catId,
              category_heading: newCatForm.category_heading,
              icon: newCatForm.category_icon || undefined,
            });
          }}
        >
          <div className="border border-gray-100 rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</p>
            <Input label="Heading *" value={newCatForm.category_heading} onChange={(e) => setNewCatForm((f) => ({ ...f, category_heading: e.target.value }))} required />
            <Input
              label="Category ID (auto-generated if blank)"
              value={newCatForm.category_id}
              onChange={(e) => setNewCatForm((f) => ({ ...f, category_id: e.target.value }))}
              placeholder={toSlug(newCatForm.category_heading) || 'e.g. prasadam-booking'}
            />
            <Input label="Category Icon (MaterialCommunityIcons)" value={newCatForm.category_icon} onChange={(e) => setNewCatForm((f) => ({ ...f, category_icon: e.target.value }))} placeholder="temple-hindu" />
          </div>
          <div className="border border-gray-100 rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">First Service</p>
            <Input label="Service Title *" value={newCatForm.service_title} onChange={(e) => setNewCatForm((f) => ({ ...f, service_title: e.target.value }))} required />
            <Input
              label="Service ID (auto-generated if blank)"
              value={newCatForm.service_id}
              onChange={(e) => setNewCatForm((f) => ({ ...f, service_id: e.target.value }))}
              placeholder={toSlug(newCatForm.service_title) || 'e.g. special-entry-darshan'}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowAddCategory(false)}>Cancel</Button>
            <Button type="submit" loading={createSvc.isPending}><Plus size={14} />Create Category</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Service Confirm */}
      <Modal open={!!deleteServiceTarget} onClose={() => setDeleteServiceTarget(null)} title="Delete Service" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to delete <strong>{deleteServiceTarget?.title}</strong>?</p>
          <p className="text-xs text-gray-400">This permanently removes the service and all its associated data.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteServiceTarget(null)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" loading={deleteSvc.isPending} onClick={() => deleteSvc.mutate(deleteServiceTarget!.id)}>
              <Trash2 size={14} />Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Category Confirm */}
      <Modal open={!!deleteCategoryTarget} onClose={() => setDeleteCategoryTarget(null)} title="Delete Category" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Delete category <strong>{deleteCategoryTarget?.heading}</strong>?</p>
          <p className="text-xs text-gray-400">This will delete all {deleteCategoryTarget?.serviceIds.length} services in this category. This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteCategoryTarget(null)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" loading={deleteCat.isPending} onClick={() => deleteCat.mutate(deleteCategoryTarget!.serviceIds)}>
              <Trash2 size={14} />Delete All
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Category Image Modal */}
      <Modal
        open={!!uploadTarget}
        onClose={() => setUploadTarget(null)}
        title={`Upload Image: ${uploadTarget?.categoryHeading}`}
        size="sm"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); uploadImg.mutate(); }}>
          <p className="text-xs text-gray-500">
            This sets the image for the entire category: <strong>{uploadTarget?.categoryHeading}</strong>
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
            <Button variant="outline" type="button" onClick={() => setUploadTarget(null)}>Cancel</Button>
            <Button type="submit" loading={uploadImg.isPending} disabled={!imgFile}>
              <Upload size={14} />Upload
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
