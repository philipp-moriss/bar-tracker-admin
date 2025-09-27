import { useEffect, useMemo, useState } from 'react';
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
import { eventService } from '@/core/services/eventService';
import { Event } from '@/core/types/event';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/inputs/select';

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
  eventId: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [form, setForm] = useState<FormState>({ title: '', body: '', fireDate: Date.now() + 15 * 60 * 1000, audienceUserIds: [], mapUrl: '', eventId: '' });
  const [events, setEvents] = useState<Event[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const isValid = useMemo(() => form.title.trim().length > 0 && form.body.trim().length > 0 && form.fireDate > Date.now(), [form]);
  const isEventValid = useMemo(() => form.title.trim().length > 0 && form.body.trim().length > 0 && form.eventId.length > 0, [form]);

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

  async function sendEventNotification() {
    try {
      if (!form.title || !form.body || !form.eventId) {
        toastManager.error('Provide title, body and select event');
        return;
      }
      
      const response = await fetch('https://us-central1-react-native-bartrekker.cloudfunctions.net/sendEventNotification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: form.eventId,
          title: form.title,
          body: form.body,
          mapUrl: form.mapUrl || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send notification');
      }

      const result = await response.json();
      toastManager.success(`Sent to ${result.sent ?? 0} users with primary tickets`);
    } catch (e) {
      console.error(e);
      toastManager.error('Send failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  }

  async function loadEvents() {
    try {
      const eventsList = await eventService.getEvents();
      setEvents(eventsList);
    } catch (error) {
      console.error('Error loading events:', error);
      toastManager.error('Failed to load events');
    }
  }

  useEffect(() => { 
    load(); 
    loadEvents();
  }, []);

  return (
    <AdminLayout title="Notifications" subtitle="Manage and test push schedules">
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setCreateOpen(true)}>Create Push</Button>
        </div>

        <Modal open={createOpen} onOpenChange={setCreateOpen} title="Create Push Notification">
          <div className="space-y-6 p-4 max-h-[80vh] overflow-y-auto">
            {/* Common Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                <Input 
                  id="title"
                  placeholder="Soon we start!" 
                  value={form.title} 
                  onChange={e => setForm({ ...form, title: e.target.value })} 
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="body" className="text-sm font-medium">Message</Label>
                <Input 
                  id="body"
                  placeholder="15 minutes left before the tour" 
                  value={form.body} 
                  onChange={e => setForm({ ...form, body: e.target.value })} 
                  className="mt-1"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>
            
            {/* Event Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Send to Event Participants</h3>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <div>
                  <Label htmlFor="event-select" className="text-sm font-medium text-blue-900">Select Event</Label>
                  <Select value={form.eventId} onValueChange={(value) => setForm({ ...form, eventId: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose an event..." />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map(event => (
                        <SelectItem key={event.id} value={event.id || ''}>
                          {event.name} - {event.startTime instanceof Date 
                            ? event.startTime.toLocaleDateString() 
                            : event.startTime?.toDate ? event.startTime.toDate().toLocaleDateString()
                            : new Date(event.startTime as any).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-blue-700 mt-2">
                    📱 Notification will be sent to all users with primary tickets for this event
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="map-url" className="text-sm font-medium text-blue-900">Map URL (optional)</Label>
                  <Input 
                    id="map-url"
                    placeholder="https://maps.apple.com/?q=..." 
                    value={form.mapUrl} 
                    onChange={e => setForm({ ...form, mapUrl: e.target.value })} 
                    className="mt-1"
                  />
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button 
                    variant="default" 
                    disabled={!isEventValid} 
                    onClick={sendEventNotification}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    📤 Send to Event Users
                  </Button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Scheduled Notifications Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Schedule Notification</h3>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
                <div>
                  <Label htmlFor="send-time" className="text-sm font-medium text-orange-900">Send at</Label>
                  <Input 
                    id="send-time"
                    type="datetime-local" 
                    lang="en-GB" 
                    onChange={e => setForm({ ...form, fireDate: new Date(e.target.value).getTime() })} 
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="user-ids" className="text-sm font-medium text-orange-900">Audience UIDs (comma-separated)</Label>
                  <Input 
                    id="user-ids"
                    placeholder="uid1, uid2" 
                    onChange={e => setForm({ ...form, audienceUserIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} 
                    className="mt-1"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 justify-end pt-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      const in30s = Date.now() + 30000;
                      setForm({ ...form, fireDate: in30s });
                      toastManager.info('Scheduled for 30 seconds from now');
                    }}
                  >
                    ⚡ Quick test (+30s)
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={sendTestNow}
                  >
                    🧪 Send test now
                  </Button>
                  <Button 
                    disabled={!isValid} 
                    onClick={async () => { await create(); setCreateOpen(false); }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    📅 Schedule
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        <Card>
          <CardHeader>
            <CardTitle>Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <thead className="sticky top-0 bg-white z-10">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

