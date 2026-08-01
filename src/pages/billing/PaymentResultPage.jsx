import { Link } from "react-router-dom"
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import Header from "@/components/layout/Header"

// Backend .env'deki PAYTR_OK_URL / PAYTR_FAIL_URL bu iki sayfaya işaret
// ediyor: FRONTEND_URL + /odeme/basarili | /odeme/basarisiz. Bunlar sadece
// kullanıcıyı bilgilendiren statik ekranlar — gerçek aktivasyon (abonelik
// açma / kontör ekleme) PayTR'ın ayrı, sunucu-sunucu callback isteğiyle
// (POST /api/payments/paytr/callback) arka planda gerçekleşiyor. Yani
// kullanıcı bu "başarılı" sayfasını görse bile aktivasyon PayTR'ın
// callback'i biraz gecikirse birkaç saniye geriden gelebilir.
export default function PaymentResultPage({ status = "success" }) {
    const isSuccess = status === "success"

    return (
        <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">
            <Header />

            <main className="max-w-[560px] mx-auto w-full px-4 py-16 flex-1 flex items-center">
                <div className="w-full bg-white border border-gray-200 rounded-sm shadow-sm p-8 text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
                        isSuccess ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    }`}>
                        {isSuccess ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                    </div>

                    <h1 className="text-lg font-bold text-gray-800 mb-2">
                        {isSuccess ? "Ödemeniz Alındı" : "Ödeme Tamamlanamadı"}
                    </h1>

                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
                        {isSuccess
                            ? "Ödemeniz başarıyla işleme alındı. Aboneliğiniz veya kontör bakiyeniz birkaç saniye içinde hesabınıza yansıyacak."
                            : "Kart bilgilerinizde bir sorun oluştu veya işlem iptal edildi. Bakiyenizden herhangi bir tutar çekilmedi, dilediğiniz zaman tekrar deneyebilirsiniz."}
                    </p>

                    <Link to={isSuccess ? "/abonelik" : "/abonelik"}
                          className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
                        {isSuccess ? "Abonelik & Kontör Sayfama Dön" : "Tekrar Dene"} <ArrowRight size={13} />
                    </Link>
                </div>
            </main>
        </div>
    )
}
