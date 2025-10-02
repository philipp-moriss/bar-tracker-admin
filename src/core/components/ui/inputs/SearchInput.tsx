import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './input';

interface SearchInputProps {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
    placeholder,
    value,
    onChange,
    className = ''
}) => {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`pl-10 pr-10 h-11 border-gray-200 focus:border-barTrekker-orange focus:ring-barTrekker-orange ${className}`}
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 h-4 w-4"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};
