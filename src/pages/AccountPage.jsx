import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
    User, MapPin, Shield,
    CheckCircle, Loader2, Phone,
    Building2, Car, Layers, Lock, Eye, EyeOff, Wallet, Sparkles,
    Landmark, Clock, XCircle
} from "lucide-react"
import Header from "@/components/layout/Header"
import PanelHeader from "@/components/dashboard/PanelHeader"
import { useAuth } from "@/store/AuthContext"
import { useToast } from "@/components/ui/Toast"
import { useTurkiyeLocation } from "@/hooks/useTurkiyeLocation"
import AddressManager from "@/components/account/AddressManager"
import RegionManager from "@/components/account/RegionManager"
import api from "@/lib/axios"

// ── Tab tanımları ─────────────────────────────────────────────
const TABS_BUYER = [
    { key: "profile",   label: "Profil Bilgileri", icon: User   },
    { key: "wallet",    label: "Cüzdanım",         icon: Wallet },
    { key: "addresses", label: "Adreslerim",       icon: MapPin },
    { key: "dealer",    label: "Bayilik Başvurusu", icon: Landmark },
    { key: "security",  label: "Güvenlik",          icon: Shield },
]

const TABS_AGENT = [
    { key: "profile",  label: "Profil Bilgileri", icon: User   },
    { key: "wallet",   label: "Cüzdanım",         icon: Wallet },
    { key: "regions",  label: "Bölge Takibi",      icon: MapPin },
    { key: "dealer",   label: "Bayilik Başvurusu", icon: Landmark },
    { key: "security", label: "Güvenlik",           icon: Shield },
]

// ── Ortak input bileşeni ────────────────────────────────────────
function FieldInput({ label, value, onChange, placeholder, type = "text", required = false }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:bg-white placeholder:text-gray-400 transition-colors"
            />
        </div>
    )
}

