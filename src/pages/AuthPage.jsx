import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
    User, Phone, Lock, Mail, Eye, EyeOff, CheckCircle,
    Upload, FileText, Clock, ChevronRight, ChevronLeft,
    RefreshCw, Briefcase, X, AlertCircle, Loader2,
} from "lucide-react"
import { useAuth } from "@/store/AuthContext"
import { useToast } from "@/components/ui/Toast"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import api from "@/lib/axios"
import { useTurkiyeLocation } from "@/hooks/useTurkiyeLocation"
import LocationSelect from "@/components/ui/LocationSelect"
import LegalDocumentModal from "@/components/legal/LegalDocumentModal.jsx"

const LOGIN_TABS = ["SMS ile Giriş", "Şifre ile Giriş"]
const REG_STEPS   = ["Bilgiler", "Doğrulama", "Hesap Türü", "Belgeler", "Tamamlandı"]

// Backend'deki AccountTypeGroup admin panelinden dinamik tanımlanıyor
// (bkz. AccountTypeGroupResource) — burada sabit bir liste tutmuyoruz.
const GROUP_ICON = { individual: User, commercial: Briefcase }

function validatePhone(val) {
    if (!val) return "Telefon numarası zorunludur."
    if (!val.startsWith("5")) return "Telefon numarası 5 ile başlamalıdır."
    if (val.length !== 10) return "Telefon numarası 10 haneli olmalıdır."
    return null
}

// ── Telefon Input (her iki taraf da kullanır) ──────────────────
function PhoneInput({ value, onChange, error, id }) {
    const handleChange = (e) => {
        const digits = e.target.value.replace(/\D/g, "")
        if (digits.startsWith("0")) return
        if (digits.length <= 10) onChange(digits)
    }

    const isValid  = value.length === 10 && value.startsWith("5")
    const showHint = value.length > 0 && !isValid

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Telefon Numarası</label>
            <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none">
                    <Phone size={13} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 border-r border-gray-200 pr-2 mr-1">0</span>
                </div>
                <input
                    id={id}
                    type="tel"
                    inputMode="numeric"
                    placeholder="5XX XXX XX XX"
                    value={value}
                    onChange={handleChange}
                    className={`w-full pl-16 pr-10 py-2.5 bg-gray-50 hover:bg-white border text-xs font-medium text-gray-700 rounded outline-none transition-all focus:bg-white focus:ring-1 ${
                        error ? "border-red-300 focus:ring-red-400 focus:border-red-400" :
                            isValid ? "border-emerald-300 focus:ring-emerald-400 bg-emerald-50/30" :
                                "border-gray-200 hover:border-gray-300 focus:ring-purple-400 focus:border-purple-400"
                    }`}
                />
                {isValid && <CheckCircle size={14} className="absolute right-3 text-emerald-500 pointer-events-none" />}
            </div>

            {error ? (
                <p className="text-[10px] font-bold text-red-500 flex items-center gap-1"><AlertCircle size={11} /> {error}</p>
            ) : showHint ? (
                <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                    <AlertCircle size={11} />
                    {!value.startsWith("5") ? "Telefon numarası 5 ile başlamalıdır" : "Telefon numarası 10 haneli olmalıdır"}
                </p>
            ) : (
                <p className="text-[10px] text-gray-400 font-medium">Başındaki 0'ı yazmadan girin (örn: 532 123 45 67)</p>
            )}
        </div>
    )
}

// ── Adım göstergesi (sadece kayıt tarafı) ───────────────────────
function StepBar({ current, steps }) {
    return (
        <div className="flex items-center mb-5">
            {steps.map((label, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                        i < current ? "bg-green-100 text-green-800" :
                            i === current ? "bg-purple-600 text-white ring-4 ring-purple-50" :
                                "bg-gray-100 text-gray-400"
                    }`}>
                        {i < current ? <CheckCircle size={12} className="stroke-[3]" /> : i + 1}
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 transition-colors ${i < current ? "bg-green-200" : "bg-gray-200"}`} />
                    )}
                </div>
            ))}
        </div>
    )
}

