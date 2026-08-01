import { useState, useEffect, useRef } from "react"
import { Landmark, Phone, ShieldCheck, AlertCircle, Loader2, RefreshCw, CheckCircle } from "lucide-react"

/**
 * https://teklifmeydani.com/bayilik — bayi sahibi / departman personeli
 * için ayrı, markalı SMS OTP giriş sayfası. Diğer sayfalardan FARKLI
 * olarak lib/axios.js (Bearer token tabanlı) KULLANILMIYOR — bu sayfa
 * gerçek bir Laravel SESSION'ı (Filament /admin panelinin kullandığı
 * 'web' guard) kuruyor, token değil.
 *
 * AKIŞ (bkz. backend: routes/web.php + BayilikAuthController):
 *   1) Sayfa açılışında GET /api/bayilik/csrf → session başlar + CSRF token alınır.
 *   2) "Kod Gönder" → fetch POST /api/bayilik/send-otp (credentials:include, X-CSRF-TOKEN header).
 *   3) "Giriş Yap" → GERÇEK native <form> POST /api/bayilik/verify-otp — fetch DEĞİL,
 *      çünkü backend başarılıysa redirect('/admin') döner ve tarayıcının bu
 *      yönlendirmeyi TAKİP EDİP session cookie'sini /admin'e taşıması gerekiyor.
 */
export default function BayilikLoginPage() {
    const [csrfToken, setCsrfToken] = useState(null)
    const [csrfReady, setCsrfReady] = useState(false)

    const [step, setStep] = useState(0) // 0: telefon, 1: OTP
    const [phone, setPhone] = useState("")
    const [otp, setOtp] = useState(["", "", "", "", "", ""])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [debugOtp, setDebugOtp] = useState(null)
    const [countdown, setCountdown] = useState(0)

    const formRef = useRef(null)
    const otpRefs = useRef([])

    // Redirect sonrası geri dönen hata (?error=...) — bkz. BayilikAuthController::verifyOtp
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const err = params.get("error")
        if (err) {
            setError(err)
            setStep(1) // kullanıcı zaten OTP adımındaydı, orada kalsın
        }
    }, [])

    // Session'ı başlat + CSRF token al
    useEffect(() => {
        fetch("/api/bayilik/csrf", { credentials: "include" })
            .then((r) => r.json())
            .then((data) => {
                setCsrfToken(data.csrf_token)
                setCsrfReady(true)
            })
            .catch(() => setError("Sunucuya bağlanılamadı. Sayfayı yenileyip tekrar deneyin."))
    }, [])

    useEffect(() => {
        if (countdown <= 0) return
        const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000)
        return () => clearInterval(t)
    }, [countdown])

    const handlePhoneChange = (e) => {
        const digits = e.target.value.replace(/\D/g, "")
        if (digits.startsWith("0")) return
        if (digits.length <= 10) setPhone(digits)
    }

    const isPhoneValid = phone.length === 10 && phone.startsWith("5")

    async function sendOtp() {
        if (!isPhoneValid || !csrfReady) return
        setLoading(true)
        setError(null)

        try {
            const res = await fetch("/api/bayilik/send-otp", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ phone: `0${phone}` }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.message || "Kod gönderilemedi.")
                if (data.seconds) setCountdown(data.seconds)
                return
            }

            setDebugOtp(data.debug_otp || null)
            setCountdown(60)
            setStep(1)
            setOtp(["", "", "", "", "", ""])
            setTimeout(() => otpRefs.current[0]?.focus(), 50)
        } catch {
            setError("Sunucuya bağlanılamadı. Tekrar deneyin.")
        } finally {
            setLoading(false)
        }
    }

    function handleOtpChange(i, val) {
        const digit = val.replace(/\D/g, "").slice(-1)
        const next = [...otp]
        next[i] = digit
        setOtp(next)
        if (digit && i < 5) otpRefs.current[i + 1]?.focus()
    }

    function handleOtpKeyDown(i, e) {
        if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
    }

    const otpValue = otp.join("")
    const otpComplete = otpValue.length === 6

    // "Giriş Yap" butonuna basınca formu native submit ediyoruz — bkz. dosya
    // başındaki akış açıklaması. React burada preventDefault YAPMIYOR.
    function handleSubmit(e) {
        if (!otpComplete || !csrfReady) {
            e.preventDefault()
            return
        }
        // formRef üzerinden gerçek tarayıcı POST'u devam eder.
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40 mb-3">
                        <Landmark size={26} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Teklif Meydanı Bayilik</h1>
                    <p className="text-sm text-indigo-200/70 mt-1">Bayi ve departman personeli girişi</p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
                    {error && (
                        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2.5">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {step === 0 && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Telefon Numarası</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none">
                                        <Phone size={15} className="text-gray-400" />
                                        <span className="text-sm font-bold text-gray-500 border-r border-gray-200 pr-2 mr-1">0</span>
                                    </div>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="5XX XXX XX XX"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        className="w-full pl-16 pr-10 py-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white text-sm outline-none focus:ring-4 focus:ring-purple-500/20 transition-all"
                                        autoFocus
                                    />
                                    {isPhoneValid && <CheckCircle size={15} className="absolute right-3 text-emerald-500 pointer-events-none" />}
                                </div>
                                <p className="text-xs text-gray-400">Sadece bayi ve bayilik personeli hesapları giriş yapabilir.</p>
                            </div>

                            <button
                                type="button"
                                disabled={!isPhoneValid || loading || !csrfReady}
                                onClick={sendOtp}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                Kod Gönder
                            </button>
                        </div>
                    )}

                    {step === 1 && (
                        <form ref={formRef} action="/api/bayilik/verify-otp" method="POST" onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <input type="hidden" name="_token" value={csrfToken || ""} />
                            <input type="hidden" name="phone" value={`0${phone}`} />
                            {/* otp alanları gizli input'lara toplanır, aşağıdaki tek-haneli
                                kutular sadece görsel/kullanım kolaylığı için */}
                            <input type="hidden" name="otp" value={otpValue} />

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">
                                    <span className="font-bold">0{phone}</span> numarasına gelen 6 haneli kodu girin
                                </label>
                                <div className="flex gap-2 justify-between">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => (otpRefs.current[i] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className="w-11 h-12 text-center text-lg font-bold border border-gray-300 rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-4 focus:ring-purple-500/20 transition-all"
                                        />
                                    ))}
                                </div>
                                {debugOtp && (
                                    <p className="text-xs text-amber-600 mt-1">Test kodu: <span className="font-mono font-bold">{debugOtp}</span></p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={!otpComplete || !csrfReady}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                            >
                                <ShieldCheck size={16} />
                                Giriş Yap
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep(0); setError(null); }}
                                className="text-xs text-gray-400 hover:text-gray-600 self-center"
                            >
                                Numarayı değiştir
                            </button>

                            <button
                                type="button"
                                disabled={countdown > 0 || loading}
                                onClick={sendOtp}
                                className="text-xs text-purple-600 hover:text-purple-700 disabled:text-gray-300 self-center flex items-center gap-1"
                            >
                                <RefreshCw size={11} />
                                {countdown > 0 ? `Tekrar gönder (${countdown}s)` : "Kodu tekrar gönder"}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-indigo-200/50 mt-6">
                    Bayilik başvurusu yapmak için <a href="/account?tab=dealer" className="underline hover:text-indigo-100">Teklif Meydanı</a> hesabınızdan başvurabilirsiniz.
                </p>
            </div>
        </div>
    )
}
