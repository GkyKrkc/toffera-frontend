import { useState } from "react"
import { CreditCard, Landmark, Loader2, Copy, Check, X, ShieldCheck } from "lucide-react"
import api from "@/lib/axios"
import { useToast } from "@/components/ui/Toast"

// Satın alma akışında "Kredi/Banka Kartı" (PayTR, mevcut davranış) ile
// "Havale/EFT" (yeni) arasında seçim yaptırır. Havale/EFT seçilirse
// şirketin aktif banka hesaplarını listeler, kullanıcı birini seçip
// isteğe bağlı bir not ekleyerek "bekleyen" bir ödeme talebi oluşturur —
// hak (abonelik/kontör) admin panelden elle onaylanınca aktif olur (bkz.
// backend PaymentResource "Onayla" aksiyonu).
//
// Sadece PricingPage'in /payment-methods isteğinde 'havale_eft' aktif
// dönerse gösterilir — kapalıyken satın alma akışı eskisi gibi doğrudan
// PayTR'a gider, bu modal hiç açılmaz.
export default function PaymentMethodModal({ type, code, onClose, onSelectPaytr }) {
    const toast = useToast()
    const [step, setStep] = useState("method") // method | bank | success
    const [bankAccounts, setBankAccounts] = useState([])
    const [selectedBankId, setSelectedBankId] = useState(null)
    const [note, setNote] = useState("")
    const [loadingBanks, setLoadingBanks] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState(null)
    const [copied, setCopied] = useState(false)

    const handleChooseHavale = async () => {
        setStep("bank")
        setLoadingBanks(true)
        try {
            const res = await api.get("/bank-accounts")
            const accounts = res.data.data || []
            setBankAccounts(accounts)
            if (accounts.length > 0) setSelectedBankId(accounts[0].id)
        } catch {
            toast({ message: "Banka hesapları yüklenemedi.", type: "error" })
        } finally {
            setLoadingBanks(false)
        }
    }

    const handleSubmitHavale = async () => {
        if (!selectedBankId) return
        setSubmitting(true)
        try {
            const endpoint = type === "subscription" ? "/subscription/checkout" : "/credit-packs/checkout"
            const res = await api.post(endpoint, {
                plan_code: code,
                payment_method: "havale_eft",
                bank_account_id: selectedBankId,
                note: note || undefined,
            })
            setResult(res.data)
            setStep("success")
        } catch (err) {
            toast({ message: err?.response?.data?.message || "Ödeme talebi oluşturulamadı.", type: "error" })
        } finally {
            setSubmitting(false)
        }
    }

    const handleCopyIban = (iban) => {
        navigator.clipboard?.writeText(iban.replace(/\s/g, ""))
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" onClick={!submitting ? onClose : undefined}>
            <div className="bg-white rounded-sm shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-800">
                        {step === "success" ? "Ödeme Talebiniz Alındı" : "Ödeme Yöntemi Seç"}
                    </p>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-4">
                    {step === "method" && (
                        <div className="space-y-2">
                            <button
                                onClick={onSelectPaytr}
                                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-sm hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                            >
                                <div className="w-9 h-9 bg-purple-50 border border-purple-100 rounded flex items-center justify-center text-purple-600 flex-shrink-0">
                                    <CreditCard size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-800">Kredi/Banka Kartı</p>
                                    <p className="text-[10px] text-gray-400 font-medium">PayTR güvenli ödeme, anında aktivasyon</p>
                                </div>
                            </button>
                            <button
                                onClick={handleChooseHavale}
                                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-sm hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                            >
                                <div className="w-9 h-9 bg-amber-50 border border-amber-100 rounded flex items-center justify-center text-amber-600 flex-shrink-0">
                                    <Landmark size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-800">Havale / EFT</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Banka hesabına transfer, onay sonrası aktivasyon</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {step === "bank" && (
                        loadingBanks ? (
                            <div className="py-8 flex justify-center"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
                        ) : bankAccounts.length === 0 ? (
                            <p className="text-xs font-semibold text-gray-500 text-center py-6">Şu anda aktif bir banka hesabı tanımlı değil.</p>
                        ) : (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    {bankAccounts.map(acc => (
                                        <label key={acc.id}
                                               className={`flex items-start gap-2 p-3 border rounded-sm cursor-pointer transition-colors ${selectedBankId === acc.id ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                                            <input type="radio" name="bank_account" className="mt-0.5"
                                                   checked={selectedBankId === acc.id}
                                                   onChange={() => setSelectedBankId(acc.id)} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-800">{acc.banka_adi}</p>
                                                <p className="text-[11px] text-gray-500 font-medium">{acc.hesap_sahibi}</p>
                                                <p className="text-[11px] text-gray-600 font-mono mt-0.5 break-all">{acc.iban}</p>
                                                {acc.aciklama && <p className="text-[10px] text-gray-400 font-medium mt-0.5">{acc.aciklama}</p>}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Not (opsiyonel)</label>
                                    <input value={note} onChange={e => setNote(e.target.value)} maxLength={255}
                                           placeholder="Gönderen adı vb."
                                           className="w-full mt-1 border border-gray-200 rounded-sm px-2.5 py-2 text-xs focus:outline-none focus:border-purple-400" />
                                </div>
                                <button onClick={handleSubmitHavale} disabled={submitting || !selectedBankId}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-xs font-bold uppercase tracking-wider text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-60 transition-colors">
                                    {submitting ? <><Loader2 size={13} className="animate-spin" /> Oluşturuluyor...</> : "Ödeme Talebi Oluştur"}
                                </button>
                            </div>
                        )
                    )}

                    {step === "success" && result && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-100 rounded-sm px-3 py-2">
                                <ShieldCheck size={14} className="flex-shrink-0" />
                                <p className="text-[11px] font-bold">Talebiniz alındı, ödeme onaylandığında hesabınız otomatik aktif edilecek.</p>
                            </div>
                            <div className="border border-gray-200 rounded-sm p-3 space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aşağıdaki hesaba transfer yapın</p>
                                <p className="text-xs font-bold text-gray-800">{result.bank_account.banka_adi}</p>
                                <p className="text-[11px] text-gray-500 font-medium">{result.bank_account.hesap_sahibi}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs font-mono text-gray-700">{result.bank_account.iban}</p>
                                    <button onClick={() => handleCopyIban(result.bank_account.iban)} className="text-purple-600 hover:text-purple-800">
                                        {copied ? <Check size={12} /> : <Copy size={12} />}
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-600 font-semibold mt-2">Tutar: {Number(result.amount).toLocaleString("tr-TR")} ₺</p>
                                <p className="text-[10px] text-gray-400 font-medium">Referans: Ödeme #{result.payment_id}</p>
                            </div>
                            <button onClick={onClose} className="w-full py-2.5 rounded text-xs font-bold uppercase tracking-wider text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                                Anladım
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
