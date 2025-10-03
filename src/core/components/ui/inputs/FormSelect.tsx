import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface SelectOption {
    value: string;
    label: string;
}

interface FormSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    placeholder: string;
    className?: string;
    allowEmpty?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
    value,
    onValueChange,
    options,
    placeholder,
    className = '',
    allowEmpty = false
}) => {
    const filteredOptions = allowEmpty
        ? options
        : options.filter(option => option.value !== '');

    const displayValue = value === '' ? 'placeholder' : value;

    const handleValueChange = (newValue: string) => {
        onValueChange(newValue === 'placeholder' ? '' : newValue);
    };

    return (
        <Select
            value={displayValue}
            onValueChange={handleValueChange}
            className={className}
        >
            <SelectTrigger className="h-11 bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {filteredOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value || 'placeholder'}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
