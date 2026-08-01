// ─────────────────────────────────────────────────────────────
// realestate/right.jsx
// Sağ grid içeriği: emlağa özel özet + tamamlanma kontrolleri + ipuçları.
// Ortak RightPanel kabuğunu kullanır.
// ─────────────────────────────────────────────────────────────
import { Zap, Shield, AlertTriangle } from "lucide-react"
import RightPanel from "@/pages/demands/_shared/RightPanel"
import { katLabelOf, islemLabelOf } from "./realEstateConfig"

export default function RealEstateRight({ condition, kategori, islemTipi, il, ilce, mahalleler, maxBudget, duration, features, uploadFile }) {
    const katLabel = katLabelOf(kategori).split(" ")[0]
    const islemLabel = islemLabelOf(islemTipi)

    const checks = [
        { ok: !!islemTipi, label: "İşlem tipi seçildi", warn: "İşlem tipi seçilmedi" },
        { ok: !!kategori, label: "Gayrimenkul kategorisi seçildi", warn: "Kategori seçilmedi" },
        { ok: !!il, label: "Şehir seçildi", warn: "Şehir seçilmedi" },
        { ok: !!ilce, label: "İlçe seçildi", warn: "İlçe seçilmedi" },
        { ok: !!features.oda_sayisi || kategori === "arsa", label: "Oda sayısı girildi", warn: "Oda sayısı belirtilmedi" },
        { ok: !!features.metrekare, label: "Metrekare girildi", warn: "Metrekare belirtilmedi" },
        { ok: !!maxBudget && Number(maxBudget) > 0, label: "Maksimum bütçe belirlendi", warn: "Bütçe girilmedi" },
        { ok: !!duration.expires_at, label: "Yayım süresi belirlendi", warn: "Yayım süresi seçilmedi" },
    ]

    const tips = [
        { icon: <Zap size={12} />, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", text: "İlçe ve mahalle seçimi, yerel uzmanlığı olan brokerları öncelikli uyandırır." },
        { icon: <AlertTriangle size={12} />, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", text: "Kabul edilemez kriterler, bütçenizi çalacak gereksiz portföyleri eler." },
        { icon: <Shield size={12} />, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", text: "Kredi uygunluğu ve tapu durumunu belirtmeniz mülk sahiplerinin dikkatini çeker." },
    ]

    const mahStr = (mahalleler || []).length
        ? (mahalleler.length <= 2 ? mahalleler.join(", ") : `${mahalleler.slice(0, 2).join(", ")} +${mahalleler.length - 2}`)
        : ""

    const summary = (
        <>
            <div className="bg-white/80 border border-purple-200/50 rounded px-3.5 py-3">
                <p className="text-[9px] font-bold text-purple-800 uppercase tracking-wider mb-1">Mülk Tipi ve İşlem</p>
                <p className="text-xs font-bold text-gray-800 leading-snug">
                    {[islemLabel, condition === "sifir" ? "Sıfır Proje" : "2. El", katLabel].filter(Boolean).join(" · ") || <span className="text-gray-400 font-semibold">Kategori ve işlem tipi seçin</span>}
                </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/80 border border-purple-200/50 rounded px-3 py-2.5">
                    <p className="text-[9px] font-bold text-purple-800 uppercase tracking-wider mb-1">Maks. Bütçe</p>
                    <p className="text-xs font-bold text-green-800">{maxBudget ? Number(maxBudget).toLocaleString("tr-TR") + " ₺" : <span className="text-gray-400 font-semibold">—</span>}</p>
                </div>
                <div className="bg-white/80 border border-purple-200/50 rounded px-3 py-2.5">
                    <p className="text-[9px] font-bold text-purple-800 uppercase tracking-wider mb-1">Lokasyon</p>
                    <p className="text-xs font-bold text-gray-800 truncate">{il ? `${il} / ${ilce || "..."}` : <span className="text-gray-400 font-semibold">—</span>}</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {features.oda_sayisi && <span className="text-[10px] font-bold bg-white/80 border border-purple-200 text-gray-700 px-2.5 py-1 rounded">{features.oda_sayisi}</span>}
                {features.metrekare && <span className="text-[10px] font-bold bg-white/80 border border-purple-200 text-gray-700 px-2.5 py-1 rounded">{features.metrekare} m²</span>}
                {features.bina_yasi && <span className="text-[10px] font-bold bg-white/80 border border-purple-200 text-gray-700 px-2.5 py-1 rounded">Bina: {features.bina_yasi}</span>}
                {mahStr && <span className="text-[10px] font-bold bg-purple-100 text-purple-950 border border-purple-200 px-2.5 py-1 rounded">{mahStr}</span>}
                {uploadFile && <span className="text-[10px] font-bold bg-green-100 text-green-950 border border-green-200 px-2.5 py-1 rounded">Belge Eklendi</span>}
            </div>
        </>
    )

    return <RightPanel summaryTitle="Gayrimenkul Talep Özeti" summary={summary} checks={checks} tips={tips} />
}