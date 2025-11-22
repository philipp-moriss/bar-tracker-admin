import { useEffect, useMemo, useState } from 'react';
import { db } from '@/modules/firebase/config';
import { collection, getDocs, query, orderBy, doc, writeBatch, addDoc, Timestamp } from 'firebase/firestore';
import { Bell, Send, Clock, Calendar, MapPin, X, Trash2, CheckCircle2 } from 'lucide-react';
import { Label } from '@/core/components/ui/label';
import { Input } from '@/core/components/ui/inputs/input';
import { Button } from '@/core/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { toastManager } from '@/core/components/ui/toast/toast';
import { AdminLayout } from '@/core/components/layout/AdminLayout';
import { Modal } from '@/core/components/ui/modals';
import { eventService } from '@/core/services/eventService';
import { Event } from '@/core/types/event';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/inputs/select';
import { Badge } from '@/core/components/ui/badge';


type FormState = {
  title: string;
  body: string;
  mapUrl: string;
  eventId: string;
  scheduleType: 'immediate' | 'scheduled';
  scheduledDate: string;
  scheduledTime: string;
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
  scheduled?: boolean;
  scheduleId?: string;
  scheduledFor?: Date;
};

export default function NotificationsPage() {
  const [form, setForm] = useState<FormState>({ 
    title: '', 
    body: '', 
    mapUrl: '', 
    eventId: '',
    scheduleType: 'immediate',
    scheduledDate: '',
    scheduledTime: ''
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const isEventValid = useMemo(() => form.title.trim().length > 0 && form.body.trim().length > 0 && form.eventId.length > 0, [form]);
  const isScheduledValid = useMemo(() => {
    if (form.scheduleType === 'scheduled') {
      return form.scheduledDate && form.scheduledTime;
    }
    return true;
  }, [form.scheduleType, form.scheduledDate, form.scheduledTime]);





  async function sendEventNotification() {
    try {
      if (!form.title || !form.body || !form.eventId) {
        toastManager.error('Provide title, body and select event');
        return;
      }

      if (form.scheduleType === 'scheduled' && (!form.scheduledDate || !form.scheduledTime)) {
        toastManager.error('Please provide scheduled date and time');
        return;
      }
      
      setIsSending(true);

      // If scheduled, create scheduled notification
      if (form.scheduleType === 'scheduled') {
        // Calculate fireDate from scheduled date and time
        const [hours, minutes] = form.scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date(form.scheduledDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        
        // Check if scheduled time is in the future
        if (scheduledDateTime.getTime() <= Date.now()) {
          toastManager.error('Scheduled time must be in the future');
          setIsSending(false);
          return;
        }

        const fireDate = Timestamp.fromDate(scheduledDateTime);

        // Create scheduled notification - the system will find users by eventId when sending
        const scheduledNotification = {
          title: form.title,
          body: form.body,
          eventId: form.eventId,
          fireDate: fireDate,
          audienceUserIds: [], // Empty array - system will find users by eventId
          sent: false,
          type: 'admin_scheduled',
          ...(form.mapUrl ? { mapUrl: form.mapUrl } : {}),
          createdAt: Timestamp.now()
        };

        // Save to history first to get history doc ID
        const historyData: any = {
          eventId: form.eventId,
          title: form.title,
          body: form.body,
          sent: 0,
          totalUsers: 0,
          sentAt: fireDate, // Will be updated when actually sent
          createdAt: Timestamp.now(),
          scheduled: true,
          scheduledFor: fireDate
        };
        
        if (form.mapUrl) {
          historyData.mapUrl = form.mapUrl;
        }
        
        const historyDocRef = await addDoc(collection(db, 'notificationHistory'), historyData);
        
        // Create scheduled notification with historyId pointing to history document
        const notificationWithHistoryId = {
          ...scheduledNotification,
          historyId: historyDocRef.id
        };
        
        await addDoc(collection(db, 'notificationSchedules'), notificationWithHistoryId);
        
        toastManager.success(`Scheduled notification created for ${scheduledDateTime.toLocaleString()}`);
        
        // Reload history to show new scheduled notification
        await loadHistory();
        
        // Close modal and reset form
        setCreateOpen(false);
        setForm({ title: '', body: '', mapUrl: '', eventId: '', scheduleType: 'immediate', scheduledDate: '', scheduledTime: '' });
        setIsSending(false);
        return;
      }
      
      // Immediate send
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
      setForm({ title: '', body: '', mapUrl: '', eventId: '', scheduleType: 'immediate', scheduledDate: '', scheduledTime: '' });
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
      const snap = await getDocs(query(collection(db, 'notificationHistory'), orderBy('createdAt', 'desc')));
      const historyData = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          sentAt: data.sentAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          scheduledFor: data.scheduledFor?.toDate() || undefined,
        } as NotificationHistory;
      });
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
      <div className="max-w-7xl mx-auto">
        {/* Header with Create Button */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Bell className="h-6 w-6 mr-2 text-barTrekker-orange" />
              Push Notifications
            </h2>
            <p className="text-gray-600 mt-1">Manage and send notifications to event participants</p>
          </div>
          <Button 
            onClick={() => setCreateOpen(true)}
            className="bg-barTrekker-orange hover:bg-barTrekker-orange/90 flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>Create Push</span>
          </Button>
        </div>

        <Modal 
          open={createOpen} 
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) setIsSending(false);
          }} 
          title="Create Push Notification"
          className="max-w-4xl"
        >
          <div className="space-y-6 p-4 overflow-hidden">
            {/* Common Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">Title</Label>
                <Input 
                  id="title"
                  placeholder="Soon we start!" 
                  value={form.title} 
                  onChange={e => setForm({ ...form, title: e.target.value })} 
                  className="mt-1 bg-white"
                />
              </div>
              <div>
                <Label htmlFor="body" className="text-sm font-medium text-gray-700">Message</Label>
                <Input 
                  id="body"
                  placeholder="15 minutes left before the tour" 
                  value={form.body} 
                  onChange={e => setForm({ ...form, body: e.target.value })} 
                  className="mt-1 bg-white"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Schedule Type Selection */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 flex items-center mb-3">
                  <Clock className="h-4 w-4 mr-2 text-barTrekker-orange" />
                  Send Type
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Immediate Send Option */}
                  <div
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      form.scheduleType === 'immediate'
                        ? 'border-barTrekker-orange bg-orange-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => setForm({ ...form, scheduleType: 'immediate' })}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        name="scheduleType"
                        value="immediate"
                        checked={form.scheduleType === 'immediate'}
                        onChange={(e) => setForm({ ...form, scheduleType: e.target.value as 'immediate' | 'scheduled' })}
                        className="w-4 h-4 text-barTrekker-orange mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Send className={`h-5 w-5 ${form.scheduleType === 'immediate' ? 'text-barTrekker-orange' : 'text-gray-400'}`} />
                          <div className="font-medium text-barTrekker-darkGrey">Send Immediately</div>
                        </div>
                        <div className="text-sm text-gray-500">Send notification right away</div>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Send Option */}
                  <div
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      form.scheduleType === 'scheduled'
                        ? 'border-barTrekker-orange bg-orange-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => setForm({ ...form, scheduleType: 'scheduled' })}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        name="scheduleType"
                        value="scheduled"
                        checked={form.scheduleType === 'scheduled'}
                        onChange={(e) => setForm({ ...form, scheduleType: e.target.value as 'immediate' | 'scheduled' })}
                        className="w-4 h-4 text-barTrekker-orange mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className={`h-5 w-5 ${form.scheduleType === 'scheduled' ? 'text-barTrekker-orange' : 'text-gray-400'}`} />
                          <div className="font-medium text-barTrekker-darkGrey">Schedule for Later</div>
                        </div>
                        <div className="text-sm text-gray-500">Set a specific date and time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {form.scheduleType === 'scheduled' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scheduled-date" className="text-sm font-medium text-gray-700 flex items-center mb-2">
                        <Calendar className="h-4 w-4 mr-1" />
                        Date
                      </Label>
                      <Input
                        id="scheduled-date"
                        type="date"
                        value={form.scheduledDate}
                        onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                        className="bg-white"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduled-time" className="text-sm font-medium text-gray-700 flex items-center mb-2">
                        <Clock className="h-4 w-4 mr-1" />
                        Time
                      </Label>
                      <Input
                        id="scheduled-time"
                        type="time"
                        value={form.scheduledTime}
                        onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Divider */}
            <div className="border-t border-gray-200"></div>
            
            {/* Event Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-barTrekker-orange rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Event Selection</h3>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <div>
                  <Label htmlFor="event-select" className="text-sm font-medium text-gray-900">Select Event</Label>
                  <Select value={form.eventId} onValueChange={(value) => setForm({ ...form, eventId: value })}>
                    <SelectTrigger className="mt-1 bg-white">
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
                  <p className="text-xs text-gray-600 mt-2 flex items-center">
                    <Bell className="h-3 w-3 mr-1" />
                    Notification will be sent to all users with primary tickets for this event
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="map-url" className="text-sm font-medium text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Map URL (optional)
                  </Label>
                  <Input 
                    id="map-url"
                    placeholder="https://maps.apple.com/?q=..." 
                    value={form.mapUrl} 
                    onChange={e => setForm({ ...form, mapUrl: e.target.value })} 
                    className="mt-1 bg-white"
                  />
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button 
                    variant="default" 
                    disabled={!isEventValid || !isScheduledValid || isSending} 
                    onClick={sendEventNotification}
                    className="bg-barTrekker-orange hover:bg-barTrekker-orange/90 flex items-center space-x-2"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{form.scheduleType === 'scheduled' ? 'Scheduling...' : 'Sending...'}</span>
                      </>
                    ) : (
                      <>
                        {form.scheduleType === 'scheduled' ? (
                          <>
                            <Calendar className="h-4 w-4" />
                            <span>Schedule Notification</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>Send to Event Users</span>
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </Modal>

        <Card className="shadow-sm border-0 bg-gradient-to-r from-gray-50 to-white">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-barTrekker-orange" />
                Notification History
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openClearConfirm}
                disabled={history.length === 0}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear History</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No notifications sent yet</p>
                <p className="text-sm mt-1">Create your first push notification to get started</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Title</TableHead>
                      <TableHead className="font-semibold text-gray-700">Message</TableHead>
                      <TableHead className="font-semibold text-gray-700">Event</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => {
                      const event = events.find(e => e.id === item.eventId);
                      const isScheduled = item.scheduled && item.sent === 0;
                      const successRate = item.totalUsers > 0 ? (item.sent / item.totalUsers) * 100 : 0;
                      return (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{item.title}</TableCell>
                          <TableCell className="max-w-[300px] truncate text-gray-600">{item.body}</TableCell>
                          <TableCell>
                            <span className="text-gray-700">{event?.name || 'Unknown Event'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {isScheduled ? (
                                <Badge variant="secondary" className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Scheduled</span>
                                </Badge>
                              ) : (
                                <Badge 
                                  variant={successRate === 100 ? "default" : successRate > 50 ? "secondary" : "destructive"}
                                  className="flex items-center space-x-1"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>{item.sent}/{item.totalUsers}</span>
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {isScheduled && item.scheduledFor 
                              ? `Scheduled: ${item.scheduledFor.toLocaleString()}`
                              : item.sentAt.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
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

