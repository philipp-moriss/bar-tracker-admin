import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import { AdminLayout } from '@/core/components/layout/AdminLayout';
import { ImageUpload } from '@/components/common/ImageUpload/ImageUpload';
import { ImageUploadResult } from '@/core/services/imageService';
import { GoogleMapsImporter } from '@/components/common/GoogleMapsImporter/GoogleMapsImporter';
import { geocodingService } from '@/core/services/geocodingService';
import { MapPreview } from '@/components/common/MapPreview/MapPreview';
import { GeocodingResultsSelector } from '@/components/common/GeocodingResultsSelector/GeocodingResultsSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';

import { Button } from '@/core/components/ui/button';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/core/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/inputs/input';
import { barService } from '@/core/services/barService';
import { CreateBarData } from '@/core/types/bar';
import { toast } from 'sonner';

const createBarSchema = z.object({
    name: z.string().min(1, "Bar name is required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    phone: z.string().optional(),
    email: z.string().email("Must be a valid email").optional().or(z.literal("")),
    website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    description: z.string().optional(),
    isActive: z.boolean(),
    latitude: z.coerce.number().refine((val) => Number.isFinite(val) && val >= -90 && val <= 90, "Must be a valid latitude (-90..90)"),
    longitude: z.coerce.number().refine((val) => Number.isFinite(val) && val >= -180 && val <= 180, "Must be a valid longitude (-180..180)"),
});

type CreateBarFormData = z.infer<typeof createBarSchema>;

export const CreateBarPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<ImageUploadResult[]>([]);
    const [geocodingLoading, setGeocodingLoading] = useState(false);
    const [showGeocodingResults, setShowGeocodingResults] = useState(false);
    const [geocodingResults, setGeocodingResults] = useState<any[]>([]);

    const form = useForm<CreateBarFormData>({
        resolver: zodResolver(createBarSchema),
        defaultValues: {
            name: '',
            address: '',
            city: '',
            country: '',
            phone: '',
            email: '',
            website: '',
            description: '',
            isActive: true,
            latitude: 0,
            longitude: 0,
        },
    });

    const onSubmit = async (data: CreateBarFormData) => {
        try {
            setLoading(true);

            // Clean up empty strings
            const round = (v: number) => Math.round(v * 1e6) / 1e6
            let latitude = round(data.latitude)
            let longitude = round(data.longitude)

            // Auto-geocoding if coordinates are empty or zero
            if ((latitude === 0 && longitude === 0) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                if (data.address && data.city && data.country) {
                    try {
                        toast.info('Coordinates not specified, attempting to get them from address...')
                        const result = await geocodingService.geocodeAddress(data.address, data.city, data.country, data.name)
                        // If multiple results - use the first one
                        latitude = round(result.latitude)
                        longitude = round(result.longitude)
                        toast.success('Coordinates obtained automatically')
                    } catch (error) {
                        console.error('Auto-geocoding failed:', error)
                        toast.error('Failed to automatically get coordinates. Please enter them manually or use the "Get coordinates by address" button')
                        setLoading(false)
                        return
                    }
                } else {
                    toast.error('Please enter coordinates or fill in address, city and country for automatic coordinate retrieval')
                    setLoading(false)
                    return
                }
            }

            const cleanData: CreateBarData = {
                name: data.name,
                address: data.address,
                city: data.city,
                country: data.country,
                phone: data.phone || undefined,
                email: data.email || undefined,
                website: data.website || undefined,
                description: data.description || undefined,
                isActive: data.isActive,
                // Images
                images: uploadedImages.map(img => img.url),
                coordinates: { latitude, longitude },
            };

            await barService.createBar(cleanData);

            toast.success('Bar created successfully!');
            navigate('/admin/bars');
        } catch (error) {
            console.error('Error creating bar:', error);
            toast.error('Failed to create bar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Create New Bar" subtitle="Add a new bar to the system">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/bars')}
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Bars
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Bar Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                                                    Bar Name *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter bar name"
                                                        className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                                                    City *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter city"
                                                        className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                                                Address *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Enter full address"
                                                    className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                                                    Country *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter country"
                                                        className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                                                    Phone
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter phone number"
                                                        className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                                                    Email
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter email address"
                                                        className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="website"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                                                    Website
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter website URL"
                                                        className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Image Upload */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-barTrekker-darkGrey">Bar Images</h3>
                                    <ImageUpload
                                        onImagesChange={setUploadedImages}
                                        maxImages={3}
                                        folder="bars"
                                        disabled={loading}
                                    />
                                </div>

                                

                                {/* Google Maps Importer */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-barTrekker-darkGrey">Location Coordinates</h3>
                                    
                                    {/* Geocoding by address */}
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600 mb-2">
                                                Get coordinates automatically by address
                                            </p>
                                            <Button
                                                type="button"
                                                onClick={async () => {
                                                    const address = form.watch('address')
                                                    const city = form.watch('city')
                                                    const country = form.watch('country')
                                                    const name = form.watch('name')
                                                    
                                                    if (!address || !city || !country) {
                                                        toast.error('Please fill in address, city and country before geocoding')
                                                        return
                                                    }
                                                    
                                                    setGeocodingLoading(true)
                                                    try {
                                                        const result = await geocodingService.geocodeAddress(address, city, country, name)
                                                        const round = (v: number) => Math.round(v * 1e6) / 1e6
                                                        
                                                        // If multiple results - show selection
                                                        if (result.multipleResults && result.results && result.results.length > 1) {
                                                            setGeocodingResults(result.results)
                                                            setShowGeocodingResults(true)
                                                        } else {
                                                            // Single result - apply immediately
                                                            form.setValue('latitude', round(result.latitude))
                                                            form.setValue('longitude', round(result.longitude))
                                                            toast.success(`Coordinates obtained: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`)
                                                        }
                                                    } catch (error) {
                                                        console.error('Geocoding error:', error)
                                                        toast.error(error instanceof Error ? error.message : 'Failed to get coordinates by address')
                                                    } finally {
                                                        setGeocodingLoading(false)
                                                    }
                                                }}
                                                disabled={geocodingLoading || loading}
                                                variant="outline"
                                                className="w-full"
                                            >
                                                {geocodingLoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                                        Getting coordinates...
                                                    </>
                                                ) : (
                                                    <>
                                                        <MapPin className="h-4 w-4 mr-2" />
                                                        Get coordinates by address
                                                    </>
                                                )}
                                            </Button>
                                            
                                            {/* Dialog for selecting from multiple results */}
                                            <Dialog open={showGeocodingResults} onOpenChange={setShowGeocodingResults}>
                                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Select the correct address</DialogTitle>
                                                    </DialogHeader>
                                                    <GeocodingResultsSelector
                                                        results={geocodingResults}
                                                        onSelect={(result) => {
                                                            const round = (v: number) => Math.round(v * 1e6) / 1e6
                                                            form.setValue('latitude', round(result.latitude))
                                                            form.setValue('longitude', round(result.longitude))
                                                            setShowGeocodingResults(false)
                                                            toast.success(`Coordinates selected: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`)
                                                        }}
                                                        onCancel={() => setShowGeocodingResults(false)}
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                    
                                    <div className="text-xs text-gray-500">
                                        Or paste Google Maps link below
                                    </div>
                                    
                                    <GoogleMapsImporter
                                        onCoordinatesFound={(latitude, longitude) => {
                                            const round = (v: number) => Math.round(v * 1e6) / 1e6
                                            form.setValue('latitude', round(latitude))
                                            form.setValue('longitude', round(longitude))
                                        }}
                                    />
                                </div>

                                {/* Coordinates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="latitude"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                                                    Latitude *
                                                </FormLabel>
                                                <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    step="any"
                                                    placeholder="e.g., 40.7128"
                                                    className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                                                />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="longitude"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                                                    Longitude *
                                                </FormLabel>
                                                <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    step="any"
                                                    placeholder="e.g., -74.0060"
                                                    className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                                                />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Map Preview */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-barTrekker-darkGrey">Map Preview</h4>
                                    <MapPreview
                                        latitude={form.watch('latitude')}
                                        longitude={form.watch('longitude')}
                                        address={form.watch('address') ? `${form.watch('address')}, ${form.watch('city')}, ${form.watch('country')}` : undefined}
                                        height={250}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                                                Description
                                            </FormLabel>
                                            <FormControl>
                                                <textarea
                                                    {...field}
                                                    placeholder="Enter bar description"
                                                    className="w-full p-3 border border-barTrekker-lightGrey rounded-md bg-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange focus:outline-none"
                                                    rows={4}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end space-x-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate('/admin/bars')}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            loading ||
                                            !Number.isFinite(form.watch('latitude')) ||
                                            !Number.isFinite(form.watch('longitude')) ||
                                            (form.watch('latitude') === 0 && form.watch('longitude') === 0)
                                        }
                                        className="bg-barTrekker-orange hover:bg-barTrekker-orange/90"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {loading ? 'Creating...' : 'Create Bar'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};