export default function AuthPage() {
    const { login } = useAuth()
    const toast      = useToast()
    const navigate    = useNavigate()
    const location    = useLocation()

    // ═══════════════════════════════════════════════════════════
    // SOL TARAF — GİRİŞ YAP
    // ═══════════════════════════════════════════════════════════
    const [loginTab,       setLoginTab]       = useState(0)
    const [loginStep,      setLoginStep]      = useState(0)
    const [loginLoading,   setLoginLoading]   = useState(false)
    const [loginErrors,    setLoginErrors]    = useState({})
    const [loginShowPass,  setLoginShowPass]  = useState(false)
    const [loginPhone,     setLoginPhone]     = useState("")
    const [loginPassPhone, setLoginPassPhone] = useState("")
    const [loginPassword,  setLoginPassword]  = useState("")
    const [loginOtp,       setLoginOtp]       = useState(["", "", "", "", "", ""])
    const [loginCountdown, setLoginCountdown] = useState(0)
    const [loginDebugOtp,  setLoginDebugOtp]  = useState(null)

    // Simülasyon/test kolaylığı: SMS_PROVIDER=log iken backend doğrulama
    // kodunu debug_otp olarak da döndürüyor — bu durumda kodu elle
    // yazmaya gerek kalmadan kutucuklara otomatik dolduruyoruz.
    useEffect(() => {
        if (loginDebugOtp) setLoginOtp(String(loginDebugOtp).padStart(6, "0").slice(-6).split(""))
    }, [loginDebugOtp])

    // RequireAuth ile korunan bir sayfadan buraya yönlendirildiyse
    // (bkz. components/auth/RequireAuth.jsx), girişten sonra kaldığı
    // yere geri döner; aksi halde ana sayfaya gider.
    const goHomeAfterLogin = () => {
        toast({ message: "Giriş başarılı. Hoş geldiniz!" })
        const from = location.state?.from
        navigate(from ? `${from.pathname}${from.search || ""}` : "/", { replace: true })
    }

    const handlePasswordLogin = async () => {
        setLoginErrors({})
        const phoneErr = validatePhone(loginPassPhone)
        if (phoneErr) { setLoginErrors({ phone: [phoneErr] }); return }

        setLoginLoading(true)
        try {
            const res = await api.post("/login", { phone: "0" + loginPassPhone, password: loginPassword })
            login(res.data.token, res.data.user)
            goHomeAfterLogin()
        } catch (err) {
            if (err.response?.data?.errors) setLoginErrors(err.response.data.errors)
            else toast({ message: err.response?.data?.message || "Giriş başarısız.", type: "error" })
        } finally {
            setLoginLoading(false)
        }
    }

    const startLoginCountdown = () => {
        setLoginCountdown(60)
        const t = setInterval(() => {
            setLoginCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 })
        }, 1000)
    }

    const sendLoginOtp = async () => {
        setLoginErrors({})
        const phoneErr = validatePhone(loginPhone)
        if (phoneErr) { setLoginErrors({ phone: [phoneErr] }); return }

        setLoginLoading(true)
        try {
            const res = await api.post("/login/send-otp", { phone: "0" + loginPhone })
            setLoginDebugOtp(res.data.debug_otp || null)
            setLoginStep(1)
            startLoginCountdown()
        } catch (err) {
            if (err.response?.data?.errors) setLoginErrors(err.response.data.errors)
            else toast({ message: err.response?.data?.message || "Kod gönderilemedi.", type: "error" })
        } finally {
            setLoginLoading(false)
        }
    }

    const verifyLoginOtp = async () => {
        setLoginErrors({}); setLoginLoading(true)
        try {
            const res = await api.post("/login/verify-otp", { phone: "0" + loginPhone, otp: loginOtp.join("") })
            login(res.data.token, res.data.user)
            goHomeAfterLogin()
        } catch (err) {
            toast({ message: err.response?.data?.message || "Kod hatalı.", type: "error" })
            setLoginOtp(["", "", "", "", "", ""])
        } finally {
            setLoginLoading(false)
        }
    }

    const handleLoginOtpChange = (i, val) => {
        if (!/^\d?$/.test(val)) return
        const next = [...loginOtp]; next[i] = val; setLoginOtp(next)
        if (val && i < 5) document.getElementById(`otp-login-${i + 1}`)?.focus()
    }

    const handleLoginOtpKeyDown = (i, e) => {
        if (e.key === "Backspace" && !loginOtp[i] && i > 0)
            document.getElementById(`otp-login-${i - 1}`)?.focus()
    }

    // ═══════════════════════════════════════════════════════════
    // SAĞ TARAF — HESAP OLUŞTUR
    // ═══════════════════════════════════════════════════════════
    const [regStep,    setRegStep]    = useState(0)
    const [regLoading, setRegLoading] = useState(false)
    const [regErrors,  setRegErrors]  = useState({})
    const [regIsAgent, setRegIsAgent] = useState(false)

    const [regForm, setRegForm] = useState({
        name: "", phone: "", email: "", password: "", password_confirmation: "",
    })
    const [regShowPass, setRegShowPass] = useState(false)

    // Yasal onaylar — kvkkOnay ZORUNLU (Kullanıcı Sözleşmesi + KVKK
    // Aydınlatma Metni tek onay kutusunda birleşik, bkz. backend
    // RegisterController::register()); diğer ikisi KVKK gereği isteğe
    // bağlı, varsayılan işaretsiz.
    const [regKvkkOnay, setRegKvkkOnay] = useState(false)
    const [regAcikRizaOnay, setRegAcikRizaOnay] = useState(false)
    const [regTicariIletiOnay, setRegTicariIletiOnay] = useState(false)
    const [regLegalModalType, setRegLegalModalType] = useState(null)

    const [regOtp,       setRegOtp]       = useState(["", "", "", "", "", ""])
    const [regCountdown, setRegCountdown] = useState(0)
    const [regDebugOtp,  setRegDebugOtp]  = useState(null)

    // Simülasyon/test kolaylığı: bkz. loginDebugOtp effect'i yukarıda.
    useEffect(() => {
        if (regDebugOtp) setRegOtp(String(regDebugOtp).padStart(6, "0").slice(-6).split(""))
    }, [regDebugOtp])

    // Adres bilgisi (il/ilçe/mahalle) — opsiyonel, seçilirse kayıt akışı
    // sonunda kullanıcının varsayılan adresi olarak POST /user/addresses
    // ile kaydedilir (bkz. saveDefaultAddress).
    const loc = useTurkiyeLocation()

    const [regGroups, setRegGroups] = useState([])
    const [regGroupsLoading, setRegGroupsLoading] = useState(true)
    const [regSelectedGroupId, setRegSelectedGroupId] = useState(null)
    const [regCompanyName, setRegCompanyName] = useState("")

    useEffect(() => {
        api.get("/register/account-type-groups")
            .then(res => setRegGroups(res.data.data || []))
            .catch(() => setRegGroups([]))
            .finally(() => setRegGroupsLoading(false))
    }, [])

    const [regRequiredDocuments, setRegRequiredDocuments] = useState([])
    const [regFiles, setRegFiles] = useState({})
    const regFileRefs = useRef({})

    const startRegCountdown = () => {
        setRegCountdown(60)
        const t = setInterval(() => {
            setRegCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 })
        }, 1000)
    }

    const handleRegister = async () => {
        setRegErrors({})
        const phoneErr = validatePhone(regForm.phone)
        if (phoneErr) { setRegErrors({ phone: [phoneErr] }); return }
        if (!regForm.name.trim()) { setRegErrors({ name: ["Ad Soyad zorunludur."] }); return }
        if (!regKvkkOnay) {
            setRegErrors({ kvkk_onay: ["Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metni'ni onaylamanız gerekiyor."] })
            return
        }

        setRegLoading(true)
        try {
            const payload = {
                ...regForm,
                phone: "0" + regForm.phone,
                kvkk_onay: regKvkkOnay,
                acik_riza_onay: regAcikRizaOnay,
                ticari_ileti_onay: regTicariIletiOnay,
            }
            const res = await api.post("/register", payload)
            api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`
            setRegDebugOtp(res.data.debug_otp || null)
            startRegCountdown()
            setRegStep(1) // → Doğrulama
        } catch (err) {
            if (err.response?.data?.errors) setRegErrors(err.response.data.errors)
            else toast({ message: err.response?.data?.message || "Kayıt başarısız.", type: "error" })
        } finally {
            setRegLoading(false)
        }
    }

    // Kalıcı token oluştuktan (login sonrası) çağrılır — il/ilçe seçiliyse
    // kullanıcının ilk (ve otomatik olarak varsayılan) adresi olarak kaydeder.
    // Kayıt akışını bloklamaması için hata sessizce yutulur.
    const saveDefaultAddress = async () => {
        if (!loc.selectedProvince || !loc.selectedDistrict) return
        try {
            await api.post("/user/addresses", {
                title: "Ev",
                city: loc.selectedProvince.name,
                district: loc.selectedDistrict.name,
                neighborhood: loc.selectedNeighborhood?.name || null,
                is_default: true,
            })
        } catch {
            // Adres kaydı opsiyonel bir kolaylık — başarısız olsa da
            // kullanıcı kaydı tamamlanmış sayılır, akış devam eder.
        }
    }

    const handleSetType = async () => {
        setRegErrors({}); setRegLoading(true)
        try {
            const res = await api.post("/register/set-type", {
                account_type_group_id: regSelectedGroupId,
                company_name: regCompanyName || undefined,
            })
            setRegIsAgent(regSelectedGroup?.kind === "commercial")

            if (res.data.requires_documents) {
                setRegRequiredDocuments(res.data.required_documents || [])
                setRegStep(3) // → Belgeler
            } else {
                // Bireysel ya da belge istemeyen ticari — backend hesabı burada
                // finalize etti (kalıcı token döndü), doğrudan giriş yapıyoruz.
                login(res.data.token, res.data.user)
                saveDefaultAddress()
                setRegStep(4) // → Tamamlandı
            }
        } catch (err) {
            if (err.response?.data?.errors) setRegErrors(err.response.data.errors)
            else toast({ message: err.response?.data?.message || "Hata oluştu.", type: "error" })
        } finally {
            setRegLoading(false)
        }
    }

    const handleRegFile = (type, e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { toast({ message: "Dosya 5MB'ı geçemez.", type: "error" }); return }
        setRegFiles(prev => ({ ...prev, [type]: file }))
    }
    const removeRegFile = (type) => setRegFiles(prev => { const n = { ...prev }; delete n[type]; return n })

    const uploadRegDocuments = async () => {
        setRegLoading(true)
        try {
            const fd = new FormData()
            Object.entries(regFiles).forEach(([type, file]) => fd.append(type, file))
            const res = await api.post("/register/upload-documents", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            // Belgeler kabul edildi, backend hesabı finalize etti.
            login(res.data.token, res.data.user)
            saveDefaultAddress()
            setRegStep(4) // → Tamamlandı
        } catch (err) {
            const first = Object.values(err.response?.data?.errors || {})[0]?.[0]
            toast({ message: first || err.response?.data?.message || "Yükleme başarısız.", type: "error" })
        } finally {
            setRegLoading(false)
        }
    }

    const verifyRegisterOtp = async () => {
        setRegErrors({}); setRegLoading(true)
        try {
            await api.post("/register/verify-otp", { otp: regOtp.join("") })
            setRegStep(2) // → Hesap Türü
        } catch (err) {
            toast({ message: err.response?.data?.message || "Kod hatalı.", type: "error" })
            setRegOtp(["", "", "", "", "", ""])
        } finally {
            setRegLoading(false)
        }
    }

    const resendRegisterOtp = async () => {
        try {
            const res = await api.post("/register/resend-otp")
            setRegDebugOtp(res.data.debug_otp || null)
            startRegCountdown()
            toast({ message: "Yeni kod gönderildi." })
        } catch (err) {
            toast({ message: err.response?.data?.message || "Kod gönderilemedi.", type: "error" })
        }
    }

    const handleRegOtpChange = (i, val) => {
        if (!/^\d?$/.test(val)) return
        const next = [...regOtp]; next[i] = val; setRegOtp(next)
        if (val && i < 5) document.getElementById(`otp-reg-${i + 1}`)?.focus()
    }

    const handleRegOtpKeyDown = (i, e) => {
        if (e.key === "Backspace" && !regOtp[i] && i > 0)
            document.getElementById(`otp-reg-${i - 1}`)?.focus()
    }

    const regSelectedGroup = regGroups.find(g => g.id === regSelectedGroupId)

    // "Belgeler" adımı (index 3) şu durumlarda hiç yaşanmıyor: bireysel grup,
    // ya da belge istemeyen ticari grup — ikisinde de handleSetType hesabı
    // doğrudan finalize edip step 4'e atlıyor. Adım çubuğu da buna göre
    // reaktif küçülüyor/büyüyor.
    const regSkipDocsStep   = regSelectedGroup?.kind === "individual" ||
        (regSelectedGroup?.kind === "commercial" && (regSelectedGroup?.required_documents?.length ?? 0) === 0)
    const regDisplaySteps   = regSkipDocsStep ? REG_STEPS.filter((_, i) => i !== 3) : REG_STEPS
    const regDisplayCurrent = regSkipDocsStep ? (regStep < 3 ? regStep : regStep - 1) : regStep

    // ═══════════════════════════════════════════════════════════
    // RENDER — 12 kolonlu grid, 6/6 sol-sağ, tek gövde
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">
            <Header />

            <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-8 lg:py-10 flex items-center justify-center">
                <div className="w-full bg-white rounded-sm shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-gray-200 relative">

                    {/* ═══════════ SOL: GİRİŞ YAP (col-span-6) ═══════════ */}
                    <div className="lg:col-span-6 flex flex-col bg-white z-10">
                        <div className="border-b border-gray-200 px-6 pt-5 pb-4 bg-white">
                            <h1 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight flex items-center gap-2">
                                <Lock className="w-5 h-5 text-purple-600" /> Tekrar Hoş Geldiniz!
                            </h1>
                            <p className="text-gray-500 text-[11px] sm:text-xs font-medium mt-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                                TeklifMeydanı hesabınıza giriş yapın
                            </p>
                        </div>
                        <div className="p-6 sm:p-8 flex-1">
                            <div className="max-w-sm mx-auto w-full">

                            {/* Tabs */}
                            <div className="flex bg-gray-50 border border-gray-200 rounded p-1 mb-6">
                                {LOGIN_TABS.map((t, i) => (
                                    <button key={i} onClick={() => { setLoginTab(i); setLoginStep(0); setLoginErrors({}) }}
                                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                                                loginTab === i ? "bg-purple-700 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                                            }`}>
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {/* ── Şifre ile giriş ────────────────────────────── */}
                            {loginTab === 1 && (
                                <div className="flex flex-col gap-4">
                                    <PhoneInput value={loginPassPhone} onChange={setLoginPassPhone} error={loginErrors.phone?.[0]} id="pass-phone" />
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Şifre</label>
                                            <a href="#" className="text-[10px] font-bold text-purple-600 hover:text-purple-800 transition-colors uppercase tracking-wider">Şifremi Unuttum</a>
                                        </div>
                                        <div className="relative">
                                            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type={loginShowPass ? "text" : "password"}
                                                placeholder="Şifreniz"
                                                value={loginPassword}
                                                onChange={e => setLoginPassword(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && handlePasswordLogin()}
                                                className="w-full pl-9 pr-10 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 rounded text-xs font-medium text-gray-700 outline-none focus:bg-white focus:ring-1 focus:ring-purple-400 focus:border-purple-400 transition-all"
                                            />
                                            <button type="button" onClick={() => setLoginShowPass(v => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {loginShowPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                        {loginErrors.password && <p className="text-[10px] font-bold text-red-500">{loginErrors.password[0]}</p>}
                                    </div>
                                    <button onClick={handlePasswordLogin} disabled={loginLoading}
                                            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all">
                                        {loginLoading && <RefreshCw size={14} className="animate-spin" />} Giriş Yap
                                    </button>
                                </div>
                            )}

                            {/* ── SMS: Telefon ───────────────────────────────── */}
                            {loginTab === 0 && loginStep === 0 && (
                                <div className="flex flex-col gap-4">
                                    <PhoneInput value={loginPhone} onChange={setLoginPhone} error={loginErrors.phone?.[0]} id="sms-phone" />
                                    <button onClick={sendLoginOtp} disabled={loginLoading || loginPhone.length !== 10 || !loginPhone.startsWith("5")}
                                            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-40 text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all">
                                        {loginLoading && <RefreshCw size={14} className="animate-spin" />} Kod Gönder
                                    </button>
                                </div>
                            )}

                            {/* ── SMS: OTP ───────────────────────────────────── */}
                            {loginTab === 0 && loginStep === 1 && (
                                <div className="flex flex-col gap-5">
                                    <div className="text-center">
                                        <CheckCircle size={26} className="text-emerald-500 mx-auto mb-2" />
                                        <p className="text-xs text-gray-600 font-medium">
                                            <span className="font-bold text-gray-800">0{loginPhone}</span> numarasına doğrulama kodu gönderildi.
                                        </p>
                                    </div>
                                    <div className="flex gap-2 justify-center">
                                        {loginOtp.map((digit, i) => (
                                            <input key={i} id={`otp-login-${i}`}
                                                   type="text" inputMode="numeric" maxLength={1} value={digit}
                                                   onChange={e => handleLoginOtpChange(i, e.target.value)}
                                                   onKeyDown={e => handleLoginOtpKeyDown(i, e)}
                                                   className="w-10 h-11 text-center text-lg font-extrabold text-gray-800 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                                            />
                                        ))}
                                    </div>
                                    {loginDebugOtp && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded">
                                            <span className="text-amber-600 text-xs">🔧</span>
                                            <p className="text-[10px] text-amber-700 font-medium">
                                                <span className="font-bold">Test kodu:</span>{" "}
                                                <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">{loginDebugOtp}</code>
                                            </p>
                                        </div>
                                    )}
                                    {loginErrors.otp && <p className="text-[10px] font-bold text-red-500 text-center">{loginErrors.otp[0]}</p>}
                                    <button onClick={verifyLoginOtp} disabled={loginLoading || loginOtp.some(d => !d)}
                                            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-40 text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all">
                                        {loginLoading && <RefreshCw size={14} className="animate-spin" />} Giriş Yap
                                    </button>
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <button onClick={() => setLoginStep(0)} className="text-gray-500 hover:text-gray-700 uppercase tracking-wider">← Geri</button>
                                        <button onClick={sendLoginOtp} disabled={loginCountdown > 0}
                                                className="flex items-center gap-1 text-gray-500 hover:text-purple-600 disabled:opacity-40 uppercase tracking-wider">
                                            <RefreshCw size={12} /> {loginCountdown > 0 ? `${loginCountdown}s` : "Yeni kod gönder"}
                                        </button>
                                    </div>
                                </div>
                            )}
                            </div>
                        </div>
                    </div>

                    {/* ═══════════ AYIRICI ═══════════ */}
                    <div className="hidden lg:block w-px bg-gray-200 absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-20" />
                    <div className="lg:hidden w-full h-px bg-gray-100 flex items-center justify-center relative">
                        <span className="bg-white px-4 text-[9px] font-bold uppercase tracking-widest text-gray-400 absolute z-10 rounded border border-gray-200 py-1">VEYA</span>
                    </div>

                    {/* ═══════════ SAĞ: HESAP OLUŞTUR (col-span-6) ═══════════ */}
                    <div className="lg:col-span-6 flex flex-col bg-gray-50/50 z-10 relative overflow-hidden">
                        <div className="border-b border-gray-200 px-6 pt-5 pb-4 bg-gray-50/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h1 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight flex items-center gap-2">
                                        <User className="w-5 h-5 text-purple-600" /> Hemen Üye Ol
                                    </h1>
                                    <p className="text-gray-500 text-[11px] sm:text-xs font-medium mt-1 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                                        Saniyeler içinde ücretsiz üye olun
                                    </p>
                                </div>
                                <span className="self-start sm:self-center text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded border bg-purple-50 text-purple-700 border-purple-200 flex-shrink-0">
                                    Adım {regDisplayCurrent + 1}/{regDisplaySteps.length}
                                </span>
                            </div>
                        </div>
                        <div className="p-6 sm:p-8 flex-1">
                        <div className="max-w-sm mx-auto w-full relative">

                            <StepBar current={regDisplayCurrent} steps={regDisplaySteps} />

                            {/* ── ADIM 1: Bilgiler ─────────────────────────── */}
                            {regStep === 0 && (
                                <div className="flex flex-col gap-3.5">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                            Ad Soyad <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Ahmet Yılmaz"
                                                value={regForm.name}
                                                onChange={e => {
                                                    const val = e.target.value
                                                        .split(" ")
                                                        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                                                        .join(" ")
                                                    setRegForm(f => ({ ...f, name: val }))
                                                }}
                                                className={`w-full pl-9 pr-4 py-2.5 bg-gray-50 hover:bg-white border text-xs font-medium text-gray-700 rounded outline-none focus:bg-white focus:ring-1 focus:ring-purple-400 focus:border-purple-400 transition-all ${
                                                    regErrors.name ? "border-red-300" : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            />
                                        </div>
                                        {regErrors.name && <p className="text-[10px] font-bold text-red-500 flex items-center gap-1"><AlertCircle size={11}/>{regErrors.name[0]}</p>}
                                    </div>

                                    <PhoneInput value={regForm.phone} onChange={v => setRegForm(f => ({ ...f, phone: v }))} error={regErrors.phone?.[0]} id="reg-phone" />

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">E-posta <span className="text-gray-400 font-normal normal-case">(opsiyonel)</span></label>
                                        <div className="relative">
                                            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                placeholder="ornek@mail.com"
                                                value={regForm.email}
                                                onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 rounded text-xs font-medium text-gray-700 outline-none focus:bg-white focus:ring-1 focus:ring-purple-400 focus:border-purple-400 transition-all"
                                            />
                                        </div>
                                        {regErrors.email && <p className="text-[10px] font-bold text-red-500">{regErrors.email[0]}</p>}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Şifre <span className="text-gray-400 font-normal normal-case">(opsiyonel)</span></label>
                                        <div className="relative">
                                            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type={regShowPass ? "text" : "password"}
                                                placeholder="En az 6 karakter"
                                                value={regForm.password}
                                                onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                                                className="w-full pl-9 pr-10 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 rounded text-xs font-medium text-gray-700 outline-none focus:bg-white focus:ring-1 focus:ring-purple-400 focus:border-purple-400 transition-all"
                                            />
                                            <button type="button" onClick={() => setRegShowPass(v => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {regShowPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-medium">SMS ile de giriş yapabilirsiniz, şifre zorunlu değil.</p>
                                        {regErrors.password && <p className="text-[10px] font-bold text-red-500">{regErrors.password[0]}</p>}
                                    </div>

                                    {regForm.password && (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Şifre Tekrar</label>
                                            <div className="relative">
                                                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="password"
                                                    placeholder="Şifrenizi tekrarlayın"
                                                    value={regForm.password_confirmation}
                                                    onChange={e => setRegForm(f => ({ ...f, password_confirmation: e.target.value }))}
                                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 rounded text-xs font-medium text-gray-700 outline-none focus:bg-white focus:ring-1 focus:ring-purple-400 focus:border-purple-400 transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Adres — opsiyonel, seçilirse hesabınızın varsayılan
                                        adresi olarak kaydedilir (talep oluştururken otomatik
                                        kullanılır). */}
                                    <LocationSelect {...loc} showNeighborhood={true} />

                                    {/* Yasal onaylar — bkz. backend RegisterController::register().
                                        Kullanıcı Sözleşmesi + KVKK Aydınlatma Metni ZORUNLU, tek onay
                                        kutusunda birleşik. Açık Rıza ve Ticari Elektronik İleti KVKK
                                        gereği isteğe bağlı, varsayılan işaretsiz. */}
                                    <div className="flex flex-col gap-2 pt-1">
                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="checkbox" checked={regKvkkOnay}
                                                   onChange={e => setRegKvkkOnay(e.target.checked)}
                                                   className="mt-0.5 w-3.5 h-3.5 accent-purple-600 flex-shrink-0" />
                                            <span className="text-[10px] text-gray-500 font-medium leading-relaxed">
                                                <button type="button" onClick={() => setRegLegalModalType("user_agreement")}
                                                        className="text-purple-700 font-bold hover:underline">Kullanıcı Sözleşmesi</button>
                                                {" "}ve{" "}
                                                <button type="button" onClick={() => setRegLegalModalType("kvkk_disclosure")}
                                                        className="text-purple-700 font-bold hover:underline">KVKK Aydınlatma Metni</button>
                                                'ni okudum, kabul ediyorum. <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        {regErrors.kvkk_onay && <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 pl-5"><AlertCircle size={11}/>{regErrors.kvkk_onay[0]}</p>}

                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="checkbox" checked={regAcikRizaOnay}
                                                   onChange={e => setRegAcikRizaOnay(e.target.checked)}
                                                   className="mt-0.5 w-3.5 h-3.5 accent-purple-600 flex-shrink-0" />
                                            <span className="text-[10px] text-gray-500 font-medium leading-relaxed">
                                                <button type="button" onClick={() => setRegLegalModalType("explicit_consent")}
                                                        className="text-purple-700 font-bold hover:underline">Açık Rıza Metni</button>
                                                'ni okudum, kabul ediyorum. <span className="text-gray-400 font-normal">(opsiyonel)</span>
                                            </span>
                                        </label>

                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="checkbox" checked={regTicariIletiOnay}
                                                   onChange={e => setRegTicariIletiOnay(e.target.checked)}
                                                   className="mt-0.5 w-3.5 h-3.5 accent-purple-600 flex-shrink-0" />
                                            <span className="text-[10px] text-gray-500 font-medium leading-relaxed">
                                                Kampanya, indirim ve duyurulardan{" "}
                                                <button type="button" onClick={() => setRegLegalModalType("commercial_electronic_message")}
                                                        className="text-purple-700 font-bold hover:underline">ticari elektronik ileti</button>
                                                {" "}yoluyla haberdar olmak istiyorum. <span className="text-gray-400 font-normal">(opsiyonel)</span>
                                            </span>
                                        </label>
                                    </div>

                                    <button onClick={handleRegister} disabled={regLoading}
                                            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all">
                                        {regLoading && <RefreshCw size={14} className="animate-spin" />} Devam Et <ChevronRight size={14} />
                                    </button>

                                    {regLegalModalType && (
                                        <LegalDocumentModal type={regLegalModalType} onClose={() => setRegLegalModalType(null)} />
                                    )}
                                </div>
                            )}

                            {/* ── ADIM 3: Hesap türü ───────────────────────── */}
                            {regStep === 2 && (
                                <div className="flex flex-col gap-4">
                                    {regGroupsLoading ? (
                                        <div className="flex items-center justify-center py-10">
                                            <Loader2 size={20} className="animate-spin text-purple-500" />
                                        </div>
                                    ) : regGroups.length === 0 ? (
                                        <p className="text-xs text-gray-400 font-medium text-center py-6">
                                            Şu anda seçilebilir bir hesap türü bulunamadı, lütfen daha sonra tekrar deneyin.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {regGroups.map(group => {
                                                const Icon = GROUP_ICON[group.kind] || User
                                                const sel  = regSelectedGroupId === group.id
                                                const requiresDocs = group.kind === "commercial" && group.required_documents?.length > 0
                                                return (
                                                    <button key={group.id} onClick={() => setRegSelectedGroupId(group.id)}
                                                            className={`p-3 text-left border rounded-sm transition-all ${
                                                                sel ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                                                            }`}>
                                                        <div className={`w-8 h-8 rounded flex items-center justify-center mb-2 ${sel ? "bg-purple-100" : "bg-gray-100"}`}>
                                                            <Icon size={16} className={sel ? "text-purple-700" : "text-gray-500"} />
                                                        </div>
                                                        <p className={`text-xs font-bold ${sel ? "text-purple-800" : "text-gray-800"}`}>{group.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-snug">
                                                            {group.kind === "individual" ? "Talep oluşturmak istiyorum" : "Ticari hesap — teklif verebilirsiniz"}
                                                        </p>
                                                        {requiresDocs && (
                                                            <span className="mt-1.5 inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-700 rounded">Belge gerekli</span>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {regSelectedGroup?.kind === "commercial" && (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                                Firma / İşletme Adı <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Briefcase size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input type="text" placeholder="Örn: Yılmaz Emlak Ltd."
                                                       value={regCompanyName} onChange={e => setRegCompanyName(e.target.value)}
                                                       className="w-full pl-9 pr-4 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 rounded text-xs font-medium text-gray-700 outline-none focus:bg-white focus:ring-1 focus:ring-purple-400 focus:border-purple-400 transition-all"
                                                />
                                            </div>
                                            {regErrors.company_name && <p className="text-[10px] font-bold text-red-500">{regErrors.company_name[0]}</p>}
                                            <p className="text-[10px] text-gray-400 font-medium">Profilinizde ve tekliflerinizde görünür.</p>
                                        </div>
                                    )}

                                    <button onClick={handleSetType} disabled={regLoading || !regSelectedGroupId}
                                            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-40 text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all">
                                        {regLoading && <RefreshCw size={14} className="animate-spin" />} Devam Et <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}

                            {/* ── ADIM 4: Belgeler (sadece belge isteyen ticari gruplar) ── */}
                            {regStep === 3 && (
                                <div className="flex flex-col gap-3">
                                    <p className="text-[10px] text-gray-500 font-medium mb-1">PDF, JPG veya PNG · Maks. 5MB</p>
                                    {regRequiredDocuments.map(doc => {
                                        const uploaded = regFiles[doc.key]
                                        return (
                                            <div key={doc.key} className={`flex items-center gap-3 p-3 border rounded-sm transition-all ${
                                                uploaded ? "border-emerald-300 bg-emerald-50" : "border-gray-200"
                                            }`}>
                                                <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${uploaded ? "bg-emerald-100" : "bg-gray-100"}`}>
                                                    <FileText size={16} className={uploaded ? "text-emerald-600" : "text-gray-400"} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-800">
                                                        {doc.label} {doc.required !== false && <span className="text-red-500">*</span>}
                                                    </p>
                                                    <p className={`text-[10px] font-medium truncate ${uploaded ? "text-emerald-600" : "text-gray-400"}`}>
                                                        {uploaded ? uploaded.name : "Belge yükleyin"}
                                                    </p>
                                                </div>
                                                {uploaded ? (
                                                    <button onClick={() => removeRegFile(doc.key)} className="text-gray-400 hover:text-red-500 p-1">
                                                        <X size={14} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => regFileRefs.current[doc.key]?.click()}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                                        <Upload size={12} /> Seç
                                                    </button>
                                                )}
                                                <input ref={el => regFileRefs.current[doc.key] = el} type="file"
                                                       accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                                       onChange={e => handleRegFile(doc.key, e)} />
                                            </div>
                                        )
                                    })}
                                    <p className="text-[10px] text-gray-400 font-medium">* işaretli belgeler zorunludur.</p>
                                    <div className="flex gap-3 mt-1">
                                        <button onClick={() => setRegStep(2)} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 rounded text-xs font-bold uppercase tracking-wider transition-all">
                                            Geri
                                        </button>
                                        <button onClick={uploadRegDocuments} disabled={regLoading}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all">
                                            {regLoading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />} Gönder
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── ADIM 2: Doğrulama ────────────────────────── */}
                            {regStep === 1 && (
                                <div className="flex flex-col gap-5">
                                    <div className="text-center">
                                        <CheckCircle size={26} className="text-emerald-500 mx-auto mb-2" />
                                        <p className="text-xs text-gray-600 font-medium">
                                            <span className="font-bold text-gray-800">0{regForm.phone}</span> numarasına doğrulama kodu gönderildi.
                                        </p>
                                    </div>
                                    <div className="flex gap-2 justify-center">
                                        {regOtp.map((digit, i) => (
                                            <input key={i} id={`otp-reg-${i}`}
                                                   type="text" inputMode="numeric" maxLength={1} value={digit}
                                                   onChange={e => handleRegOtpChange(i, e.target.value)}
                                                   onKeyDown={e => handleRegOtpKeyDown(i, e)}
                                                   className="w-10 h-11 text-center text-lg font-extrabold text-gray-800 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                                            />
                                        ))}
                                    </div>
                                    {regDebugOtp && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded">
                                            <span className="text-amber-600 text-xs">🔧</span>
                                            <p className="text-[10px] text-amber-700 font-medium">
                                                <span className="font-bold">Test kodu:</span>{" "}
                                                <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">{regDebugOtp}</code>
                                            </p>
                                        </div>
                                    )}
                                    <button onClick={verifyRegisterOtp} disabled={regLoading || regOtp.some(d => !d)}
                                            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-40 text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all">
                                        {regLoading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />} Doğrula
                                    </button>
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <button onClick={() => setRegStep(0)} className="text-gray-500 hover:text-gray-700 uppercase tracking-wider flex items-center gap-1">
                                            <ChevronLeft size={12} /> Geri
                                        </button>
                                        <button onClick={resendRegisterOtp} disabled={regCountdown > 0}
                                                className="flex items-center gap-1 text-gray-500 hover:text-purple-600 disabled:opacity-40 uppercase tracking-wider">
                                            <RefreshCw size={12} /> {regCountdown > 0 ? `${regCountdown}s` : "Yeni kod gönder"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── ADIM 5: Tamamlandı ───────────────────────── */}
                            {regStep === 4 && (
                                <div className="text-center py-4 flex flex-col items-center gap-4">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${regIsAgent ? "bg-amber-100" : "bg-emerald-100"}`}>
                                        {regIsAgent ? <Clock size={28} className="text-amber-500" /> : <CheckCircle size={28} className="text-emerald-500" />}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 mb-1">
                                            {regIsAgent ? "Başvurunuz alındı!" : "Hoş geldiniz!"}
                                        </h3>
                                        <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">
                                            {regIsAgent
                                                ? "Belgeleriniz inceleniyor. Onay süreciniz 1–2 iş günü sürer. Sonucu SMS ile bildireceğiz."
                                                : "Hesabınız aktif. Hemen talep oluşturabilirsiniz!"}
                                        </p>
                                    </div>
                                    <button onClick={() => navigate("/")}
                                            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white px-6 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all">
                                        {regIsAgent ? "Tamam" : "Başlayalım"}
                                    </button>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    )
}