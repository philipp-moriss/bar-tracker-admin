import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';

type Direction = 'ltr' | 'rtl';

interface ActionTooltipProps {
  label: React.ReactNode;
  children: React.ReactNode;
  dir?: Direction;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
  sideOffset?: number;
  arrowOffset?: number;
}

export const ActionTooltip: React.FC<ActionTooltipProps> = ({
  label,
  children,
  dir = 'ltr',
  side = 'bottom',
  align,
  alignOffset = 12,
  sideOffset = 20,
  arrowOffset = 14,
}) => {
  const isRTL = dir === 'rtl';
  const computedAlign = align ?? (isRTL ? 'start' : 'end');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align={computedAlign}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        arrowAlign={computedAlign}
        arrowOffset={arrowOffset}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
};


