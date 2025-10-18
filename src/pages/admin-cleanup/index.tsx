import { useState, useEffect } from 'react';
import { AdminLayout } from '@/core/components/layout/AdminLayout';
import { Button } from '@/core/components/ui/button';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/inputs/input';
import { Label } from '@/core/components/ui/label';
import {
    Trash2,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Calendar,
} from 'lucide-react';
import { cleanupService, CleanupResult } from '@/core/services/cleanupService';
import { toast } from 'sonner';

export const AdminCleanupPage = () => {
    const [daysOld, setDaysOld] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [expiredTicketsCount, setExpiredTicketsCount] = useState<number>(0);
    const [lastCleanupResult, setLastCleanupResult] = useState<CleanupResult | null>(null);
    const [isLoadingCount, setIsLoadingCount] = useState(false);

    useEffect(() => {
        loadExpiredTicketsCount();
    }, [daysOld]);

    const loadExpiredTicketsCount = async () => {
        try {
            setIsLoadingCount(true);
            const count = await cleanupService.getExpiredTicketsCount(daysOld);
            setExpiredTicketsCount(count);
        } catch (error) {
            console.error('Error loading expired tickets count:', error);
            toast.error('Failed to load expired tickets count');
        } finally {
            setIsLoadingCount(false);
        }
    };

    const handleCleanup = async () => {
        if (expiredTicketsCount === 0) {
            toast.info('No expired tickets to clean up');
            return;
        }

        try {
            setIsLoading(true);
            const result = await cleanupService.cleanupExpiredTickets(daysOld);
            setLastCleanupResult(result);

            if (result.success) {
                toast.success(result.message);
                // Reload the count after successful cleanup
                await loadExpiredTicketsCount();
            } else {
                toast.error(result.error || 'Failed to cleanup expired tickets');
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
            toast.error('An error occurred during cleanup');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AdminLayout title="Cleanup Management" subtitle="Manage expired tickets and data cleanup">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Trash2 className="h-8 w-8" />
                            Data Cleanup
                        </h1>
                        <p className="text-gray-600">Clean up expired tickets and maintain database health</p>
                    </div>
                </div>

                {/* Cleanup Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Cleanup Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="daysOld">Days Old</Label>
                                <Input
                                    id="daysOld"
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={daysOld}
                                    onChange={(e) => setDaysOld(parseInt(e.target.value) || 1)}
                                    className="mt-1"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Tickets older than this many days will be deleted
                                </p>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={loadExpiredTicketsCount}
                                    disabled={isLoadingCount}
                                    className="w-full"
                                >
                                    {isLoadingCount ? (
                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                    )}
                                    Refresh Count
                                </Button>
                            </div>
                        </div>

                        {/* Expired Tickets Count */}
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                <span className="font-medium text-yellow-800">
                                    {isLoadingCount ? 'Loading...' : `${expiredTicketsCount} expired tickets found`}
                                </span>
                            </div>
                            <p className="text-sm text-yellow-700 mt-1">
                                These tickets are for events that ended more than {daysOld} day{daysOld !== 1 ? 's' : ''} ago
                            </p>
                        </div>

                        {/* Cleanup Button */}
                        <div className="flex gap-4">
                            <Button
                                onClick={handleCleanup}
                                disabled={isLoading || expiredTicketsCount === 0}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isLoading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                {isLoading ? 'Cleaning up...' : 'Clean Up Expired Tickets'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Last Cleanup Result */}
                {lastCleanupResult && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {lastCleanupResult.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                )}
                                Last Cleanup Result
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`p-4 rounded-lg ${lastCleanupResult.success
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'
                                }`}>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {lastCleanupResult.success ? 'Success!' : 'Failed'}
                                        </span>
                                    </div>
                                    <p className="text-sm">
                                        {lastCleanupResult.message}
                                    </p>
                                    {lastCleanupResult.success && (
                                        <div className="text-sm space-y-1">
                                            <p><strong>Deleted Tickets:</strong> {lastCleanupResult.deletedTickets}</p>
                                            <p><strong>Cutoff Date:</strong> {formatDate(lastCleanupResult.cutoffDate)}</p>
                                        </div>
                                    )}
                                    {lastCleanupResult.error && (
                                        <p className="text-sm text-red-600">
                                            <strong>Error:</strong> {lastCleanupResult.error}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>About Cleanup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-gray-600 space-y-2">
                            <p>
                                <strong>Automatic Cleanup:</strong> Expired tickets are automatically cleaned up every day at 2:00 AM UTC.
                            </p>
                            <p>
                                <strong>Manual Cleanup:</strong> Use this tool to manually clean up expired tickets or adjust the cleanup schedule.
                            </p>
                            <p>
                                <strong>What gets cleaned:</strong>
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>Tickets for events that ended more than the specified number of days ago</li>
                                <li>Only tickets with status 'unscanned' or 'scanned' (completed tickets are preserved)</li>
                                <li>Empty ticket groups that no longer have any tickets</li>
                            </ul>
                            <p className="text-yellow-700 font-medium">
                                ⚠️ This action cannot be undone. Make sure you want to delete these tickets before proceeding.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};
