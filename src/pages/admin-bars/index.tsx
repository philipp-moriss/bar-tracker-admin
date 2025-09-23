import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Plus, Edit, Trash2, MapPin, Phone, Mail, Globe, Building2, Users, DollarSign, Star } from 'lucide-react';
import { AdminLayout } from '@/core/components/layout/AdminLayout';

import { Button } from '@/core/components/ui/button';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/inputs/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { barService } from '@/core/services/barService';
import { Bar, BarFilters } from '@/core/types/bar';
import { toast } from 'sonner';
import { ConfirmModal } from '@/core/components/ui/modals/ConfirmModal';

export const AdminBarsPage = () => {
    const navigate = useNavigate();
    const [bars, setBars] = useState<Bar[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [countryFilter, setCountryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedBar, setSelectedBar] = useState<{ id: string; name: string } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Load bars on component mount
    useEffect(() => {
        loadBars();
    }, []);

    const loadBars = async () => {
        try {
            setLoading(true);
            setError(null);

            const filters: BarFilters = {
                search: searchTerm || undefined,
                city: cityFilter || undefined,
                country: countryFilter || undefined,
                isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
            };

            const barsData = await barService.getBars(filters);
            setBars(barsData);
        } catch (err) {
            setError('Failed to load bars');
            console.error('Error loading bars:', err);
        } finally {
            setLoading(false);
        }
    };

    // Reload bars when filters change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadBars();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, cityFilter, countryFilter, statusFilter]);

    const handleDeleteBar = (barId: string, barName: string) => {
        setSelectedBar({ id: barId, name: barName });
        setDeleteModalOpen(true);
    };

    const confirmDeleteBar = async () => {
        if (!selectedBar) return;

        try {
            setActionLoading(true);
            await barService.deleteBar(selectedBar.id);
            toast.success(`Bar "${selectedBar.name}" deleted successfully`);
            setDeleteModalOpen(false);
            setSelectedBar(null);
            loadBars();
        } catch (error) {
            console.error('Error deleting bar:', error);
            toast.error('Failed to delete bar');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
                Active
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
                Inactive
            </Badge>
        );
    };

    const formatDate = (date: Date | any) => {
        if (!date) return 'N/A';
        const d = date instanceof Date ? date : date.toDate();
        return d.toLocaleDateString();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <AdminLayout title="Bars Management" subtitle="Manage all bars and their information">
            <div className="max-w-7xl mx-auto">
                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 h-4 w-4" />
                                    <Input
                                        placeholder="Search bars..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <Input
                                    placeholder="Filter by city..."
                                    value={cityFilter}
                                    onChange={(e) => setCityFilter(e.target.value)}
                                />
                            </div>
                            <div>
                                <Input
                                    placeholder="Filter by country..."
                                    value={countryFilter}
                                    onChange={(e) => setCountryFilter(e.target.value)}
                                />
                            </div>
                            <div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-barTrekker-orange focus:border-barTrekker-orange"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <Button
                                    onClick={() => navigate('/admin/bars/create')}
                                    className="w-full bg-barTrekker-orange hover:bg-barTrekker-orange/90"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Bar
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bars Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                                <Building2 className="h-5 w-5" />
                                <span>Bars ({bars.length})</span>
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-barTrekker-orange"></div>
                            </div>
                        ) : bars.length === 0 ? (
                            <div className="text-center py-8">
                                <Building2 className="h-12 w-12 text-barTrekker-darkGrey/30 mx-auto mb-4" />
                                <p className="text-barTrekker-darkGrey/70">No bars found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bar</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Stats</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bars.map((bar) => (
                                            <TableRow key={bar.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        {bar.images && bar.images.length > 0 ? (
                                                            <img
                                                                src={bar.images[0]}
                                                                alt={bar.name}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-barTrekker-orange rounded-full flex items-center justify-center">
                                                                <span className="text-white font-semibold text-sm">
                                                                    {bar.name.charAt(0)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium">{bar.name}</div>
                                                            <div className="text-sm text-barTrekker-darkGrey/70">
                                                                ID: {bar.id.slice(0, 8)}...
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-1 text-sm">
                                                            <MapPin className="h-3 w-3" />
                                                            <span>{bar.address}</span>
                                                        </div>
                                                        <div className="text-sm text-barTrekker-darkGrey/70">
                                                            {bar.city}, {bar.country}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {bar.phone && (
                                                            <div className="flex items-center space-x-1 text-sm">
                                                                <Phone className="h-3 w-3" />
                                                                <span>{bar.phone}</span>
                                                            </div>
                                                        )}
                                                        {bar.email && (
                                                            <div className="flex items-center space-x-1 text-sm">
                                                                <Mail className="h-3 w-3" />
                                                                <span className="truncate max-w-xs">{bar.email}</span>
                                                            </div>
                                                        )}
                                                        {bar.website && (
                                                            <div className="flex items-center space-x-1 text-sm">
                                                                <Globe className="h-3 w-3" />
                                                                <span className="truncate max-w-xs">{bar.website}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(bar.isActive)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <Users className="h-3 w-3" />
                                                            <span>{bar.totalEvents || 0} events</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <DollarSign className="h-3 w-3" />
                                                            <span>{formatCurrency(bar.totalRevenue || 0)}</span>
                                                        </div>
                                                        {bar.averageRating && bar.averageRating > 0 && (
                                                            <div className="flex items-center space-x-1">
                                                                <Star className="h-3 w-3" />
                                                                <span>{bar.averageRating.toFixed(1)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {formatDate(bar.createdAt)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/admin/bars/edit/${bar.id}`)}
                                                            title="Edit Bar"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteBar(bar.id, bar.name)}
                                                            className="text-red-600 hover:text-red-700"
                                                            title="Delete Bar"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                onConfirm={confirmDeleteBar}
                loading={actionLoading}
                title="Delete Bar"
                description={`Are you sure you want to delete "${selectedBar?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
};