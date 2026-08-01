import { forwardRef } from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none",
    {
        variants: {
            variant: {
                default:   "bg-purple-600 text-white hover:bg-purple-700 shadow-sm",
                hero:      "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md transform hover:-translate-y-0.5",
                secondary: "bg-purple-50 text-purple-700 hover:bg-purple-100 active:bg-purple-200",
                outline:   "border border-purple-200 text-purple-700 hover:border-purple-600 hover:bg-purple-50",
                danger:    "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-500",
                ghost:     "text-gray-600 hover:bg-gray-100",
                link:      "text-purple-600 underline-offset-4 hover:underline p-0 h-auto",
            },
            size: {
                sm:   "h-8 px-3 text-xs",
                md:   "h-10 px-4",
                lg:   "h-12 px-6 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "md",
        },
    }
)

const Button = forwardRef(({ className, variant, size, children, loading, ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={cn(buttonVariants({ variant, size }), className)}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
            )}
            {children}
        </button>
    )
})

Button.displayName = "Button"

export { Button, buttonVariants }