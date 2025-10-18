import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Calendar } from 'lucide-react';
import { AdminLayout } from '@/core/components/layout/AdminLayout';
import { ImageUpload } from '@/components/common/ImageUpload/ImageUpload';
import { ImageUploadResult } from '@/core/services/imageService';
// Coordinates are derived from selected bar; no direct importer needed here

import { Button } from '@/core/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/core/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/inputs/input';
import { Textarea } from '@/core/components/ui/inputs/textarea';
import { FormSelect } from '@/core/components/ui/inputs/FormSelect';
import { eventService } from '@/core/services/eventService';
import { barService } from '@/core/services/barService';
import { CreateEventData, EventRoute, EventNotificationSettings, EventLocation } from '@/core/types/event';
import { Bar } from '@/core/types/bar';
import { AnalyticsService } from '@/core/services/analyticsService';
import { EventRouteManager } from '@/components/common/EventRouteManager/EventRouteManager';
import { CURRENCIES, getCurrencyByCountry } from '@/core/constants/currencies';
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

// Form validation schema
const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required").min(2, "Name must be at least 2 characters"),
  description: z.string().min(1, "Description is required").min(10, "Description must be at least 10 characters"),
  price: z.string().min(1, "Price is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price must be a positive number"),
  currency: z.string().min(1, "Currency is required"),
  country: z.string().min(1, "Country is required"),
  startLocationName: z.string().optional(),
  includedDescription: z.string().optional(),
  startTime: z.string().optional(),
  barId: z.string().min(1, "Please select a bar"),
  // Recurring event fields
  isRecurring: z.boolean().optional(),
  recurringTime: z.string().optional(),
  recurringDays: z.array(z.number()).optional(),
}).refine((data) => {
  // If not recurring, startTime is required
  if (!data.isRecurring && !data.startTime) {
    return false;
  }
  // If recurring, recurringTime and recurringDays are required
  if (data.isRecurring && (!data.recurringTime || !data.recurringDays || data.recurringDays.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "For one-time events, start time is required. For recurring events, recurring time and days are required.",
  path: ["startTime"]
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

export const CreateEventPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bars, setBars] = useState<Bar[]>([]);
  const [selectedBar, setSelectedBar] = useState<Bar | undefined>(undefined);
  const [uploadedImages, setUploadedImages] = useState<ImageUploadResult[]>([]);
  const [eventRoute, setEventRoute] = useState<EventRoute | undefined>();
  const [notificationSettings, setNotificationSettings] = useState<EventNotificationSettings | undefined>();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('gbp');
  const [selectedBartenderIds, setSelectedBartenderIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // Защита от двойной отправки
  // Recurring event state
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringTime, setRecurringTime] = useState<string>('19:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Default to all days
  const [scheduleType, setScheduleType] = useState<'daily' | 'custom'>('daily');

  useEffect(() => {
    if (selectedBar && (!eventRoute || eventRoute.locations.length === 0)) {
      const startLocation: EventLocation = {
        id: `start_location_${selectedBar.id}`,
        name: selectedBar.name,
        address: selectedBar.address,
        coordinates: { latitude: selectedBar.coordinates.latitude, longitude: selectedBar.coordinates.longitude },
        order: 0,
        stayDuration: 60,
        description: `Starting location at ${selectedBar.name}`,
        barName: selectedBar.name,
        barAddress: selectedBar.address,
        barPhone: selectedBar.phone,
        barEmail: selectedBar.email,
      };

      const initialRoute: EventRoute = {
        locations: [startLocation],
        totalDuration: startLocation.stayDuration,
        isActive: true,
      };

      setEventRoute(initialRoute);

      setNotificationSettings({
        startReminder: 15,
        locationReminders: 10,
        arrivalNotifications: true,
        departureNotifications: true,
      });
    }
  }, [selectedBar, eventRoute]);

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

  const form = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      currency: 'gbp',
      country: '',
      startLocationName: '',
      includedDescription: '',
      startTime: '',
      barId: '',
      isRecurring: false,
      recurringTime: '19:00',
      recurringDays: [0, 1, 2, 3, 4, 5, 6], // Default to all days for daily schedule
    },
  });

  // Sync selectedDays with form when scheduleType changes
  useEffect(() => {
    if (isRecurring && scheduleType === 'daily') {
      form.setValue('recurringDays', selectedDays);
    }
  }, [selectedDays, isRecurring, scheduleType, form]);

  useEffect(() => {
    if (selectedBar) {
      form.setValue('startLocationName', selectedBar.name)

      // Auto-select currency based on bar country
      const suggestedCurrency = getCurrencyByCountry(selectedBar.country);
      if (suggestedCurrency) {
        form.setValue('currency', suggestedCurrency.code);
        setSelectedCurrency(suggestedCurrency.code);
      }
    }
  }, [selectedBar])

  // Auto-select currency when country changes
  useEffect(() => {
    const country = form.watch('country');
    if (country) {
      const suggestedCurrency = getCurrencyByCountry(country);
      if (suggestedCurrency && suggestedCurrency.code !== selectedCurrency) {
        form.setValue('currency', suggestedCurrency.code);
        setSelectedCurrency(suggestedCurrency.code);
      }
    }
  }, [form.watch('country')]);

  // Load bars on component mount
  useEffect(() => {
    const loadBars = async () => {
      try {
        const barsData = await barService.getBars({ isActive: true });
        setBars(barsData);
      } catch (error) {
        console.error('Error loading bars:', error);
      }
    };
    loadBars();
  }, []);

  const onSubmit = async (data: CreateEventFormData) => {
    // Защита от повторной отправки
    if (isSubmitting) {
      console.log('⚠️ Event creation already in progress, ignoring duplicate submit');
      return;
    }

    try {
      setIsSubmitting(true);
      setLoading(true);
      setError(null);

      console.log('🚀 Starting event creation...');

      // Find selected bar
      const bar = bars.find(b => b.id === data.barId);
      if (!bar) {
        setError('Selected bar not found');
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      const primaryImage = uploadedImages[0]?.url || 'https://via.placeholder.com/400x200'
      const eventData: CreateEventData = {
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency,
        country: data.country,
        startLocationName: data.startLocationName || bar.name,
        includedDescription: data.includedDescription || '',
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        timezone: getTimezoneByCountry(data.country),
        imageURL: primaryImage,
        startLocation: {
          latitude: bar.coordinates.latitude,
          longitude: bar.coordinates.longitude,
        },
        // Bar information from selected bar
        barName: bar.name,
        barAddress: bar.address,
        barCity: bar.city,
        barCountry: bar.country,
        barPhone: bar.phone || undefined,
        barEmail: bar.email || undefined,
        barWebsite: bar.website || undefined,
        // Bartender assignment
        assignedBartenders: selectedBartenderIds.length > 0 ? selectedBartenderIds : undefined,
        images: uploadedImages.map(img => img.url),
        route: eventRoute,
        notificationSettings: notificationSettings,
        // Recurring event fields
        isRecurring: data.isRecurring || false,
        recurringTime: data.recurringTime,
        recurringDays: data.recurringDays,
      };

      console.log('📝 Event data prepared:', { name: eventData.name, barName: eventData.barName });

      const createdEvent = await eventService.createEvent(eventData);

      console.log('✅ Event created successfully with ID:', createdEvent.id);

      AnalyticsService.logCustomEvent('event_created', {
        eventName: data.name,
        country: data.country,
        price: data.price,
        barName: bar.name
      });

      console.log('🔄 Navigating to events list...');

      // Сбрасываем loading перед навигацией
      setLoading(false);
      setIsSubmitting(false);
      navigate('/admin/events');
    } catch (err: any) {
      console.error('❌ Error creating event:', err);
      setError(err?.message || 'Failed to create event. Please try again.');
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/events');
  };

  return (
    <AdminLayout title="Create New Event Tour" subtitle="Create a multi-location BarTrekker pub crawl or tour experience">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Events</span>
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Creating a Multi-Location Event Tour</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>BarTrekker events are designed as guided tours through multiple locations. Here's how it works:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><strong>Start Location:</strong> Choose your first bar where participants will gather</li>
                  <li><strong>Additional Stops:</strong> Add 2-4 more bars to create the complete tour route</li>
                  <li><strong>Automatic Navigation:</strong> Participants receive real-time directions and notifications</li>
                  <li><strong>Timed Progression:</strong> Each location has a customizable duration (30-90 minutes)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Event Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Starting Location Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-barTrekker-darkGrey">Starting Location</h3>
                  <p className="text-sm text-gray-600">Select the first bar where your event tour will begin. Additional stops will be added in the route section below.</p>

                  <FormField
                    control={form.control}
                    name="barId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                          Select Bar *
                        </FormLabel>
                        <FormControl>
                          <FormSelect
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              const bar = bars.find(b => b.id === value);
                              setSelectedBar(bar);
                              // Reset bartender selection when bar changes
                              setSelectedBartenderIds([]);
                            }}
                            options={[
                              { value: '', label: 'Select a bar...' },
                              ...bars.map((bar) => ({
                                value: bar.id,
                                label: `${bar.name} - ${bar.city}, ${bar.country}`
                              }))
                            ]}
                            placeholder="Select a bar..."
                            allowEmpty={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Selected Bar Info */}
                  {selectedBar && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-2">Selected Bar Information:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Name:</span> {selectedBar.name}
                        </div>
                        <div>
                          <span className="font-medium">City:</span> {selectedBar.city}
                        </div>
                        <div>
                          <span className="font-medium">Address:</span> {selectedBar.address}
                        </div>
                        <div>
                          <span className="font-medium">Country:</span> {selectedBar.country}
                        </div>
                        {selectedBar.phone && (
                          <div>
                            <span className="font-medium">Phone:</span> {selectedBar.phone}
                          </div>
                        )}
                        {selectedBar.email && (
                          <div>
                            <span className="font-medium">Email:</span> {selectedBar.email}
                          </div>
                        )}
                        {selectedBar.website && (
                          <div>
                            <span className="font-medium">Website:</span> {selectedBar.website}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {bars.length === 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800">
                        No bars available. Please create a bar first in the{' '}
                        <a href="/admin/bars" className="underline font-medium">
                          Bars Management
                        </a>{' '}
                        section.
                      </p>
                    </div>
                  )}
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                          Event Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter event name"
                            className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                          Currency *
                        </FormLabel>
                        <FormControl>
                          <FormSelect
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCurrency(value);
                            }}
                            options={CURRENCIES.map((currency) => ({
                              value: currency.code,
                              label: `${currency.symbol} ${currency.name} (${currency.code.toUpperCase()})`
                            }))}
                            placeholder="Select currency..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                          Price *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-barTrekker-darkGrey/70 text-sm">
                              {CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '£'}
                            </span>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-10 bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                        Description *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe your event..."
                          rows={4}
                          className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                          Country *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter country"
                            className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* startLocationName is auto-filled from selected bar; field hidden */}
                </div>

                {/* Coordinates are derived from selected bar automatically */}

                {/* Event Type Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-barTrekker-darkGrey">Event Type</h3>

                  {/* Beautiful Card-based Event Type Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* One-time Event Option */}
                    <div
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${!isRecurring
                        ? 'border-barTrekker-orange bg-orange-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                      onClick={() => {
                        setIsRecurring(false);
                        form.setValue('isRecurring', false);
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${!isRecurring
                          ? 'border-barTrekker-orange bg-barTrekker-orange'
                          : 'border-gray-300'
                          }`}>
                          {!isRecurring && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900">One-time Event</h3>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            A single event with a specific date and time. Perfect for special occasions, launches, or unique experiences.
                          </p>
                          <div className="mt-2 flex items-center space-x-1">
                            <div className="w-6 h-6 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center justify-center font-medium">
                              📅
                            </div>
                            <span className="text-xs text-gray-500">Single date</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recurring Event Option */}
                    <div
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${isRecurring
                        ? 'border-barTrekker-orange bg-orange-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                      onClick={() => {
                        setIsRecurring(true);
                        form.setValue('isRecurring', true);
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${isRecurring
                          ? 'border-barTrekker-orange bg-barTrekker-orange'
                          : 'border-gray-300'
                          }`}>
                          {isRecurring && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900">Recurring Event (Daily)</h3>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Event runs every day at the specified time. Customers can buy tickets for specific dates. Perfect for regular tours and activities.
                          </p>
                          <div className="mt-2 flex items-center space-x-1">
                            <div className="w-6 h-6 bg-barTrekker-orange text-white text-xs rounded-full flex items-center justify-center font-medium">
                              🔄
                            </div>
                            <span className="text-xs text-gray-500">Daily recurring</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date and Time - Only for one-time events */}
                {!isRecurring && (
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                          Start Date & Time *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="datetime-local"
                            lang="en-GB"
                            className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Recurring Event Settings */}
                {isRecurring && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-barTrekker-darkGrey">Recurring Event Settings</h3>

                    {/* Recurring Time */}
                    <FormField
                      control={form.control}
                      name="recurringTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                            Event Time *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="time"
                              value={recurringTime}
                              onChange={(e) => {
                                setRecurringTime(e.target.value);
                                field.onChange(e.target.value);
                              }}
                              className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Schedule Type */}
                    <div className="space-y-4">
                      <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                        Schedule Type *
                      </FormLabel>

                      {/* Beautiful Card-based Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Daily Option */}
                        <div
                          className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${scheduleType === 'daily'
                            ? 'border-barTrekker-orange bg-orange-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                            }`}
                          onClick={() => setScheduleType('daily')}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${scheduleType === 'daily'
                              ? 'border-barTrekker-orange bg-barTrekker-orange'
                              : 'border-gray-300'
                              }`}>
                              {scheduleType === 'daily' && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900">Daily (Every Day)</h3>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                Event runs every day of the week at the specified time. Perfect for regular tours and activities.
                              </p>
                              <div className="mt-2 flex items-center space-x-1">
                                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                  <div key={day} className="w-6 h-6 bg-barTrekker-orange text-white text-xs rounded-full flex items-center justify-center font-medium">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'][day]}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Custom Option */}
                        <div
                          className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${scheduleType === 'custom'
                            ? 'border-barTrekker-orange bg-orange-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                            }`}
                          onClick={() => setScheduleType('custom')}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${scheduleType === 'custom'
                              ? 'border-barTrekker-orange bg-barTrekker-orange'
                              : 'border-gray-300'
                              }`}>
                              {scheduleType === 'custom' && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900">Custom Schedule</h3>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                Choose specific days when the event is available. Great for weekend-only or weekday-only events.
                              </p>
                              <div className="mt-2 flex items-center space-x-1">
                                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                  <div key={day} className={`w-6 h-6 text-xs rounded-full flex items-center justify-center font-medium ${selectedDays.includes(day)
                                    ? 'bg-barTrekker-orange text-white'
                                    : 'bg-gray-100 text-gray-400'
                                    }`}>
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'][day]}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Custom Days Selection - Only show when custom schedule is selected */}
                    {scheduleType === 'custom' && (
                      <div className="space-y-4">
                        <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                          Select Days *
                        </FormLabel>

                        {/* Beautiful Day Selection */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-7 gap-3">
                            {[
                              { value: 0, label: 'Sun', fullLabel: 'Sunday' },
                              { value: 1, label: 'Mon', fullLabel: 'Monday' },
                              { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
                              { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
                              { value: 4, label: 'Thu', fullLabel: 'Thursday' },
                              { value: 5, label: 'Fri', fullLabel: 'Friday' },
                              { value: 6, label: 'Sat', fullLabel: 'Saturday' }
                            ].map((day) => {
                              const isSelected = selectedDays.includes(day.value);
                              return (
                                <div
                                  key={day.value}
                                  className={`relative cursor-pointer transition-all duration-200 ${isSelected
                                    ? 'transform scale-105'
                                    : 'hover:scale-102'
                                    }`}
                                  onClick={() => {
                                    const newDays = isSelected
                                      ? selectedDays.filter(d => d !== day.value)
                                      : [...selectedDays, day.value];
                                    setSelectedDays(newDays);
                                    form.setValue('recurringDays', newDays);
                                  }}
                                >
                                  <div className={`w-full h-20 rounded-lg border-2 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${isSelected
                                    ? 'border-barTrekker-orange bg-barTrekker-orange text-white shadow-lg'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-md'
                                    }`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isSelected
                                      ? 'bg-white text-barTrekker-orange'
                                      : 'bg-gray-100 text-gray-600'
                                      }`}>
                                      {day.label}
                                    </div>
                                    <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-600'
                                      }`}>
                                      {day.fullLabel}
                                    </span>
                                    {isSelected && (
                                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Selection Summary */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Selected: {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''}
                              </span>
                              {selectedDays.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-gray-500">Days:</span>
                                  <div className="flex space-x-1">
                                    {selectedDays.sort().map(day => (
                                      <span key={day} className="px-2 py-1 bg-barTrekker-orange text-white text-xs rounded-full font-medium">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
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
                )}

                {/* Additional Information */}
                <FormField
                  control={form.control}
                  name="includedDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                        What's Included
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe what's included in the event..."
                          rows={3}
                          className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-barTrekker-darkGrey">Event Images</h3>
                  <ImageUpload
                    onImagesChange={setUploadedImages}
                    maxImages={5}
                    folder="events"
                    disabled={loading}
                  />
                </div>

                {/* No fallback URL field; primary image is first uploaded image */}

                {/* Bartender Assignment */}
                {selectedBar && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-barTrekker-darkGrey">Assign Bartenders</h3>
                    <p className="text-sm text-gray-600">
                      Select which bartenders from {selectedBar.name} will be assigned to this event.
                      Only assigned bartenders will see this event in their mobile app.
                    </p>
                    <BartenderSelector
                      barName={selectedBar.name}
                      selectedBartenderIds={selectedBartenderIds}
                      onSelectionChange={setSelectedBartenderIds}
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Event Route Manager */}
                <EventRouteManager
                  route={eventRoute}
                  notificationSettings={notificationSettings}
                  onRouteChange={setEventRoute}
                  onNotificationSettingsChange={setNotificationSettings}
                  bars={bars}
                  startBar={selectedBar}
                />

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-barTrekker-orange hover:bg-barTrekker-orange/90"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Save className="h-4 w-4" />
                        <span>Create Event</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
