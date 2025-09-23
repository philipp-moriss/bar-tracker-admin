import React, { useEffect, useMemo, useState } from 'react';
import { db } from '@/modules/firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { Label } from '@/core/components/ui/label';
import { Input } from '@/core/components/ui/inputs/input';
import { Button } from '@/core/components/ui/button';
import { Table } from '@/core/components/ui/table';
import { toastManager } from '@/core/components/ui/toast/toast';
import { AdminLayout } from '@/core/components/layout/AdminLayout';
import { Modal } from '@/core/components/ui/modals';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/modules/firebase/config';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  fireDate: number;
  audienceUserIds: string[];
  mapUrl?: string;
};

type FormState = {
  title: string;
  body: string;
  fireDate: number;
  audienceUserIds: string[];
  mapUrl: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [form, setForm] = useState<FormState>({ title: '', body: '', fireDate: Date.now() + 15 * 60 * 1000, audienceUserIds: [], mapUrl: '' });
  const [createOpen, setCreateOpen] = useState(false);
  const isValid = useMemo(() => form.title.trim().length > 0 && form.body.trim().length > 0 && form.fireDate > Date.now(), [form]);

  async function load() {
    const snap = await getDocs(query(collection(db, 'notificationSchedules'), orderBy('fireDate', 'asc')));
    setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<NotificationItem, 'id'>) })));
  }

  async function create() {
    if (!isValid) {
      toastManager.error('Fill title/body and pick a future time');
      return;
    }
    await addDoc(collection(db, 'notificationSchedules'), {
      title: form.title,
      body: form.body,
      fireDate: form.fireDate,
      audienceUserIds: form.audienceUserIds,
      mapUrl: form.mapUrl || undefined,
    });
    toastManager.success('Schedule created');
    await load();
  }

  async function remove(id: string) {
    await deleteDoc(doc(db, 'notificationSchedules', id));
    toastManager.success('Deleted');
    await load();
  }

  async function sendTestNow() {
    try {
      if (!form.title || !form.body || form.audienceUserIds.length === 0) {
        toastManager.error('Provide title/body and at least one UID');
        return;
      }
      const fn = httpsCallable(functions, 'sendTestPush');
      const res: any = await fn({ title: form.title, body: form.body, audienceUserIds: form.audienceUserIds, mapUrl: form.mapUrl || undefined });
      toastManager.success(`Sent: ${res?.data?.sent ?? 0}`);
    } catch (e) {
      toastManager.error('Send failed');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <AdminLayout title="Notifications" subtitle="Manage and test push schedules">
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setCreateOpen(true)}>Create Push</Button>
        </div>

        <Modal open={createOpen} onOpenChange={setCreateOpen} title="Create Push Schedule">
          <div className="grid gap-3 p-2">
            <div>
              <Label>Title</Label>
              <Input placeholder="Soon we start!" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Body</Label>
              <Input placeholder="15 minutes left before the tour" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
            </div>
            <div>
              <Label>Send at</Label>
              <Input type="datetime-local" lang="en-GB" onChange={e => setForm({ ...form, fireDate: new Date(e.target.value).getTime() })} />
            </div>
            <div>
              <Label>Audience UIDs (comma-separated)</Label>
              <Input placeholder="uid1, uid2" onChange={e => setForm({ ...form, audienceUserIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
            </div>
            <div>
              <Label>Map URL (optional)</Label>
              <Input placeholder="https://maps.apple.com/?q=..." onChange={e => setForm({ ...form, mapUrl: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => {
                const in30s = Date.now() + 30000;
                setForm({ ...form, fireDate: in30s });
                toastManager.info('Scheduled for 30 seconds from now');
              }}>Quick test (+30s)</Button>
              <Button variant="outline" onClick={sendTestNow}>Send test now</Button>
              <Button disabled={!isValid} onClick={async () => { await create(); setCreateOpen(false); }}>Save</Button>
            </div>
          </div>
        </Modal>

        <Card>
          <CardHeader>
            <CardTitle>Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <th className="text-left">Title</th>
                  <th className="text-left">Body</th>
                  <th className="text-left">Send at</th>
                  <th className="text-left">Audience</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-t">
                    <td>{item.title}</td>
                    <td className="max-w-[320px] truncate">{item.body}</td>
                    <td>{new Date(item.fireDate).toLocaleString()}</td>
                    <td>{(item.audienceUserIds || []).length}</td>
                    <td className="text-right">
                      <Button variant="destructive" onClick={() => remove(item.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

