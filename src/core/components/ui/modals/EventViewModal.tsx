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
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | unknown) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : (date as any).toDate();
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const formatPrice = (price: string) => {
    return `£${parseFloat(price || '0').toFixed(2)}`;
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
                  value={<span className="text-lg font-semibold text-gray-900">{formatPrice(event.price)}</span>}
                />
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

        {/* Technical Details */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Coordinates</p>
              <p className="text-sm text-gray-700 font-mono">
                Lat: {event.startLocation.latitude}, Lng: {event.startLocation.longitude}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Event ID</p>
              <p className="text-sm text-gray-700 font-mono">{event.id}</p>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
