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

// Функция для автоматического определения timezone по стране
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

  return timezoneMap[country] || 'Europe/London'; // По умолчанию London
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
  startTime: z.string().min(1, "Start time is required"),
  barId: z.string().min(1, "Please select a bar"),
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
    },
  });

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
    try {
      setLoading(true);
      setError(null);

      // Find selected bar
      const bar = bars.find(b => b.id === data.barId);
      if (!bar) {
        setError('Selected bar not found');
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
        startTime: new Date(data.startTime),
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
        images: uploadedImages.map(img => img.url),
        route: eventRoute,
        notificationSettings: notificationSettings,
      };

      await eventService.createEvent(eventData);

      AnalyticsService.logCustomEvent('event_created', {
        eventName: data.name,
        country: data.country,
        price: data.price,
        barName: bar.name
      });

      navigate('/admin/events');
    } catch (err) {
      setError('Failed to create event');
      console.error('Error creating event:', err);
    } finally {
      setLoading(false);
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

                {/* Date and Time */}
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
