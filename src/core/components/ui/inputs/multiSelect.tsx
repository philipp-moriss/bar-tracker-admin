import { useState } from 'react'
import { Button } from '../button'
import { Checkbox } from './checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import { useTranslation } from 'react-i18next'
interface Option {
    id: number | string
    name: string
    value: string
}

interface MultiSelectProps {
    options: Option[]
    value: string[]
    onChange: (value: string[]) => void
    placeholder: string
    searchPlaceholder?: string
    showSearch?: boolean
    className?: string
    dialogContentRef?: React.RefObject<HTMLElement>
    disablePortal?: boolean
}

export const MultiSelect = ({
    options,
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    showSearch = false,
    className,
    dialogContentRef,
    disablePortal = false
}: MultiSelectProps) => {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')

    const filteredOptions = showSearch 
        ? options.filter(option => option.name.toLowerCase().includes(search.toLowerCase()))
        : options

    const selectedOptions = options.filter(option => value.includes(option.value))
    const displayText = value.length === 0
        ? placeholder
        : selectedOptions.map(option => option.name).join(', ')

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" className={`w-full justify-between text-base h-12 ${className}`}>
                    <span className="truncate text-left w-full">
                        {displayText}
                    </span>
                    <svg className="w-5 h-5 ml-2 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-2 rounded-xl"
                sideOffset={8}
                align="center"
                container={dialogContentRef?.current || undefined}
                disablePortal={disablePortal}
            >
                {showSearch && (
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full mb-2 px-3 py-2 rounded border border-input bg-background text-base outline-none focus:ring-2 focus:ring-primary"
                    />
                )}
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                    {filteredOptions.map((option) => (
                        <label key={option.id} className="flex items-center gap-3 cursor-pointer px-3 py-3 rounded-lg text-lg active:bg-muted focus:bg-muted select-none">
                            <Checkbox
                                checked={value.includes(option.value)}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        onChange([...value, option.value])
                                    } else {
                                        onChange(value.filter(v => v !== option.value))
                                    }
                                }}
                                className="h-6 w-6 rounded-md"
                            />
                            <span className="truncate">{option.name}</span>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end pt-2">
                    <Button type="button" size="sm" className="rounded-lg px-4 py-2 text-base" onClick={() => setIsOpen(false)}>
                        {t('common.success')}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
} 