import { useState, useRef, useEffect } from "react"
import { BarChart2, Eye, Heart, CheckCircle2 } from "lucide-react"

// ─────────────────────────────────────────────────────────────
// OfferStatsButton.jsx
// Portföy listesindeki (VehicleListPage/RealEstateListPage) her satırda,
// düzenle/sil ikonlarından sonra gelen küçük "teklif istatistiği" ikonu.
// Tıklanınca bu portföy öğesine verilmiş tekliflerden kaçının
// değerlendirmede, kaçının favorilendiği, kaçının kabul edildiğini
// gösteren küçük bir popup açar. Sayılar PortfolioController::index()'in
// döndürdüğü offers_reviewing_count / offers_favorited_count /
// offers_accepted_count / offers_total_count alanlarından geliyor.
// ─────────────────────────────────────────────────────────────
export default function OfferStatsButton({ item, accent = "purple" }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (!open) return
        const onClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener("mousedown", onClick)
        return () => document.removeEventListener("mousedown", onClick)
    }, [open])

    const total      = item.offers_total_count ?? 0
    const reviewing  = item.offers_reviewing_count ?? 0
    const favorited  = item.offers_favorited_count ?? 0
    const accepted   = item.offers_accepted_count ?? 0

    // Tailwind JIT derleyicisi class isimlerini KAYNAKTA arıyor — runtime'da
    // parça parça birleştirilen (`hover:${x}`) class isimlerini bulamaz. Bu
    // yüzden her renk için TAM, literal class string'i ayrı ayrı yazılıyor.
    const buttonCls = accent === "amber"
        ? "relative w-7 h-7 rounded bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors"
        : "relative w-7 h-7 rounded bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors"
    const badgeCls = accent === "amber"
        ? "absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-600 text-white text-[7px] font-bold rounded-full flex items-center justify-center"
        : "absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-600 text-white text-[7px] font-bold rounded-full flex items-center justify-center"

    return (
        <div className="relative flex-shrink-0" ref={ref}>
            <button type="button" onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
                    title="Teklif istatistiği"
                    className={buttonCls}>
                <BarChart2 size={12} />
                {total > 0 && (
                    <span className={badgeCls}>
                        {total > 9 ? "9+" : total}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded shadow-lg z-20 overflow-hidden w-48">
                    <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Teklif İstatistiği</p>
                    </div>
                    <div className="p-2.5 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] px-1 py-1">
                            <span className="flex items-center gap-1.5 text-gray-500 font-bold">
                                <Eye size={11} className="text-amber-500" /> Değerlendirmede
                            </span>
                            <span className="font-bold text-gray-800">{reviewing}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] px-1 py-1">
                            <span className="flex items-center gap-1.5 text-gray-500 font-bold">
                                <Heart size={11} className="text-red-400" /> Favorilenen
                            </span>
                            <span className="font-bold text-gray-800">{favorited}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] px-1 py-1">
                            <span className="flex items-center gap-1.5 text-gray-500 font-bold">
                                <CheckCircle2 size={11} className="text-green-500" /> Kabul Edilen
                            </span>
                            <span className="font-bold text-gray-800">{accepted}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] px-1 py-1 border-t border-gray-50 pt-2 mt-0.5">
                            <span className="text-gray-400 font-bold">Toplam Teklif</span>
                            <span className="font-bold text-gray-700">{total}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
