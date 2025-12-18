import React, { useState } from 'react';
import { Plus, Trash2, MapPin, Clock, Settings, Navigation, Repeat, Power, PowerOff, Pencil } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/inputs/input';
import { Textarea } from '@/core/components/ui/inputs/textarea';
import { GoogleMapsImporter } from '@/components/common/GoogleMapsImporter/GoogleMapsImporter';
import { EventLocation, EventRoute, EventNotificationSettings, EventRecurringNotification } from '@/core/types/event';
import { Bar } from '@/core/types/bar';

interface EventRouteManagerProps {
    route?: EventRoute;
    notificationSettings?: EventNotificationSettings;
    recurringNotifications?: EventRecurringNotification[];
    onRouteChange: (route: EventRoute | undefined) => void;
    onNotificationSettingsChange: (settings: EventNotificationSettings | undefined) => void;
    onRecurringNotificationsChange?: (notifications: EventRecurringNotification[]) => void;
    bars?: Bar[];
    startBar?: Bar;
    timezone?: string; // e.g., 'Europe/Warsaw'
}

// Helper functions for timezone conversion
const utcToLocal = (utcTime: string, timezone: string): string => {
    try {
        const [hours, minutes] = utcTime.split(':').map(Number);
        const date = new Date();
        date.setUTCHours(hours, minutes, 0, 0);
        return date.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: timezone,
            hour12: false
        });
    } catch {
        return utcTime;
    }
};

const localToUtc = (localTime: string, timezone: string): string => {
    try {
        const [hours, minutes] = localTime.split(':').map(Number);
        
        // Get timezone offset by comparing UTC and local time for a reference point
        const now = new Date();
        const utcTime = now.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false });
        const localTzTime = now.toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false });
        
        const [utcH, utcM] = utcTime.split(':').map(Number);
        const [localH, localM] = localTzTime.split(':').map(Number);
        
        // Offset in minutes: local - utc
        let offsetMinutes = (localH * 60 + localM) - (utcH * 60 + utcM);
        if (offsetMinutes > 12 * 60) offsetMinutes -= 24 * 60;
        if (offsetMinutes < -12 * 60) offsetMinutes += 24 * 60;
        
        // Convert input local time to UTC: UTC = local - offset
        let utcTotalMinutes = (hours * 60 + minutes) - offsetMinutes;
        if (utcTotalMinutes < 0) utcTotalMinutes += 24 * 60;
        if (utcTotalMinutes >= 24 * 60) utcTotalMinutes -= 24 * 60;
        
        const utcHours = Math.floor(utcTotalMinutes / 60);
        const utcMins = utcTotalMinutes % 60;
        
        return `${utcHours.toString().padStart(2, '0')}:${utcMins.toString().padStart(2, '0')}`;
    } catch {
        return localTime;
    }
};

