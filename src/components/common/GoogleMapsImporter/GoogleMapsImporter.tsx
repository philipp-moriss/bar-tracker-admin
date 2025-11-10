import React, { useState } from 'react'
import { Button } from '@/core/components/ui/button'
import { Input } from '@/core/components/ui/inputs/input'
import { MapPin, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/core/lib/utils'

interface GoogleMapsImporterProps {
    onCoordinatesFound: (latitude: number, longitude: number) => void
    className?: string
}

export const GoogleMapsImporter: React.FC<GoogleMapsImporterProps> = ({
    onCoordinatesFound,
    className
}) => {
    const [url, setUrl] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const parseGoogleMapsUrl = (url: string): { latitude: number; longitude: number } | null => {
        try {
            // Remove any whitespace
            const cleanUrl = url.trim()

            // Check if it's a Google Maps URL
            if (!cleanUrl.includes('google.com/maps') && !cleanUrl.includes('maps.google.com')) {
                throw new Error('Not a Google Maps URL')
            }

            // Pattern 1: @lat,lng,zoom (new format)
            const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+\.?\d*)z/
            const atMatch = cleanUrl.match(atPattern)
            if (atMatch) {
                return {
                    latitude: parseFloat(atMatch[1]),
                    longitude: parseFloat(atMatch[2])
                }
            }

            // Pattern 2: !3d and !4d (new format)
            const d3Pattern = /!3d(-?\d+\.?\d*)/
            const d4Pattern = /!4d(-?\d+\.?\d*)/
            const d3Match = cleanUrl.match(d3Pattern)
            const d4Match = cleanUrl.match(d4Pattern)

            if (d3Match && d4Match) {
                return {
                    latitude: parseFloat(d3Match[1]),
                    longitude: parseFloat(d4Match[1])
                }
            }

            // Pattern 3: ll=lat,lng (old format)
            const llPattern = /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/
            const llMatch = cleanUrl.match(llPattern)
            if (llMatch) {
                return {
                    latitude: parseFloat(llMatch[1]),
                    longitude: parseFloat(llMatch[2])
                }
            }

            // Pattern 4: q=lat,lng (old format)
            const qPattern = /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
            const qMatch = cleanUrl.match(qPattern)
            if (qMatch) {
                return {
                    latitude: parseFloat(qMatch[1]),
                    longitude: parseFloat(qMatch[2])
                }
            }

            throw new Error('Could not extract coordinates from URL')
        } catch (error) {
            throw new Error('Invalid Google Maps URL format')
        }
    }

    const handleImport = async () => {
        if (!url.trim()) {
            setError('Please enter a Google Maps URL')
            return
        }

        setIsLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const coordinates = parseGoogleMapsUrl(url)

            if (coordinates) {
                onCoordinatesFound(coordinates.latitude, coordinates.longitude)
                setSuccess(true)
                setUrl('') // Clear the URL after successful import
            } else {
                setError('Could not extract coordinates from URL')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse URL')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClear = () => {
        setUrl('')
        setError(null)
        setSuccess(false)
    }

    const exampleUrls = [
        'https://maps.google.com/maps?q=40.7128,-74.0060'
    ]

    return (
        <div className={cn('space-y-4', className)}>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                    Paste Google Maps link
                </label>
                <p className="text-xs text-gray-500">
                    Paste a Google Maps link to fill coordinates automatically.
                </p>
            </div>

            <div className="space-y-3">
                <div className="flex space-x-2">
                    <div className="flex-1">
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://maps.google.com/maps?q=40.7128,-74.0060"
                            className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                        />
                    </div>
                    <Button
                        type="button"
                        onClick={handleImport}
                        disabled={isLoading || !url.trim()}
                        className="bg-barTrekker-orange hover:bg-barTrekker-orange/90"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <MapPin className="h-4 w-4" />
                        )}
                    </Button>
                    {url && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClear}
                            className="border-gray-300"
                        >
                            Clear
                        </Button>
                    )}
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center space-x-2 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Coordinates imported successfully!</span>
                    </div>
                )}

                {/* Example URLs */}
                <div className="space-y-1 text-xs text-gray-500">
                    <p className="font-medium">Example:</p>
                    <button
                        onClick={() => setUrl(exampleUrls[0])}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                    >
                        https://maps.google.com/maps?q=40.7128,-74.0060
                    </button>
                    <p>Plain Google Maps links (maps.google.com) work.</p>
                </div>
            </div>
        </div>
    )
}
