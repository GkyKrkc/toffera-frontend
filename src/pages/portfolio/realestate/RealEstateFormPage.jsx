import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import {
    Building2, ChevronRight, Save, ArrowLeft,
    ChevronDown, Loader2, MapPin, Image, ImagePlus, FileText, AlertCircle,
} from "lucide-react"
// KATEGORİ: eskiden kaydederken backend'e sabit "type: gayrimenkul" gönderiliyordu
// — backend bunu Gayrimenkul KÖK kategorisine eşliyordu, kullanıcının izinleri
// (user_category_permissions) ise yaprak kategorilerde (satılık ev/daire,
// arsa/tarla, devremülk, kiralık ev/daire, kiralık iş yeri...) tanımlı
// olduğundan her kayıt 403 ile reddediliyordu (bkz. VehicleFormPage'deki
// aynı bug ve düzeltme). Artık kaydetmeden önce kullanıcının hesabına
// atanmış gerçek DB kategorisi seçtiriliyor ve category_id gönderiliyor.
// "Mülk Türü" (Daire/Villa/Arsa...) seçimi bundan AYRI, form alanlarını
// belirleyen zengin bir eksen olduğu için (Villa/Arsa/Dükkan gibi DB
// kategorileriyle 1:1 eşleşmiyor) DEĞİŞTİRİLMEDİ.
//
// MİMARİ: VehicleFormPage ile birebir aynı 3 adımlı FormShell kabuğu
// kullanılıyor (Kategori & Mülk Türü / Konum / Fiyat & Yayın) — iki portföy
// formunun da aynı yapıdan okunması ve bakımının kolay olması için.
import Header from "@/components/layout/Header"
import { useAuth } from "@/store/AuthContext"
import { useToast } from "@/components/ui/Toast"
import api from "@/lib/axios"
import { useTurkiyeLocation } from "@/hooks/useTurkiyeLocation"
import { EMLAK_TIPLER, FIELD_GROUPS, FIELD_META } from "@/data/realEstateData"
import ImageUploadModal from "@/components/portfolio/ImageUploadModal"
import DocumentUploadModal from "@/components/portfolio/DocumentUploadModal"
import FormShell from "@/pages/demands/_shared/FormShell"

const STATUS_OPTIONS = [
    { value: "available", label: "Satışta" },
    { value: "reserved",  label: "Rezerve" },
    { value: "sold",      label: "Satıldı" },
]

function SectionHeader({ children }) {
    return (
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">
            {children}
        </p>
    )
}

function SelectField({ label, value, onChange, options, required, placeholder = "Seçin..." }) {
    return (
        <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <div className="relative">
                <select value={value || ""} onChange={e => onChange(e.target.value)}
                        className="w-full appearance-none px-3 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 focus:border-amber-400 focus:bg-white focus:ring-1 focus:ring-amber-400 text-xs font-medium text-gray-700 rounded outline-none cursor-pointer transition-all">
                    <option value="">{placeholder}</option>
                    {options.map(o => (
                        <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
                            {typeof o === "string" ? o : o.label}
                        </option>
                    ))}
                </select>
                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
        </div>
    )
}

