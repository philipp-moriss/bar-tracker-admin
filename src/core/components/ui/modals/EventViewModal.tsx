import React from 'react';
import { Calendar, MapPin, DollarSign, Globe, FileText } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { InfoCard, InfoItem } from './InfoCard';
import { Badge } from '@/core/components/ui/badge';
import { Event, EventStatus } from '@/core/types/event';

interface EventViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onEdit?: (eventId: string) => void;
}

export const EventViewModal: React.FC<EventViewModalProps> = ({
  open,
  onOpenChange,
  event,
  onEdit
}) => {
  if (!event) return null;

  const getStatusBadge = (status: EventStatus) => {
    const statusConfig = {
      [EventStatus.ACTIVE]: { label: 'Active', variant: 'default' as const },
      [EventStatus.COMPLETED]: { label: 'Completed', variant: 'secondary' as const },
      [EventStatus.CANCELLED]: { label: 'Cancelled', variant: 'destructive' as const },
      [EventStatus.DRAFT]: { label: 'Draft', variant: 'outline' as const },
      [EventStatus.PERMANENT]: { label: 'Permanent', variant: 'default' as const },
    };

    const config = statusConfig[status];
    if (!config) {
      return <Badge variant="outline">Unknown</Badge>;
    }
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | unknown) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : (date as any).toDate();
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const formatPrice = (price: string, currency: string = 'gbp') => {
    const currencySymbols: { [key: string]: string } = {
      'gbp': '£',
      'usd': '$',
      'eur': '€',
      'pln': 'zł',
      'czk': 'Kč',
      'huf': 'Ft',
      'sek': 'kr',
      'nok': 'kr',
      'dkk': 'kr',
      'chf': 'CHF'
    };
    const symbol = currencySymbols[currency] || '£';
    return `${symbol}${parseFloat(price || '0').toFixed(2)}`;
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={event.name}
      size="4xl"
      className="max-h-[80vh] overflow-y-auto"
      showConfirmButton={!!onEdit}
      confirmText="Edit Event"
      confirmClassName="bg-barTrekker-orange hover:bg-barTrekker-orange/90"
      onConfirm={() => {
        if (onEdit) {
          onEdit(event.id!);
          onOpenChange(false);
        }
      }}
    >
      <div className="space-y-8">
        {/* Header with Image and Basic Info */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Event Image */}
          <div className="lg:w-1/2">
            {event.imageURL ? (
              <div className="w-full h-64 lg:h-80 rounded-xl overflow-hidden shadow-lg">
                <img
                  src={event.imageURL}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-64 lg:h-80 rounded-xl bg-gradient-to-br from-barTrekker-orange/20 to-barTrekker-orange/40 flex items-center justify-center">
                <Calendar className="h-16 w-16 text-barTrekker-orange/60" />
              </div>
            )}
          </div>

          {/* Basic Info Card */}
          <div className="lg:w-1/2">
            <InfoCard
              title="Event Details"
              icon={Calendar}
              headerActions={getStatusBadge(event.status || EventStatus.DRAFT)}
            >
              <div className="space-y-4">
                <InfoItem
                  icon={Calendar}
                  label="Date & Time"
                  value={formatDate(event.startTime)}
                />
                <InfoItem
                  icon={MapPin}
                  label="Location"
                  value={event.startLocationName}
                />
                <InfoItem
                  icon={DollarSign}
                  label="Price"
                  value={<span className="text-lg font-semibold text-gray-900">{formatPrice(event.price, event.currency)}</span>}
                />
                {event.route?.totalDuration && (
                  <InfoItem
                    icon={Calendar}
                    label="Duration"
                    value={`${event.route.totalDuration} minutes`}
                  />
                )}
                {event.timezone && (
                  <InfoItem
                    icon={Globe}
                    label="Timezone"
                    value={event.timezone}
                  />
                )}
                <InfoItem
                  icon={Globe}
                  label="Country"
                  value={event.country}
                />
                {event.rating && (
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-barTrekker-orange/10 rounded-lg">
                      <div className="h-5 w-5 text-barTrekker-orange">★</div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Rating</p>
                      <p className="text-sm text-gray-600">{event.rating}/5</p>
                    </div>
                  </div>
                )}
              </div>
            </InfoCard>
          </div>
        </div>

        {/* Description Section */}
        <InfoCard
          title="Description"
          icon={FileText}
        >
          <p className="text-gray-700 leading-relaxed">{event.description}</p>
        </InfoCard>

        {/* What's Included Section */}
        {event.includedDescription && (
          <InfoCard title="What's Included">
            <p className="text-gray-700 leading-relaxed">{event.includedDescription}</p>
          </InfoCard>
        )}

        {/* Bar Information Section */}
        <InfoCard title="Bar Information">
          {event.route?.locations && event.route.locations.length > 0 ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 mb-4">
                This event includes {event.route.locations.length} bar{event.route.locations.length > 1 ? 's' : ''} in the route:
              </p>
              {event.route.locations.map((location, index) => (
                <div key={location.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      Stop {location.order || index + 1}: {location.name || location.barName || `Bar ${index + 1}`}
                    </h4>
                    <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                      {location.stayDuration} min
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Address:</span>
                      <p className="text-gray-600">{location.address || location.barAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Coordinates:</span>
                      <p className="text-gray-600 font-mono text-xs">
                        {location.coordinates.latitude.toFixed(6)}, {location.coordinates.longitude.toFixed(6)}
                      </p>
                    </div>
                    {location.barPhone && (
                      <div>
                        <span className="font-medium text-gray-700">Phone:</span>
                        <p className="text-gray-600">{location.barPhone}</p>
                      </div>
                    )}
                    {location.barEmail && (
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <p className="text-gray-600">{location.barEmail}</p>
                      </div>
                    )}
                  </div>
                  {location.description && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-600 text-sm mt-1">{location.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <InfoItem
                icon={MapPin}
                label="Bar Name"
                value={event.barName || 'N/A'}
              />
              <InfoItem
                icon={MapPin}
                label="Bar Address"
                value={event.barAddress || 'N/A'}
              />
              <InfoItem
                icon={MapPin}
                label="Bar City"
                value={event.barCity || 'N/A'}
              />
              <InfoItem
                icon={Globe}
                label="Bar Country"
                value={event.barCountry || 'N/A'}
              />
              {event.barPhone && (
                <InfoItem
                  icon={MapPin}
                  label="Bar Phone"
                  value={event.barPhone}
                />
              )}
              {event.barEmail && (
                <InfoItem
                  icon={MapPin}
                  label="Bar Email"
                  value={event.barEmail}
                />
              )}
              {event.barWebsite && (
                <InfoItem
                  icon={Globe}
                  label="Bar Website"
                  value={<a href={event.barWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{event.barWebsite}</a>}
                />
              )}
            </div>
          )}
        </InfoCard>

        {/* Technical Details */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Start Coordinates</p>
              <p className="text-sm text-gray-700 font-mono">
                Lat: {event.startLocation.latitude}, Lng: {event.startLocation.longitude}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Event ID</p>
              <p className="text-sm text-gray-700 font-mono">{event.id}</p>
            </div>
            {event.route?.totalDuration && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Route Duration</p>
                <p className="text-sm text-gray-700">{event.route.totalDuration} minutes</p>
              </div>
            )}
            {event.route?.locations && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Route Status</p>
                <p className="text-sm text-gray-700">
                  {event.route.isActive ? 'Active' : 'Inactive'} • {event.route.locations.length} stops
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
