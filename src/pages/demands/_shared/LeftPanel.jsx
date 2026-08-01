import { Store, RotateCcw, Check } from "lucide-react"

const DEFAULT_CONDITIONS = [
    { id: "sifir", label: "Sıfır Araç", icon: Store, color: "#7e22ce", desc: "Plaza & yetkili bayi teklifleri" },
    { id: "ikinci_el", label: "2. El Araç", icon: RotateCcw, color: "#94a3b8", desc: "Galeri & vasıta danışmanları" },
]

export default function LeftPanel({
                                      title = "Talep",
                                      subtitle = "Talep türünü seçin",
                                      condition,
                                      onConditionChange,
                                      conditions = DEFAULT_CONDITIONS,
                                      children,
                                  }) {
    return (
        <>
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">{title}</h2>
                    <p className="text-[10px] font-medium text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                        {subtitle}
                    </p>
                </div>

                <div className="p-3 space-y-2">
                    {conditions.map(c => {
                        const Icon = c.icon
                        const isActive = condition === c.id
                        return (
                            <button key={c.id} type="button"
                                    onClick={() => onConditionChange(c.id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border transition-all text-left ${isActive ? "bg-purple-50 border-purple-300" : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                                <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                                     style={{ background: c.color + "18" }}>
                                    <Icon size={15} style={{ color: c.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[11px] font-bold ${isActive ? "text-purple-800" : "text-gray-700"}`}>{c.label}</p>
                                    <p className={`text-[9px] font-medium mt-0.5 ${isActive ? "text-purple-600" : "text-gray-400"}`}>{c.desc}</p>
                                </div>
                                {isActive && <Check size={14} className="text-purple-600 flex-shrink-0" />}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Kategoriye özel widget'lar */}
            {children}
        </>
    )
}