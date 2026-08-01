import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  User, Phone, Lock, Mail, Eye, EyeOff, CheckCircle,
  Upload, FileText, Clock, ChevronRight, ChevronLeft,
  RefreshCw, Briefcase, X,
  AlertCircle, Loader2,
} from "lucide-react"
import { useAuth } from "@/store/AuthContext"
import { useToast } from "@/components/ui/Toast"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import api from "@/lib/axios"

const STEPS = ["Bilgiler", "Hesap Türü", "Belgeler", "Doğrulama", "Tamamlandı"]

// Backend'deki AccountTypeGroup admin panelinden dinamik olarak tanımlanıyor
// (bkz. AccountTypeGroupResource) — burada sabit bir liste tutmuyoruz.
// Sadece görsel ikon için kind'a (individual/commercial) göre bir varsayılan
// seçiyoruz, her grubun kendi ikonunu tanımlamasına gerek kalmadan.
const GROUP_ICON = { individual: User, commercial: Briefcase }

// ── Adım göstergesi ──────────────────────────────────────────
function StepBar({ current, steps }) {
  return (
      <div className="flex items-center mb-6">
        {steps.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-all ${
                  i < current ? "bg-emerald-500 text-white" :
                      i === current ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white" :
                          "bg-gray-100 text-gray-400"
              }`}>
                {i < current ? <CheckCircle size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 transition-colors ${i < current ? "bg-emerald-400" : "bg-gray-200"}`} />
              )}
            </div>
        ))}
      </div>
  )
}

// ── Telefon Input ─────────────────────────────────────────────
function PhoneInput({ value, onChange, error }) {
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "")
    if (digits.startsWith("0")) return
    if (digits.length <= 10) onChange(digits)
  }

  const isValid  = value.length === 10 && value.startsWith("5")
  const showHint = value.length > 0 && !isValid

  return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Telefon Numarası <span className="text-red-500">*</span>
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none">
            <Phone size={15} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-500 border-r border-gray-200 pr-2 mr-1">0</span>
          </div>
          <input
              type="tel"
              inputMode="numeric"
              placeholder="5XX XXX XX XX"
              value={value}
              onChange={handleChange}
              className={`w-full pl-16 pr-10 py-2.5 border rounded-xl bg-gray-50 focus:bg-white text-sm outline-none focus:ring-4 transition-all ${
                  error ? "border-red-300 focus:ring-red-500/20" :
                      isValid ? "border-emerald-300 focus:ring-emerald-500/20 bg-emerald-50/30" :
                          "border-gray-300 focus:ring-purple-500/20"
              }`}
          />
          {isValid && <CheckCircle size={15} className="absolute right-3 text-emerald-500" />}
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