// ── Profil Bilgileri Sekmesi ──────────────────────────────────
function ProfileTab({ user, onUpdate }) {
    const toast = useToast()
    const [form, setForm] = useState({
        name:         user?.name         || "",
        email:        user?.email        || "",
        company_name: user?.company_name || "",
    })
    const [saving, setSaving] = useState(false)
    const [edited, setEdited] = useState(false)

    const set = (k) => (e) => {
        setForm(p => ({ ...p, [k]: e.target.value }))
        setEdited(true)
    }

    const handleSave = async () => {
        if (!form.name.trim()) { toast({ message: "Ad Soyad zorunludur.", type: "error" }); return }
        setSaving(true)
        try {
            const res = await api.put("/user/profile", form)
            onUpdate(res.data.data || res.data)
            toast({ message: "Profil güncellendi." })
            setEdited(false)
        } catch (err) {
            toast({ message: err.response?.data?.message || "Güncelleme başarısız.", type: "error" })
        } finally {
            setSaving(false)
        }
    }

    const agentTypeLabel = {
        emlakci:   "Emlakçı",
        galerici:  "Galerici",
        her_ikisi: "Emlakçı & Galerici",
    }[user?.agent_type || user?.account_type] || null

    const isAgentUser = user?.roles?.some?.(r => (typeof r === "string" ? r : r.name) === "agent")

    return (
        <div className="space-y-6">

            {/* Avatar + rol */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-sm border border-gray-200">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-700 to-indigo-600 rounded flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {user?.name?.charAt(0) || "?"}
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-sm">{user?.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full">
              {isAgentUser ? "Uzman" : "Müşteri"}
            </span>
                        {agentTypeLabel && (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                {(user?.agent_type || user?.account_type) === "emlakci"   ? <Building2 size={9} /> :
                    (user?.agent_type || user?.account_type) === "galerici" ? <Car size={9} />       : <Layers size={9} />}
                                {agentTypeLabel}
              </span>
                        )}
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            user?.status === "active"
                                ? "bg-green-50 text-green-700 border-green-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
              {user?.status === "active" ? "Aktif" : "Onay Bekliyor"}
            </span>
                    </div>
                </div>
            </div>

            {/* Form alanları */}
            <div className="space-y-4">
                <FieldInput label="Ad Soyad" value={form.name} onChange={set("name")} placeholder="Ad ve soyadınız" required />
                <FieldInput label="E-posta" value={form.email} onChange={set("email")} placeholder="email@example.com" type="email" />

                {user?.company_name !== undefined && (
                    <FieldInput label="Şirket / Ofis Adı" value={form.company_name} onChange={set("company_name")} placeholder="Şirket veya ofis adınız" />
                )}

                {/* Telefon — salt okunur */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Telefon Numarası</label>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded">
                        <Phone size={13} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs font-bold text-gray-600">{user?.phone || "—"}</span>
                        <span className="ml-auto text-[9px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
              Doğrulandı
            </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">Telefon numarası değiştirilemez.</p>
                </div>
            </div>

            {edited && (
                <button onClick={handleSave} disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-60 text-white rounded font-bold text-xs uppercase tracking-wider transition-all">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </button>
            )}
        </div>
    )
}

// ── Cüzdanım Sekmesi ──────────────────────────────────────────
function WalletTab({ user }) {
    const hasSubscription = !!user?.active_subscription

    return (
        <div className="space-y-5">
            <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-sm p-5 text-white">
                {hasSubscription ? (
                    <div className="relative z-10">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-purple-400 mb-1.5">Aktif Abonelik</p>
                        <h3 className="font-bold text-lg text-white mb-1">{user.active_subscription.product_name}</h3>
                        <p className="text-gray-400 text-xs font-medium mb-4">
                            {user.active_subscription.ends_at} tarihine kadar geçerli
                        </p>
                        <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                {user.active_subscription.offer_quota == null ? "∞" : user.active_subscription.offers_remaining}
              </span>
                            <span className="text-gray-400 text-xs font-bold">
                {user.active_subscription.offer_quota == null
                    ? "sınırsız teklif hakkı"
                    : `/ ${user.active_subscription.offer_quota} teklif hakkı kaldı`}
              </span>
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">Kontör Bakiyesi</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">{user?.credit_balance ?? 0}</span>
                            <span className="text-gray-400 text-xs font-bold">kontör</span>
                        </div>
                        <p className="text-gray-400 text-xs font-medium mt-2">Her teklif hakkı 1 kontör harcar.</p>
                    </div>
                )}
            </div>

            {/* Satın alma — ödeme altyapısı tamamlanana kadar pasif */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={13} className="text-purple-500" />
                    <p className="text-xs font-bold text-gray-700">Kontör Yükle / Abone Ol</p>
                </div>
                <p className="text-[11px] text-gray-400 font-medium mb-3 leading-relaxed">
                    Ödeme altyapımız yakında aktif olacak. Hazır olduğunda buradan kontör satın alabilir
                    veya abonelik planınızı yükseltebileceksiniz.
                </p>
                <button disabled
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-200 text-gray-400 rounded font-bold text-xs uppercase tracking-wider cursor-not-allowed">
                    Çok Yakında
                </button>
            </div>
        </div>
    )
}

// ── Güvenlik Sekmesi ──────────────────────────────────────────
function SecurityTab() {
    const toast = useToast()
    const [form, setForm]     = useState({ current: "", password: "", confirm: "" })
    const [show, setShow]     = useState({ current: false, password: false, confirm: false })
    const [saving, setSaving] = useState(false)

    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
    const toggleShow = (k) => setShow(p => ({ ...p, [k]: !p[k] }))

    const handleSubmit = async () => {
        if (!form.current) { toast({ message: "Mevcut şifre zorunludur.", type: "error" }); return }
        if (form.password.length < 8) { toast({ message: "Yeni şifre en az 8 karakter olmalıdır.", type: "error" }); return }
        if (form.password !== form.confirm) { toast({ message: "Şifreler eşleşmiyor.", type: "error" }); return }

        setSaving(true)
        try {
            await api.put("/user/password", {
                current_password:      form.current,
                password:              form.password,
                password_confirmation: form.confirm,
            })
            toast({ message: "Şifreniz güncellendi." })
            setForm({ current: "", password: "", confirm: "" })
        } catch (err) {
            toast({ message: err.response?.data?.message || "Şifre güncellenemedi.", type: "error" })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-sm">
                <p className="text-xs text-purple-700 font-medium leading-relaxed">
                    Güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi öneririz.
                    Şifreniz en az 8 karakter olmalıdır.
                </p>
            </div>

            {[
                { key: "current",  label: "Mevcut Şifre", placeholder: "Mevcut şifrenizi girin" },
                { key: "password", label: "Yeni Şifre",   placeholder: "En az 8 karakter" },
                { key: "confirm",  label: "Şifre Tekrarı", placeholder: "Yeni şifreyi tekrar girin" },
            ].map(({ key, label, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{label}</label>
                    <div className="relative">
                        <input
                            type={show[key] ? "text" : "password"}
                            value={form[key]}
                            onChange={set(key)}
                            placeholder={placeholder}
                            className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:bg-white placeholder:text-gray-400 transition-colors"
                        />
                        <button onClick={() => toggleShow(key)} type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                            {show[key] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                    </div>
                </div>
            ))}

            <button onClick={handleSubmit} disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white rounded font-bold text-xs uppercase tracking-wider transition-all">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                {saving ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
        </div>
    )
}

// ── Bayilik Başvurusu Sekmesi ───────────────────────────────────
// Başvuru durumu backend'den çekilir (GET /dealer-applications/me):
// yoksa form gösterilir, "pending" ise inceleme kartı, "approved"/
// "rejected" ise sonuç kartı gösterilir. Onay/red işlemi admin panelinden
// yapılıyor — burada sadece başvuru + durum takibi var.
function DealerApplicationTab() {
    const toast = useToast()
    const loc = useTurkiyeLocation()
    const [application, setApplication] = useState(undefined) // undefined = henüz yüklenmedi
    const [motivation, setMotivation] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const fetchStatus = () => {
        api.get("/dealer-applications/me")
            .then(r => setApplication(r.data?.data ?? null))
            .catch(() => setApplication(null))
    }

    useEffect(() => { fetchStatus() }, [])

    const handleSubmit = async () => {
        if (!loc.selectedProvince) { toast({ message: "Lütfen bir il seçin.", type: "error" }); return }
        if (motivation.trim().length < 20) { toast({ message: "Açıklamanız en az 20 karakter olmalı.", type: "error" }); return }

        setSubmitting(true)
        try {
            await api.post("/dealer-applications", {
                il:         loc.selectedProvince.name,
                ilce:       loc.selectedDistrict?.name || null,
                motivation: motivation.trim(),
            })
            toast({ message: "Başvurunuz alındı, inceleme sonrası bilgilendirileceksiniz." })
            fetchStatus()
        } catch (err) {
            toast({ message: err.response?.data?.message || "Başvuru gönderilemedi.", type: "error" })
        } finally {
            setSubmitting(false)
        }
    }

    if (application === undefined) {
        return <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-purple-500" /></div>
    }

    // ── Durum kartı (pending / approved / rejected) ──
    if (application && application.status !== "rejected") {
        const isApproved = application.status === "approved"
        return (
            <div className="space-y-4">
                <div className={`p-5 rounded-sm border ${isApproved ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"}`}>
                    <div className="flex items-center gap-2 mb-2">
                        {isApproved ? <CheckCircle size={16} className="text-green-600" /> : <Clock size={16} className="text-amber-600" />}
                        <p className={`text-xs font-bold ${isApproved ? "text-green-700" : "text-amber-700"}`}>
                            {isApproved ? "Bayilik başvurunuz onaylandı" : "Başvurunuz inceleniyor"}
                        </p>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">
                        {application.ilce ? `${application.ilce}, ${application.il}` : `${application.il} (İl Bayiliği)`}
                    </p>
                    {isApproved && (
                        <p className="text-[11px] text-gray-500 font-medium mt-2 leading-relaxed">
                            Admin panele giriş yaparak kendi bölgenizdeki talep/teklif onaylarını ve gelir payınızı görebilirsiniz.
                        </p>
                    )}
                </div>
            </div>
        )
    }

    // ── Reddedilmişse: sebep + tekrar başvuru formu ──
    return (
        <div className="space-y-5">
            {application?.status === "rejected" && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <XCircle size={14} className="text-red-600" />
                        <p className="text-xs font-bold text-red-700">Önceki başvurunuz reddedildi</p>
                    </div>
                    {application.admin_note && (
                        <p className="text-[11px] text-red-600 font-medium">{application.admin_note}</p>
                    )}
                </div>
            )}

            <div className="p-4 bg-purple-50 border border-purple-100 rounded-sm">
                <p className="text-xs text-purple-700 font-medium leading-relaxed">
                    İl bayisi, kendi ilinden başvuran uzmanların abonelik/kontör gelirinden pay alır ve
                    o ildeki talep/teklif onaylarını yürütür. Başvurunuz genel merkez tarafından incelenir.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">İl *</label>
                    <select
                        value={loc.selectedProvince?.id || ""}
                        onChange={e => {
                            const p = loc.provinces.find(p => p.id === Number(e.target.value))
                            loc.setSelectedProvince(p || null)
                            loc.setSelectedDistrict(null)
                        }}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400"
                    >
                        <option value="">Seçiniz</option>
                        {loc.provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">İlçe (opsiyonel)</label>
                    <select
                        value={loc.selectedDistrict?.id || ""}
                        disabled={!loc.selectedProvince}
                        onChange={e => {
                            const d = loc.districts.find(d => d.id === Number(e.target.value))
                            loc.setSelectedDistrict(d || null)
                        }}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 disabled:opacity-50"
                    >
                        <option value="">Tüm il (il bayiliği)</option>
                        {loc.districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
            </div>
            <p className="text-[10px] text-gray-400 font-medium -mt-2">
                İlçe seçerseniz sadece o ilçe için, boş bırakırsanız tüm il için bayilik başvurusu yapmış olursunuz.
            </p>

            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Neden bayi olmak istiyorsunuz? *</label>
                <textarea
                    value={motivation}
                    onChange={e => setMotivation(e.target.value)}
                    rows={4}
                    placeholder="Sektör deneyiminizi ve bölgeyle ilginizi kısaca anlatın (en az 20 karakter)"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:bg-white placeholder:text-gray-400 transition-colors resize-none"
                />
            </div>

            <button onClick={handleSubmit} disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-60 text-white rounded font-bold text-xs uppercase tracking-wider transition-all">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Landmark size={14} />}
                {submitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}
            </button>
        </div>
    )
}

// ── Ana Sayfa ─────────────────────────────────────────────────
export default function AccountPage() {
    const { user, isAuthenticated, isAgent, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile")
    const [userData, setUserData] = useState(null)
    const TABS = isAgent ? TABS_AGENT : TABS_BUYER

    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate("/")
    }, [authLoading, isAuthenticated])

    useEffect(() => {
        if (user) setUserData(user)
    }, [user])

    const handleTabChange = (key) => {
        setActiveTab(key)
        setSearchParams({ tab: key })
    }

    if (authLoading || !userData) {
        return (
            <div className="min-h-screen bg-gray-200 flex flex-col">
                <Header />
                <div className="flex items-center justify-center flex-1">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">
            <Header />

            <main className="max-w-[1200px] mx-auto w-full px-4 py-6 flex-1">

                <PanelHeader />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    {/* Sol sidebar — tab menü */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
                            {TABS.map(tab => {
                                const Icon = tab.icon
                                return (
                                    <button key={tab.key}
                                            onClick={() => handleTabChange(tab.key)}
                                            className={`w-full flex items-center gap-2.5 px-4 py-3 text-left border-b border-gray-100 last:border-0 transition-all ${
                                                activeTab === tab.key ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50"
                                            }`}>
                                        <Icon size={14} className={activeTab === tab.key ? "text-purple-600" : "text-gray-400"} />
                                        <span className="text-xs font-bold">{tab.label}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Mobil: özet kart */}
                        <div className="mt-4 bg-white rounded-sm border border-gray-200 shadow-sm p-4 hidden md:block">
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="w-11 h-11 bg-gradient-to-br from-purple-700 to-indigo-600 rounded flex items-center justify-center text-white font-bold text-base">
                                    {userData?.name?.charAt(0) || "?"}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-xs leading-tight">{userData?.name}</p>
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{userData?.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sağ içerik */}
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-sm border border-gray-200 shadow-sm p-5">
                            {activeTab === "profile"   && <ProfileTab user={userData} onUpdate={setUserData} />}
                            {activeTab === "wallet"    && <WalletTab user={userData} />}
                            {activeTab === "addresses" && <AddressManager />}
                            {activeTab === "regions"   && <RegionManager />}
                            {activeTab === "dealer"    && <DealerApplicationTab />}
                            {activeTab === "security"  && <SecurityTab />}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}