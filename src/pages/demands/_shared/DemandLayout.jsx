// ─────────────────────────────────────────────────────────────
// DemandLayout.jsx
// Tüm talep kategorilerinin ortak 3-parçalı grid iskeleti.
//   Sol grid (3 kolon)  : left  slot  → Sıfır/2.El + widget'lar
//   Orta      (8 kolon)  : form  slot  → kategoriye özel form
//   Sağ grid  (4 kolon)  : right slot  → özet / tamamlanma / ipuçları
//
// Sadece yerleşimden sorumlu; içerik bilmez. Slot'lar props ile gelir.
// ─────────────────────────────────────────────────────────────
import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import Header from "@/components/layout/Header.jsx"

export default function DemandLayout({ breadcrumb, left, form, right }) {
    return (
        <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">
            <Header />

            <main className="max-w-[1200px] mx-auto w-full px-4 py-6 flex-1">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400 mb-6" aria-label="Breadcrumb">
                    <Link to="/" className="hover:text-purple-700 transition-colors">Anasayfa</Link>
                    <ChevronRight size={12} className="text-gray-300" />
                    <Link to="/dashboard" className="hover:text-purple-700 transition-colors">Panelim</Link>
                    <ChevronRight size={12} className="text-gray-300" />
                    <span className="text-gray-600">{breadcrumb || "Talep Oluştur"}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* SOL (3 Kolon) */}
                    <div className="lg:col-span-3 order-3 lg:order-1">
                        <div className="space-y-4 sticky top-4">
                            {left}
                        </div>
                    </div>

                    {/* ORTA & SAĞ (9 Kolon) */}
                    <div className="lg:col-span-9 order-1 lg:order-2">
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                            {/* Form (8 Sütun) */}
                            <main className="xl:col-span-8 bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                {form}
                            </main>

                            {/* Sağ (4 Sütun) */}
                            <div className="xl:col-span-4">
                                <div className="space-y-4 sticky top-4">
                                    {right}
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}