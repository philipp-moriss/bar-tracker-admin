import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { AdminLayout } from '@/core/components/layout/AdminLayout';

import { Button } from '@/core/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/core/components/ui/card';
import { SearchInput } from '@/core/components/ui/inputs/SearchInput';
import { FilterSelect } from '@/core/components/ui/inputs/FilterSelect';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { eventService } from '@/core/services/eventService';
import { Event, EventStatus, EventFilters } from '@/core/types/event';
import { AnalyticsService } from '@/core/services/analyticsService';
import { CURRENCIES } from '@/core/constants/currencies';
import { EventViewModal } from '@/core/components/ui/modals/EventViewModal';
import { EventEditModal } from '@/core/components/ui/modals/EventEditModal';

// Опции для фильтра статусов
const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: EventStatus.ACTIVE, label: 'Active' },
  { value: EventStatus.COMPLETED, label: 'Completed' },
  { value: EventStatus.CANCELLED, label: 'Cancelled' },
  { value: EventStatus.DRAFT, label: 'Draft' }
];
import { DeleteConfirmModal } from '@/core/components/ui/modals/DeleteConfirmModal';
import { EventInfoModal } from '@/core/components/ui/modals/EventInfoModal';

export const AdminEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | ''>('');
  const [sortBy, setSortBy] = useState<EventFilters['sortBy']>('startTime');
  const [sortDir, setSortDir] = useState<EventFilters['sortDir']>('desc');
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [autoCompleteLoading, setAutoCompleteLoading] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalMessage, setInfoModalMessage] = useState('');

  // Load events on component mount
  useEffect(() => {
    loadEvents();
    AnalyticsService.logPageView('Admin Events Page');
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: EventFilters = {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortDir,
      };

      const eventsData = await eventService.getEvents(filters);
      setEvents(eventsData);
    } catch (err) {
      setError('Failed to load events');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reload events when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadEvents();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, sortBy, sortDir]);

  const toggleSort = (field: NonNullable<EventFilters['sortBy']>) => {
    if (sortBy === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  };

  const handleCreateEvent = () => {
    navigate('/admin/events/create');
  };

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setViewModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setEditModalOpen(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setSelectedEvent(event);
    setDeleteModalOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      setDeleteLoading(true);
      await eventService.deleteEvent(selectedEvent.id!);
      await loadEvents();
      setDeleteModalOpen(false);
      setSelectedEvent(null);
      AnalyticsService.logCustomEvent('event_deleted', { eventId: selectedEvent.id });
    } catch (err) {
      setError('Failed to delete event');
      console.error('Error deleting event:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEventSaved = () => {
    loadEvents();
  };

  const handleAutoCompleteExpired = async () => {
    try {
      setAutoCompleteLoading(true);
      const count = await eventService.autoCompleteExpiredEvents();

      if (count > 0) {
        setInfoModalMessage(`Successfully completed ${count} expired event(s)! All past events with "Active" status have been updated to "Completed".`);
        setInfoModalOpen(true);
        await loadEvents();
        AnalyticsService.logCustomEvent('events_auto_completed', { count });
      } else {
        // Не показываем модалку, если нет просроченных событий
        // Просто логируем в консоль для отладки
        console.log('No expired active events found. All active events have future dates.');
      }
    } catch (err) {
      setError('Failed to auto-complete expired events');
      console.error('Error auto-completing events:', err);
    } finally {
      setAutoCompleteLoading(false);
    }
  };


  const getStatusBadge = (status: EventStatus) => {
    const statusConfig = {
      [EventStatus.ACTIVE]: { label: 'Active', variant: 'default' as const },
      [EventStatus.COMPLETED]: { label: 'Completed', variant: 'secondary' as const },
      [EventStatus.CANCELLED]: { label: 'Cancelled', variant: 'destructive' as const },
      [EventStatus.DRAFT]: { label: 'Draft', variant: 'outline' as const },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | unknown) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : (date as any).toDate();
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const formatPrice = (price: string, currency?: string) => {
    const currencyCode = currency || 'gbp';
    const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || '£';
    return `${currencySymbol}${parseFloat(price || '0').toFixed(2)}`;
  };

  return (
    <AdminLayout title="Events Management" subtitle="Manage all BarTrekker events and tours">
      <div className="max-w-7xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
          {/* Auto-Complete Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              onClick={handleAutoCompleteExpired}
              disabled={autoCompleteLoading}
              variant="outline"
              className="flex items-center space-x-2 w-full sm:w-auto"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{autoCompleteLoading ? 'Processing...' : 'Complete Expired Events'}</span>
            </Button>
            <div className="flex items-center text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <div className="text-blue-500 mr-2">💡</div>
              <span>Expired events are auto-completed every hour</span>
            </div>
          </div>

          {/* Create Event Button */}
          <Button
            onClick={handleCreateEvent}
            className="flex items-center space-x-2 bg-barTrekker-orange hover:bg-barTrekker-orange/90 w-full lg:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Event</span>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-sm border-0 bg-gradient-to-r from-gray-50 to-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <Search className="h-5 w-5 mr-2 text-barTrekker-orange" />
              Search & Filter Events
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search by event name, location, or description..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
              </div>
              <div className="md:w-48">
                <FilterSelect
                  placeholder="All Status"
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  options={statusOptions}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Events ({events.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-barTrekker-orange"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-barTrekker-darkGrey/30 mx-auto mb-4" />
                <p className="text-barTrekker-darkGrey/70">No events found</p>
                <Button
                  onClick={handleCreateEvent}
                  className="mt-4 bg-barTrekker-orange hover:bg-barTrekker-orange/90"
                >
                  Create First Event
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button className="flex items-center gap-1" onClick={() => toggleSort('name')}>
                          Event
                          {sortBy === 'name' && (
                            <span className="text-xs text-gray-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="flex items-center gap-1" onClick={() => toggleSort('startTime')}>
                          Date & Time
                          {sortBy === 'startTime' && (
                            <span className="text-xs text-gray-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="flex items-center gap-1" onClick={() => toggleSort('startLocationName' as any)}>
                          Location
                          {sortBy === ('startLocationName' as any) && (
                            <span className="text-xs text-gray-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="flex items-center gap-1" onClick={() => toggleSort('price')}>
                          Price
                          {sortBy === 'price' && (
                            <span className="text-xs text-gray-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="flex items-center gap-1" onClick={() => toggleSort('status')}>
                          Status
                          {sortBy === 'status' && (
                            <span className="text-xs text-gray-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{event.name}</div>
                            <div className="text-sm text-barTrekker-darkGrey/70 truncate max-w-xs">
                              {event.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(event.startTime)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-xs">{event.startLocationName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>{formatPrice(event.price, event.currency)}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(event.status || EventStatus.DRAFT)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewEvent(event)}
                              title="View Event"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEvent(event)}
                              title="Edit Event"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(event)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete Event"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <EventViewModal
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          event={selectedEvent}
          onEdit={(eventId) => {
            const event = events.find(e => e.id === eventId);
            if (event) {
              setSelectedEvent(event);
              setViewModalOpen(false);
              setEditModalOpen(true);
            }
          }}
        />

        <EventEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          event={selectedEvent}
          onSave={handleEventSaved}
        />

        <DeleteConfirmModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          onConfirm={confirmDeleteEvent}
          loading={deleteLoading}
          textKey={`Are you sure you want to delete "${selectedEvent?.name}"?`}
        />

        {/* Info Modal */}
        <EventInfoModal
          open={infoModalOpen}
          onOpenChange={setInfoModalOpen}
          message={infoModalMessage}
        />
      </div>
    </AdminLayout>
  );
};
