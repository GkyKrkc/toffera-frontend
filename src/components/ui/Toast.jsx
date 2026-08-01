import { createContext, useContext, useState, useCallback } from "react"
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react"

const ToastContext = createContext(null)

const icons = {
  success: <CheckCircle size={18} className="text-emerald-500" />,
  error:   <XCircle size={18} className="text-red-500" />,
  warning: <AlertCircle size={18} className="text-amber-500" />,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ message, type = "success", duration = 3000 }) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg border border-gray-100 min-w-[280px] max-w-sm animate-in slide-in-from-right-5 duration-300">
            {icons[t.type]}
            <p className="text-sm text-gray-800 flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
