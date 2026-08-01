// ─────────────────────────────────────────────────────────────
// DemandSuccess.jsx
// Talep başarıyla gönderildikten sonra gösterilen ortak başarı ekranı.
//   - Onay mesajı + moderasyon (kontrol) bilgisi
//   - Sistem talep numarası + küçük özet bilgiler
//   - 10 → 0 geri sayım sonrası otomatik yönlendirme
//
// Tüm kategoriler (araç, emlak, ...) aynı ekranı kullanır.
// index.jsx submit başarılı olunca bu bileşeni render eder.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, Clock, Hash, ArrowRight, ShieldCheck, Copy, Check } from "lucide-react"

export default function DemandSuccess({
                                          demandNo,                    // sistem talep numarası (ör. "TM-2026-018342")
                                          title,                       // talep başlığı
                                          info = [],                   // [{ label, value }] küçük bilgi satırları
                                          redirectTo = "/",            // yönlendirilecek yol
                                          redirectSeconds = 10,
                                          categoryLabel = "Talebiniz", // "Araç talebiniz" / "Gayrimenkul talebiniz"
                                      }) {
    const navigate = useNavigate()
    const [remaining, setRemaining] = useState(redirectSeconds)
    const [copied, setCopied] = useState(false)
    const timerRef = useRef(null)

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setRemaining(r => {
                if (r <= 1) {
                    clearInterval(timerRef.current)
                    navigate(redirectTo)
                    return 0
                }
                return r - 1
            })
        }, 1000)
        return () => clearInterval(timerRef.current)
    }, [])

    const goNow = () => {
        clearInterval(timerRef.current)
        navigate(redirectTo)
    }

    const copyNo = async () => {
        try {
            await navigator.clipboard.writeText(demandNo || "")
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch { /* pano erişimi yoksa sessiz geç */ }
    }

    const pct = ((redirectSeconds - remaining) / redirectSeconds) * 100

    return (
        <div className="max-w-lg mx-auto py-10 px-4">
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">

                {/* Üst — onay */}
                <div className="px-6 pt-8 pb-6 text-center border-b border-gray-100 bg-gradient-to-b from-green-50/60 to-white">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center ring-8 ring-green-50">
                        <CheckCircle2 size={34} className="text-green-600" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                        {categoryLabel} başarıyla alındı
                    </h1>
                    <p className="text-[13px] text-gray-500 font-medium mt-2 leading-relaxed max-w-sm mx-auto">
                        Talebiniz yayınlanmak üzere <span className="font-bold text-gray-700">inceleme kuyruğuna</span> alındı.
                        Editör ekibimizin kontrolünden geçtikten sonra, kriterlerinize uyan onaylı profesyonellerin
                        karşısına çıkacak ve teklif almaya başlayacaksınız.
                    </p>
                </div>

                {/* Orta — talep no + bilgiler */}
                <div className="px-6 py-5 space-y-4">
                    {demandNo && (
                        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-sm px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center flex-shrink-0">
                                    <Hash size={15} className="text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Sistem Talep Numarası</p>
                                    <p className="text-sm font-bold text-gray-800 tracking-wide">{demandNo}</p>
                                </div>
                            </div>
                            <button type="button" onClick={copyNo}
                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 hover:text-purple-900 px-2.5 py-1.5 rounded hover:bg-purple-50 transition-colors">
                                {copied ? <><Check size={12} /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
                            </button>
                        </div>
                    )}

                    {title && (
                        <div className="bg-white border border-gray-100 rounded-sm px-4 py-3">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Talep Başlığı</p>
                            <p className="text-[13px] font-bold text-gray-800 leading-snug">{title}</p>
                        </div>
                    )}

                    {info.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                            {info.map((it, i) => (
                                <div key={i} className="bg-gray-50 border border-gray-100 rounded px-3 py-2">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{it.label}</p>
                                    <p className="text-[12px] font-bold text-gray-800 truncate">{it.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
                        <Clock size={16} className="text-amber-600 flex-shrink-0" />
                        <div>
                            <p className="text-[11px] font-bold text-amber-900">Durum: İnceleme Bekliyor</p>
                            <p className="text-[10px] text-amber-700 font-medium">Onaylandığında panelinizden ve bildirimlerden haberdar olacaksınız.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold justify-center">
                        <ShieldCheck size={12} className="text-green-500" />
                        Talebiniz güvenli şekilde kaydedildi
                    </div>
                </div>

                {/* Alt — geri sayım + yönlendirme */}
                <div className="px-6 pt-4 pb-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-bold text-gray-500">
                            <span className="text-gray-800 font-bold">{remaining}</span> saniye içinde anasayfaya yönlendirileceksiniz
                        </p>
                        <button type="button" onClick={goNow}
                                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-700 hover:text-white hover:bg-purple-700 border border-purple-200 hover:border-purple-700 px-3 py-1.5 rounded transition-all">
                            Şimdi Git <ArrowRight size={13} />
                        </button>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full transition-all duration-1000 ease-linear" style={{ width: pct + "%" }} />
                    </div>
                </div>

            </div>
        </div>
    )
}