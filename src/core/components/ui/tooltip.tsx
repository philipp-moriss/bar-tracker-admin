import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/core/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

type TooltipContentProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
  variant?: 'default' | 'muted' | 'danger' | 'success' | 'inverted'
  size?: 'sm' | 'md'
  arrowAlign?: 'start' | 'center' | 'end'
  arrowOffset?: number
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, side = "top", align = "center", sideOffset = 6, variant = 'default', size = 'md', arrowAlign = 'center', arrowOffset = 0, children, ...props }, ref) => {
  const variantClass = {
    default: "bg-white text-foreground border-0",
    muted: "bg-muted text-muted-foreground border",
    danger: "bg-red-600 text-white border-transparent",
    success: "bg-emerald-600 text-white border-transparent",
    inverted: "bg-foreground text-background border-transparent",
  }[variant]

  const sizeClass = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl font-medium",
  }[size]

  const arrowFillClass = {
    default: "fill-white",
    muted: "fill-[hsl(var(--muted))]",
    danger: "fill-red-600",
    success: "fill-emerald-600",
    inverted: "fill-[hsl(var(--foreground))]",
  }[variant]

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[9999] overflow-visible transition-none relative shadow-[0px_8px_24px_rgba(0,0,0,0.12)]",
          variantClass,
          sizeClass,
          className
        )}
        {...props}
      >
        <TooltipPrimitive.Arrow
          width={12}
          height={6}
          className={cn("fill-white", arrowFillClass)}
        />
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
})
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent }