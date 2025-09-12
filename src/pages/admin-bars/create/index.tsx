import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { AdminLayout } from '@/core/components/layout/AdminLayout';
import { ImageUpload } from '@/components/common/ImageUpload/ImageUpload';
import { ImageUploadResult } from '@/core/services/imageService';
import { GoogleMapsImporter } from '@/components/common/GoogleMapsImporter/GoogleMapsImporter';

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
    imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    isActive: z.boolean().default(true),
    latitude: z.string().refine((val) => !isNaN(Number(val)), "Must be a valid latitude"),
    longitude: z.string().refine((val) => !isNaN(Number(val)), "Must be a valid longitude"),
});

type CreateBarFormData = z.infer<typeof createBarSchema>;

export const CreateBarPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<ImageUploadResult[]>([]);

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
            imageUrl: '',
            isActive: true,
            latitude: '',
            longitude: '',
        },
    });

    const onSubmit = async (data: CreateBarFormData) => {
        try {
            setLoading(true);

            // Clean up empty strings
            const cleanData: CreateBarData = {
                name: data.name,
                address: data.address,
                city: data.city,
                country: data.country,
                phone: data.phone || undefined,
                email: data.email || undefined,
                website: data.website || undefined,
                description: data.description || undefined,
                imageUrl: data.imageUrl || undefined,
                isActive: data.isActive,
                // Images
                images: uploadedImages.map(img => img.url),
            };

            const barId = await barService.createBar(cleanData);

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

                                <FormField
                                    control={form.control}
                                    name="imageUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                                                Fallback Image URL (optional)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Enter image URL"
                                                    className="bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Google Maps Importer */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-barTrekker-darkGrey">Location Coordinates</h3>
                                    <GoogleMapsImporter
                                        onCoordinatesFound={(latitude, longitude) => {
                                            form.setValue('latitude', latitude.toString())
                                            form.setValue('longitude', longitude.toString())
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
                                        disabled={loading}
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
