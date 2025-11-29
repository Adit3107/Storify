import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
        color?: string
        size?: string
        label?: string
        showValueLabel?: boolean
    }
>(({ className, value, color, label, showValueLabel, ...props }, ref) => (
    <div className="w-full">
        {(label || showValueLabel) && (
            <div className="flex justify-between mb-1">
                {label && <span className="text-sm font-medium">{label}</span>}
                {showValueLabel && <span className="text-sm text-muted-foreground">{value}%</span>}
            </div>
        )}
        <ProgressPrimitive.Root
            ref={ref}
            className={cn(
                "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
                className
            )}
            {...props}
        >
            <ProgressPrimitive.Indicator
                className="h-full w-full flex-1 bg-primary transition-all"
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            />
        </ProgressPrimitive.Root>
    </div>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
