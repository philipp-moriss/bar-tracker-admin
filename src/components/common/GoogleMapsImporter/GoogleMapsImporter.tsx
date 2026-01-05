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

    const expandShortUrl = async (shortUrl: string): Promise<string> => {
        try {
            if (!shortUrl.includes('maps.app.goo.gl') && !shortUrl.includes('goo.gl/maps')) {
                return shortUrl
            }

            console.log('[GoogleMapsImporter] Expanding short URL:', shortUrl)

            const response = await fetch(shortUrl, {
                method: 'HEAD',
                redirect: 'follow'
            })

            const fullUrl = response.url
            console.log('[GoogleMapsImporter] Expanded URL:', fullUrl)
            
            return fullUrl
        } catch (error) {
            console.error('[GoogleMapsImporter] Error expanding short URL:', error)
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
                console.log('[GoogleMapsImporter] Found exact place coordinates (!3d/!4d):', {
                    latitude: parseFloat(d3Match[1]),
                    longitude: parseFloat(d4Match[1])
                })
                return {
                    latitude: parseFloat(d3Match[1]),
                    longitude: parseFloat(d4Match[1])
                }
            }

            // PRIORITY 2: /place/.../@lat,lng
            const placePattern = /\/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/
            const placeMatch = cleanUrl.match(placePattern)
            if (placeMatch) {
                console.log('[GoogleMapsImporter] Found place coordinates (/place/):', {
                    latitude: parseFloat(placeMatch[1]),
                    longitude: parseFloat(placeMatch[2])
                })
                return {
                    latitude: parseFloat(placeMatch[1]),
                    longitude: parseFloat(placeMatch[2])
                }
            }

            // PRIORITY 3: ll=lat,lng
            const llPattern = /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/
            const llMatch = cleanUrl.match(llPattern)
            if (llMatch) {
                console.log('[GoogleMapsImporter] Found coordinates (ll=):', {
                    latitude: parseFloat(llMatch[1]),
                    longitude: parseFloat(llMatch[2])
                })
                return {
                    latitude: parseFloat(llMatch[1]),
                    longitude: parseFloat(llMatch[2])
                }
            }

            // PRIORITY 4: q=lat,lng
            const qPattern = /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
            const qMatch = cleanUrl.match(qPattern)
            if (qMatch) {
                console.log('[GoogleMapsImporter] Found coordinates (q=):', {
                    latitude: parseFloat(qMatch[1]),
                    longitude: parseFloat(qMatch[2])
                })
                return {
                    latitude: parseFloat(qMatch[1]),
                    longitude: parseFloat(qMatch[2])
                }
            }

            // PRIORITY 5: center=lat,lng
            const centerPattern = /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/
            const centerMatch = cleanUrl.match(centerPattern)
            if (centerMatch) {
                console.log('[GoogleMapsImporter] Found coordinates (center=):', {
                    latitude: parseFloat(centerMatch[1]),
                    longitude: parseFloat(centerMatch[2])
                })
                return {
                    latitude: parseFloat(centerMatch[1]),
                    longitude: parseFloat(centerMatch[2])
                }
            }

            // PRIORITY 6: /dir/.../@lat,lng
            const dirPattern = /\/dir\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/
            const dirMatch = cleanUrl.match(dirPattern)
            if (dirMatch) {
                console.log('[GoogleMapsImporter] Found route coordinates (/dir/):', {
                    latitude: parseFloat(dirMatch[1]),
                    longitude: parseFloat(dirMatch[2])
                })
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
                console.warn('[GoogleMapsImporter] Found only viewport coordinates (@lat,lng) - may be inaccurate!', {
                    latitude: parseFloat(atMatch[1]),
                    longitude: parseFloat(atMatch[2])
                })
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
                        console.log('[GoogleMapsImporter] Found coordinates in data parameter:', {
                            latitude: parseFloat(dataCoords[1]),
                            longitude: parseFloat(dataCoords[2])
                        })
                        return {
                            latitude: parseFloat(dataCoords[1]),
                            longitude: parseFloat(dataCoords[2])
                        }
                    }
                }
            } catch (e) {
                // Ignore URL parsing errors
            }

            console.warn('[GoogleMapsImporter] Failed to parse URL:', cleanUrl)
            
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
        'https://maps.google.com/maps?q=40.7128,-74.0060',
        'https://maps.app.goo.gl/example'
    ]

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
