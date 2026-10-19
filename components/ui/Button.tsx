import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary hover:bg-primary-hover text-primary-foreground font-bold shadow-sm shadow-primary/20 focus-visible:ring-primary",
  secondary:
    "bg-secondary hover:bg-secondary-hover text-secondary-foreground font-semibold border border-border focus-visible:ring-secondary",
  outline:
    "bg-transparent hover:bg-muted text-foreground font-semibold border border-border focus-visible:ring-primary",
  destructive:
    "bg-destructive hover:bg-destructive/90 text-white font-bold shadow-sm shadow-destructive/20 focus-visible:ring-destructive",
  ghost: "bg-transparent hover:bg-muted text-foreground font-medium focus-visible:ring-muted",
  link: "bg-transparent text-primary hover:underline font-semibold p-0 h-auto focus-visible:ring-0",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-xs sm:text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-sm sm:text-base rounded-xl gap-2.5",
  icon: "h-9 w-9 p-0 rounded-lg justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isActuallyDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isActuallyDisabled}
        className={`inline-flex items-center justify-center transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
