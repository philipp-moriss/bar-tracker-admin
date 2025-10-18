import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Globe, Image, MapPin as MapPinIcon, Users } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { FormSection, FormField, FormGrid } from './FormSection';
import { Input } from '@/core/components/ui/inputs/input';
import { Textarea } from '@/core/components/ui/inputs/textarea';
import { FormSelect } from '@/core/components/ui/inputs/FormSelect';
import { Event, EventStatus, UpdateEventData, EventRoute, EventNotificationSettings } from '@/core/types/event';
import { eventService } from '@/core/services/eventService';
import { barService } from '@/core/services/barService';
import { Bar } from '@/core/types/bar';
import { CURRENCIES } from '@/core/constants/currencies';
import { EventRouteManager } from '@/components/common/EventRouteManager/EventRouteManager';
import { BartenderSelector } from '@/components/common/BartenderSelector/BartenderSelector';

const getTimezoneByCountry = (country: string): string => {
  const timezoneMap: { [key: string]: string } = {
    'Poland': 'Europe/Warsaw',
    'United Kingdom': 'Europe/London',
    'UK': 'Europe/London',
    'United States': 'America/New_York',
    'USA': 'America/New_York',
    'Germany': 'Europe/Berlin',
    'France': 'Europe/Paris',
    'Spain': 'Europe/Madrid',
    'Italy': 'Europe/Rome',
    'Netherlands': 'Europe/Amsterdam',
    'Belgium': 'Europe/Brussels',
    'Austria': 'Europe/Vienna',
    'Ireland': 'Europe/Dublin',
    'Finland': 'Europe/Helsinki',
    'Portugal': 'Europe/Lisbon',
    'Greece': 'Europe/Athens',
    'Cyprus': 'Asia/Nicosia',
    'Malta': 'Europe/Malta',
    'Slovenia': 'Europe/Ljubljana',
    'Slovakia': 'Europe/Bratislava',
    'Estonia': 'Europe/Tallinn',
    'Latvia': 'Europe/Riga',
    'Lithuania': 'Europe/Vilnius',
    'Luxembourg': 'Europe/Luxembourg',
    'Czech Republic': 'Europe/Prague',
    'Hungary': 'Europe/Budapest',
    'Sweden': 'Europe/Stockholm',
    'Norway': 'Europe/Oslo',
    'Denmark': 'Europe/Copenhagen',
    'Switzerland': 'Europe/Zurich'
  };

  return timezoneMap[country] || 'Europe/London';
};
import { ConfirmModal } from './ConfirmModal';

interface EventEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onSave?: () => void;
}

