import React from 'react';
import { MapPin, Check } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent } from '@/core/components/ui/card';
import { GeocodingResultOption } from '@/core/services/geocodingService';
import { MapPreview } from '@/components/common/MapPreview/MapPreview';

interface GeocodingResultsSelectorProps {
  results: GeocodingResultOption[];
  onSelect: (result: GeocodingResultOption) => void;
  onCancel?: () => void;
}

export const GeocodingResultsSelector: React.FC<GeocodingResultsSelectorProps> = ({
  results,
  onSelect,
  onCancel,
}) => {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    onSelect(results[index]);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Found {results.length} {results.length === 1 ? 'result' : 'results'}. Select the correct one:
      </div>

      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {results.map((result, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all ${
              selectedIndex === index
                ? 'border-barTrekker-orange border-2 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleSelect(index)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  {result.name && (
                    <div className="font-semibold text-barTrekker-darkGrey mb-1">
                      {result.name}
                    </div>
                  )}
                  <div className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                    <MapPin className="h-3 w-3" />
                    <span>{result.formattedAddress}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                    {result.source === 'places' && (
                      <span className="ml-2 text-barTrekker-orange">• Places API</span>
                    )}
                  </div>
                </div>
                {selectedIndex === index && (
                  <div className="text-barTrekker-orange">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </div>
              
              {/* Map preview */}
              <div className="mt-3">
                <MapPreview
                  latitude={result.latitude}
                  longitude={result.longitude}
                  height={120}
                  className="rounded"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {onCancel && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