export const EventRouteManager: React.FC<EventRouteManagerProps> = ({
    route,
    notificationSettings,
    recurringNotifications = [],
    onRouteChange,
    onNotificationSettingsChange,
    onRecurringNotificationsChange,
    bars = [],
    startBar,
    timezone = 'Europe/London',
}) => {
    const [showRouteBuilder, setShowRouteBuilder] = useState(false);
    const [showRecurringNotifications, setShowRecurringNotifications] = useState(false);
    const [newRecurring, setNewRecurring] = useState({ time: '20:00', title: '', body: '', mapUrl: '' });
    const [editingNotificationId, setEditingNotificationId] = useState<string | null>(null);

    const createStartLocationFromBar = (bar: Bar): EventLocation => {
        return {
            id: `start_location_${bar.id}`,
            name: bar.name,
            address: bar.address,
            coordinates: { latitude: bar.coordinates.latitude, longitude: bar.coordinates.longitude },
            order: 0,
            stayDuration: 60,
            description: `Starting location at ${bar.name}`,
            barName: bar.name,
            barAddress: bar.address,
            barPhone: bar.phone,
            barEmail: bar.email,
        };
    };

    const addLocationFromBar = (selectedBar: Bar) => {
        const newLocation: EventLocation = {
            id: `location_${selectedBar.id}_${Date.now()}`,
            name: selectedBar.name,
            address: selectedBar.address,
            coordinates: { latitude: selectedBar.coordinates.latitude, longitude: selectedBar.coordinates.longitude },
            order: route?.locations.length || 0,
            stayDuration: 75,
            description: `Visit to ${selectedBar.name}`,
            barName: selectedBar.name,
            barAddress: selectedBar.address,
            barPhone: selectedBar.phone,
            barEmail: selectedBar.email,
        };

        const updatedRoute: EventRoute = {
            locations: [...(route?.locations || []), newLocation],
            totalDuration: (route?.totalDuration || 0) + newLocation.stayDuration,
            isActive: true,
        };

        onRouteChange(updatedRoute);
    };

    const addCustomLocation = () => {
        const newLocation: EventLocation = {
            id: `custom_location_${Date.now()}`,
            name: '',
            address: '',
            coordinates: { latitude: 0, longitude: 0 },
            order: route?.locations.length || 0,
            stayDuration: 60,
            description: '',
        };

        const updatedRoute: EventRoute = {
            locations: [...(route?.locations || []), newLocation],
            totalDuration: (route?.totalDuration || 0) + newLocation.stayDuration,
            isActive: true,
        };

        onRouteChange(updatedRoute);
    };

    const removeLocation = (locationId: string) => {
        if (!route) return;

        const updatedLocations = route.locations.filter(loc => loc.id !== locationId);
        const removedLocation = route.locations.find(loc => loc.id === locationId);

        const newTotalDuration = updatedLocations.reduce((total, loc) => total + loc.stayDuration, 0);

        const reorderedLocations = updatedLocations.map((loc, index) => ({
            ...loc,
            order: index,
        }));

        if (updatedLocations.length === 0) {
            onRouteChange(undefined);
        } else {
            onRouteChange({
                locations: reorderedLocations,
                totalDuration: newTotalDuration,
                isActive: true,
            });
        }
    };

    const updateLocation = (locationId: string, updates: Partial<EventLocation>) => {
        if (!route) return;

        const updatedLocations = route.locations.map(loc => {
            if (loc.id === locationId) {
                return { ...loc, ...updates };
            }
            return loc;
        });

        const newTotalDuration = updatedLocations.reduce((total, loc) => total + loc.stayDuration, 0);

        onRouteChange({
            locations: updatedLocations,
            totalDuration: newTotalDuration,
            isActive: true,
        });
    };

    const updateLocationCoordinates = (locationId: string, latitude: number, longitude: number) => {
        updateLocation(locationId, {
            coordinates: { latitude, longitude },
        });
    };

    const updateNotificationSettings = (updates: Partial<EventNotificationSettings>) => {
        const updatedSettings: EventNotificationSettings = {
            startReminder: 15,
            locationReminders: 5,
            arrivalNotifications: true,
            departureNotifications: true,
            ...notificationSettings,
            ...updates,
        };

        onNotificationSettingsChange(updatedSettings);
    };

    const addRecurringNotification = () => {
        if (!newRecurring.title.trim() || !newRecurring.body.trim() || !newRecurring.time) return;
        
        // Convert local time to UTC for storage
        const utcTime = localToUtc(newRecurring.time, timezone);
        
        const newNotification: EventRecurringNotification = {
            id: `recurring_${Date.now()}`,
            time: utcTime, // Store in UTC
            title: newRecurring.title.trim(),
            body: newRecurring.body.trim(),
            mapUrl: newRecurring.mapUrl.trim() || undefined,
            isActive: true,
        };

        onRecurringNotificationsChange?.([...recurringNotifications, newNotification]);
        setNewRecurring({ time: '20:00', title: '', body: '', mapUrl: '' });
    };

    const updateRecurringNotification = (id: string, updates: Partial<EventRecurringNotification>) => {
        onRecurringNotificationsChange?.(
            recurringNotifications.map((n) =>
                n.id === id ? { ...n, ...updates } : n
            )
        );
    };

    const removeRecurringNotification = (id: string) => {
        onRecurringNotificationsChange?.(recurringNotifications.filter(n => n.id !== id));
    };

    const toggleRecurringNotification = (id: string) => {
        onRecurringNotificationsChange?.(
            recurringNotifications.map(n => 
                n.id === id ? { ...n, isActive: !n.isActive } : n
            )
        );
    };

    return (
        <div className="space-y-6">
            {/* Route Builder Toggle */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Navigation className="h-5 w-5" />
                        <span>Event Route</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600 mb-2">
                                {route && route.locations && route.locations.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-blue-50 rounded border border-blue-200">
                                        <div>
                                            <p className="font-medium text-blue-800">Total Stops:</p>
                                            <p className="text-lg font-bold text-blue-900">{route.locations.length} locations</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-blue-800">Duration:</p>
                                            <p className="text-lg font-bold text-blue-900">{Math.floor(route.totalDuration / 60)}h {route.totalDuration % 60}m</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-blue-800">Event Type:</p>
                                            <p className="text-lg font-bold text-blue-900">
                                                {route.locations.length <= 1 ? 'Single Location' :
                                                    route.locations.length <= 3 ? 'Mini Tour' : 'Full Pub Crawl'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                        <p className="text-yellow-800 font-medium">⚠️ Single Location Event</p>
                                        <p className="text-yellow-700 text-sm">Consider adding more stops to create a proper pub crawl experience!</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">
                                Routes allow you to create multi-location events with automatic navigation and notifications.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant={route ? "outline" : "default"}
                            onClick={() => setShowRouteBuilder(!showRouteBuilder)}
                            className="ml-4"
                        >
                            {route ? 'Edit Route' : 'Create Route'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Route Builder */}
            {showRouteBuilder && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center space-x-2">
                                <MapPin className="h-5 w-5" />
                                <span>Route Locations</span>
                            </span>
                            <div className="flex space-x-2">
                                {bars.length > 0 && (
                                    <select
                                        onChange={(e) => {
                                            const selectedBarId = e.target.value;
                                            if (selectedBarId) {
                                                const selectedBar = bars.find(b => b.id === selectedBarId);
                                                if (selectedBar) {
                                                    addLocationFromBar(selectedBar);
                                                }
                                                e.target.value = ''; // Reset selection
                                            }
                                        }}
                                        className="px-3 py-1 border rounded-md text-sm"
                                        defaultValue=""
                                    >
                                        <option value="">Add from Bar</option>
                                        {bars.map((bar) => (
                                            <option key={bar.id} value={bar.id}>
                                                {bar.name} - {bar.city}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <Button
                                    type="button"
                                    onClick={addCustomLocation}
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center space-x-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Add Custom</span>
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {route?.locations.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No locations added yet.</p>
                                <p className="text-sm font-medium">Ready to create an amazing pub crawl experience!</p>
                                <p className="text-sm text-gray-600 mt-2">Your starting location is already set. Now add 2-4 additional bars to create the perfect tour route. Each stop should be within walking distance of the next.</p>
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-sm text-yellow-800"><strong>Pro Tip:</strong> Plan for 60-90 minutes per location to give participants enough time to enjoy drinks and socialize before moving to the next stop.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {route?.locations.map((location, index) => (
                                    <div key={location.id} className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-medium flex items-center space-x-2">
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                                        {index + 1}
                                                    </span>
                                                    <span>Location {index + 1}</span>
                                                </h4>
                                                {location.barName && (
                                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                                        {location.barName}
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeLocation(location.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Location Name */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Location Name *
                                                </label>
                                                <Input
                                                    value={location.name}
                                                    onChange={(e) => updateLocation(location.id, { name: e.target.value })}
                                                    placeholder="e.g., Bar XYZ"
                                                    className="bg-white"
                                                />
                                            </div>

                                            {/* Address */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Address *
                                                </label>
                                                <Input
                                                    value={location.address}
                                                    onChange={(e) => updateLocation(location.id, { address: e.target.value })}
                                                    placeholder="e.g., 123 Main St, City"
                                                    className="bg-white"
                                                />
                                            </div>

                                            {/* Stay Duration */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Stay Duration (minutes) *
                                                </label>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                                    <Input
                                                        type="number"
                                                        value={location.stayDuration}
                                                        onChange={(e) => updateLocation(location.id, { stayDuration: parseInt(e.target.value) || 0 })}
                                                        placeholder="30"
                                                        className="pl-10 bg-white"
                                                    />
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Description
                                                </label>
                                                <Textarea
                                                    value={location.description || ''}
                                                    onChange={(e) => updateLocation(location.id, { description: e.target.value })}
                                                    placeholder="Optional description..."
                                                    rows={2}
                                                    className="bg-white"
                                                />
                                            </div>
                                        </div>

                                        {/* Google Maps Importer */}
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Coordinates
                                            </label>
                                            <GoogleMapsImporter
                                                onCoordinatesFound={(latitude, longitude) => {
                                                    updateLocationCoordinates(location.id, latitude, longitude);
                                                }}
                                            />
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    value={location.coordinates.latitude}
                                                    onChange={(e) => updateLocationCoordinates(
                                                        location.id,
                                                        parseFloat(e.target.value) || 0,
                                                        location.coordinates.longitude
                                                    )}
                                                    placeholder="Latitude"
                                                    className="bg-white"
                                                />
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    value={location.coordinates.longitude}
                                                    onChange={(e) => updateLocationCoordinates(
                                                        location.id,
                                                        location.coordinates.latitude,
                                                        parseFloat(e.target.value) || 0
                                                    )}
                                                    placeholder="Longitude"
                                                    className="bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Map Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>Map Settings</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Map Confirmation Message
                        </label>
                        <Input
                            value={notificationSettings?.customMapConfirmMessage || ''}
                            onChange={(e) => updateNotificationSettings({
                                customMapConfirmMessage: e.target.value
                            })}
                            placeholder="This will open the location in your default maps application"
                            className="bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">Message shown when user clicks "Open Map" button</p>
                    </div>
                </CardContent>
            </Card>

            {/* Recurring Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Repeat className="h-5 w-5" />
                        <span>Recurring Notifications</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">
                                Daily notifications sent to participants at specific times
                            </p>
                            {recurringNotifications.length > 0 && (
                                <p className="text-xs text-green-600 font-medium">
                                    {recurringNotifications.filter(n => n.isActive).length} active notification(s)
                                </p>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowRecurringNotifications(!showRecurringNotifications)}
                        >
                            {showRecurringNotifications ? 'Hide' : 'Configure'}
                        </Button>
                    </div>

                    {showRecurringNotifications && (
                        <div className="mt-4 space-y-4">
                            {/* Existing Recurring Notifications */}
                            {recurringNotifications.length > 0 && (
                                <div className="space-y-3">
                                    {recurringNotifications.map((notification) => (
                                        <div 
                                            key={notification.id} 
                                            className={`border rounded-lg p-4 ${notification.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex flex-col">
                                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-mono font-bold">
                                                            {utcToLocal(notification.time, timezone)}
                                                        </span>
                                                        <span className="text-xs text-gray-500 mt-1 text-center">
                                                            ({notification.time} UTC)
                                                        </span>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs ${notification.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                                        {notification.isActive ? 'Active' : 'Paused'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setEditingNotificationId(
                                                                editingNotificationId === notification.id ? null : notification.id
                                                            )
                                                        }
                                                        className="text-gray-600 hover:text-gray-800"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleRecurringNotification(notification.id)}
                                                        className={notification.isActive ? "text-amber-600 hover:text-amber-700" : "text-green-600 hover:text-green-700"}
                                                    >
                                                        {notification.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeRecurringNotification(notification.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {/* Read-only view */}
                                            <div className="mt-2 text-sm">
                                                <p className="font-medium text-gray-900">{notification.title}</p>
                                                <p className="text-gray-600">{notification.body}</p>
                                                {notification.mapUrl && (
                                                    <p className="text-xs text-blue-600 mt-1 truncate">
                                                        📍 {notification.mapUrl}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Edit mode */}
                                            {editingNotificationId === notification.id && (
                                                <div className="mt-4 space-y-2 text-sm border-t border-gray-200 pt-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Time ({timezone.split('/').pop()})
                                                            </label>
                                                            <Input
                                                                type="time"
                                                                value={utcToLocal(notification.time, timezone)}
                                                                onChange={(e) =>
                                                                    updateRecurringNotification(notification.id, {
                                                                        time: localToUtc(e.target.value, timezone),
                                                                    })
                                                                }
                                                                className="bg-white"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-3">
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Title
                                                            </label>
                                                            <Input
                                                                value={notification.title}
                                                                onChange={(e) =>
                                                                    updateRecurringNotification(notification.id, {
                                                                        title: e.target.value,
                                                                    })
                                                                }
                                                                className="bg-white"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                            Message
                                                        </label>
                                                        <Input
                                                            value={notification.body}
                                                            onChange={(e) =>
                                                                updateRecurringNotification(notification.id, {
                                                                    body: e.target.value,
                                                                })
                                                            }
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                            Map URL (optional)
                                                        </label>
                                                        <Input
                                                            value={notification.mapUrl || ''}
                                                            onChange={(e) =>
                                                                updateRecurringNotification(notification.id, {
                                                                    mapUrl: e.target.value || undefined,
                                                                })
                                                            }
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Recurring Notification */}
                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Recurring Notification
                                </h4>
                                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Time ({timezone.split('/').pop()})
                                            </label>
                                            <Input
                                                type="time"
                                                value={newRecurring.time}
                                                onChange={(e) => setNewRecurring({ ...newRecurring, time: e.target.value })}
                                                className="bg-white"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                = {localToUtc(newRecurring.time, timezone)} UTC
                                            </p>
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Title
                                            </label>
                                            <Input
                                                value={newRecurring.title}
                                                onChange={(e) => setNewRecurring({ ...newRecurring, title: e.target.value })}
                                                placeholder="e.g., Time to move!"
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Message
                                        </label>
                                        <Input
                                            value={newRecurring.body}
                                            onChange={(e) => setNewRecurring({ ...newRecurring, body: e.target.value })}
                                            placeholder="e.g., Drink up! We're moving to the next bar in 15 minutes"
                                            className="bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Map URL (optional)
                                        </label>
                                        <Input
                                            value={newRecurring.mapUrl}
                                            onChange={(e) => setNewRecurring({ ...newRecurring, mapUrl: e.target.value })}
                                            placeholder="https://maps.apple.com/..."
                                            className="bg-white"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={addRecurringNotification}
                                        disabled={!newRecurring.title.trim() || !newRecurring.body.trim()}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Notification
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 These notifications will be sent daily at the specified time to all participants with tickets for that day.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