function LocSelect({ label, value, onChange, options, disabled, placeholder, loading }) {
    return (
        <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{label}</label>
            <div className="relative">
                <select value={value || ""} onChange={e => onChange(e.target.value)}
                        disabled={disabled || loading}
                        className="w-full appearance-none px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-amber-300 focus:border-amber-400 focus:bg-white focus:ring-1 focus:ring-amber-400 text-xs font-medium text-gray-700 rounded outline-none cursor-pointer disabled:opacity-40 transition-all">
                    <option value="">{loading ? "Yükleniyor..." : placeholder}</option>
                    {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
        </div>
    )
}

export default function RealEstateFormPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const toast = useToast()
    const { isAuthenticated, loading: authLoading, user } = useAuth()
    const isEdit = !!id
    const loc = useTurkiyeLocation()

    const [saving, setSaving] = useState(false)
    const [loadingItem, setLoadingItem] = useState(isEdit)
    const [currentStep, setCurrentStep] = useState(1)
    const [errors, setErrors] = useState({})

    // ── Kategori seçimi (VehicleFormPage ile aynı mantık) ──
    const [categories, setCategories] = useState([])
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [itemCategoryId, setItemCategoryId] = useState(null)

    const [form, setForm] = useState({
        title: "", description: "", price: "", status: "available", features: {},
    })
    const [images, setImages] = useState([])
    const [documents, setDocuments] = useState([])
    const [showGallery, setShowGallery] = useState(false)
    const [showDocs, setShowDocs] = useState(false)
    const [moderationStatus, setModerationStatus] = useState(null)
    const [moderationNote, setModerationNote] = useState(null)
    const [ownershipVerifiedAt, setOwnershipVerifiedAt] = useState(null)

    // Sol taraftaki eski PortfolioSidebar kaldırıldı (bu sayfada gereksizdi),
    // yerine RealEstateListPage'deki ile aynı stok özeti kartı geldi.
    const [counts, setCounts] = useState({ total: 0, available: 0, reserved: 0, sold: 0 })

    useEffect(() => {
        if (authLoading || !isAuthenticated) return
        api.get("/agent/portfolio", { params: { type: "gayrimenkul", per_page: 1000 } })
            .then(res => {
                const all = res.data.data || res.data
                setCounts({
                    total: all.length,
                    available: all.filter(i => i.status === "available").length,
                    reserved: all.filter(i => i.status === "reserved").length,
                    sold: all.filter(i => i.status === "sold").length,
                })
            })
            .catch(() => {})
    }, [authLoading, isAuthenticated])

    const getImageUrl = (img) => img?.url || img?.path || img?.full_url || img
    const setFeature = (key, val) => setForm(f => ({ ...f, features: { ...f.features, [key]: val } }))

    const emlakTipi = form.features.emlak_tipi || ""
    const activeFields = FIELD_GROUPS[emlakTipi] || []

    // Kullanıcının hesabına atanmış gayrimenkul kategorileri.
    useEffect(() => {
        if (authLoading) return
        if (!isAuthenticated) return
        api.get("/my-portfolio/available-categories")
            .then(res => setCategories((res.data.data || []).filter(c => c.form_component === "real_estate")))
            .catch(() => setCategories([]))
            .finally(() => setCategoriesLoading(false))
    }, [authLoading, isAuthenticated])

    // Yeni kayıt akışında kategori listesi geldiğinde ilk sıradaki kategori
    // otomatik seçili gelsin — kullanıcı elle seçmek zorunda kalmasın
    // (VehicleFormPage ile aynı davranış). Edit modunda dokunmuyoruz.
    useEffect(() => {
        if (isEdit || categoriesLoading || selectedCategory || categories.length === 0) return
        setSelectedCategory(categories[0])
    }, [isEdit, categoriesLoading, selectedCategory, categories])

    useEffect(() => {
        if (authLoading) return
        if (!isAuthenticated) { navigate("/"); return }
        if (!isEdit) return
        api.get(`/agent/portfolio/${id}`)
            .then(res => {
                const item = res.data.data || res.data
                setForm({
                    title: item.title || "", description: item.description || "", price: item.price || "",
                    status: item.status || "available", features: item.features || {},
                })
                setImages(item.images || [])
                setDocuments(item.documents || [])
                setModerationStatus(item.moderation_status || null)
                setModerationNote(item.moderation_note || null)
                setOwnershipVerifiedAt(item.ownership_verified_at || null)
                setItemCategoryId(item.category_id || null)
            })
            .catch(() => { toast({ message: "Veri yüklenemedi.", type: "error" }); navigate("/portfolio/realestate") })
            .finally(() => setLoadingItem(false))
    }, [id, authLoading, isAuthenticated])

    // Edit modunda: kategori listesi + kayıt yüklendikten sonra category_id'yi
    // listede bulup selectedCategory'yi otomatik dolduruyoruz.
    useEffect(() => {
        if (!isEdit || selectedCategory || categoriesLoading || loadingItem || !itemCategoryId) return
        const found = categories.find(c => c.id === itemCategoryId)
        setSelectedCategory(found || { id: itemCategoryId, name: "Gayrimenkul", slug: "" })
    }, [isEdit, selectedCategory, categoriesLoading, loadingItem, itemCategoryId, categories])

    // Otomatik başlık
    useEffect(() => {
        if (!emlakTipi) return
        const oda = form.features.oda_sayisi || ""
        const dist = loc.selectedDistrict?.name || loc.selectedProvince?.name || ""
        const parts = [dist, oda, emlakTipi].filter(Boolean)
        setForm(f => ({ ...f, title: parts.join(" ") }))
    }, [emlakTipi, form.features.oda_sayisi, loc.selectedProvince?.id, loc.selectedDistrict?.id])

    const validateStep = (step) => {
        const e = {}
        if (step === 1) {
            if (!selectedCategory) e.category = "Önce bir kategori seçmelisiniz."
            if (!emlakTipi) e.emlakTipi = "Mülk türü seçmelisiniz."
        }
        if (step === 3) {
            if (!form.price || Number(form.price) <= 0) e.price = "Satış fiyatı girilmelidir."
            if (!form.title.trim()) e.title = "İlan başlığı boş bırakılamaz."
        }
        setErrors(e)
        if (Object.keys(e).length > 0) {
            toast({ message: Object.values(e)[0], type: "error" })
            return false
        }
        return true
    }

    const nextStep = () => { if (validateStep(currentStep)) setCurrentStep(s => Math.min(s + 1, 3)) }
    const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1))

    const handleSubmit = async () => {
        if (!validateStep(1) || !validateStep(3)) { setCurrentStep(!selectedCategory || !emlakTipi ? 1 : 3); return }
        setSaving(true)
        try {
            const district = [loc.selectedNeighborhood?.name, loc.selectedDistrict?.name, loc.selectedProvince?.name].filter(Boolean).join(", ")
            const payload = {
                // Eskiden sabit "type: gayrimenkul" gönderiliyordu, bkz. dosya
                // başındaki not — artık seçilen gerçek yaprak kategori.
                category_id: selectedCategory.id,
                ...form,
                price: form.price || null,
                district: district || null,
                features: {
                    ...form.features,
                    il: loc.selectedProvince?.name || "",
                    ilce: loc.selectedDistrict?.name || "",
                    mahalle: loc.selectedNeighborhood?.name || "",
                },
            }
            if (isEdit) {
                await api.put(`/agent/portfolio/${id}`, payload)
                toast({ message: "Gayrimenkul güncellendi." })
            } else {
                await api.post("/agent/portfolio", payload)
                toast({ message: "Gayrimenkul portföye eklendi." })
            }
            navigate("/portfolio/realestate")
        } catch (err) {
            const code = err?.response?.data?.code
            if (code === "PORTFOLIO_LOCKED_BY_OFFERS") {
                toast({ message: err.response.data.message || "Bu mülk için aktif teklifler var, önce onları geri çekmelisiniz.", type: "error" })
            } else {
                toast({ message: err?.response?.data?.message || "Kayıt başarısız.", type: "error" })
            }
        } finally { setSaving(false) }
    }

    if (loadingItem || (isEdit && (categoriesLoading || !selectedCategory))) {
        return (
            <div className="min-h-screen bg-gray-200 flex flex-col">
                <Header />
                <div className="flex items-center justify-center flex-1">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">
            <Header />

            <main className="max-w-[1200px] mx-auto w-full px-4 py-6 flex-1">

                {/* Breadcrumb — grid'in ÜSTÜNDE, tam genişlikte (VehicleFormPage
                    ile aynı mimari — başlık artık FormShell'in kendi header'ında). */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-4">
                    <Link to="/portfolio" className="hover:text-amber-600 transition-colors">Portföy</Link>
                    <ChevronRight size={10} />
                    <Link to="/portfolio/realestate" className="hover:text-amber-600 transition-colors">Gayrimenkul</Link>
                    <ChevronRight size={10} />
                    <span className="text-gray-700">{isEdit ? "Düzenle" : "Yeni Gayrimenkul"}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    {/* Sol: stok özeti — RealEstateListPage'deki ile aynı özet kart. */}
                    <div className="md:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                            <div className="h-[3px] bg-amber-500" />
                            <div className="p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shadow-sm flex-shrink-0">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Gayrimenkul Portföyü</p>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Stok özetiniz</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {[
                                        { label: "Toplam",  value: counts.total },
                                        { label: "Satışta", value: counts.available },
                                        { label: "Rezerve", value: counts.reserved },
                                        { label: "Satıldı", value: counts.sold },
                                    ].map((s, i) => (
                                        <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-gray-50 last:border-0">
                                            <span className="text-gray-500 font-bold">{s.label}</span>
                                            <span className="font-bold text-gray-800">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sağ: geniş içerik grid'i */}
                    <div className="md:col-span-3">

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                            {/* Form — VehicleFormPage ile AYNI 3 adımlı kabuk (FormShell)
                                kullanılıyor: Kategori & Mülk Türü / Konum / Fiyat & Yayın. */}
                            <div className="xl:col-span-2 bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                                <FormShell
                                    icon={Building2}
                                    title={isEdit ? "Gayrimenkulü Düzenle" : "Yeni Gayrimenkul Ekle"}
                                    subtitle="Talep formuyla aynı kategori/konum mantığı — eşleştirme doğruluğunu artırır"
                                    badge={{ label: user?.account_type_group?.name || "Gayrimenkul Uzmanı", cls: "bg-amber-50 text-amber-700 border-amber-200" }}
                                    steps={[
                                        { step: 1, title: "Kategori & Mülk Türü" },
                                        { step: 2, title: "Konum" },
                                        { step: 3, title: "Fiyat & Yayın" },
                                    ]}
                                    currentStep={currentStep}
                                    onPrev={prevStep}
                                    onNext={nextStep}
                                    resetKey="realestate-portfolio-form"
                                >
                                    {/* ── ADIM 1: Kategori & Mülk Türü ── */}
                                    {currentStep === 1 && (
                                        <div className="space-y-4">
                                            <div>
                                                <SectionHeader>KATEGORİ</SectionHeader>
                                                <div className="mb-4">
                                                    {categoriesLoading ? (
                                                        <div className="h-[38px] w-full bg-gray-100 rounded animate-pulse" />
                                                    ) : categories.length === 0 ? (
                                                        <p className="text-xs text-gray-400 font-medium">
                                                            Hesap türünüze tanımlı bir gayrimenkul kategorisi bulunamadı. Yönetici ile iletişime geçin.
                                                        </p>
                                                    ) : (
                                                        <div className="relative w-full">
                                                            <select
                                                                value={selectedCategory?.id || ""}
                                                                disabled={isEdit}
                                                                onChange={e => setSelectedCategory(categories.find(c => c.id === Number(e.target.value)) || null)}
                                                                className={`w-full appearance-none px-3 py-2.5 bg-gray-50 hover:bg-white border text-xs font-medium text-gray-700 rounded outline-none cursor-pointer transition-all focus:bg-white focus:ring-1 focus:ring-amber-400 disabled:opacity-60 disabled:cursor-not-allowed ${errors.category ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-amber-400"}`}>
                                                                <option value="">Kategori Seçin...</option>
                                                                {categories.map(cat => {
                                                                    const full = cat.limit !== null && cat.current >= cat.limit && selectedCategory?.id !== cat.id
                                                                    return (
                                                                        <option key={cat.id} value={cat.id} disabled={full}>
                                                                            {cat.name}{cat.limit !== null ? ` (${cat.current}/${cat.limit})` : ""}{full ? " — limit doldu" : ""}
                                                                        </option>
                                                                    )
                                                                })}
                                                            </select>
                                                            <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                        </div>
                                                    )}
                                                    {errors.category && <p className="text-[10px] text-red-600 font-bold mt-1.5">{errors.category}</p>}
                                                </div>

                                                {!selectedCategory ? (
                                                    <p className="text-xs text-gray-400 font-medium italic py-2">
                                                        Devam etmek için yukarıdan bir kategori seçin.
                                                    </p>
                                                ) : (
                                                <>
                                                <SectionHeader>MÜLK TÜRÜ</SectionHeader>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {EMLAK_TIPLER.map(tip => (
                                                        <button key={tip} type="button"
                                                                onClick={() => setForm(f => ({ ...f, features: { emlak_tipi: tip } }))}
                                                                className={`py-2.5 px-3 rounded text-xs font-bold border transition-all text-left ${
                                                                    emlakTipi === tip
                                                                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                                                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50/40"
                                                                }`}>
                                                            {tip}
                                                        </button>
                                                    ))}
                                                </div>
                                                {errors.emlakTipi && <p className="text-[10px] text-red-600 font-bold mt-1.5">{errors.emlakTipi}</p>}
                                                </>
                                                )}
                                            </div>

                                            {selectedCategory && activeFields.length > 0 && (
                                                <div>
                                                    <SectionHeader>TEKNİK ÖZELLİKLER</SectionHeader>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                        {activeFields.map(key => {
                                                            const meta = FIELD_META[key]
                                                            if (!meta) return null
                                                            return (
                                                                <SelectField key={key} label={meta.label} value={form.features[key]}
                                                                             onChange={v => setFeature(key, v)} options={meta.options} />
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── ADIM 2: Konum ── */}
                                    {currentStep === 2 && (
                                        <div className="space-y-4">
                                            <div>
                                                <SectionHeader>KONUM</SectionHeader>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <LocSelect label="İl" value={loc.selectedProvince?.id} options={loc.provinces} loading={loc.loadingProv} placeholder="İl Seçin"
                                                               onChange={v => { const p = loc.provinces.find(p => p.id === Number(v)); loc.setSelectedProvince(p || null); loc.setSelectedDistrict(null); loc.setSelectedNeighborhood(null) }} />
                                                    <LocSelect label="İlçe" value={loc.selectedDistrict?.id} options={loc.districts} loading={loc.loadingDist} disabled={!loc.selectedProvince} placeholder="İlçe Seçin"
                                                               onChange={v => { const d = loc.districts.find(d => d.id === Number(v)); loc.setSelectedDistrict(d || null); loc.setSelectedNeighborhood(null) }} />
                                                    <LocSelect label="Mahalle" value={loc.selectedNeighborhood?.id} options={loc.neighborhoods} loading={loc.loadingNeigh} disabled={!loc.selectedDistrict} placeholder="Mahalle Seçin"
                                                               onChange={v => { const n = loc.neighborhoods.find(n => n.id === Number(v)); loc.setSelectedNeighborhood(n || null) }} />
                                                </div>
                                                {loc.locationString && (
                                                    <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded">
                                                        <MapPin size={11} className="flex-shrink-0" />
                                                        {loc.locationString}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── ADIM 3: Fiyat & Yayın ── */}
                                    {currentStep === 3 && (
                                        <div className="space-y-4">
                                            <div>
                                                <SectionHeader>FİYAT & DURUM</SectionHeader>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1 text-left">
                                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                                            Satış Fiyatı (₺) <span className="text-red-500">*</span>
                                                        </label>
                                                        <input type="number" placeholder="örn. 2.500.000" value={form.price}
                                                               onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                                               className={`px-3 py-2.5 bg-gray-50 border text-xs font-medium text-gray-700 rounded outline-none focus:bg-white transition-all placeholder:text-gray-400 ${errors.price ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-amber-400"}`} />
                                                        {errors.price && <p className="text-[10px] text-red-600 font-bold">{errors.price}</p>}
                                                    </div>
                                                    <SelectField label="Stok Durumu" required value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={STATUS_OPTIONS} />
                                                </div>
                                            </div>

                                            <div>
                                                <SectionHeader>İLAN DETAYLARI</SectionHeader>
                                                <div className="space-y-3">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                                            Başlık <span className="text-red-500">*</span>
                                                        </label>
                                                        <input type="text" value={form.title}
                                                               onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                                               placeholder="Konum, oda sayısı ve emlak tipine göre otomatik oluşur"
                                                               className={`px-3 py-2.5 bg-gray-50 border text-xs font-medium text-gray-700 rounded outline-none focus:bg-white transition-all placeholder:text-gray-400 ${errors.title ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-amber-400"}`} />
                                                        {errors.title && <p className="text-[10px] text-red-600 font-bold">{errors.title}</p>}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Açıklama</label>
                                                        <textarea rows={4} value={form.description}
                                                                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                                                  placeholder="Mülk hakkında ek bilgiler, öne çıkan özellikler..."
                                                                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-amber-400 focus:bg-white focus:ring-1 focus:ring-amber-400 text-xs font-medium text-gray-700 rounded outline-none resize-none transition-all placeholder:text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-gray-100">
                                                <button type="button" onClick={handleSubmit} disabled={saving}
                                                        className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white py-3.5 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm">
                                                    {saving
                                                        ? <><Loader2 size={13} className="animate-spin" /> Kaydediliyor...</>
                                                        : <><Save size={13} /> {isEdit ? "Güncelle" : "Portföye Ekle"}</>}
                                                </button>
                                                <Link to="/portfolio/realestate"
                                                      className="w-full flex items-center justify-center gap-1.5 mt-2.5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded transition-colors bg-gray-50">
                                                    <ArrowLeft size={12} /> Vazgeç
                                                </Link>
                                                <div className="flex items-start gap-2.5 mt-3.5 bg-amber-50/50 border border-amber-100 rounded p-3">
                                                    <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                                    <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">
                                                        Kaydettiğinizde bu mülk, kriterlerine uyan aktif gayrimenkul taleplerine göre otomatik eşleştirilir.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </FormShell>
                            </div>

                            {/* Sağ: özet + medya — her adımda görünür (VehicleFormPage ile
                                aynı mimari, adımlardan bağımsız sabit panel). */}
                            <div className="xl:col-span-1 flex flex-col gap-4">
                                <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                                    <div className="h-[3px] bg-amber-500" />
                                    <div className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-11 h-11 rounded bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shadow-sm flex-shrink-0">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{isEdit ? "Gayrimenkulü Düzenle" : "Yeni Gayrimenkul"}</p>
                                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Gayrimenkul Portföyü</p>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                            Mülk türü ve konum seçtiğinizde başlık otomatik oluşturulur; isterseniz kendiniz düzenleyebilirsiniz.
                                        </p>

                                        {emlakTipi && (
                                            <div className="mt-3 flex items-center justify-between text-[11px]">
                                                <span className="text-gray-500 font-bold">Tür</span>
                                                <span className="font-bold text-amber-700">{emlakTipi}</span>
                                            </div>
                                        )}
                                        {form.features.oda_sayisi && (
                                            <div className="mt-1.5 flex items-center justify-between text-[11px]">
                                                <span className="text-gray-500 font-bold">Oda</span>
                                                <span className="font-bold text-gray-800">{form.features.oda_sayisi}</span>
                                            </div>
                                        )}
                                        {form.price && (
                                            <div className="mt-1.5 flex items-center justify-between text-[11px]">
                                                <span className="text-gray-500 font-bold">Fiyat</span>
                                                <span className="font-bold text-green-700">{Number(form.price).toLocaleString("tr-TR")} ₺</span>
                                            </div>
                                        )}
                                        {loc.selectedProvince && (
                                            <div className="mt-1.5 flex items-center justify-between text-[11px]">
                                                <span className="text-gray-500 font-bold">Konum</span>
                                                <span className="font-bold text-gray-800 text-right max-w-[60%]">
                                                    {[loc.selectedDistrict?.name, loc.selectedProvince?.name].filter(Boolean).join(", ")}
                                                </span>
                                            </div>
                                        )}
                                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                                            <span className="text-gray-500 font-bold">Stok Durumu</span>
                                            <span className="font-bold text-gray-800">{STATUS_OPTIONS.find(s => s.value === form.status)?.label || "—"}</span>
                                        </div>

                                        {isEdit && moderationStatus && (
                                            <div className="mt-3 flex items-center justify-between text-[11px]">
                                                <span className="text-gray-500 font-bold">Onay Durumu</span>
                                                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                                    moderationStatus === "approved" ? "bg-green-50 text-green-700" :
                                                        moderationStatus === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                                                }`} title={moderationStatus === "rejected" ? moderationNote : undefined}>
                                                    {moderationStatus === "approved" ? "Onaylandı" : moderationStatus === "rejected" ? "Reddedildi" : "İncelemede"}
                                                </span>
                                            </div>
                                        )}
                                        {isEdit && moderationStatus === "rejected" && moderationNote && (
                                            <p className="mt-1.5 text-[10px] text-red-600 font-medium bg-red-50 border border-red-100 rounded px-2.5 py-1.5">
                                                Sebep: {moderationNote}
                                            </p>
                                        )}
                                        {isEdit && !ownershipVerifiedAt && (
                                            <div className="mt-3 flex items-center justify-between text-[11px] bg-amber-50 border border-amber-100 rounded px-2.5 py-2">
                                                <span className="text-amber-700 font-bold text-[10px] leading-relaxed">
                                                    Sahiplik belgesi (tapu) yüklenip onaylanmadan bu mülkle teklif verilemez.
                                                </span>
                                            </div>
                                        )}

                                        {isEdit && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Fotoğraflar ({images.length})</p>
                                                    <button onClick={() => setShowGallery(true)}
                                                            className="flex items-center gap-1 text-[9px] font-bold text-amber-700 hover:text-amber-800 uppercase tracking-wider transition-colors">
                                                        <ImagePlus size={11} /> Galeriyi Yönet
                                                    </button>
                                                </div>
                                                {images.length > 0 ? (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {images.slice(0, 6).map((img, i) => (
                                                            <div key={img.id || i} onClick={() => setShowGallery(true)}
                                                                 className="aspect-square rounded overflow-hidden border border-gray-200 hover:border-gray-300 bg-gray-50 cursor-pointer transition-all">
                                                                <img src={getImageUrl(img)} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setShowGallery(true)}
                                                            className="w-full flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 rounded py-5 transition-all">
                                                        <Image size={18} className="text-gray-400" />
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fotoğraf Ekle</p>
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {isEdit && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Dökümanlar ({documents.length})</p>
                                                    <button onClick={() => setShowDocs(true)}
                                                            className="flex items-center gap-1 text-[9px] font-bold text-amber-700 hover:text-amber-800 uppercase tracking-wider transition-colors">
                                                        <FileText size={11} /> Belgeleri Yönet
                                                    </button>
                                                </div>
                                                {documents.length > 0 ? (
                                                    <div className="flex flex-col gap-1.5">
                                                        {documents.slice(0, 4).map(doc => (
                                                            <div key={doc.id} className="flex items-center gap-2 px-2.5 py-2 bg-gray-50 border border-gray-100 rounded">
                                                                <FileText size={12} className="text-gray-400 flex-shrink-0" />
                                                                <p className="text-[10px] font-bold text-gray-700 truncate">{doc.name || doc.file_name}</p>
                                                            </div>
                                                        ))}
                                                        {documents.length > 4 && (
                                                            <p className="text-[9px] text-gray-400 font-bold text-center">+{documents.length - 4} belge daha</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setShowDocs(true)}
                                                            className="w-full flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 rounded py-5 transition-all">
                                                        <FileText size={18} className="text-gray-400" />
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Belge Ekle</p>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            {showGallery && (
                <ImageUploadModal item={{ id, title: form.title, images }} onClose={() => setShowGallery(false)} onUpdate={setImages} />
            )}
            {showDocs && (
                <DocumentUploadModal item={{ id, title: form.title }} initialDocuments={documents} onClose={() => setShowDocs(false)} onUpdate={setDocuments} />
            )}
        </div>
    )
}
