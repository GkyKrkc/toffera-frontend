import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Phone, Lock, Eye, EyeOff, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/store/AuthContext"
import { useToast } from "@/components/ui/Toast"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import api from "@/lib/axios"

const TABS = ["SMS ile Giriş", "Şifre ile Giriş"]

// ── Telefon Input ─────────────────────────────────────────────
function PhoneInput({ value, onChange, error, id = "login-phone" }) {
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "")
    if (digits.startsWith("0")) return
    if (digits.length <= 10) onChange(digits)
  }

  const isValid  = value.length === 10 && value.startsWith("5")
  const showHint = value.length > 0 && !isValid

  return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Telefon Numarası</label>
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none">
            <Phone size={15} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-500 border-r border-gray-200 pr-2 mr-1">0</span>
          </div>
          <input
              id={id}
              type="tel"
              inputMode="numeric"
              placeholder="5XX XXX XX XX"
              value={value}
              onChange={handleChange}
              className={`w-full pl-16 pr-10 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 transition-all ${
                  error ? "border-red-300 focus:ring-red-500/20" :
                      isValid ? "border-emerald-300 focus:ring-emerald-500/20 bg-emerald-50/30" :
                          "border-gray-300 focus:ring-purple-500/20"
              }`}
          />
          {isValid && <CheckCircle size={15} className="absolute right-3 text-emerald-500 pointer-events-none" />}
        </div>

        {error ? (
            <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} /> {error}</p>
        ) : showHint ? (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle size={11} />
              {!value.startsWith("5") ? "Telefon numarası 5 ile başlamalıdır" : "Telefon numarası 10 haneli olmalıdır"}
            </p>
        ) : (
            <p className="text-xs text-gray-400">Başındaki 0'ı yazmadan girin (örn: 532 123 45 67)</p>
        )}
      </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const toast      = useToast()
  const navigate    = useNavigate()

  const [tab,       setTab]       = useState(0)
  const [step,      setStep]      = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [errors,    setErrors]    = useState({})
  const [showPass,  setShowPass]  = useState(false)
  const [phone,     setPhone]     = useState("")
  const [passPhone, setPassPhone] = useState("")
  const [password,  setPassword]  = useState("")
  const [otp,       setOtp]       = useState(["", "", "", "", "", ""])
  const [countdown, setCountdown] = useState(0)
  const [debugOtp,  setDebugOtp]  = useState(null) // SMS_PROVIDER=log iken backend'den gelir

  const validatePhone = (val) => {
    if (!val) return "Telefon numarası zorunludur."
    if (!val.startsWith("5")) return "Telefon numarası 5 ile başlamalıdır."
    if (val.length !== 10) return "Telefon numarası 10 haneli olmalıdır."
    return null
  }

  const goHomeAfterLogin = () => {
    toast({ message: "Giriş başarılı. Hoş geldiniz!" })
    navigate("/")
  }

  // ── Şifre ile giriş ──────────────────────────────────────
  const handlePasswordLogin = async () => {
    setErrors({})
    const phoneErr = validatePhone(passPhone)
    if (phoneErr) { setErrors({ phone: [phoneErr] }); return }

    setLoading(true)
    try {
      const res = await api.post("/login", { phone: "0" + passPhone, password })
      login(res.data.token, res.data.user)
      goHomeAfterLogin()
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else toast({ message: err.response?.data?.message || "Giriş başarısız.", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  // ── SMS — kod gönder ──────────────────────────────────────
  const sendOtp = async () => {
    setErrors({})
    const phoneErr = validatePhone(phone)
    if (phoneErr) { setErrors({ phone: [phoneErr] }); return }

    setLoading(true)
    try {
      const res = await api.post("/login/send-otp", { phone: "0" + phone })
      setDebugOtp(res.data.debug_otp || null)
      setStep(1)
      startCountdown()
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else toast({ message: err.response?.data?.message || "Kod gönderilemedi.", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  // ── SMS — kodu doğrula ────────────────────────────────────
  const verifyOtp = async () => {
    setErrors({}); setLoading(true)
    try {
      const res = await api.post("/login/verify-otp", { phone: "0" + phone, otp: otp.join("") })
      login(res.data.token, res.data.user)
      goHomeAfterLogin()
    } catch (err) {
      toast({ message: err.response?.data?.message || "Kod hatalı.", type: "error" })
      setOtp(["", "", "", "", "", ""])
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) document.getElementById(`otp-login-${i + 1}`)?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0)
      document.getElementById(`otp-login-${i - 1}`)?.focus()
  }

  const startCountdown = () => {
    setCountdown(60)
    const t = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 })
    }, 1000)
  }

  return (
      <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">
        <Header />

        <main className="max-w-[1200px] mx-auto w-full px-4 py-10 flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in duration-500">
              <div className="bg-gradient-to-r from-indigo-800 via-purple-700 to-fuchsia-600 px-8 py-6 text-center">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Giriş Yap</h1>
                <p className="text-purple-100 text-xs font-medium mt-1">TeklifMeydanı hesabınıza erişin</p>
              </div>

              <div className="p-8">
                {/* Tabs */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                  {TABS.map((t, i) => (
                      <button key={i} onClick={() => { setTab(i); setStep(0); setErrors({}) }}
                              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                  tab === i ? "bg-white text-purple-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                              }`}>
                        {t}
                      </button>
                  ))}
                </div>

                {/* ── Şifre ile giriş ────────────────────────────── */}
                {tab === 1 && (
                    <div className="flex flex-col gap-4">
                      <PhoneInput value={passPhone} onChange={setPassPhone} error={errors.phone?.[0]} id="pass-phone" />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Şifre</label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                              type={showPass ? "text" : "password"}
                              placeholder="Şifreniz"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && handlePasswordLogin()}
                              className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-sm outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                          />
                          <button type="button" onClick={() => setShowPass(v => !v)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500">{errors.password[0]}</p>}
                      </div>
                      <button onClick={handlePasswordLogin} disabled={loading}
                              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        {loading && <RefreshCw size={14} className="animate-spin" />} Giriş Yap
                      </button>
                    </div>
                )}

                {/* ── SMS: Telefon ───────────────────────────────── */}
                {tab === 0 && step === 0 && (
                    <div className="flex flex-col gap-4">
                      <PhoneInput value={phone} onChange={setPhone} error={errors.phone?.[0]} id="sms-phone" />
                      <button onClick={sendOtp} disabled={loading || phone.length !== 10 || !phone.startsWith("5")}
                              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        {loading && <RefreshCw size={14} className="animate-spin" />} Kod Gönder
                      </button>
                    </div>
                )}

                {/* ── SMS: OTP ───────────────────────────────────── */}
                {tab === 0 && step === 1 && (
                    <div className="flex flex-col gap-5">
                      <div className="text-center">
                        <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          <span className="font-bold">0{phone}</span> numarasına doğrulama kodu gönderildi.
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        {otp.map((digit, i) => (
                            <input key={i} id={`otp-login-${i}`}
                                   type="text" inputMode="numeric" maxLength={1} value={digit}
                                   onChange={e => handleOtpChange(i, e.target.value)}
                                   onKeyDown={e => handleOtpKeyDown(i, e)}
                                   className="w-12 h-14 text-center text-xl font-extrabold text-gray-800 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 outline-none transition-all"
                            />
                        ))}
                      </div>
                      {debugOtp && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <span className="text-amber-600 text-xs">🔧</span>
                            <p className="text-xs text-amber-700">
                              <span className="font-medium">Test kodu:</span>{" "}
                              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">{debugOtp}</code>
                            </p>
                          </div>
                      )}
                      {errors.otp && <p className="text-xs text-red-500 text-center">{errors.otp[0]}</p>}
                      <button onClick={verifyOtp} disabled={loading || otp.some(d => !d)}
                              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        {loading && <RefreshCw size={14} className="animate-spin" />} Giriş Yap
                      </button>
                      <div className="flex items-center justify-between text-sm">
                        <button onClick={() => setStep(0)} className="text-gray-500 hover:text-gray-700">← Geri</button>
                        <button onClick={sendOtp} disabled={countdown > 0}
                                className="flex items-center gap-1 text-gray-500 hover:text-purple-600 disabled:opacity-40">
                          <RefreshCw size={13} /> {countdown > 0 ? `${countdown}s` : "Yeni kod gönder"}
                        </button>
                      </div>
                    </div>
                )}

                <p className="text-center text-sm text-gray-500 mt-6">
                  Hesabınız yok mu?{" "}
                  <Link to="/register" className="text-purple-700 font-semibold hover:underline">Kayıt Ol</Link>
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
  )
}