import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
    Bell, AlertTriangle, Smartphone, Mail,
    Phone, Eye, PauseCircle, Trash2, Loader2, ShieldCheck,
    FileText, Scale, CheckCircle2,
} from "lucide-react"
import Header from "@/components/layout/Header"
import PanelHeader from "@/components/dashboard/PanelHeader"
import Toggle from "@/components/ui/Toggle"
import { useAuth } from "@/store/AuthContext"
import { useToast } from "@/components/ui/Toast"
import api from "@/lib/axios"
import { fetchLegalDocuments } from "@/lib/legalDocuments.js"
import LegalDocumentModal from "@/components/legal/LegalDocumentModal.jsx"

// NOT: Gizlilik ve hesap işlemleri uç noktaları (/user/privacy, /user/deactivate,
// /user/account) backend'de henüz mevcut olmayabilir — bu iki sekme arayüzü
// hazırlıyor, karşılık gelen Laravel route'ları eklenince gerçek veriyle
// senkron çalışacak. Şimdilik istek başarısız olursa arayüz sessizce yerel
// state ile devam ediyor. Bildirim Tercihleri sekmesi ise gerçek backend'e
// bağlı (bkz. UserProfileController::notificationPreferences()).

const TABS = [
    { key: "notifications", label: "Bildirim Tercihleri", icon: Bell },
    { key: "legal",         label: "Yasal Metinler",       icon: Scale },
    { key: "privacy",       label: "Gizlilik",             icon: Eye },
    { key: "account",       label: "Hesap İşlemleri",       icon: AlertTriangle },
]

// Backend'deki NotificationType::category() ile birebir eşleşmeli.
const NOTIFICATION_ROWS = [
    { key: "new_offer",       label: "Yeni Teklif Geldi",              desc: "Talebinize bir uzman teklif verdiğinde" },
    { key: "offer_status",    label: "Teklif Durumu Güncellendi",      desc: "Verdiğiniz ya da aldığınız teklif kabul, red veya güncelleme aldığında" },
    { key: "demand_status",   label: "Talep Durumu Değişti",           desc: "Talebiniz onaylandığında, reddedildiğinde veya süresi yaklaştığında" },
    { key: "region_activity", label: "Portföyümle Eşleşen Yeni Talep", desc: "İlgilendiğiniz kategori/bölgede yeni bir talep girildiğinde" },
    { key: "messages",        label: "Yeni Mesaj",                     desc: "Bir görüşmede karşı taraftan mesaj geldiğinde" },
    { key: "billing",         label: "Ödeme & Abonelik",                desc: "Ödeme, abonelik süresi veya kontör bakiyenizle ilgili" },
]

// Kilitli satır — 'account' kategorisi kullanıcı tarafından kapatılamaz
// (bkz. backend NotificationType::category(), hesap onay/red gibi kritik
// olaylar). Ayrı tutuluyor çünkü prefs state'ine dahil değil, PUT'a da gitmiyor.
const LOCKED_ROW = {
    key: "account",
    label: "Hesap ve Onay Bildirimleri",
    desc: "Uzman başvurusu, belge ve ilan onay/red gibi kritik hesap olayları — her zaman açık",
}

