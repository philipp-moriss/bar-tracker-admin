import React from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/core/lib/utils';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  address?: string;
  className?: string;
  height?: number;
}

/**
 * Component for map preview with coordinates
 * Uses Google Maps Embed API to display a static map
 */
export const MapPreview: React.FC<MapPreviewProps> = ({
  latitude,
  longitude,
  address,
  className,
  height = 300,
}) => {
  // Check if coordinates are valid
  const isValid = 
    Number.isFinite(latitude) && 
    Number.isFinite(longitude) &&
    latitude !== 0 && 
    longitude !== 0 &&
    latitude >= -90 && 
    latitude <= 90 &&
    longitude >= -180 && 
    longitude <= 180;

  if (!isValid) {
    return (
      <div className={cn('border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center', className)} style={{ height: `${height}px` }}>
        <div className="text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Enter coordinates to view on map</p>
        </div>
      </div>
    );
  }

  // Use regular Google Maps link for iframe (doesn't require API key)
  const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: `${height}px` }}>
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
          title="Map preview"
        />
      </div>
      {address && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>{address}</span>
        </div>
      )}
      <div className="text-xs text-gray-400">
        Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>
    </div>
  );
};

