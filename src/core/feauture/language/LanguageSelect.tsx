import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/inputs/select'

const languages = [
    { value: 'en', label: 'EN' },
]

interface LanguageSelectProps {
    size?: 'sm' | 'md' | 'lg'
    triggerClassName?: string
    contentClassName?: string
}

const sizeClasses = {
    sm: 'w-[70px] h-8 text-xs',
    md: 'w-[80px] h-10 text-sm',
    lg: 'w-[100px] h-12 text-base'
}

export const LanguageSelect = ({ size = 'md', triggerClassName, contentClassName }: LanguageSelectProps) => {
    const { i18n } = useTranslation()

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng)
    }

    const defaultTriggerClass = `bg-white ${sizeClasses[size]}`

    return (
        <Select value={i18n.language} onValueChange={changeLanguage}>
            <SelectTrigger className={triggerClassName || defaultTriggerClass}>
                <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className={contentClassName}>
                {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
} 