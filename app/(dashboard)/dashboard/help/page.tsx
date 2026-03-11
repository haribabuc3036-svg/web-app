'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { helpApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import type { Faq, DressCodeItem, DosDont, ContactSupport } from '@/lib/types';

type Tab = 'faqs' | 'dresscode' | 'dosdont' | 'contacts';
const TABS: { id: Tab; label: string }[] = [
  { id: 'faqs', label: 'FAQs' },
  { id: 'dresscode', label: 'Dress Code' },
  { id: 'dosdont', label: "Do's & Don'ts" },
  { id: 'contacts', label: 'Contacts' },
];

function FaqsTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Faq | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', sort_order: 0, is_active: true });

  const { data, isLoading, refetch } = useQuery({ queryKey: ['faqs'], queryFn: () => helpApi.getFaqs() });
  const create = useMutation({ mutationFn: () => helpApi.createFaq(form), onSuccess: () => { toast.success('FAQ created'); qc.invalidateQueries({ queryKey: ['faqs'] }); setModal(null); }, onError: (e: Error) => toast.error(e.message) });
  const update = useMutation({ mutationFn: () => helpApi.updateFaq(selected!.id, form), onSuccess: () => { toast.success('FAQ updated'); qc.invalidateQueries({ queryKey: ['faqs'] }); setModal(null); }, onError: (e: Error) => toast.error(e.message) });
  const del = useMutation({ mutationFn: (id: number) => helpApi.deleteFaq(id), onSuccess: () => { toast.success('FAQ deleted'); qc.invalidateQueries({ queryKey: ['faqs'] }); setModal(null); }, onError: (e: Error) => toast.error(e.message) });

  const items = data?.data ?? [];
  const Form = () => (
    <div className="space-y-3">
      <Textarea label="Question" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} required rows={2} />
      <Textarea label="Answer" value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} required rows={4} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer self-end pb-1">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
          Active
        </label>
      </div>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-gray-500">{items.length} FAQs</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw size={13} />Refresh</Button>
          <Button size="sm" onClick={() => { setForm({ question: '', answer: '', sort_order: 0, is_active: true }); setModal('create'); }}><Plus size={13} />Add</Button>
        </div>
      </div>
      {isLoading ? <PageLoader /> : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.question}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.answer}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setForm({ question: item.question, answer: item.answer, sort_order: item.sort_order, is_active: item.is_active }); setModal('edit'); }}><Pencil size={13} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setModal('delete'); }}><Trash2 size={13} className="text-red-400" /></Button>
                </div>
              </div>
            </Card>
          ))}
          {items.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No FAQs yet</p>}
        </div>
      )}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="New FAQ"><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}><Form /><div className="flex justify-end gap-2 pt-2"><Button variant="outline" type="button" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={create.isPending}>Create</Button></div></form></Modal>
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit FAQ"><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); update.mutate(); }}><Form /><div className="flex justify-end gap-2 pt-2"><Button variant="outline" type="button" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={update.isPending}>Save</Button></div></form></Modal>
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Delete FAQ" size="sm"><p className="text-sm text-gray-600 mb-4">Delete this FAQ?</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" loading={del.isPending} onClick={() => del.mutate(selected!.id)}>Delete</Button></div></Modal>
    </div>
  );
}

function DressCodeTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<DressCodeItem | null>(null);
  const [form, setForm] = useState<{ section: 'men' | 'women' | 'general'; content: string; sort_order: number; is_active: boolean }>({ section: 'men', content: '', sort_order: 0, is_active: true });

  const { data, isLoading, refetch } = useQuery({ queryKey: ['dresscode'], queryFn: () => helpApi.getDressCode() });
  const create = useMutation({ mutationFn: () => helpApi.createDressCode(form), onSuccess: () => { toast.success('Created'); qc.invalidateQueries({ queryKey: ['dresscode'] }); setModal(null); }, onError: (e: Error) => toast.error(e.message) });
  const update = useMutation({ mutationFn: () => helpApi.updateDressCode(selected!.id, form), onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['dresscode'] }); setModal(null); }, onError: (e: Error) => toast.error(e.message) });
  const del = useMutation({ mutationFn: (id: number) => helpApi.deleteDressCode(id), onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['dresscode'] }); setModal(null); }, onError: (e: Error) => toast.error(e.message) });

  const items = data?.data ?? [];
  const Form = () => (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700">Section</label>
        <select value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value as 'men' | 'women' | 'general' }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="men">Men</option><option value="women">Women</option><option value="general">General</option>
        </select>
      </div>
      <Textarea label="Content" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} required rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer self-end pb-1">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
          Active
        </label>
      </div>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-gray-500">{items.length} rules</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw size={13} />Refresh</Button>
          <Button size="sm" onClick={() => { setForm({ section: 'men', content: '', sort_order: 0, is_active: true }); setModal('create'); }}><Plus size={13} />Add</Button>
        </div>
      </div>
      {isLoading ? <PageLoader /> : (
        <Card className="divide-y divide-gray-50">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between px-4 py-3 gap-3">
              <div className="flex-1">
                <Badge variant="blue" className="mb-1 text-xs">{item.section}</Badge>
                <p className="text-sm font-medium text-gray-900">{item.content}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setForm({ section: item.section, content: item.content, sort_order: item.sort_order, is_active: item.is_active }); setModal('edit'); }}><Pencil size={13} /></Button>
                <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setModal('delete'); }}><Trash2 size={13} className="text-red-400" /></Button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No dress code rules</p>}
        </Card>
      )}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="New Rule"><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}><Form /><div className="flex justify-end gap-2 pt-2"><Button variant="outline" type="button" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={create.isPending}>Create</Button></div></form></Modal>
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Rule"><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); update.mutate(); }}><Form /><div className="flex justify-end gap-2 pt-2"><Button variant="outline" type="button" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={update.isPending}>Save</Button></div></form></Modal>
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Delete Rule" size="sm"><p className="text-sm text-gray-600 mb-4">Delete this rule?</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" loading={del.isPending} onClick={() => del.mutate(selected!.id)}>Delete</Button></div></Modal>
    </div>
  );
}

function DosDontsTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<DosDont | null>(null);
  const [form, setForm] = useState<{ type: 'do' | 'dont'; content: string; sort_order: number; is_active: boolean }>({ type: 'do', content: '', sort_order: 0, is_active: true });

  const { data, isLoading, refetch } = useQuery({ queryKey: ['dosdont'], queryFn: () => helpApi.getDosDonts() });
  const create = useMutation({ mutationFn: () => helpApi.createDosDont(form), onSuccess: () => { toast.success('Created'); qc.invalidateQueries({ queryKey: ['dosdont'] }); setModal(null); }, onError: (e: Error) => toast.error(e.message) });
  const update = useMutation({ mutationFn: () => helpApi.updateDosDont(selected!.id, form), onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['dosdont'] }); setModal(null); }, onError: (e: Error) => toast.error(e.message) });
  const del = useMutation({ mutationFn: (id: number) => helpApi.deleteDosDont(id), onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['dosdont'] }); setModal(null); }, onError: (e: Error) => toast.error(e.message) });

  const items = data?.data ?? [];
  const dos = items.filter((i) => i.type === 'do');
  const donts = items.filter((i) => i.type === 'dont');

  const Form = () => (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700">Type</label>
        <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'do' | 'dont' }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="do">Do</option><option value="dont">Dont</option>
        </select>
      </div>
      <Textarea label="Content" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} required rows={3} />
      <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
    </div>
  );

  const List = ({ items: list, typeLabel }: { items: DosDont[]; typeLabel: string }) => (
    <Card className="flex-1 p-0 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{typeLabel}</p>
      </div>
      <div className="divide-y divide-gray-50">
        {list.map((item) => (
          <div key={item.id} className="flex items-start justify-between px-4 py-3 gap-2">
            <p className="text-sm text-gray-700 flex-1">{item.content}</p>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setForm({ type: item.type, content: item.content, sort_order: item.sort_order, is_active: item.is_active }); setModal('edit'); }}><Pencil size={13} /></Button>
              <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setModal('delete'); }}><Trash2 size={13} className="text-red-400" /></Button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-center py-6 text-gray-400 text-sm">None</p>}
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-gray-500">{dos.length} dos, {donts.length} donts</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw size={13} />Refresh</Button>
          <Button size="sm" onClick={() => { setForm({ type: 'do', content: '', sort_order: 0, is_active: true }); setModal('create'); }}><Plus size={13} />Add</Button>
        </div>
      </div>
      {isLoading ? <PageLoader /> : (
        <div className="flex flex-col md:flex-row gap-4">
          <List items={dos} typeLabel="Dos" />
          <List items={donts} typeLabel="Donts" />
        </div>
      )}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="New Entry"><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}><Form /><div className="flex justify-end gap-2 pt-2"><Button variant="outline" type="button" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={create.isPending}>Create</Button></div></form></Modal>
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Entry"><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); update.mutate(); }}><Form /><div className="flex justify-end gap-2 pt-2"><Button variant="outline" type="button" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={update.isPending}>Save</Button></div></form></Modal>
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Delete Entry" size="sm"><p className="text-sm text-gray-600 mb-4">Delete this entry?</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" loading={del.isPending} onClick={() => del.mutate(selected!.id)}>Delete</Button></div></Modal>
    </div>
  );
}

function ContactsTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<ContactSupport | null>(null);
  const [form, setForm] = useState({ label: '', sub_label: '' as string | null, url: '', icon: '' as string | null, sort_order: 0, is_active: true });

  const { data, isLoading, refetch } = useQuery({ queryKey: ['contacts'], queryFn: () => helpApi.getContacts() });
  const create = useMutation({ mutationFn: () => helpApi.createContact(form), onSuccess: () => { toast.success('Created'); qc.invalidateQueries({ queryKey: ['contacts'] }); setModal(null); }, onError: (e: Error) => toast.error(e.message) });
  const update = useMutation({ mutationFn: () => helpApi.updateContact(selected!.id, form), onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['contacts'] }); setModal(null); }, onError: (e: Error) => toast.error(e.message) });
  const del = useMutation({ mutationFn: (id: number) => helpApi.deleteContact(id), onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['contacts'] }); setModal(null); }, onError: (e: Error) => toast.error(e.message) });

  const items = data?.data ?? [];
  const Form = () => (
    <div className="space-y-3">
      <Input label="Label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required />
      <Input label="Sub-label" value={form.sub_label ?? ''} onChange={(e) => setForm((f) => ({ ...f, sub_label: e.target.value || null }))} />
      <Input label="URL / Link" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Icon" value={form.icon ?? ''} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value || null }))} placeholder="phone" />
        <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-gray-500">{items.length} contacts</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw size={13} />Refresh</Button>
          <Button size="sm" onClick={() => { setForm({ label: '', sub_label: null, url: '', icon: null, sort_order: 0, is_active: true }); setModal('create'); }}><Plus size={13} />Add</Button>
        </div>
      </div>
      {isLoading ? <PageLoader /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  {item.sub_label && <p className="text-xs text-gray-500 mt-0.5">{item.sub_label}</p>}
                  <p className="text-xs text-indigo-600 mt-1 truncate">{item.url}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setForm({ label: item.label, sub_label: item.sub_label, url: item.url, icon: item.icon, sort_order: item.sort_order, is_active: item.is_active }); setModal('edit'); }}><Pencil size={13} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setModal('delete'); }}><Trash2 size={13} className="text-red-400" /></Button>
                </div>
              </div>
            </Card>
          ))}
          {items.length === 0 && <p className="col-span-2 text-center py-8 text-gray-400 text-sm">No contacts</p>}
        </div>
      )}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="New Contact"><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}><Form /><div className="flex justify-end gap-2 pt-2"><Button variant="outline" type="button" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={create.isPending}>Create</Button></div></form></Modal>
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Contact"><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); update.mutate(); }}><Form /><div className="flex justify-end gap-2 pt-2"><Button variant="outline" type="button" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={update.isPending}>Save</Button></div></form></Modal>
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Delete Contact" size="sm"><p className="text-sm text-gray-600 mb-4">Delete <strong>{selected?.label}</strong>?</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" loading={del.isPending} onClick={() => del.mutate(selected!.id)}>Delete</Button></div></Modal>
    </div>
  );
}

export default function HelpPage() {
  const [tab, setTab] = useState<Tab>('faqs');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help Content</h1>
        <p className="text-sm text-gray-500 mt-1">Manage FAQs, dress code rules, dos and donts, and contact info</p>
      </div>
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      {tab === 'faqs' && <FaqsTab />}
      {tab === 'dresscode' && <DressCodeTab />}
      {tab === 'dosdont' && <DosDontsTab />}
      {tab === 'contacts' && <ContactsTab />}
    </div>
  );
}
