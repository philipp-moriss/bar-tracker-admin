import { useEffect, useMemo, useState } from 'react';
import { db } from '@/modules/firebase/config';
import { collection, getDocs, query, orderBy, doc, writeBatch, addDoc, Timestamp } from 'firebase/firestore';
import { Label } from '@/core/components/ui/label';
import { Input } from '@/core/components/ui/inputs/input';
import { Button } from '@/core/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { Table } from '@/core/components/ui/table';
import { toastManager } from '@/core/components/ui/toast/toast';
import { AdminLayout } from '@/core/components/layout/AdminLayout';
import { Modal } from '@/core/components/ui/modals';
import { eventService } from '@/core/services/eventService';
import { Event } from '@/core/types/event';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/inputs/select';


type FormState = {
  title: string;
  body: string;
  mapUrl: string;
  eventId: string;
};

type NotificationHistory = {
  id: string;
  eventId: string;
  title: string;
  body: string;
  mapUrl?: string;
  sent: number;
  totalUsers: number;
  sentAt: Date;
  createdAt: Date;
};

export default function NotificationsPage() {
  const [form, setForm] = useState<FormState>({ title: '', body: '', mapUrl: '', eventId: '' });
  const [events, setEvents] = useState<Event[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const isEventValid = useMemo(() => form.title.trim().length > 0 && form.body.trim().length > 0 && form.eventId.length > 0, [form]);





  async function sendEventNotification() {
    try {
      if (!form.title || !form.body || !form.eventId) {
        toastManager.error('Provide title, body and select event');
        return;
      }
      
      setIsSending(true);
      
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
      
      // Save notification to history directly in Firestore
      const historyData: any = {
        eventId: form.eventId,
        title: form.title,
        body: form.body,
        sent: result.sent || 0,
        totalUsers: result.totalUsers || 0,
        sentAt: Timestamp.now(),
        createdAt: Timestamp.now()
      };
      
      // Only add mapUrl if it has a value
      if (form.mapUrl) {
        historyData.mapUrl = form.mapUrl;
      }
      
      await addDoc(collection(db, 'notificationHistory'), historyData);
      
      toastManager.success(`Sent to ${result.sent ?? 0} users with primary tickets`);
      
      // Reload history to show new notification
      await loadHistory();
      
      // Close modal and reset form
      setCreateOpen(false);
      setForm({ title: '', body: '', mapUrl: '', eventId: '' });
    } catch (e) {
      console.error(e);
      toastManager.error('Send failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
      // Don't close modal on error so user can retry
    } finally {
      setIsSending(false);
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

  async function loadHistory() {
    try {
      const snap = await getDocs(query(collection(db, 'notificationHistory'), orderBy('sentAt', 'desc')));
      const historyData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as NotificationHistory[];
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading notification history:', error);
      setHistory([]);
    }
  }

  function openClearConfirm() {
    if (history.length === 0) {
      toastManager.info('No notifications to clear');
      return;
    }
    setClearConfirmOpen(true);
  }

  async function clearHistory() {
    try {
      // Delete all notifications in batches
      const batchSize = 500; 
      
      for (let i = 0; i < history.length; i += batchSize) {
        const batch = writeBatch(db); 
        const batchDocs = history.slice(i, i + batchSize);
        batchDocs.forEach(item => {
          batch.delete(doc(db, 'notificationHistory', item.id));
        });
        await batch.commit();
      }

      setHistory([]);
      setClearConfirmOpen(false);
      toastManager.success('Notification history cleared');
    } catch (error) {
      console.error('Error clearing notification history:', error);
      toastManager.error('Failed to clear notification history');
    }
  }

  useEffect(() => { 
    loadEvents();
    loadHistory();
  }, []);

  return (
    <AdminLayout title="Notifications" subtitle="Send push notifications to event participants">
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setCreateOpen(true)}>Create Push</Button>
        </div>

        <Modal open={createOpen} onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setIsSending(false);
        }} title="Create Push Notification">
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
                    disabled={!isEventValid || isSending} 
                    onClick={sendEventNotification}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <>📤 Send to Event Users</>
                    )}
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </Modal>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Notification History</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openClearConfirm}
                disabled={history.length === 0}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear History
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No notifications sent yet
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <thead className="sticky top-0 bg-white z-10">
                    <tr>
                      <th className="text-left">Title</th>
                      <th className="text-left">Message</th>
                      <th className="text-left">Event</th>
                      <th className="text-left">Sent</th>
                      <th className="text-left">Sent At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => {
                      const event = events.find(e => e.id === item.eventId);
                      return (
                        <tr key={item.id} className="border-t">
                          <td className="font-medium">{item.title}</td>
                          <td className="max-w-[300px] truncate">{item.body}</td>
                          <td>{event?.name || 'Unknown Event'}</td>
                          <td>{item.sent}/{item.totalUsers}</td>
                          <td>{item.sentAt.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clear History Confirmation Modal */}
        <Modal open={clearConfirmOpen} onOpenChange={setClearConfirmOpen} title="Clear Notification History">
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-gray-700">Are you sure?</p>
            </div>
            
            <p className="text-gray-600 mb-6">
              This will clear all <span className="font-semibold text-red-600">{history.length}</span> notifications from history. 
              This action cannot be undone.
            </p>
              
              <div className="flex space-x-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setClearConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={clearHistory}
                >
                  Clear History
                </Button>
              </div>
          </div>
        </Modal>

      </div>
    </AdminLayout>
  );
}

