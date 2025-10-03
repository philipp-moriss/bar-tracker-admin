import { useEffect, useState } from 'react';
import { User } from '@/core/types/user';
import { userService } from '@/core/services/userService';
import { Checkbox } from '@/core/components/ui/inputs/checkbox';
import { Label } from '@/core/components/ui/label';
import { Users } from 'lucide-react';

interface BartenderSelectorProps {
    barName: string;
    selectedBartenderIds: string[];
    onSelectionChange: (bartenderIds: string[]) => void;
    disabled?: boolean;
}

export const BartenderSelector = ({
    barName,
    selectedBartenderIds,
    onSelectionChange,
    disabled = false
}: BartenderSelectorProps) => {
    const [bartenders, setBartenders] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadBartenders = async () => {
            if (!barName) {
                setBartenders([]);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const barBartenders = await userService.getBartendersByBarName(barName);
                setBartenders(barBartenders);
            } catch (err) {
                console.error('Error loading bartenders:', err);
                setError('Failed to load bartenders');
                setBartenders([]);
            } finally {
                setLoading(false);
            }
        };

        loadBartenders();
    }, [barName]);

    const handleToggleBartender = (bartenderId: string) => {
        if (disabled) return;

        const newSelection = selectedBartenderIds.includes(bartenderId)
            ? selectedBartenderIds.filter(id => id !== bartenderId)
            : [...selectedBartenderIds, bartenderId];

        onSelectionChange(newSelection);
    };

    const handleSelectAll = () => {
        if (disabled) return;
        onSelectionChange(bartenders.map(b => b.id));
    };

    const handleDeselectAll = () => {
        if (disabled) return;
        onSelectionChange([]);
    };

    if (!barName) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                    Please select a bar first to assign bartenders
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-4 bg-gray-50 border rounded-lg">
                <p className="text-sm text-gray-600">Loading bartenders...</p>
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

    if (bartenders.length === 0) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                    No bartenders found for this bar. Please create bartender users in the{' '}
                    <a href="/admin/users" className="underline font-medium">
                        User Management
                    </a>{' '}
                    section.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-barTrekker-darkGrey" />
                    <h4 className="text-sm font-medium text-barTrekker-darkGrey">
                        Assign Bartenders ({selectedBartenderIds.length} of {bartenders.length} selected)
                    </h4>
                </div>
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        disabled={disabled}
                        className="text-xs text-barTrekker-orange hover:underline disabled:opacity-50"
                    >
                        Select All
                    </button>
                    <span className="text-xs text-gray-400">|</span>
                    <button
                        type="button"
                        onClick={handleDeselectAll}
                        disabled={disabled}
                        className="text-xs text-gray-600 hover:underline disabled:opacity-50"
                    >
                        Deselect All
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 border rounded-lg max-h-64 overflow-y-auto">
                {bartenders.map((bartender) => (
                    <div
                        key={bartender.id}
                        className={`flex items-start space-x-3 p-3 rounded-md transition-colors ${selectedBartenderIds.includes(bartender.id)
                            ? 'bg-barTrekker-orange/10 border border-barTrekker-orange'
                            : 'bg-white border border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <Checkbox
                            id={`bartender-${bartender.id}`}
                            checked={selectedBartenderIds.includes(bartender.id)}
                            onCheckedChange={() => handleToggleBartender(bartender.id)}
                            disabled={disabled}
                            className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                            <Label
                                htmlFor={`bartender-${bartender.id}`}
                                className="text-sm font-medium text-gray-900 cursor-pointer block"
                            >
                                {bartender.name}
                            </Label>
                            <p className="text-xs text-gray-500 truncate">{bartender.email}</p>
                            {bartender.phoneNumber && (
                                <p className="text-xs text-gray-400">{bartender.phoneNumber}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-600">
                <strong>Note:</strong> Only selected bartenders will see this event in their mobile app.
                Make sure to assign at least one bartender to the event.
            </p>
        </div>
    );
};

