// ─────────────────────────────────────────────────────────────
// FormShell.jsx
// Form alanının ortak kabuğu:
//   - Header (ikon + başlık + alt açıklama + durum rozeti)
//   - Adım göstergesi (steps prop'undan)
//   - Adım içeriği: children (kategoriye özel form gövdesi)
//   - Alt navigasyon (Geri / Sonraki) — son adımda Sonraki gizlenir.
//
// steps: [{ step: 1, title: "..." }, ...]
// ─────────────────────────────────────────────────────────────
import { ArrowLeft, ArrowRight, Check } from "lucide-react"

export default function FormShell({
                                      icon: Icon,
                                      title,
                                      subtitle,
                                      badge,             // { label, cls }  → sağ üst rozet
                                      steps = [],
                                      currentStep,
                                      onPrev,
                                      onNext,
                                      resetKey,          // içerik anahtarı (ör. `${condition}-${kategori}`) — değişince animasyon yeniler
                                      children,
                                  }) {
    const lastStep = steps.length || 3

    return (
        <>
            {/* Header */}
            <div className="border-b border-gray-200 px-6 pt-5 pb-4 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight flex items-center gap-2">
                            {Icon && <Icon className="w-5 h-5 text-purple-600" />} {title}
                        </h1>
                        {subtitle && (
                            <p className="text-gray-500 text-[11px] sm:text-xs font-medium mt-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {badge && (
                        <span className={`self-start sm:self-center text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded border ${badge.cls}`}>
              {badge.label}
            </span>
                    )}
                </div>
            </div>

            {/* Adım Göstergesi */}
            {steps.length > 0 && (
                <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 grid gap-2 text-center"
                     style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
                    {steps.map(s => {
                        const isActive = currentStep === s.step
                        const isPassed = currentStep > s.step
                        return (
                            <div key={s.step} className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                        isActive ? "bg-purple-600 text-white shadow-sm ring-4 ring-purple-50"
                                            : isPassed ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-400"
                                    }`}>
                                        {isPassed ? <Check size={12} className="stroke-[3]" /> : s.step}
                                    </div>
                                    <span className={`text-[11px] font-bold ${isActive ? "text-gray-800" : isPassed ? "text-green-900" : "text-gray-400"}`}>
                    {s.title}
                  </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Adım İçeriği */}
            <div className="p-6 space-y-6" key={resetKey}>
                {children}

                {/* Alt Navigasyon */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    {currentStep > 1 ? (
                        <button type="button" onClick={onPrev}
                                className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 rounded text-xs font-bold uppercase tracking-wider transition-all">
                            <ArrowLeft size={14} /> Geri Dön
                        </button>
                    ) : <div />}

                    {currentStep < lastStep ? (
                        <button type="button" onClick={onNext}
                                className="flex items-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ml-auto">
                            Sonraki Adım <ArrowRight size={14} />
                        </button>
                    ) : null}
                </div>
            </div>
        </>
    )
}