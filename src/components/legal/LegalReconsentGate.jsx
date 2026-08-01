import { useState } from "react"
import { ShieldAlert, FileText, Loader2 } from "lucide-react"
import { useAuth } from "@/store/AuthContext.jsx"
import api from "@/lib/axios.js"
import LegalDocumentModal from "./LegalDocumentModal.jsx"

/**
 * Zorunlu bir yasal metin (Kullanıcı Sözleşmesi / KVKK Aydınlatma Metni)
 * admin panelden güncellendiğinde, giriş yapmış kullanıcıyı tam ekran
 * bloke eden onay ekranı. /me (bkz. AuthController::userResponse())
 * user.pending_consents doluysa devreye girer — App.jsx'te <Routes>'un
 * yanına, AuthProvider içine monte edilir, her sayfanın üstünde görünür.
 *
 * Mevcut (bu özellikten önce kaydolmuş) kullanıcılar için de doğal olarak
 * çalışır: hiç onay kaydı yoksa pending_consents dolu gelir, bir kez
 * onaylayınca bir daha görünmez.
 */
export default function LegalReconsentGate() {
    const { user, isAuthenticated, refreshUser } = useAuth()
    const [viewingType, setViewingType] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const pending = user?.pending_consents || []

    if (!isAuthenticated || pending.length === 0) return null

    const handleAccept = async () => {
        setSubmitting(true)
        try {
            await api.post("/user/legal-consents", { types: pending.map(p => p.type) })
            await refreshUser()
        } catch {
            // sessizce yut — kullanıcı tekrar dener, pending_consents state'ten düşmediyse ekran açık kalır
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
            <div className="w-full max-w-md bg-white rounded-sm shadow-2xl overflow-hidden">
                <div className="px-5 py-4 bg-amber-50 border-b border-amber-100 flex items-center gap-2.5">
                    <ShieldAlert size={18} className="text-amber-600 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">Güncellenen Metinleri Onaylayın</h3>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">Devam edebilmeniz için aşağıdaki metinleri tekrar onaylamanız gerekiyor.</p>
                    </div>
                </div>

                <div className="p-5 space-y-2">
                    {pending.map(doc => (
                        <button key={doc.type} type="button" onClick={() => setViewingType(doc.type)}
                                className="w-full flex items-center gap-2.5 p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-sm transition-colors text-left">
                            <FileText size={14} className="text-purple-600 flex-shrink-0" />
                            <span className="text-xs font-bold text-gray-700 flex-1">{doc.title}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Oku</span>
                        </button>
                    ))}
                </div>

                <div className="px-5 pb-5">
                    <button onClick={handleAccept} disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-60 text-white py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all">
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        {submitting ? "İşleniyor..." : "Okudum, Kabul Ediyorum"}
                    </button>
                </div>

                {viewingType && (
                    <LegalDocumentModal type={viewingType} onClose={() => setViewingType(null)} />
                )}
            </div>
        </div>
    )
}
