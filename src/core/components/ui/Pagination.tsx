import { Button } from '@/core/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PaginationProps {
  currentPage: number
  totalPages?: number
  hasNextPage?: boolean
  onPrevious: () => void
  onNext: () => void
  className?: string
  dir?: 'ltr' | 'rtl'
}

export const Pagination = ({
  currentPage,
  totalPages,
  hasNextPage = false,
  onPrevious,
  onNext,
  className = '',
  dir = 'ltr'
}: PaginationProps) => {
  const { t } = useTranslation()
  const isRTL = dir === 'rtl'
  
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} dir={dir}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevious}
        disabled={currentPage === 1}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400"
      >
        {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        {t('common.previous')}
      </Button>
      
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-gray-800 text-white rounded-md text-sm font-medium">
          {currentPage}
        </span>
        {totalPages && totalPages > 0 && (
          <span className="text-sm text-gray-600">
            {t('common.of')} {totalPages}
          </span>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={!hasNextPage}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400"
      >
        {t('common.next')}
        {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
    </div>
  )
} 