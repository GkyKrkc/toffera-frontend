// ─────────────────────────────────────────────────────────────
// vehicle/left.jsx
// Sol grid içeriği: durum seçici (ortak LeftPanel) + araca özel widget'lar.
// ─────────────────────────────────────────────────────────────
import { Store, RotateCcw, Landmark, TrendingUp, HelpCircle } from "lucide-react"
import LeftPanel from "@/pages/demands/_shared/LeftPanel"

const VEHICLE_CONDITIONS = [
    { id: "sifir", label: "Sıfır Araç", icon: Store, color: "#7e22ce", desc: "Plaza & yetkili bayi teklifleri" },
    { id: "ikinci_el", label: "2. El Araç", icon: RotateCcw, color: "#94a3b8", desc: "Galeri & vasıta danışmanları" },
]

export default function VehicleLeft({ condition, onConditionChange }) {
    return (
        <LeftPanel
            title="Araç Talebi"
            subtitle="Talep türünü seçin"
            condition={condition}
            onConditionChange={onConditionChange}
            conditions={VEHICLE_CONDITIONS}
        >
            {/* Taşıt Kredisi Limit Rehberi */}
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-2">
                    <Landmark size={15} className="text-gray-700" />
                    <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Taşıt Kredisi Limit Rehberi</h2>
                </div>
                <div className="p-4 space-y-3">
                    <div className="p-3 bg-purple-50/50 rounded border border-purple-100">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-gray-600 uppercase">Fatura Değeri</span>
                            <span className="text-xs font-bold text-purple-950">BDDK Azami Limit</span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed">
                            Taşıt kredisinde kullanabileceğiniz azami oran ve vade, aracın fatura / kasko değerine göre kademeli olarak belirlenir.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[11px] border-b border-gray-100 pb-1">
                            <span className="text-gray-500 font-semibold">Alt Segment Araçlar</span>
                            <span className="font-bold text-gray-800">%70'e kadar kredi</span>
                        </div>
                        <div className="flex justify-between text-[11px] border-b border-gray-100 pb-1">
                            <span className="text-gray-500 font-semibold">Orta Segment Araçlar</span>
                            <span className="font-bold text-gray-800">%50'ye kadar kredi</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500 font-semibold">Üst Segment Araçlar</span>
                            <span className="font-bold text-gray-800">%20-30 · kısa vade</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vasıta Pazar Endeksi */}
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-2">
                    <TrendingUp size={15} className="text-green-600" />
                    <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Vasıta Pazar Endeksi</h2>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-green-600 text-xs font-bold flex-shrink-0">1.</div>
                        <div>
                            <p className="text-xs font-bold text-gray-800">{condition === "sifir" ? "Sıfır Araç Teslim Süreleri" : "2. El Talep Yoğunluğu"}</p>
                            <p className="text-[10px] text-gray-500 font-semibold">{condition === "sifir" ? "Stoktan teslim modellerde bekleme süresi kısaldı." : "Düşük km ve boyasız araç talepleri hızla eşleşiyor."}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center text-purple-600 text-xs font-bold flex-shrink-0">2.</div>
                        <div>
                            <p className="text-xs font-bold text-gray-800">Hibrit & Elektrikli Trendi</p>
                            <p className="text-[10px] text-gray-500 font-semibold">Hibrit ve elektrikli araç talepleri pazarda payını artırıyor.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nasıl Çalışır? */}
            <div className="bg-gray-900 border border-gray-800 rounded-sm overflow-hidden shadow-sm text-white">
                <div className="border-b border-gray-800 px-4 py-3 flex items-center gap-2">
                    <HelpCircle size={15} className="text-amber-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wide">TeklifMeydanı Nasıl Çalışır?</h2>
                </div>
                <div className="p-4 space-y-3 text-[11px] text-gray-300">
                    <div className="space-y-1">
                        <p className="font-bold text-white">1. Kriterleri Netleştirin</p>
                        <p className="leading-relaxed">Marka, model, bütçe ve kabul etmeyeceğiniz durumları forma girin.</p>
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold text-white">2. Nokta Atışı Eşleşin</p>
                        <p className="leading-relaxed">Talebiniz sistemdeki onaylı galeri, plaza ve vasıta danışmanlarına iletilir.</p>
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold text-white">3. Teklifleri Karşılaştırın</p>
                        <p className="leading-relaxed">Kriterlerinize tam uyan araçlardan gelen teklifleri değerlendirin.</p>
                    </div>
                </div>
            </div>
        </LeftPanel>
    )
}