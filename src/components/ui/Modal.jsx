import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Modal({ open, onClose, title, children, size = "md", className }) {
  // ESC tuşu ile kapat
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose?.() }
    if (open) document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  // Body scroll kilitle
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        />

        {/* Modal */}
        <div className={cn(
            "relative w-full bg-white rounded-xl shadow-2xl",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            sizes[size],
            className
        )}>
          {/* Header */}
          {title && (
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
          )}

          {/* İçerik */}
          <div className="px-6 py-6">
            {children}
          </div>
        </div>
      </div>
  )
}