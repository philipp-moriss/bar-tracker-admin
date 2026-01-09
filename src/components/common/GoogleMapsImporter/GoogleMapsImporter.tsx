import React, { useState } from 'react'
import { Button } from '@/core/components/ui/button'
import { Input } from '@/core/components/ui/inputs/input'
import { MapPin, CheckCircle, AlertCircle } from 'lucide-react'
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

    const expandShortUrl = async (shortUrl: string): Promise<string> => {
        try {
            if (!shortUrl.includes('maps.app.goo.gl') && !shortUrl.includes('goo.gl/maps')) {
                return shortUrl
            }

            // Use server function to expand short URLs
            // This bypasses CORS issues on the client
            const response = await fetch('https://us-central1-react-native-bartrekker.cloudfunctions.net/expandGoogleMapsUrl', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        url: shortUrl
                    }
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()
            
            if (result.data && result.data.expandedUrl) {
                const expandedUrl = result.data.expandedUrl
                
                // Verify that URL was actually expanded
                if (expandedUrl !== shortUrl && (expandedUrl.includes('google.com/maps') || expandedUrl.includes('maps.google.com'))) {
                    return expandedUrl
                }
            }

            // If server function didn't return expanded URL, return original
            // Parser will try to process it directly
            return shortUrl
        } catch (_error) {
            // If expansion failed, return original URL
            // Parser will try to process it directly
            return shortUrl
        }
    }

    const parseGoogleMapsUrl = (url: string): { latitude: number; longitude: number } | null => {
        try {
            const cleanUrl = url.trim()

            if (!cleanUrl.includes('google.com/maps') && 
                !cleanUrl.includes('maps.google.com') && 
                !cleanUrl.includes('maps.app.goo.gl')) {
                throw new Error('Not a Google Maps URL')
            }

            // PRIORITY 1: !3d and !4d (exact place coordinates)
            // These coordinates always point to a specific place and don't change when zooming
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

            // PRIORITY 2: /place/.../@lat,lng
            const placePattern = /\/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/
            const placeMatch = cleanUrl.match(placePattern)
            if (placeMatch) {
                return {
                    latitude: parseFloat(placeMatch[1]),
                    longitude: parseFloat(placeMatch[2])
                }
            }

            // PRIORITY 2.5: /search/lat,+lng or /search/lat,lng (new Google Maps format)
            // Match coordinates after /search/ - coordinates can be followed by ? or / or end of string
            const searchPattern = /\/search\/(-?\d+\.?\d*),\+?(-?\d+\.?\d*)/
            const searchMatch = cleanUrl.match(searchPattern)
            if (searchMatch) {
                return {
                    latitude: parseFloat(searchMatch[1]),
                    longitude: parseFloat(searchMatch[2])
                }
            }

            // PRIORITY 3: ll=lat,lng
            const llPattern = /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/
            const llMatch = cleanUrl.match(llPattern)
            if (llMatch) {
                return {
                    latitude: parseFloat(llMatch[1]),
                    longitude: parseFloat(llMatch[2])
                }
            }

            // PRIORITY 4: q=lat,lng
            const qPattern = /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
            const qMatch = cleanUrl.match(qPattern)
            if (qMatch) {
                return {
                    latitude: parseFloat(qMatch[1]),
                    longitude: parseFloat(qMatch[2])
                }
            }

            // PRIORITY 5: center=lat,lng
            const centerPattern = /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/
            const centerMatch = cleanUrl.match(centerPattern)
            if (centerMatch) {
                return {
                    latitude: parseFloat(centerMatch[1]),
                    longitude: parseFloat(centerMatch[2])
                }
            }

            // PRIORITY 6: /dir/.../@lat,lng
            const dirPattern = /\/dir\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/
            const dirMatch = cleanUrl.match(dirPattern)
            if (dirMatch) {
                return {
                    latitude: parseFloat(dirMatch[1]),
                    longitude: parseFloat(dirMatch[2])
                }
            }

            // PRIORITY 7 (LOW): @lat,lng,zoom - viewport/camera coordinates
            // WARNING: these coordinates change when zooming/panning the map!
            // Only used if no more accurate coordinates found above
            const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,(\d+\.?\d*)z)?/
            const atMatch = cleanUrl.match(atPattern)
            if (atMatch) {
                return {
                    latitude: parseFloat(atMatch[1]),
                    longitude: parseFloat(atMatch[2])
                }
            }

            // PRIORITY 8: Parse from query parameters
            try {
                const urlObj = new URL(cleanUrl)
                const params = urlObj.searchParams
                
                const dataParam = params.get('data')
                if (dataParam) {
                    const dataCoords = dataParam.match(/(-?\d+\.?\d*),(-?\d+\.?\d*)/)
                    if (dataCoords) {
                        return {
                            latitude: parseFloat(dataCoords[1]),
                            longitude: parseFloat(dataCoords[2])
                        }
                    }
                }

                // PRIORITY 9: Try to extract coordinates from pb parameter (new Google Maps format)
                const pbParam = params.get('pb')
                if (pbParam) {
                    // pb parameter may contain coordinates in format !1m2!1m1!1s...!2m2!1d...!2d...
                    const pbCoords = pbParam.match(/!2m2!1d(-?\d+\.?\d*)!2d(-?\d+\.?\d*)/)
                    if (pbCoords) {
                        return {
                            latitude: parseFloat(pbCoords[1]),
                            longitude: parseFloat(pbCoords[2])
                        }
                    }
                }
            } catch (_e) {
                // Ignore URL parsing errors
            }

            // PRIORITY 10: Try to find coordinates anywhere in URL (last attempt)
            // For cases when coordinates exist but in non-standard format
            const anyCoordsPattern = /(-?\d+\.\d+),(-?\d+\.\d+)/
            const anyMatch = cleanUrl.match(anyCoordsPattern)
            if (anyMatch) {
                const lat = parseFloat(anyMatch[1])
                const lng = parseFloat(anyMatch[2])
                // Verify that these are valid coordinates
                if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    return {
                        latitude: lat,
                        longitude: lng
                    }
                }
            }
            
            throw new Error('Could not extract coordinates from URL')
        } catch (error) {
            if (error instanceof Error && error.message !== 'Could not extract coordinates from URL') {
                throw error
            }
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
            const fullUrl = await expandShortUrl(url)
            const coordinates = parseGoogleMapsUrl(fullUrl)

            if (coordinates) {
                onCoordinatesFound(coordinates.latitude, coordinates.longitude)
                setSuccess(true)
                setUrl('')
            } else {
                setError('Could not extract coordinates from URL')
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to parse URL'
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleClear = () => {
        setUrl('')
        setError(null)
        setSuccess(false)
    }

    return (
        <div className={cn('space-y-4', className)}>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                    Paste Google Maps link
                </label>
                <p className="text-xs text-gray-500">
                    Paste any Google Maps link or Share Link to fill coordinates automatically.
                </p>
            </div>

            <div className="space-y-3">
                <div className="flex space-x-2">
                    <div className="flex-1">
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://maps.app.goo.gl/... or full URL"
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

                {/* Instructions */}
                <div className="space-y-2 text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="font-medium text-blue-900">How to get the right link:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-800">
                        <li>Find the bar in Google Maps</li>
                        <li>Click <span className="font-semibold">"Share"</span> button</li>
                        <li>Copy the Share Link (maps.app.goo.gl/...)</li>
                        <li>Paste it here</li>
                    </ol>
                    <p className="text-blue-700 mt-2">
                        ⚠️ Don't copy from address bar - it may have wrong coordinates!
                    </p>
                </div>
            </div>
        </div>
    )
}
