import React, { useState } from 'react';
import { Plus, Trash2, MapPin, Clock, Settings, Navigation } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/inputs/input';
import { Textarea } from '@/core/components/ui/inputs/textarea';
import { GoogleMapsImporter } from '@/components/common/GoogleMapsImporter/GoogleMapsImporter';
import { EventLocation, EventRoute, EventNotificationSettings } from '@/core/types/event';
import { Bar } from '@/core/types/bar';

interface EventRouteManagerProps {
    route?: EventRoute;
    notificationSettings?: EventNotificationSettings;
    onRouteChange: (route: EventRoute | undefined) => void;
    onNotificationSettingsChange: (settings: EventNotificationSettings | undefined) => void;
    bars?: Bar[];
    startBar?: Bar;
}

export const EventRouteManager: React.FC<EventRouteManagerProps> = ({
    route,
    notificationSettings,
    onRouteChange,
    onNotificationSettingsChange,
    bars = [],
    startBar,
}) => {
    const [showRouteBuilder, setShowRouteBuilder] = useState(false);
    const [showNotificationSettings, setShowNotificationSettings] = useState(false);

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

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>Notification Settings</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">
                                Configure automatic notifications for event participants
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                        >
                            {showNotificationSettings ? 'Hide Settings' : 'Configure'}
                        </Button>
                    </div>

                    {showNotificationSettings && (
                        <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Reminder (minutes before)
                                    </label>
                                    <Input
                                        type="number"
                                        value={notificationSettings?.startReminder || 15}
                                        onChange={(e) => updateNotificationSettings({
                                            startReminder: parseInt(e.target.value) || 15
                                        })}
                                        placeholder="15"
                                        className="bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location Reminder (minutes before)
                                    </label>
                                    <Input
                                        type="number"
                                        value={notificationSettings?.locationReminders || 5}
                                        onChange={(e) => updateNotificationSettings({
                                            locationReminders: parseInt(e.target.value) || 5
                                        })}
                                        placeholder="5"
                                        className="bg-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={notificationSettings?.arrivalNotifications ?? true}
                                        onChange={(e) => updateNotificationSettings({
                                            arrivalNotifications: e.target.checked
                                        })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700">Send arrival notifications</span>
                                </label>

                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={notificationSettings?.departureNotifications ?? true}
                                        onChange={(e) => updateNotificationSettings({
                                            departureNotifications: e.target.checked
                                        })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700">Send departure notifications</span>
                                </label>
                            </div>

                            {/* Custom Notification Messages */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-4">Custom Notification Messages</h4>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Reminder Notification Title
                                        </label>
                                        <Input
                                            value={notificationSettings?.customReminderTitle || ''}
                                            onChange={(e) => updateNotificationSettings({
                                                customReminderTitle: e.target.value
                                            })}
                                            placeholder="Event Starting Soon!"
                                            className="bg-white"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Leave empty to use default</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Reminder Notification Message
                                        </label>
                                        <Input
                                            value={notificationSettings?.customReminderBody || ''}
                                            onChange={(e) => updateNotificationSettings({
                                                customReminderBody: e.target.value
                                            })}
                                            placeholder="Event starts in {minutes} minutes"
                                            className="bg-white"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Use {"{minutes}"} as placeholder for minutes</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Leaving Notification Title
                                        </label>
                                        <Input
                                            value={notificationSettings?.customLeavingTitle || ''}
                                            onChange={(e) => updateNotificationSettings({
                                                customLeavingTitle: e.target.value
                                            })}
                                            placeholder="Moving to Next Location"
                                            className="bg-white"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Leave empty to use default</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Leaving Notification Message
                                        </label>
                                        <Input
                                            value={notificationSettings?.customLeavingBody || ''}
                                            onChange={(e) => updateNotificationSettings({
                                                customLeavingBody: e.target.value
                                            })}
                                            placeholder="Leaving for {nextLocation} in {minutes} minutes"
                                            className="bg-white"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Use {"{nextLocation}"} and {"{minutes}"} as placeholders</p>
                                    </div>

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
                                        <p className="text-xs text-gray-500 mt-1">Message shown when user clicks "Open Map"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
