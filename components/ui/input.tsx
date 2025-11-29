import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    errorMessage?: string
    isInvalid?: boolean
    startContent?: React.ReactNode
    endContent?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, errorMessage, isInvalid, startContent, endContent, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="text-sm font-medium mb-1.5 block text-foreground">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {startContent && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {startContent}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            startContent && "pl-10",
                            endContent && "pr-10",
                            isInvalid && "border-destructive focus-visible:ring-destructive",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {endContent && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {endContent}
                        </div>
                    )}
                </div>
                {errorMessage && isInvalid && (
                    <p className="text-xs text-destructive mt-1.5">{errorMessage}</p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
