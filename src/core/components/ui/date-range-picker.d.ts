import { DateRange, SelectRangeEventHandler } from "react-day-picker"

export interface DateRangePickerProps {
  date: DateRange
  onSelect: SelectRangeEventHandler
}

export function DateRangePicker(props: DateRangePickerProps): JSX.Element 