export const EventEditModal: React.FC<EventEditModalProps> = ({
  open,
  onOpenChange,
  event,
  onSave
}) => {
  const [formData, setFormData] = useState<UpdateEventData>({
    id: '',
    name: '',
    price: '',
    currency: 'gbp',
    description: '',
    imageURL: '',
    startTime: new Date(),
    country: '',
    includedDescription: '',
    startLocationName: '',
    startLocation: {
      latitude: 0,
      longitude: 0
    },
    barName: '',
    barAddress: '',
    barCity: '',
    barCountry: '',
    barPhone: '',
    barEmail: '',
    barWebsite: '',
    status: EventStatus.DRAFT
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bars, setBars] = useState<Bar[]>([]);
  const [eventRoute, setEventRoute] = useState<EventRoute | undefined>();
  const [notificationSettings, setNotificationSettings] = useState<EventNotificationSettings | undefined>();
  const [selectedBartenderIds, setSelectedBartenderIds] = useState<string[]>([]);
  const [confirmData, setConfirmData] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Recurring event state
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringTime, setRecurringTime] = useState<string>('19:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Default to all days
  const [scheduleType, setScheduleType] = useState<'daily' | 'custom'>('daily');

  useEffect(() => {
    const loadBars = async () => {
      try {
        const barsData = await barService.getBars();
        setBars(barsData);
      } catch (error) {
        console.error('Error loading bars:', error);
      }
    };

    if (open) {
      loadBars();
    }
  }, [open]);

  useEffect(() => {
    if (event) {
      setFormData({
        id: event.id || '',
        name: event.name,
        price: event.price,
        currency: event.currency || 'gbp',
        description: event.description,
        imageURL: event.imageURL,
        startTime: event.startTime instanceof Date ? event.startTime : event.startTime?.toDate(),
        country: event.country,
        includedDescription: event.includedDescription,
        startLocationName: event.startLocationName,
        startLocation: event.startLocation,
        barName: event.barName || '',
        barAddress: event.barAddress || '',
        barCity: event.barCity || '',
        barCountry: event.barCountry || '',
        barPhone: event.barPhone || '',
        barEmail: event.barEmail || '',
        barWebsite: event.barWebsite || '',
        timezone: event.timezone || getTimezoneByCountry(event.country),
        status: event.status || EventStatus.DRAFT
      });

      // Load recurring event data
      setIsRecurring(event.isRecurring || false);
      setRecurringTime(event.recurringTime || '19:00');
      const days = event.recurringDays || [0, 1, 2, 3, 4, 5, 6];
      setSelectedDays(days);
      // Determine schedule type based on days
      setScheduleType(days.length === 7 ? 'daily' : 'custom');

      setEventRoute(event.route);
      setNotificationSettings(event.notificationSettings);
      setSelectedBartenderIds(event.assignedBartenders || []);
    }
  }, [event]);

  // Sync scheduleType with selectedDays
  useEffect(() => {
    if (isRecurring) {
      if (scheduleType === 'daily') {
        // Set all days for daily schedule
        const allDays = [0, 1, 2, 3, 4, 5, 6];
        setSelectedDays(allDays);
      }
    }
  }, [scheduleType, isRecurring]);

  const handleInputChange = (field: keyof UpdateEventData, value: unknown) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      if (field === 'country' && typeof value === 'string') {
        newData.timezone = getTimezoneByCountry(value);
      }

      return newData;
    });
  };

  const handleLocationChange = (field: 'latitude' | 'longitude', value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      startLocation: {
        ...(prev.startLocation || { latitude: 0, longitude: 0 }),
        [field]: numValue
      }
    }));
  };

  const validateDateAndStatus = () => {
    if (!formData.startTime) return null;

    const now = new Date();
    const eventDate = new Date(formData.startTime);
    const isPastEvent = eventDate < now;

    if (isPastEvent && formData.status === EventStatus.ACTIVE) {
      return 'Warning: Setting an event with a past date as "Active" may not make sense. Consider changing the status to "Completed" or updating the date.';
    }

    if (!isPastEvent && formData.status === EventStatus.COMPLETED) {
      return 'Warning: Setting a future event as "Completed" may not make sense. Consider changing the status to "Active" or "Draft".';
    }

    return null;
  };

  const handleSave = async () => {
    if (!formData.id) return;

    const validationWarning = validateDateAndStatus();
    if (validationWarning) {
      setConfirmData({
        message: `${validationWarning}\n\nDo you want to proceed anyway?`,
        onConfirm: () => {
          setShowConfirmModal(false);
          performSave();
        }
      });
      setShowConfirmModal(true);
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const updateData: UpdateEventData = {
        ...formData,
        route: eventRoute,
        notificationSettings: notificationSettings,
        assignedBartenders: selectedBartenderIds.length > 0 ? selectedBartenderIds : [],
        // Recurring event fields
        isRecurring: isRecurring,
        recurringTime: isRecurring ? recurringTime : undefined,
        recurringDays: isRecurring ? selectedDays : undefined,
        // Clear startTime for recurring events
        startTime: isRecurring ? undefined : formData.startTime,
        // Auto-set status based on recurring type
        status: isRecurring ? EventStatus.PERMANENT : formData.status,
      };

      console.log('💾 Saving event with assignedBartenders:', selectedBartenderIds);

      await eventService.updateEvent(updateData);
      onSave?.();
      onOpenChange(false);
    } catch (err) {
      setError('Failed to update event');
      console.error('Error updating event:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (!event) return null;

  const startBar = bars.find(bar =>
    bar.name === event.barName &&
    bar.city === event.barCity &&
    bar.country === event.barCountry
  );

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Event"
      size="4xl"
      className="max-h-[90vh]"
      showConfirmButton
      confirmText="Save Changes"
      confirmClassName="bg-barTrekker-orange hover:bg-barTrekker-orange/90"
      onConfirm={handleSave}
      loading={loading}
    >
      <div className="max-h-[70vh] overflow-y-auto space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Basic Information Section */}
        <FormSection
          title="Basic Information"
          icon={Calendar}
        >
          <FormGrid cols={2}>
            <FormField label="Event Name" required>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter event name"
              />
            </FormField>

            <FormField label="Currency" required>
              <FormSelect
                value={formData.currency || 'gbp'}
                onValueChange={(value) => handleInputChange('currency', value)}
                options={CURRENCIES.map((currency) => ({
                  value: currency.code,
                  label: `${currency.symbol} ${currency.name}`
                }))}
                placeholder="Select currency"
              />
            </FormField>

            <FormField label="Price" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {CURRENCIES.find(c => c.code === formData.currency)?.symbol || '£'}
                </span>
                <Input
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                  type="number"
                  step="0.01"
                />
              </div>
            </FormField>

            {/* Date and Time - Only for one-time events */}
            {!isRecurring && (
              <FormField label="Start Date & Time" required>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="datetime-local"
                    lang="en-GB"
                    value={formatDateForInput(formData.startTime)}
                    onChange={(e) => handleInputChange('startTime', new Date(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </FormField>
            )}




            <FormField label="Country" required>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Enter country"
                  className="pl-10"
                />
              </div>
            </FormField>

            <FormField label="Location Name" required>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={formData.startLocationName}
                  onChange={(e) => handleInputChange('startLocationName', e.target.value)}
                  placeholder="Enter location name"
                  className="pl-10"
                />
              </div>
            </FormField>

            <FormField label="Status">
              <FormSelect
                value={formData.status || EventStatus.DRAFT}
                onValueChange={(value) => handleInputChange('status', value as EventStatus)}
                options={[
                  { value: EventStatus.DRAFT, label: 'Draft' },
                  { value: EventStatus.ACTIVE, label: 'Active' },
                  { value: EventStatus.COMPLETED, label: 'Completed' },
                  { value: EventStatus.CANCELLED, label: 'Cancelled' }
                ]}
                placeholder="Select status"
              />
              {(() => {
                if (!formData.startTime) return null;

                const now = new Date();
                const eventDate = new Date(formData.startTime);
                const isPastEvent = eventDate < now;

                if (isPastEvent && formData.status === EventStatus.ACTIVE) {
                  return (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        ⚠️ This event has a past date but is marked as "Active". Consider changing the status to "Completed".
                      </p>
                    </div>
                  );
                }

                if (!isPastEvent && formData.status === EventStatus.COMPLETED) {
                  return (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        ⚠️ This is a future event but is marked as "Completed". Consider changing the status to "Active" or "Draft".
                      </p>
                    </div>
                  );
                }

                return null;
              })()}
            </FormField>
          </FormGrid>

          {/* Event Type Selection */}
          <div className="mt-6">
            <FormField label="Event Type" required>
              <div className="flex space-x-4">
                <label className="flex-1 cursor-pointer">
                  <div className={`p-4 border rounded-lg transition-colors ${!isRecurring
                    ? 'border-barTrekker-orange bg-orange-50'
                    : 'border-barTrekker-lightGrey bg-white hover:border-barTrekker-darkGrey'
                    }`}>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="eventType"
                        checked={!isRecurring}
                        onChange={() => setIsRecurring(false)}
                        className="w-4 h-4 text-barTrekker-orange"
                      />
                      <div>
                        <div className="font-medium text-barTrekker-darkGrey">One-time Event</div>
                        <div className="text-sm text-gray-500">Single occurrence</div>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="flex-1 cursor-pointer">
                  <div className={`p-4 border rounded-lg transition-colors ${isRecurring
                    ? 'border-barTrekker-lightBlue bg-blue-50'
                    : 'border-barTrekker-lightGrey bg-white hover:border-barTrekker-darkGrey'
                    }`}>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="eventType"
                        checked={isRecurring}
                        onChange={() => setIsRecurring(true)}
                        className="w-4 h-4 text-barTrekker-lightBlue"
                      />
                      <div>
                        <div className="font-medium text-barTrekker-darkGrey">Recurring Event</div>
                        <div className="text-sm text-gray-500">Daily schedule</div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </FormField>
          </div>

          {/* Recurring Event Settings - Only show when recurring is selected */}
          {isRecurring && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recurring Event Settings</h3>

              {/* Recurring Time */}
              <FormField label="Event Time" required>
                <Input
                  type="time"
                  value={recurringTime}
                  onChange={(e) => setRecurringTime(e.target.value)}
                  className="bg-gray-50 border-gray-300 focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                />
              </FormField>

              {/* Schedule Type */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-900">Schedule Type *</label>

                <div className="flex space-x-4">
                  {/* Daily Option */}
                  <label className="flex-1 cursor-pointer">
                    <div className={`p-4 border rounded-lg transition-colors ${scheduleType === 'daily'
                      ? 'border-barTrekker-orange bg-orange-50'
                      : 'border-barTrekker-lightGrey bg-white hover:border-barTrekker-darkGrey'
                      }`}>
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="scheduleType"
                          checked={scheduleType === 'daily'}
                          onChange={() => setScheduleType('daily')}
                          className="w-4 h-4 text-barTrekker-orange"
                        />
                        <div>
                          <div className="font-medium text-barTrekker-darkGrey">Daily (Every Day)</div>
                          <div className="text-sm text-gray-500">Runs every day</div>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Custom Option */}
                  <label className="flex-1 cursor-pointer">
                    <div className={`p-4 border rounded-lg transition-colors ${scheduleType === 'custom'
                      ? 'border-barTrekker-lightBlue bg-blue-50'
                      : 'border-barTrekker-lightGrey bg-white hover:border-barTrekker-darkGrey'
                      }`}>
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="scheduleType"
                          checked={scheduleType === 'custom'}
                          onChange={() => setScheduleType('custom')}
                          className="w-4 h-4 text-barTrekker-lightBlue"
                        />
                        <div>
                          <div className="font-medium text-barTrekker-darkGrey">Custom Schedule</div>
                          <div className="text-sm text-gray-500">Choose specific days</div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Custom Days Selection - Only show if custom is selected */}
                {scheduleType === 'custom' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-barTrekker-darkGrey">Select Days *</label>
                    <div className="flex items-center space-x-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const newDays = selectedDays.includes(day)
                              ? selectedDays.filter(d => d !== day)
                              : [...selectedDays, day];
                            setSelectedDays(newDays);
                          }}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${selectedDays.includes(day)
                            ? 'bg-barTrekker-orange text-white'
                            : 'bg-barTrekker-lightGrey text-barTrekker-darkGrey hover:bg-gray-300'
                            }`}
                        >
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                        </button>
                      ))}
                    </div>

                    {selectedDays.length === 0 && (
                      <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-sm text-red-600 font-medium">Please select at least one day for your event</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </FormSection>

        {/* Media Section */}
        <FormSection
          title="Media & Visuals"
          icon={Image}
        >
          <FormField label="Image URL">
            <Input
              value={formData.imageURL}
              onChange={(e) => handleInputChange('imageURL', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {formData.imageURL && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={formData.imageURL}
                    alt="Event preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </FormField>
        </FormSection>

        {/* Location Details Section */}
        <FormSection
          title="Location Details"
          icon={MapPinIcon}
          description="Enter the exact coordinates for the event starting location"
        >
          <FormGrid cols={2}>
            <FormField label="Latitude">
              <Input
                type="number"
                step="any"
                value={formData.startLocation?.latitude || 0}
                onChange={(e) => handleLocationChange('latitude', e.target.value)}
                placeholder="0.000000"
              />
            </FormField>
            <FormField label="Longitude">
              <Input
                type="number"
                step="any"
                value={formData.startLocation?.longitude || 0}
                onChange={(e) => handleLocationChange('longitude', e.target.value)}
                placeholder="0.000000"
              />
            </FormField>
          </FormGrid>
        </FormSection>

        {/* Description Section */}
        <FormSection
          title="Event Description"
          icon={Calendar}
        >
          <div className="space-y-6">
            <FormField label="Description" required>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter detailed event description"
                rows={4}
              />
            </FormField>

            <FormField label="What's Included">
              <Textarea
                value={formData.includedDescription}
                onChange={(e) => handleInputChange('includedDescription', e.target.value)}
                placeholder="Describe what's included in the event (food, drinks, transportation, etc.)"
                rows={3}
              />
            </FormField>
          </div>
        </FormSection>

        {/* Bar Information Section */}
        <FormSection
          title="Bar Information"
          icon={MapPinIcon}
          description="Enter the bar details for this event"
        >
          <FormGrid cols={2}>
            <FormField label="Bar Name" required>
              <Input
                value={formData.barName}
                onChange={(e) => handleInputChange('barName', e.target.value)}
                placeholder="Enter bar name"
              />
            </FormField>

            <FormField label="Bar City" required>
              <Input
                value={formData.barCity}
                onChange={(e) => handleInputChange('barCity', e.target.value)}
                placeholder="Enter bar city"
              />
            </FormField>

            <FormField label="Bar Address" required>
              <Input
                value={formData.barAddress}
                onChange={(e) => handleInputChange('barAddress', e.target.value)}
                placeholder="Enter bar address"
              />
            </FormField>

            <FormField label="Bar Country" required>
              <Input
                value={formData.barCountry}
                onChange={(e) => handleInputChange('barCountry', e.target.value)}
                placeholder="Enter bar country"
              />
            </FormField>

            <FormField label="Bar Phone">
              <Input
                value={formData.barPhone}
                onChange={(e) => handleInputChange('barPhone', e.target.value)}
                placeholder="Enter bar phone number"
              />
            </FormField>

            <FormField label="Bar Email">
              <Input
                type="email"
                value={formData.barEmail}
                onChange={(e) => handleInputChange('barEmail', e.target.value)}
                placeholder="Enter bar email"
              />
            </FormField>

            <FormField label="Bar Website">
              <Input
                type="url"
                value={formData.barWebsite}
                onChange={(e) => handleInputChange('barWebsite', e.target.value)}
                placeholder="https://example.com"
              />
            </FormField>
          </FormGrid>
        </FormSection>

        {/* Bartender Assignment */}
        {formData.barName && (
          <FormSection
            title="Assign Bartenders"
            icon={Users}
            description={`Select which bartenders from ${formData.barName} will be assigned to this event. Only assigned bartenders will see this event in their mobile app.`}
          >
            <BartenderSelector
              barName={formData.barName}
              selectedBartenderIds={selectedBartenderIds}
              onSelectionChange={setSelectedBartenderIds}
              disabled={loading}
            />
          </FormSection>
        )}

        {/* Event Route Manager */}
        {bars.length > 0 && (
          <FormSection
            title="Event Route"
            icon={MapPinIcon}
            description="Manage the bars and locations for this event tour"
          >
            <EventRouteManager
              route={eventRoute}
              notificationSettings={notificationSettings}
              onRouteChange={setEventRoute}
              onNotificationSettingsChange={setNotificationSettings}
              bars={bars}
              startBar={startBar}
            />
          </FormSection>
        )}
      </div>

      <ConfirmModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={confirmData?.onConfirm || (() => { })}
        title="Confirm Action"
        description={confirmData?.message || ''}
        confirmText="Proceed Anyway"
        cancelText="Cancel"
        variant="default"
      />
    </BaseModal>
  );
};
