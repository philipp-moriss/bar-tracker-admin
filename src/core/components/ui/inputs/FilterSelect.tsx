import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface FilterOption {
    value: string;
    label: string;
}

interface FilterSelectProps<T = string> {
    placeholder: string;
    value: T | undefined;
    onValueChange: (value: T) => void;
    options: FilterOption[];
    className?: string;
}

export const FilterSelect = <T extends string>({
    placeholder,
    value,
    onValueChange,
    options,
    className = ''
}: FilterSelectProps<T>) => {
    const displayValue = value || 'all';
    const handleValueChange = (newValue: string) => {
        onValueChange((newValue === 'all' ? '' : newValue) as T);
    };

    return (
        <Select
            value={displayValue}
            onValueChange={handleValueChange}
            className={className}
        >
            <SelectTrigger className="h-11">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
