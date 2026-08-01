import { useEffect } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { ChevronRight, ShieldCheck, ArrowLeft } from "lucide-react"
import Header from "@/components/layout/Header"

// PayTR iFrame API — checkout başlatıldığında backend'den dönen iframe_url
// (https://www.paytr.com/odeme/guvenli/{token}) burada bir <iframe> içinde
// gösteriliyor. Kullanıcı kartını girip ödemeyi PayTR'ın kendi arayüzünde
// tamamlıyor; sonuç PAYTR_OK_URL/PAYTR_FAIL_URL'e (bkz. backend .env) göre
// /odeme/basarili veya /odeme/basarisiz'e yönlendiriyor, gerçek aktivasyon
// ise PayTR'ın sunucu-sunucu callback'i ile arka planda gerçekleşiyor.
export default function CheckoutPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const { iframeUrl, returnTo } = location.state || {}

    useEffect(() => {
        if (!iframeUrl) {
            navigate(returnTo || "/abonelik", { replace: true })
        }
    }, [iframeUrl])

    if (!iframeUrl) return null

    return (
        <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">
            <Header />

            <main className="max-w-[900px] mx-auto w-full px-4 py-6 flex-1">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-4">
                    <Link to={returnTo || "/abonelik"} className="hover:text-purple-700 transition-colors">Abonelik & Kontör</Link>
                    <ChevronRight size={10} />
                    <span className="text-gray-700">Ödeme</span>
                </div>

                <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-purple-600" />
                            <p className="text-xs font-bold text-gray-700">PayTR Güvenli Ödeme</p>
                        </div>
                        <Link to={returnTo || "/abonelik"}
                              className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-purple-700 transition-colors uppercase tracking-wider">
                            <ArrowLeft size={11} /> Vazgeç
                        </Link>
                    </div>

                    <iframe
                        src={iframeUrl}
                        title="PayTR Ödeme"
                        frameBorder="0"
                        className="w-full"
                        style={{ minHeight: "640px" }}
                    />
                </div>

                <p className="text-[10px] text-gray-400 font-medium text-center mt-3">
                    Ödeme tamamlanana kadar bu sayfayı kapatmayın.
                </p>
            </main>
        </div>
    )
}
