import { Calendar } from "@/core/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover"
import { Button } from "@/core/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ru, enUS, he, ar } from "date-fns/locale"
import { DateRange, SelectRangeEventHandler } from "react-day-picker"

interface DateRangePickerProps {
  date: DateRange
  onSelect: SelectRangeEventHandler
  locale?: string
}

export function DateRangePicker({ date, onSelect, locale = 'en' }: DateRangePickerProps) {
  const getLocale = () => {
    switch (locale) {
      case 'ru':
        return ru
      case 'he':
        return he
      case 'ar':
        return ar
      default:
        return enUS
    }
  }

  const currentLocale = getLocale()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className="w-[300px] justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL dd, y", { locale: currentLocale })} -{" "}
                {format(date.to, "LLL dd, y", { locale: currentLocale })}
              </>
            ) : (
              format(date.from, "LLL dd, y", { locale: currentLocale })
            )
          ) : (
            <span>Select date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={onSelect}
          numberOfMonths={2}
          locale={currentLocale}
        />
      </PopoverContent>
    </Popover>
  )
} 