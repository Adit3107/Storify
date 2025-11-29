import { cn } from "@/lib/utils"

interface SpinnerProps {
    size?: "sm" | "md" | "lg"
    color?: "primary" | "secondary" | "success" | "warning" | "danger" | "default"
    className?: string
}

export function Spinner({ size = "md", color = "primary", className }: SpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4 border-2",
        md: "h-8 w-8 border-2",
        lg: "h-12 w-12 border-3",
    }

    const colorClasses = {
        primary: "border-primary border-t-transparent",
        secondary: "border-secondary border-t-transparent",
        success: "border-green-500 border-t-transparent",
        warning: "border-yellow-500 border-t-transparent",
        danger: "border-destructive border-t-transparent",
        default: "border-foreground border-t-transparent",
    }

    return (
        <div
            className={cn(
                "animate-spin rounded-full",
                sizeClasses[size],
                colorClasses[color],
                className
            )}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    )
}