// ── Ana Bileşen ───────────────────────────────────────────────
export default function RegisterPage() {
  const { login } = useAuth()
  const toast      = useToast()
  const navigate    = useNavigate()

  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})
  const [isAgent, setIsAgent] = useState(false)

  // Adım 1
  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "", password_confirmation: "",
  })
  const [showPass, setShowPass] = useState(false)

  // Adım 2 — OTP
  const [otp,       setOtp]       = useState(["", "", "", "", "", ""])
  const [countdown, setCountdown] = useState(0)
  const [debugOtp,  setDebugOtp]  = useState(null) // SMS_PROVIDER=log iken backend'den gelir

  // Adım 3 — Hesap türü
  const [groups, setGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [companyName, setCompanyName] = useState("")

  // Kayıt formu açılır açılmaz grup listesini çekiyoruz ki kullanıcı
  // 3. adıma geldiğinde beklemeden görsün.
  useEffect(() => {
    api.get("/register/account-type-groups")
        .then(res => setGroups(res.data.data || []))
        .catch(() => setGroups([]))
        .finally(() => setGroupsLoading(false))
  }, [])

  // Adım 4 — Belgeler
  const [requiredDocuments, setRequiredDocuments] = useState([]) // set-type yanıtından gelir: [{key,label,required}]
  const [files, setFiles] = useState({})
  const fileRefs           = useRef({})

  // Telefon validasyonu
  const validatePhone = () => {
    if (!form.phone) return "Telefon numarası zorunludur."
    if (!form.phone.startsWith("5")) return "Telefon numarası 5 ile başlamalıdır."
    if (form.phone.length !== 10) return "Telefon numarası 10 haneli olmalıdır."
    return null
  }

  // ── ADIM 1: Kayıt ─────────────────────────────────────────
  const handleRegister = async () => {
    setErrors({})
    const phoneErr = validatePhone()
    if (phoneErr) { setErrors({ phone: [phoneErr] }); return }
    if (!form.name.trim()) { setErrors({ name: ["Ad Soyad zorunludur."] }); return }

    setLoading(true)
    try {
      const payload = { ...form, phone: "0" + form.phone }
      const res = await api.post("/register", payload)
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`
      setStep(1) // → Hesap Türü (OTP artık burada değil, en sonda gönderiliyor)
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else toast({ message: err.response?.data?.message || "Kayıt başarısız.", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  // ── SON ADIM: SMS Doğrulama (hesabı finalize eder) ─────────
  const verifyOtp = async () => {
    setErrors({}); setLoading(true)
    try {
      const res = await api.post("/register/verify-otp", { otp: otp.join("") })
      login(res.data.token, res.data.user)
      setStep(4)
    } catch (err) {
      toast({ message: err.response?.data?.message || "Kod hatalı.", type: "error" })
      setOtp(["", "", "", "", "", ""])
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    try {
      const res = await api.post("/register/resend-otp")
      setDebugOtp(res.data.debug_otp || null)
      startCountdown()
      toast({ message: "Yeni kod gönderildi." })
    } catch (err) {
      toast({ message: err.response?.data?.message || "Kod gönderilemedi.", type: "error" })
    }
  }

  const startCountdown = () => {
    setCountdown(60)
    const t = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 })
    }, 1000)
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) document.getElementById(`otp-reg-${i + 1}`)?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0)
      document.getElementById(`otp-reg-${i - 1}`)?.focus()
  }

  // ── ADIM 2: Hesap türü ────────────────────────────────────
  const handleSetType = async () => {
    setErrors({}); setLoading(true)
    try {
      const res = await api.post("/register/set-type", {
        account_type_group_id: selectedGroupId,
        company_name: companyName || undefined,
      })
      setIsAgent(selectedGroup?.kind === "commercial")

      if (res.data.requires_documents) {
        setRequiredDocuments(res.data.required_documents || [])
        setStep(2) // → Belgeler
      } else {
        // Bireysel ya da belge istemeyen ticari — backend OTP'yi az önce
        // gönderdi, doğrulama adımına geçiyoruz.
        setDebugOtp(res.data.debug_otp || null)
        startCountdown()
        setStep(3) // → Doğrulama
      }
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else toast({ message: err.response?.data?.message || "Hata oluştu.", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  // ── ADIM 3: Belgeler ──────────────────────────────────────
  const handleFile = (type, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast({ message: "Dosya 5MB'ı geçemez.", type: "error" }); return }
    setFiles(prev => ({ ...prev, [type]: file }))
  }
  const removeFile = (type) => setFiles(prev => { const n = { ...prev }; delete n[type]; return n })

  const uploadDocuments = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(files).forEach(([type, file]) => fd.append(type, file))
      const res = await api.post("/register/upload-documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      // Belgeler kabul edildi, backend OTP'yi az önce gönderdi.
      setDebugOtp(res.data.debug_otp || null)
      startCountdown()
      setStep(3) // → Doğrulama
    } catch (err) {
      const first = Object.values(err.response?.data?.errors || {})[0]?.[0]
      toast({ message: first || err.response?.data?.message || "Yükleme başarısız.", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  const selectedGroup = groups.find(g => g.id === selectedGroupId)

  // Bireysel akışta "Belgeler" adımı (index 2) hiç yaşanmıyor — handleSetType
  // direkt Doğrulama'ya (step 3) atlıyor. Grup seçilir seçilmez (henüz
  // "Devam Et"e basılmadan) çubuk anında 4 adıma inip/5 adıma çıkabilsin
  // diye selectedGroup'a göre reaktif hesaplanıyor.
  const isIndividualFlow = selectedGroup?.kind === "individual"
  const displaySteps    = isIndividualFlow ? STEPS.filter((_, i) => i !== 2) : STEPS
  const displayCurrent  = isIndividualFlow ? (step < 2 ? step : step - 1) : step

  return (
      <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">
        <Header />

        <main className="max-w-[1200px] mx-auto w-full px-4 py-10 flex-1 flex items-center justify-center">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in duration-500">
              <div className="bg-gradient-to-r from-indigo-800 via-purple-700 to-fuchsia-600 px-8 py-6 text-center relative">
            <span className="absolute top-4 right-4 bg-white/15 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
              Adım {displayCurrent + 1}/{displaySteps.length}
            </span>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Hesap Oluştur</h1>
                <p className="text-purple-100 text-xs font-medium mt-1">Saniyeler içinde ücretsiz üye olun</p>
              </div>

              <div className="p-8">
                <StepBar current={displayCurrent} steps={displaySteps} />

                {/* ── ADIM 1: Bilgiler ─────────────────────────────── */}
                {step === 0 && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">
                          Ad Soyad <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                              type="text"
                              placeholder="Ahmet Yılmaz"
                              value={form.name}
                              onChange={e => {
                                const val = e.target.value
                                    .split(" ")
                                    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                                    .join(" ")
                                setForm(f => ({ ...f, name: val }))
                              }}
                              className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                                  errors.name ? "border-red-300" : "border-gray-300"
                              }`}
                          />
                        </div>
                        {errors.name && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11}/>{errors.name[0]}</p>}
                      </div>

                      <PhoneInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} error={errors.phone?.[0]} />

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">E-posta <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
                        <div className="relative">
                          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                              type="email"
                              placeholder="ornek@mail.com"
                              value={form.email}
                              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-sm outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                          />
                        </div>
                        {errors.email && <p className="text-xs text-red-500">{errors.email[0]}</p>}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Şifre <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                              type={showPass ? "text" : "password"}
                              placeholder="En az 6 karakter"
                              value={form.password}
                              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                              className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-sm outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                          />
                          <button type="button" onClick={() => setShowPass(v => !v)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-400">SMS ile de giriş yapabilirsiniz, şifre zorunlu değil.</p>
                        {errors.password && <p className="text-xs text-red-500">{errors.password[0]}</p>}
                      </div>

                      {form.password && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Şifre Tekrar</label>
                            <div className="relative">
                              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                  type="password"
                                  placeholder="Şifrenizi tekrarlayın"
                                  value={form.password_confirmation}
                                  onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-sm outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                              />
                            </div>
                          </div>
                      )}

                      <button onClick={handleRegister} disabled={loading}
                              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        {loading && <RefreshCw size={14} className="animate-spin" />} Devam Et <ChevronRight size={15} />
                      </button>
                    </div>
                )}

                {/* ── ADIM 3 (Doğrulama): SMS Doğrulama — artık akışın SONUNDA.
                 Kaynak dosyada okunabilirlik için burada bırakıldı, ama
                 step===3 koşulu sayesinde ekranda gerçekten en son gösteriliyor. ── */}
                {step === 3 && (
                    <div className="flex flex-col gap-5">
                      <div className="text-center">
                        <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          <span className="font-bold">0{form.phone}</span> numarasına doğrulama kodu gönderildi.
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        {otp.map((digit, i) => (
                            <input key={i} id={`otp-reg-${i}`}
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
                      <button onClick={verifyOtp} disabled={loading || otp.some(d => !d)}
                              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={15} />} Doğrula
                      </button>
                      <div className="flex justify-between text-sm">
                        <button onClick={() => setStep(requiredDocuments.length > 0 ? 2 : 1)} className="text-gray-500 hover:text-gray-700">
                          <ChevronLeft size={14} className="inline" /> Geri
                        </button>
                        <button onClick={resendOtp} disabled={countdown > 0}
                                className="flex items-center gap-1 text-gray-500 hover:text-purple-600 disabled:opacity-40">
                          <RefreshCw size={13} /> {countdown > 0 ? `${countdown}s` : "Yeni kod gönder"}
                        </button>
                      </div>
                    </div>
                )}

                {/* ── ADIM 2: Hesap türü ────────────────────────────── */}
                {step === 1 && (
                    <div className="flex flex-col gap-4">
                      {groupsLoading ? (
                          <div className="flex items-center justify-center py-10">
                            <Loader2 size={20} className="animate-spin text-purple-500" />
                          </div>
                      ) : groups.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-6">
                            Şu anda seçilebilir bir hesap türü bulunamadı, lütfen daha sonra tekrar deneyin.
                          </p>
                      ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {groups.map(group => {
                              const Icon = GROUP_ICON[group.kind] || User
                              const sel  = selectedGroupId === group.id
                              const requiresDocs = group.kind === "commercial" && group.required_documents?.length > 0
                              return (
                                  <button key={group.id} onClick={() => setSelectedGroupId(group.id)}
                                          className={`p-3 text-left border-2 rounded-xl transition-all ${
                                              sel ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                                          }`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${sel ? "bg-purple-100" : "bg-gray-100"}`}>
                                      <Icon size={16} className={sel ? "text-purple-700" : "text-gray-500"} />
                                    </div>
                                    <p className={`text-sm font-medium ${sel ? "text-purple-800" : "text-gray-800"}`}>{group.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                                      {group.kind === "individual" ? "Talep oluşturmak istiyorum" : "Ticari hesap — teklif verebilirsiniz"}
                                    </p>
                                    {requiresDocs && (
                                        <span className="mt-1.5 inline-block text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Belge gerekli</span>
                                    )}
                                  </button>
                              )
                            })}
                          </div>
                      )}

                      {selectedGroup?.kind === "commercial" && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">
                              Firma / İşletme Adı <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input type="text" placeholder="Örn: Yılmaz Emlak Ltd."
                                     value={companyName} onChange={e => setCompanyName(e.target.value)}
                                     className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20"
                              />
                            </div>
                            {errors.company_name && <p className="text-xs text-red-500">{errors.company_name[0]}</p>}
                            <p className="text-xs text-gray-400">Profilinizde ve tekliflerinizde görünür.</p>
                          </div>
                      )}

                      <div className="flex gap-3">
                        <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                          Geri
                        </button>
                        <button onClick={handleSetType} disabled={loading || !selectedGroupId}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                          {loading && <RefreshCw size={14} className="animate-spin" />} Devam Et <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                )}

                {/* ── ADIM 3: Belgeler (sadece belge isteyen ticari gruplar) ── */}
                {step === 2 && (
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-gray-500 mb-1">PDF, JPG veya PNG · Maks. 5MB</p>
                      {requiredDocuments.map(doc => {
                        const uploaded = files[doc.key]
                        return (
                            <div key={doc.key} className={`flex items-center gap-3 p-3 border rounded-xl transition-all ${
                                uploaded ? "border-emerald-300 bg-emerald-50" : "border-gray-200"
                            }`}>
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${uploaded ? "bg-emerald-100" : "bg-gray-100"}`}>
                                <FileText size={16} className={uploaded ? "text-emerald-600" : "text-gray-400"} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">
                                  {doc.label} {doc.required !== false && <span className="text-red-500">*</span>}
                                </p>
                                <p className={`text-xs truncate ${uploaded ? "text-emerald-600" : "text-gray-400"}`}>
                                  {uploaded ? uploaded.name : "Belge yükleyin"}
                                </p>
                              </div>
                              {uploaded ? (
                                  <button onClick={() => removeFile(doc.key)} className="text-gray-400 hover:text-red-500 p-1">
                                    <X size={14} />
                                  </button>
                              ) : (
                                  <button onClick={() => fileRefs.current[doc.key]?.click()}
                                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs">
                                    <Upload size={12} /> Seç
                                  </button>
                              )}
                              <input ref={el => fileRefs.current[doc.key] = el} type="file"
                                     accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                     onChange={e => handleFile(doc.key, e)} />
                            </div>
                        )
                      })}
                      <p className="text-xs text-gray-400">* işaretli belgeler zorunludur.</p>
                      <div className="flex gap-3 mt-1">
                        <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                          Geri
                        </button>
                        <button onClick={uploadDocuments} disabled={loading}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={15} />} Gönder
                        </button>
                      </div>
                    </div>
                )}

                {/* ── ADIM 5: Tamamlandı ────────────────────────────── */}
                {step === 4 && (
                    <div className="text-center py-4 flex flex-col items-center gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isAgent ? "bg-amber-100" : "bg-emerald-100"}`}>
                        {isAgent ? <Clock size={32} className="text-amber-500" /> : <CheckCircle size={32} className="text-emerald-500" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {isAgent ? "Başvurunuz alındı!" : "Hoş geldiniz!"}
                        </h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                          {isAgent
                              ? "Belgeleriniz inceleniyor. Onay süreciniz 1–2 iş günü sürer. Sonucu SMS ile bildireceğiz."
                              : "Hesabınız aktif. Hemen talep oluşturabilirsiniz!"}
                        </p>
                      </div>
                      <button onClick={() => navigate("/")}
                              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all">
                        {isAgent ? "Tamam" : "Başlayalım"}
                      </button>
                    </div>
                )}

                {step < 4 && (
                    <p className="text-center text-sm text-gray-500 mt-5">
                      Zaten hesabınız var mı?{" "}
                      <Link to="/login" className="text-purple-700 font-semibold hover:underline">Giriş Yap</Link>
                    </p>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
  )
}