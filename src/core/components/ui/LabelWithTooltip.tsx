import { Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';
import React from 'react';

interface LabelWithTooltipProps {
  label: React.ReactNode;
  tooltip: React.ReactNode;
  htmlFor?: string;
  dir?: 'ltr' | 'rtl';
  className?: string;
}

export const LabelWithTooltip: React.FC<LabelWithTooltipProps> = ({
  label,
  tooltip,
  htmlFor,
  dir,
  className = '',
}) => (
  <div className={`flex items-center mb-1 ${className}`} dir={dir}>
    {htmlFor ? (
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
    ) : (
      <span className="block text-sm font-medium">{label}</span>
    )}
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={dir === 'rtl' ? 'inline-flex align-middle mr-2 cursor-pointer text-muted-foreground' : 'inline-flex align-middle ml-2 cursor-pointer text-muted-foreground'}>
          <Info size={16} />
        </span>
      </TooltipTrigger>
      <TooltipContent dir={dir} style={{ whiteSpace: 'pre-line' }}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  </div>
); 