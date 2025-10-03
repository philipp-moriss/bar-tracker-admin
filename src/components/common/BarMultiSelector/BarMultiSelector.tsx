import { useEffect, useState } from 'react';
import { Bar } from '@/core/types/bar';
import { barService } from '@/core/services/barService';
import { MultiSelect } from '@/core/components/ui/inputs/multiSelect';

interface BarMultiSelectorProps {
    selectedBarNames: string[];
    onSelectionChange: (barNames: string[]) => void;
    disabled?: boolean;
}

export const BarMultiSelector = ({
    selectedBarNames,
    onSelectionChange,
    disabled = false
}: BarMultiSelectorProps) => {
    const [bars, setBars] = useState<Bar[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadBars = async () => {
            try {
                setLoading(true);
                setError(null);
                const barsData = await barService.getBars({ isActive: true });
                setBars(barsData);
            } catch (err) {
                console.error('Error loading bars:', err);
                setError('Failed to load bars');
                setBars([]);
            } finally {
                setLoading(false);
            }
        };

        loadBars();
    }, []);

    if (loading) {
        return (
            <div className="p-4 bg-gray-50 border rounded-lg">
                <p className="text-sm text-gray-600">Loading bars...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
            </div>
        );
    }

    if (bars.length === 0) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                    No bars available. Please create bars in the{' '}
                    <a href="/admin/bars" className="underline font-medium">
                        Bars Management
                    </a>{' '}
                    section.
                </p>
            </div>
        );
    }

    const options = bars.map((bar) => ({
        id: bar.id,
        name: `${bar.name} (${bar.city}, ${bar.country})`,
        value: bar.name
    }));

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-barTrekker-darkGrey mb-2">
                    Select Bars:
                </label>
                <MultiSelect
                    options={options}
                    value={selectedBarNames}
                    onChange={onSelectionChange}
                    placeholder="Select bars..."
                    showSearch={true}
                    searchPlaceholder="Search bars..."
                    disablePortal={true}
                />
            </div>

            {selectedBarNames.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                        <strong>{selectedBarNames.length} bar(s) selected:</strong> {selectedBarNames.join(', ')}
                    </p>
                </div>
            )}

            <p className="text-xs text-gray-600">
                <strong>Note:</strong> Bartender will see events from all selected bars in their mobile app.
            </p>
        </div>
    );
};