// ── Bildirim Tercihleri Sekmesi ─────────────────────────────────
function NotificationTab() {
    const toast = useToast()
    const [prefs, setPrefs] = useState(() => {
        const initial = {}
        NOTIFICATION_ROWS.forEach(r => { initial[r.key] = { sms: true, email: true } })
        return initial
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        api.get("/user/notification-preferences")
            .then(res => { if (res.data) setPrefs(prev => ({ ...prev, ...res.data })) })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const toggle = (key, channel) => {
        setPrefs(prev => ({ ...prev, [key]: { ...prev[key], [channel]: !prev[key][channel] } }))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await api.put("/user/notification-preferences", prefs)
            toast({ message: "Bildirim tercihleri kaydedildi." })
        } catch {
            toast({ message: "Kaydedilemedi, daha sonra tekrar deneyin.", type: "error" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 size={18} className="animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div>
            {/* Kolon başlıkları */}
            <div className="flex items-center gap-4 pb-2 mb-1 border-b border-gray-100">
                <div className="flex-1" />
                <div className="w-14 flex flex-col items-center gap-0.5">
                    <Smartphone size={12} className="text-gray-400" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">SMS</span>
                </div>
                <div className="w-14 flex flex-col items-center gap-0.5">
                    <Mail size={12} className="text-gray-400" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">E-posta</span>
                </div>
            </div>

            {NOTIFICATION_ROWS.map(row => (
                <div key={row.key} className="flex items-center gap-4 py-2.5 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800">{row.label}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{row.desc}</p>
                    </div>
                    <div className="w-14 flex justify-center">
                        <Toggle checked={prefs[row.key]?.sms} onChange={() => toggle(row.key, "sms")} />
                    </div>
                    <div className="w-14 flex justify-center">
                        <Toggle checked={prefs[row.key]?.email} onChange={() => toggle(row.key, "email")} />
                    </div>
                </div>
            ))}

            {/* Kilitli satır — kategori state'ine dahil değil, sadece bilgilendirme */}
            <div key={LOCKED_ROW.key} className="flex items-center gap-4 py-2.5 border-b border-gray-50 last:border-0 opacity-70">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800">{LOCKED_ROW.label}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{LOCKED_ROW.desc}</p>
                </div>
                <div className="w-14 flex justify-center">
                    <Toggle checked={true} onChange={() => {}} disabled />
                </div>
                <div className="w-14 flex justify-center">
                    <Toggle checked={true} onChange={() => {}} disabled />
                </div>
            </div>

            <button onClick={handleSave} disabled={saving}
                    className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-60 text-white px-4 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all">
                {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                {saving ? "Kaydediliyor..." : "Tercihleri Kaydet"}
            </button>
        </div>
    )
}

// ── Yasal Metinler Sekmesi ────────────────────────────────────────
// Kayıt formunda (AuthPage.jsx) onaylanan/görülen metinlerin aynıları —
// üye olduktan sonra da istediği zaman buradan okuyabilsin diye (bkz.
// GET /legal-documents, GET /user/legal-consents). Metin admin panelden
// güncellenirse (bkz. LegalDocumentResource) buradaki versiyon numarası
// da otomatik değişir.
function LegalDocumentsTab() {
    const toast = useToast()
    const [docs, setDocs] = useState([])
    const [consents, setConsents] = useState({})
    const [loading, setLoading] = useState(true)
    const [viewingType, setViewingType] = useState(null)
    const [accepting, setAccepting] = useState(null) // o an onaylanan doc'un type'ı

    useEffect(() => {
        Promise.all([
            fetchLegalDocuments(),
            api.get("/user/legal-consents").catch(() => ({ data: { data: [] } })),
        ]).then(([documents, consentRes]) => {
            setDocs(documents)
            const map = {}
            ;(consentRes.data?.data || []).forEach(c => { map[c.type] = c })
            setConsents(map)
        }).finally(() => setLoading(false))
    }, [])

    // Tek tıkla onay — SMS/OTP GEREKMEZ, kullanıcı zaten oturum açmış
    // (kimliği doğrulanmış) durumda; bkz. backend POST /user/legal-consents
    // (aynı endpoint, LegalReconsentGate.jsx'in zorunlu tekrar-onay
    // ekranında da kullanılıyor).
    const handleAccept = async (type) => {
        setAccepting(type)
        try {
            await api.post("/user/legal-consents", { types: [type] })
            setConsents(prev => {
                const doc = docs.find(d => d.type === type)
                return { ...prev, [type]: { type, version: doc?.version, accepted_at: new Date().toISOString() } }
            })
            toast({ message: "Onayınız kaydedildi." })
        } catch {
            toast({ message: "Onay kaydedilemedi, lütfen tekrar deneyin.", type: "error" })
        } finally {
            setAccepting(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 size={18} className="animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="space-y-1">
            {docs.map(doc => {
                const consent = consents[doc.type]
                return (
                    <div key={doc.type}
                         className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                        <FileText size={15} className="text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-gray-800">{doc.title}</p>
                                <span className="text-[9px] font-bold text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-1.5 py-0.5">
                                    v{doc.version}
                                </span>
                                {!doc.is_mandatory && (
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">İsteğe Bağlı</span>
                                )}
                            </div>
                            {consent ? (
                                <p className="flex items-center gap-1 text-[10px] text-green-600 font-semibold mt-0.5">
                                    <CheckCircle2 size={11} />
                                    {consent.version >= doc.version
                                        ? `Onaylandı — ${new Date(consent.accepted_at).toLocaleDateString("tr-TR")}`
                                        : `Eski versiyon (v${consent.version}) onaylanmış, güncelleme bekleniyor`}
                                </p>
                            ) : (
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Henüz onaylamadınız</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => setViewingType(doc.type)}
                                    className="text-[10px] font-bold uppercase tracking-wider text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded px-3 py-1.5 transition-colors">
                                Oku
                            </button>
                            {(!consent || consent.version < doc.version) && (
                                <button onClick={() => handleAccept(doc.type)} disabled={accepting === doc.type}
                                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded px-3 py-1.5 transition-colors">
                                    {accepting === doc.type && <Loader2 size={11} className="animate-spin" />}
                                    Onayla
                                </button>
                            )}
                        </div>
                    </div>
                )
            })}

            {viewingType && (
                <LegalDocumentModal type={viewingType} onClose={() => setViewingType(null)} />
            )}
        </div>
    )
}

// ── Gizlilik Sekmesi ────────────────────────────────────────────
function PrivacyTab() {
    const toast = useToast()
    const [phoneVisible, setPhoneVisible] = useState(false)
    const [emailVisible, setEmailVisible] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        api.get("/user/privacy")
            .then(res => {
                setPhoneVisible(!!res.data?.phone_visible)
                setEmailVisible(!!res.data?.email_visible)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await api.put("/user/privacy", { phone_visible: phoneVisible, email_visible: emailVisible })
            toast({ message: "Gizlilik ayarları kaydedildi." })
        } catch {
            toast({ message: "Kaydedilemedi, daha sonra tekrar deneyin.", type: "error" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 size={18} className="animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-3 py-2.5 border-b border-gray-50">
                <Phone size={15} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800">Telefon Numaramı Göster</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        Kapalıyken numaranız yalnızca kabul ettiğiniz teklif sahibiyle paylaşılır.
                    </p>
                </div>
                <Toggle checked={phoneVisible} onChange={setPhoneVisible} />
            </div>

            <div className="flex items-center gap-3 py-2.5">
                <Mail size={15} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800">E-posta Adresimi Göster</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        Kapalıyken e-postanız diğer kullanıcılara gösterilmez.
                    </p>
                </div>
                <Toggle checked={emailVisible} onChange={setEmailVisible} />
            </div>

            <button onClick={handleSave} disabled={saving}
                    className="mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-60 text-white px-4 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all">
                {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </button>
        </div>
    )
}

// ── Hesap İşlemleri Sekmesi ──────────────────────────────────────
function AccountActionsTab() {
    const toast = useToast()
    const { logout } = useAuth()
    const navigate = useNavigate()
    const [deactivating, setDeactivating] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleDeactivate = async () => {
        if (!confirm("Hesabınızı dondurmak istediğinizden emin misiniz? Tekrar giriş yaptığınızda hesabınız otomatik olarak aktifleşir.")) return
        setDeactivating(true)
        try {
            await api.post("/user/deactivate")
            toast({ message: "Hesabınız donduruldu." })
            await logout()
            navigate("/")
        } catch {
            toast({ message: "İşlem başarısız oldu.", type: "error" })
        } finally {
            setDeactivating(false)
        }
    }

    const handleDelete = async () => {
        const confirmed = confirm("Hesabınızı KALICI OLARAK silmek üzeresiniz. Bu işlem geri alınamaz, tüm talep/portföy/teklif verileriniz silinir. Devam etmek istiyor musunuz?")
        if (!confirmed) return
        const doubleCheck = prompt('Onaylamak için kutuya "SİL" yazın:')
        if (doubleCheck !== "SİL") return

        setDeleting(true)
        try {
            await api.delete("/user/account")
            toast({ message: "Hesabınız silindi." })
            await logout()
            navigate("/")
        } catch {
            toast({ message: "İşlem başarısız oldu.", type: "error" })
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 justify-between p-3 bg-gray-50 border border-gray-200 rounded-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                    <PauseCircle size={16} className="text-amber-500 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800">Hesabımı Dondur</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">İlanlarınız gizlenir, tekrar giriş yapınca aktifleşir.</p>
                    </div>
                </div>
                <button onClick={handleDeactivate} disabled={deactivating}
                        className="flex-shrink-0 flex items-center gap-1.5 bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-60 px-3 py-2 rounded font-bold text-[11px] transition-all">
                    {deactivating ? <Loader2 size={12} className="animate-spin" /> : null}
                    Dondur
                </button>
            </div>

            <div className="flex items-center gap-3 justify-between p-3 bg-red-50/40 border border-red-100 rounded-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                    <Trash2 size={16} className="text-red-500 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800">Hesabımı Kalıcı Olarak Sil</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">Bu işlem geri alınamaz, tüm verileriniz silinir.</p>
                    </div>
                </div>
                <button onClick={handleDelete} disabled={deleting}
                        className="flex-shrink-0 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 px-3 py-2 rounded font-bold text-[11px] transition-all">
                    {deleting ? <Loader2 size={12} className="animate-spin" /> : null}
                    Sil
                </button>
            </div>
        </div>
    )
}

// ── Ana Sayfa ─────────────────────────────────────────────────
export default function SettingsPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    // ?tab=legal — bildirim bağlantısından (NotifyLegalDocumentUpdated) veya
    // LegalReconsentGate.jsx'ten doğrudan bu sekmeye gelinebilsin diye.
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "notifications")

    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate("/")
    }, [authLoading, isAuthenticated])

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-200 flex flex-col">
                <Header />
                <div className="flex items-center justify-center flex-1">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    if (!isAuthenticated) return null

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
                                const isDanger = tab.key === "account"
                                return (
                                    <button key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`w-full flex items-center gap-2.5 px-4 py-3 text-left border-b border-gray-100 last:border-0 transition-all ${
                                                activeTab === tab.key
                                                    ? isDanger ? "bg-red-50 text-red-700" : "bg-purple-50 text-purple-700"
                                                    : "text-gray-600 hover:bg-gray-50"
                                            }`}>
                                        <Icon size={14} className={activeTab === tab.key ? (isDanger ? "text-red-500" : "text-purple-600") : "text-gray-400"} />
                                        <span className="text-xs font-bold">{tab.label}</span>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="mt-4 flex items-start gap-2.5 px-4 py-3 bg-purple-50 border border-purple-100 rounded-sm hidden md:flex">
                            <ShieldCheck size={13} className="text-purple-500 mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] text-purple-700 font-semibold leading-relaxed">
                                Şifre değiştirme "Profilim" sayfasındaki Güvenlik sekmesinden yönetilir.
                            </p>
                        </div>
                    </div>

                    {/* Sağ içerik */}
                    <div className="md:col-span-3">
                        <div className={`bg-white rounded-sm border shadow-sm p-5 ${activeTab === "account" ? "border-red-100" : "border-gray-200"}`}>
                            {activeTab === "notifications" && <NotificationTab />}
                            {activeTab === "legal"         && <LegalDocumentsTab />}
                            {activeTab === "privacy"       && <PrivacyTab />}
                            {activeTab === "account"       && <AccountActionsTab />}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}