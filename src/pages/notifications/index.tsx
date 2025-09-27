import { useEffect, useMemo, useState } from 'react';
import { Label } from '@/core/components/ui/label';
import { Input } from '@/core/components/ui/inputs/input';
import { Button } from '@/core/components/ui/button';
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

export default function NotificationsPage() {
  const [form, setForm] = useState<FormState>({ title: '', body: '', mapUrl: '', eventId: '' });
  const [events, setEvents] = useState<Event[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const isEventValid = useMemo(() => form.title.trim().length > 0 && form.body.trim().length > 0 && form.eventId.length > 0, [form]);





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
    loadEvents();
  }, []);

  return (
    <AdminLayout title="Notifications" subtitle="Send push notifications to event participants">
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

          </div>
        </Modal>

      </div>
    </AdminLayout>
  );
}

