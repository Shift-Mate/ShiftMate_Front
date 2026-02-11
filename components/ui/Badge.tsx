import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "success" | "warning" | "error" | "info" | "default";
    dot?: boolean;
    children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = "default", dot = false, children, ...props }, ref) => {
        const variants = {
            success:
                "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
            warning:
                "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
            error:
                "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
            info: "bg-primary/10 text-primary border-primary/20",
            default:
                "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-600",
        };

        return (
            <span
                ref={ref}
                className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    variants[variant],
                    className
                )}
                {...props}
            >
                {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                {children}
            </span>
        );
    }
);

Badge.displayName = "Badge";
