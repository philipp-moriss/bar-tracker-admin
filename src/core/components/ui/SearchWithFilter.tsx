import { Search, ArrowDownWideNarrow } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { ChangeEvent, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover";
import { useTranslation } from "react-i18next";

interface SortOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface SearchWithFilterProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  sortOptions?: SortOption[];
  currentSort?: string;
  onSortChange?: (value: string) => void;
  className?: string;
  showSortButton?: boolean;
  handleResetFilters?: () => void;
}

export const SearchWithFilter = ({
  placeholder,
  value,
  onChange,
  sortOptions = [],
  currentSort,
  onSortChange,
  className = "",
  showSortButton = true,
  handleResetFilters,
}: SearchWithFilterProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'he';



  const handleSortChange = (optionValue: string) => {
    onSortChange?.(optionValue);
  };

  return (
    <>
      <div className={`flex gap-3 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={`relative flex-none w-[373px] ${isRTL ? 'order-1' : 'order-1'}`}>
          <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder={placeholder || t("common.searchFormPlaceholder")}
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange(e.target.value)
            }
            className={`w-full py-2 bg-white border border-[#E3E3E3] text-gray-600 placeholder-gray-400 rounded h-10 outline-none focus:outline-none focus:border-[#E3E3E3] ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'}`}
          />
        </div>

        {showSortButton && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`bg-white border-[#E3E3E3] text-gray-700 hover:bg-gray-50 rounded h-10 shadow-none font-poppins font-normal text-base transition-all duration-200 ${isRTL ? 'order-2' : 'order-2'}`}
              >
                <ArrowDownWideNarrow className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t("common.sort")}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-0 transition-all duration-200 ease-in-out"
              align={isRTL ? 'end' : 'start'}
              side="bottom"
              sideOffset={4}
              onMouseEnter={() => setIsPopoverOpen(true)}
              onMouseLeave={() => setIsPopoverOpen(false)}
            >
              <div className="py-2">
                <div className="space-y-0">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full text-left px-4 py-3 text-base transition-all duration-200 flex items-center gap-3 hover:bg-[#F0F1FF] ${
                          currentSort === option.value
                            ? "bg-[#DBDEFF] text-gray-900 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        <div className="text-gray-500">
                          {option.icon}
                        </div>
                        <span className="flex-1">{option.label}</span>
                      </button>
                    ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {handleResetFilters && (
        <Button onClick={handleResetFilters} className="w-full">
          {t("admin.answers.list.resetFilters")}
        </Button>
      )}
    </>
  );
};
