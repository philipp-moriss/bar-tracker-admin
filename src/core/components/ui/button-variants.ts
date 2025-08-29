import { cva } from "class-variance-authority";


// Removed ADMIN_BUTTON_COLORS in favor of static Tailwind classes to avoid purge issues

export const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-[8px] text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-[#313A56] text-primary-foreground shadow hover:bg-[#1D2232]",
                destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
                outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                "admin-primary": "bg-[#3B46C4] text-white shadow hover:bg-[#222C9B] active:bg-[#161C64]",
                "admin-secondary": "bg-[#FFFFFF] text-[#3B46C4] border border-[#3B46C4] hover:bg-[#F0F1FF] active:bg-[#DBDEFF]",
                "admin-tertiary": "bg-[#FFFFFF] text-[#3B46C4] hover:bg-[#F0F1FF] active:bg-[#DBDEFF]",
                
            },
            size: {
                default: "h-12 px-5 py-3",
                sm: "h-8 rounded-[8px] px-3 text-base",
                lg: "h-10 rounded-[8px] px-8",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
); 