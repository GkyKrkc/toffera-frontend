import { useEffect, useState } from "react"
import { X, Loader2, FileText } from "lucide-react"
import { fetchLegalDocuments } from "@/lib/legalDocuments.js"

/**
 * Tek bir yasal metnin (Kullanıcı Sözleşmesi, KVKK Aydınlatma Metni,
 * Açık Rıza Metni, Ticari Elektronik İleti Onayı) tam içeriğini gösteren
 * modal. AuthPage.jsx (kayıt formu) ve LegalReconsentGate.jsx tarafından
 * kullanılır — ikisi de aynı GET /legal-documents'ı (modül-seviyeli
 * cache'li) paylaşır.
 *
 * Props:
 * - type: gösterilecek belgenin type değeri (ör. "kvkk_disclosure")
 * - onClose: kapatılınca çağrılır
 */
export default function LegalDocumentModal({ type, onClose }) {
    const [doc, setDoc] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!type) return
        let cancelled = false
        setLoading(true)
        setError(false)

        fetchLegalDocuments()
            .then(docs => {
                if (cancelled) return
                const found = docs.find(d => d.type === type)
                if (!found) { setError(true); return }
                setDoc(found)
            })
            .catch(() => { if (!cancelled) setError(true) })
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [type])

    if (!type) return null

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-sm shadow-2xl flex flex-col overflow-hidden">

                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <FileText size={15} className="text-purple-600 flex-shrink-0" />
                        <h3 className="font-bold text-gray-800 text-sm truncate">{doc?.title || "Yasal Metin"}</h3>
                        {doc?.version && (
                            <span className="text-[9px] font-bold text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-1.5 py-0.5 flex-shrink-0">
                                v{doc.version}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 flex-shrink-0">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-gray-400">
                            <Loader2 size={20} className="animate-spin" />
                        </div>
                    ) : error ? (
                        <p className="text-xs text-red-500 text-center py-10">Metin yüklenemedi, lütfen tekrar deneyin.</p>
                    ) : (
                        <pre className="whitespace-pre-wrap break-words font-sans text-xs text-gray-700 leading-relaxed">
                            {doc?.body}
                        </pre>
                    )}
                </div>

                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-right">
                    <button onClick={onClose}
                            className="text-xs font-bold uppercase tracking-wider text-purple-700 hover:text-purple-800 px-3 py-1.5">
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    )
}
