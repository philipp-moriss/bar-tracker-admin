import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, DollarSign, Globe, Image, MapPin as MapPinIcon } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { FormSection, FormField, FormGrid } from './FormSection';
import { Input } from '@/core/components/ui/inputs/input';
import { Textarea } from '@/core/components/ui/inputs/textarea';
import { Select } from '@/core/components/ui/inputs/select';
import { Event, EventStatus, UpdateEventData } from '@/core/types/event';
import { eventService } from '@/core/services/eventService';

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
  const [formData, setFormData] = useState<UpdateEventData & { status: EventStatus }>({
    id: '',
    name: '',
    price: '',
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
    status: EventStatus.DRAFT
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setFormData({
        id: event.id || '',
        name: event.name,
        price: event.price,
        description: event.description,
        imageURL: event.imageURL,
        startTime: event.startTime instanceof Date ? event.startTime : event.startTime.toDate(),
        country: event.country,
        includedDescription: event.includedDescription,
        startLocationName: event.startLocationName,
        startLocation: event.startLocation,
        status: event.status || EventStatus.DRAFT
      });
    }
  }, [event]);

  const handleInputChange = (field: keyof (UpdateEventData & { status: EventStatus }), value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const handleSave = async () => {
    if (!formData.id) return;

    try {
      setLoading(true);
      setError(null);

      await eventService.updateEvent(formData);
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

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Event"
      size="4xl"
      className="max-h-[80vh] overflow-y-auto"
      showConfirmButton
      confirmText="Save Changes"
      confirmClassName="bg-barTrekker-orange hover:bg-barTrekker-orange/90"
      onConfirm={handleSave}
      loading={loading}
    >
      <div className="space-y-8">
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

            <FormField label="Price" required>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value as EventStatus)}
              >
                <option value={EventStatus.DRAFT}>Draft</option>
                <option value={EventStatus.ACTIVE}>Active</option>
                <option value={EventStatus.COMPLETED}>Completed</option>
                <option value={EventStatus.CANCELLED}>Cancelled</option>
              </Select>
            </FormField>
          </FormGrid>
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
      </div>
    </BaseModal>
  );
};
