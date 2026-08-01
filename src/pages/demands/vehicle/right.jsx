// ─────────────────────────────────────────────────────────────
// vehicle/right.jsx
// Sağ grid içeriği: araca özel özet + tamamlanma kontrolleri + ipuçları.
// Ortak RightPanel kabuğunu kullanır.
// ─────────────────────────────────────────────────────────────
import { Zap, Shield, AlertTriangle } from "lucide-react"
import RightPanel from "@/pages/demands/_shared/RightPanel"
import { katLabelOf } from "./vehicleConfig"

export default function VehicleRight({ condition, kategori, selBrand, selModel, maxBudget, duration, features, uploadFile }) {
    const katLabel = katLabelOf(kategori)
    const boya_tipi = features.boya_degisen_tipi || "boyasiz_degisensiz"

    const checks = [
        { ok: !!kategori, label: "Kategori seçildi", warn: "Kategori seçilmedi" },
        { ok: !!selBrand, label: "Marka seçildi", warn: "Marka zorunlu" },
        { ok: !!selModel, label: "Model seçildi", warn: "Model seçilmedi" },
        { ok: !!features.yil, label: "Yıl belirlendi", warn: "Model yılı belirtilmedi" },
        ...(condition === "ikinci_el" ? [
            { ok: !!features.km, label: "KM aralığı belirlendi", warn: "KM belirtilmedi" },
        ] : []),
        { ok: !!maxBudget && Number(maxBudget) > 0, label: "Bütçe girildi", warn: "Bütçe girilmedi" },
        { ok: !!duration.expires_at, label: "İlan süresi belirlendi", warn: "Süre seçilmedi" },
    ]

    const tips = [
        { icon: <Zap size={12} />, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", text: "Marka + model + donanım üçlüsü galericilere net eşleşme puanı verir." },
        { icon: <AlertTriangle size={12} />, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", text: "Kabul edilemez durumlar istemediğiniz teklifleri baştan filtreler." },
        { icon: <Shield size={12} />, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", text: "Ekspertiz raporu yüklemek satıcılara ciddiyet sinyali verir." },
    ]

    const summary = (
        <>
            <div className="bg-white/80 border border-purple-200/50 rounded px-3.5 py-3">
                <p className="text-[9px] font-bold text-purple-800 uppercase tracking-wider mb-1">Araç Tipi ve Durum</p>
                <p className="text-xs font-bold text-gray-800 leading-snug">
                    {[condition === "sifir" ? "Sıfır" : "2. El", katLabel, selBrand, selModel].filter(Boolean).join(" · ") || <span className="text-gray-400 font-semibold">Kategori & marka seçin</span>}
                </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/80 border border-purple-200/50 rounded px-3 py-2.5">
                    <p className="text-[9px] font-bold text-purple-800 uppercase tracking-wider mb-1">Maks. Bütçe</p>
                    <p className="text-xs font-bold text-green-800">{maxBudget ? Number(maxBudget).toLocaleString("tr-TR") + " ₺" : <span className="text-gray-400 font-semibold">—</span>}</p>
                </div>
                <div className="bg-white/80 border border-purple-200/50 rounded px-3 py-2.5">
                    <p className="text-[9px] font-bold text-purple-800 uppercase tracking-wider mb-1">Süre</p>
                    <p className="text-xs font-bold text-gray-800">{duration.duration_hours ? duration.duration_hours / 24 + " Gün" : <span className="text-gray-400 font-semibold">—</span>}</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {features.yil && <span className="text-[10px] font-bold bg-white/80 border border-purple-200 text-gray-700 px-2.5 py-1 rounded">{features.yil}</span>}
                {features.km && <span className="text-[10px] font-bold bg-white/80 border border-purple-200 text-gray-700 px-2.5 py-1 rounded">{features.km}</span>}
                {boya_tipi === "boyasiz_degisensiz" && condition === "ikinci_el" && <span className="text-[10px] font-bold bg-green-100 text-green-950 border border-green-200 px-2.5 py-1 rounded">Boyasız</span>}
                {boya_tipi === "agir_hasarli" && <span className="text-[10px] font-bold bg-red-100 text-red-950 border border-red-200 px-2.5 py-1 rounded">Ağır Hasarlı</span>}
                {uploadFile && <span className="text-[10px] font-bold bg-green-100 text-green-950 border border-green-200 px-2.5 py-1 rounded">Ekspertiz Eklendi</span>}
            </div>
        </>
    )

    return <RightPanel summaryTitle="Araç Talep Özeti" summary={summary} checks={checks} tips={tips} />
}