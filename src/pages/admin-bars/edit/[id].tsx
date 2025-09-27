import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Phone, Save, X, Image as ImageIcon } from 'lucide-react';
import { AdminLayout } from '@/core/components/layout/AdminLayout';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/inputs/input';
import { Textarea } from '@/core/components/ui/inputs/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Label } from '@/core/components/ui/label';
import { barService } from '@/core/services/barService';
import { Bar } from '@/core/types/bar';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/common/ImageUpload/ImageUpload';
import { ImageUploadResult } from '@/core/services/imageService';

export const EditBarPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadedImages, setUploadedImages] = useState<ImageUploadResult[]>([]);

    const [formData, setFormData] = useState<Partial<Bar>>({
        name: '',
        address: '',
        city: '',
        country: '',
        phone: '',
        email: '',
        website: '',
        description: '',
        coordinates: { latitude: 0, longitude: 0 },
        isActive: true,
    });

    useEffect(() => {
        if (id) {
            loadBar();
        }
    }, [id]);

    const loadBar = async () => {
        try {
            setLoading(true);
            setError(null);

            const bar = await barService.getBarById(id!);
            if (!bar) {
                setError('Bar not found');
                return;
            }

            setFormData({
                name: bar.name || '',
                address: bar.address || '',
                city: bar.city || '',
                country: bar.country || '',
                phone: bar.phone || '',
                email: bar.email || '',
                website: bar.website || '',
                description: bar.description || '',
                coordinates: bar.coordinates || { latitude: 0, longitude: 0 },
                isActive: bar.isActive ?? true,
            });
            // Инициализируем виджет загрузки текущими изображениями
            setUploadedImages((bar.images || []).map((url) => ({ url, path: '', name: url.split('/').pop() || 'image', size: 0 })));
        } catch (err) {
            console.error('Error loading bar:', err);
            setError('Failed to load bar details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            if (!formData.name?.trim()) {
                setError('Bar name is required');
                return;
            }

            if (!formData.address?.trim()) {
                setError('Address is required');
                return;
            }

            if (!formData.city?.trim()) {
                setError('City is required');
                return;
            }

            if (!formData.country?.trim()) {
                setError('Country is required');
                return;
            }

            await barService.updateBar(id!, {
                name: formData.name.trim(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                country: formData.country.trim(),
                phone: formData.phone?.trim() || '',
                email: formData.email?.trim() || '',
                website: formData.website?.trim() || '',
                description: formData.description?.trim() || '',
                coordinates: formData.coordinates,
                isActive: formData.isActive,
                images: uploadedImages.map(img => img.url),
            });

            toast.success('Bar updated successfully');
            navigate('/admin/bars');
        } catch (err) {
            console.error('Error updating bar:', err);
            setError('Failed to update bar');
            toast.error('Failed to update bar');
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        navigate('/admin/bars');
    };

    const handleInputChange = (field: keyof Bar, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (loading) {
        return (
            <AdminLayout title="Edit Bar" subtitle="Update bar information">
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-barTrekker-orange"></div>
                </div>
            </AdminLayout>
        );
    }

    if (error && !formData.name) {
        return (
            <AdminLayout title="Edit Bar" subtitle="Update bar information">
                <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={handleBack} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Bars
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Edit Bar" subtitle="Update bar information">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="flex items-center space-x-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Bars</span>
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Building2 className="h-5 w-5" />
                            <span>Bar Information</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label htmlFor="name">Bar Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name || ''}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Enter bar name"
                                    className="mt-1"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description || ''}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Enter bar description"
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        {/* Location Information */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-barTrekker-darkGrey mb-4 flex items-center space-x-2">
                                <MapPin className="h-5 w-5" />
                                <span>Location Information</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Label htmlFor="address">Address *</Label>
                                    <Input
                                        id="address"
                                        value={formData.address || ''}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        placeholder="Enter street address"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        id="city"
                                        value={formData.city || ''}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                        placeholder="Enter city"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="country">Country *</Label>
                                    <Input
                                        id="country"
                                        value={formData.country || ''}
                                        onChange={(e) => handleInputChange('country', e.target.value)}
                                        placeholder="Enter country"
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="latitude">Latitude</Label>
                                        <Input
                                            id="latitude"
                                            type="number"
                                            step="any"
                                            value={formData.coordinates?.latitude || 0}
                                            onChange={(e) => handleInputChange('coordinates', {
                                                ...formData.coordinates,
                                                latitude: parseFloat(e.target.value) || 0
                                            })}
                                            placeholder="Enter latitude"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="longitude">Longitude</Label>
                                        <Input
                                            id="longitude"
                                            type="number"
                                            step="any"
                                            value={formData.coordinates?.longitude || 0}
                                            onChange={(e) => handleInputChange('coordinates', {
                                                ...formData.coordinates,
                                                longitude: parseFloat(e.target.value) || 0
                                            })}
                                            placeholder="Enter longitude"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-barTrekker-darkGrey mb-4 flex items-center space-x-2">
                                <Phone className="h-5 w-5" />
                                <span>Contact Information</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone || ''}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        placeholder="Enter phone number"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        placeholder="Enter email address"
                                        className="mt-1"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        value={formData.website || ''}
                                        onChange={(e) => handleInputChange('website', e.target.value)}
                                        placeholder="Enter website URL"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-barTrekker-darkGrey mb-4 flex items-center space-x-2">
                                <ImageIcon className="h-5 w-5" />
                                <span>Bar Images</span>
                            </h3>
                            <ImageUpload
                                onImagesChange={setUploadedImages}
                                maxImages={3}
                                folder="bars"
                                existingImages={uploadedImages}
                                disabled={saving}
                            />
                        </div>

                        {/* Status */}
                        <div className="border-t pt-6">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive ?? true}
                                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                                />
                                <Label htmlFor="isActive">Active (visible to users)</Label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-4 pt-6 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={saving}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-barTrekker-orange hover:bg-barTrekker-orange/90"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};
