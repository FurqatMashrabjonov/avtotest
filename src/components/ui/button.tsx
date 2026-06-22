import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-3d inline-flex items-center justify-center gap-2 rounded-2xl font-bold uppercase tracking-wide select-none transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none",
  {
    variants: {
      variant: {
        primary: "bg-grass border-grass-dark text-white hover:brightness-105",
        sky: "bg-sky border-sky-dark text-white hover:brightness-105",
        danger: "bg-cardinal border-cardinal-dark text-white hover:brightness-105",
        ghost: "bg-card border-line text-fg hover:bg-muted",
        locked: "bg-line border-[#cfcfcf] text-faint",
      },
      size: {
        default: "h-12 px-5 text-sm",
        lg: "h-14 px-8 text-base",
        sm: "h-10 px-4 text-xs",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
