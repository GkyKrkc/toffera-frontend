// ─────────────────────────────────────────────────────────────
// RightPanel.jsx
// Sağ grid ortak kabuğu (3 kart):
//   1. Talep Özeti      → gradient kart; iç içeriği `summary` slot'u ile gelir.
//   2. Tamamlanma Oranı → `checks` dizisinden yüzde + liste otomatik üretilir.
//   3. Eşleşme İpuçları → `tips` dizisi.
//
// checks: [{ ok: bool, label: "...", warn: "..." }]
// tips:   [{ icon, color, bg, text }]
// ─────────────────────────────────────────────────────────────
import { CheckCircle2, Clock, Zap } from "lucide-react"

export default function RightPanel({ summaryTitle = "Talep Özeti", summary, checks = [], tips = [] }) {
    const pct = checks.length ? Math.round(checks.filter(c => c.ok).length / checks.length * 100) : 0

    return (
        <>
            {/* 1. Dinamik Canlı Kart */}
            <div className="rounded-sm overflow-hidden border border-purple-200 shadow-sm"
                 style={{ background: "linear-gradient(135deg, #fefefe 0%, #faf5ff 60%, #f3e8ff 100%)" }}>
                <div className="border-b border-purple-200/60 px-4 pt-3.5 pb-3">
                    <h2 className="text-xs font-bold text-purple-950 uppercase tracking-wider">{summaryTitle}</h2>
                    <p className="text-purple-700 text-[10px] font-bold mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block animate-pulse" />Anlık Canlı Ön İzleme
                    </p>
                </div>
                <div className="p-4 space-y-3">
                    {summary}
                </div>
            </div>

            {/* 2. Doluluk Oranı & Kontrol Listesi */}
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                <div className="border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Form Tamamlanma Oranı</h2>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pct === 100 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-green-500" : "bg-purple-600"}`} style={{ width: pct + "%" }} />
                    </div>
                </div>
                <div className="p-3 space-y-1.5">
                    {checks.map((item, i) => (
                        <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded border text-[11px] font-semibold transition-all ${item.ok ? "bg-green-50/50 border-green-100 text-green-900" : "bg-gray-50 border-gray-100 text-gray-400"}`}>
                            {item.ok ? <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" /> : <Clock size={13} className="text-gray-300 flex-shrink-0" />}
                            {item.ok ? item.label : item.warn}
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Eşleşme İpuçları */}
            {tips.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-sm overflow-hidden shadow-sm">
                    <div className="p-4 space-y-3">
                        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Zap size={14} className="text-amber-400" /> Eşleşme Puanı İpuçları
                        </h2>
                        {tips.map((tip, i) => (
                            <div key={i} className={`flex items-start gap-2.5 p-3 rounded border ${tip.bg}`}>
                                <span className={`flex-shrink-0 mt-0.5 ${tip.color}`}>{tip.icon}</span>
                                <p className="text-[10px] text-gray-300 font-medium leading-relaxed">{tip.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}