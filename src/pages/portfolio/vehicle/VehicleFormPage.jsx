import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import {
    Car, ChevronRight, Save, ChevronDown, Loader2, Image, ImagePlus, FileText,
    RefreshCw, AlertTriangle, AlertCircle,
} from "lucide-react"
import Header from "@/components/layout/Header"
import { useAuth } from "@/store/AuthContext"
import { useToast } from "@/components/ui/Toast"
import api from "@/lib/axios"
import CAR_DATA from "@/data/carData"
import { useTurkiyeLocation } from "@/hooks/useTurkiyeLocation"
import ImageUploadModal from "@/components/portfolio/ImageUploadModal"
import DocumentUploadModal from "@/components/portfolio/DocumentUploadModal"
import VehicleDamageSchema from "@/components/portfolio/VehicleDamageSchema"
import FormShell from "@/pages/demands/_shared/FormShell"
// Bu form artık talep tarafındaki (demands/create/vehicle → 2. El Araç Talebi)
// formla AYNI kaynaktan besleniyor: marka/model/yıl, KM, yakıt, vites, renk,
// boya/değişen sınıfı ve seçenek metinleri buradan geliyor. Amaç: talep ile
// portföy kaydı aynı değerleri kullanınca eşleştirme motoru doğru çalışsın.
// Sadece galericiye özel alanlar (plaka, şasi, detaylı hasar şeması, fiyat,
// muayene/ağır bakım) bu dosyada ayrıca tanımlı.
//
// KATEGORİ: eskiden burada bağlantısız, sabit kodlanmış bir "Araç Kategorisi"
// dropdown'u (ARAC_KATEGORILERI) vardı — DB'deki gerçek kategori/kota
// sisteminden tamamen kopuktu, kaydederken de backend'e hiç gönderilmiyordu
// (payload sabit "type: vasita" gönderiyordu → backend bunu HER ZAMAN "Vasıta"
// KÖK kategorisine eşliyordu, kullanıcının izinleri ise yaprak kategorilerde
// tanımlı olduğundan her kayıt 403 ile reddediliyordu). Artık kategori seçimi
// "KATEGORİ & MARKA" bölümünde, formun İÇİNDE (ayrı bir tam ekran adım DEĞİL)
// bir buton grubu olarak yapılıyor — kullanıcının hesabına atanmış gerçek DB
// kategorileri arasından seçilen category_id doğrudan kaydediliyor.
import {
    BOYA_OPTIONS, DEGISEN_OPTIONS, KABUL_EDILEMEZ,
    YILLAR, YAKIT_OPTIONS, VITES_OPTIONS, RENK_OPTIONS,
} from "@/pages/demands/vehicle/vehicleConfig"
// Not: KM alanı talep formunda "0-10.000 km" gibi bir ARALIK (KM_OPTIONS) ile
// seçiliyor çünkü alıcı bir tercih aralığı belirtiyor. Galerici ise elindeki
// aracın GERÇEK kilometresini bildiği için burada net bir sayı giriyor —
// bu yüzden KM_OPTIONS bilerek kullanılmıyor.

const STATUS_OPTIONS = [
    { value: "available", label: "Satışta" },
    { value: "reserved",  label: "Rezerve" },
    { value: "sold",      label: "Satıldı" },
]

// Portföy (satıcı/galerici) tarafında boya_degisen_tipi aynı değerlerle
// (talep formuyla birebir aynı) tutuluyor — sadece etiket metni "olabilir"
// gibi olasılıksal değil, aracın gerçek/bilinen durumunu yansıtacak şekilde.
const BOYA_DEGISEN_TIPI_OPTIONS = [
    { value: "boyasiz_degisensiz",     label: "Boyasız & Değişensiz", cls: "bg-gray-700 text-white border-gray-700" },
    { value: "boya_degisen_olabilir",  label: "Boyalı / Değişen Var", cls: "bg-amber-500 text-white border-amber-500" },
    { value: "agir_hasarli",           label: "Ağır Hasar Kaydı Var", cls: "bg-red-600 text-white border-red-600" },
]

// 81 il plaka kodu — plaka girilince il otomatik seçilsin diye.
const PLAKA_IL = {1:"Adana",2:"Adıyaman",3:"Afyonkarahisar",4:"Ağrı",5:"Amasya",6:"Ankara",7:"Antalya",8:"Artvin",9:"Aydın",10:"Balıkesir",11:"Bilecik",12:"Bingöl",13:"Bitlis",14:"Bolu",15:"Burdur",16:"Bursa",17:"Çanakkale",18:"Çankırı",19:"Çorum",20:"Denizli",21:"Diyarbakır",22:"Edirne",23:"Elazığ",24:"Erzincan",25:"Erzurum",26:"Eskişehir",27:"Gaziantep",28:"Giresun",29:"Gümüşhane",30:"Hakkari",31:"Hatay",32:"Isparta",33:"Mersin",34:"İstanbul",35:"İzmir",36:"Kars",37:"Kastamonu",38:"Kayseri",39:"Kırklareli",40:"Kırşehir",41:"Kocaeli",42:"Konya",43:"Kütahya",44:"Malatya",45:"Manisa",46:"Kahramanmaraş",47:"Mardin",48:"Muğla",49:"Muş",50:"Nevşehir",51:"Niğde",52:"Ordu",53:"Rize",54:"Sakarya",55:"Samsun",56:"Siirt",57:"Sinop",58:"Sivas",59:"Tekirdağ",60:"Tokat",61:"Trabzon",62:"Tunceli",63:"Şanlıurfa",64:"Uşak",65:"Van",66:"Yozgat",67:"Zonguldak",68:"Aksaray",69:"Bayburt",70:"Karaman",71:"Kırıkkale",72:"Batman",73:"Şırnak",74:"Bartın",75:"Ardahan",76:"Iğdır",77:"Yalova",78:"Karabük",79:"Kilis",80:"Osmaniye",81:"Düzce"}

function sanitizePrice(val) {
    return String(val).replace(/[^0-9]/g, "")
}

// ── Otomatik başlık/açıklama — talep formundaki buildVehicleTitle /
// buildVehicleDescription ile AYNI yapı, sadece "arıyorum" yerine "satılık" /
// satıcı ağzıyla. Kategori adı ve "Sıfır"/"2. El" durumu artık Adım 0'da
// seçilen GERÇEK DB kategorisinden geliyor (selectedCategory) — ayrı,
// bağlantısız bir liste yok.
function buildPortfolioVehicleTitle({ isSifir, categoryName, selBrand, selModel, selVersion }) {
    if (!selBrand) return ""
    return [isSifir ? "Sıfır" : "2. El", categoryName, selBrand, selModel, selVersion].filter(Boolean).join(" ") + " satılık"
}

function buildPortfolioVehicleDescription({ isSifir, categoryName, selBrand, selModel, selVersion, features, price }) {
    if (!selBrand) return ""
    const katLbl = categoryName
    const bt = features.boya_degisen_tipi || "boyasiz_degisensiz"
    const btLabel = BOYA_DEGISEN_TIPI_OPTIONS.find(o => o.value === bt)?.label || ""

    const satirlar = []
    satirlar.push(`${isSifir ? "Sıfır" : "2. El"} ${katLbl} kategorisinde ${selBrand}${selModel ? " " + selModel : ""}${selVersion ? " " + selVersion : ""} satışa sunulmuştur.`)

    const teknik = []
    if (features.yil) teknik.push(`Model yılı: ${features.yil}`)
    if (features.km) teknik.push(`Kilometre: ${Number(features.km).toLocaleString("tr-TR")} km`)
    if (features.yakit) teknik.push(`Yakıt: ${features.yakit}`)
    if (features.vites) teknik.push(`Vites: ${features.vites}`)
    if (features.renk) teknik.push(`Renk: ${features.renk}`)
    if (teknik.length) satirlar.push("Teknik özellikler — " + teknik.join(", ") + ".")

    let hasarStr = `Boya & değişen durumu: ${btLabel}`
    if (bt === "boya_degisen_olabilir") {
        const ek = []
        if (features.boya_durumu) ek.push(`boya: ${features.boya_durumu}`)
        if (features.degisen_parca) ek.push(`değişen: ${features.degisen_parca}`)
        if ((features.mevcut_agir_sorunlar || []).length) ek.push(`dikkat: ${features.mevcut_agir_sorunlar.join(", ")}`)
        if (ek.length) hasarStr += " (" + ek.join("; ") + ")"
    }
    satirlar.push(hasarStr + ".")

    if (features.muayene_tarihi) satirlar.push(`Muayene geçerlilik tarihi: ${features.muayene_tarihi}.`)
    if (features.agir_bakim_yapildi) satirlar.push("Araçta periyodik ağır bakımlar yapılmıştır.")
    if (features.eksper_raporu_mevcut) satirlar.push("Eksper raporu mevcuttur.")
    if (features.tramer_bilgisi_paylasiyorum) {
        const tramerEk = []
        if (features.tramer_tutari) tramerEk.push(`${Number(features.tramer_tutari).toLocaleString("tr-TR")} ₺`)
        if (features.tramer_tarihi) tramerEk.push(`${features.tramer_tarihi} tarihli`)
        satirlar.push(`Tramer kaydı paylaşılmaktadır${tramerEk.length ? ` (${tramerEk.join(", ")})` : ""}.`)
    }
    if (features.katilim_finansi_uyumlu) satirlar.push("Katılım finansı ile satışa uygundur.")
    if (price) satirlar.push(`Satış fiyatı: ${Number(price).toLocaleString("tr-TR")} ₺.`)

    return satirlar.join(" ")
}

function SectionHeader({ children }) {
    return <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">{children}</p>
}

function SelectField({ label, value, onChange, options, required, error, placeholder = "Seçin..." }) {
    return (
        <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <select value={value || ""} onChange={e => onChange(e.target.value)}
                        className={`w-full appearance-none px-3 py-2.5 bg-gray-50 hover:bg-white border text-xs font-medium text-gray-700 rounded outline-none cursor-pointer transition-all focus:bg-white focus:ring-1 focus:ring-purple-400 ${error ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400"}`}>
                    <option value="">{placeholder}</option>
                    {options.map(o => (
                        <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
                            {typeof o === "string" ? o : o.label}
                        </option>
                    ))}
                </select>
                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {error && <p className="text-[10px] text-red-600 font-bold">{error}</p>}
        </div>
    )
}

function CheckboxField({ checked, onChange, label, sub, color = "purple" }) {
    const colors = {
        purple: { wrap: checked ? "bg-purple-50 border-purple-300" : "bg-white border-gray-200 hover:border-gray-300", box: checked ? "bg-purple-600 border-purple-600" : "border-gray-300", text: checked ? "text-purple-800" : "text-gray-800", sub: checked ? "text-purple-600" : "text-gray-400" },
        green:  { wrap: checked ? "bg-green-50 border-green-300"  : "bg-white border-gray-200 hover:border-gray-300", box: checked ? "bg-green-600 border-green-600"   : "border-gray-300", text: checked ? "text-green-800"  : "text-gray-800", sub: checked ? "text-green-600"  : "text-gray-400" },
    }
    const c = colors[color] || colors.purple
    return (
        <label onClick={onChange} className={`flex items-start gap-2.5 p-2.5 border rounded cursor-pointer transition-all select-none ${c.wrap}`}>
            <div className={`w-4 h-4 mt-0.5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${c.box}`}>
                {checked && <svg viewBox="0 0 10 8" className="w-2.5 h-2 text-white fill-current"><path d="M1 4l2.5 2.5L9 1" /></svg>}
            </div>
            <div>
                <p className={`text-xs font-bold ${c.text}`}>{label}</p>
                {sub && <p className={`text-[10px] mt-0.5 ${c.sub}`}>{sub}</p>}
            </div>
        </label>
    )
}

export default function VehicleFormPage() {
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

    // ── Adım 0: kategori seçimi ──────────────────────────────────
    // categories: kullanıcının hesap grubuna admin panelden atanmış, GERÇEK
    // DB kategorileri (form_component=vehicle ile filtrelenmiş) — bkz.
    // PortfolioSidebar.jsx'teki aynı /my-portfolio/available-categories
    // kaynağı. selectedCategory seçilene kadar zengin form hiç render edilmez.
    const [categories, setCategories] = useState([])
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [itemCategoryId, setItemCategoryId] = useState(null) // edit modunda kayıttan gelen category_id

    const isSifir = !!selectedCategory?.slug?.includes("sifir-arac")

    const [selBrand, setSelBrand] = useState("")
    const [selModel, setSelModel] = useState("")
    const [selVersion, setSelVersion] = useState("")

    const carModels = CAR_DATA.find(b => b.marka === selBrand)?.modeller || []
    const carVersions = carModels.find(m => m.ad === selModel)?.versiyonlar || []

    const [form, setForm] = useState({
        title: "", description: "", price: "", status: "available", district: "", features: {},
    })
    const [images, setImages] = useState([])
    const [documents, setDocuments] = useState([])
    const [showGallery, setShowGallery] = useState(false)
    const [showDocs, setShowDocs] = useState(false)
    const [moderationStatus, setModerationStatus] = useState(null)
    const [moderationNote, setModerationNote] = useState(null)
    const [ownershipVerifiedAt, setOwnershipVerifiedAt] = useState(null)

    // Sol taraftaki eski PortfolioSidebar kaldırıldı (bu sayfada gereksizdi —
    // zaten "Vasıta > Araç Ekle" akışındayız, tekrar kategori menüsü görmeye
    // gerek yok). Yerine VehicleListPage'deki ile aynı stok özeti kartı geldi.
    const [counts, setCounts] = useState({ total: 0, available: 0, reserved: 0, sold: 0 })

    useEffect(() => {
        if (authLoading || !isAuthenticated) return
        api.get("/agent/portfolio", { params: { type: "vasita", per_page: 1000 } })
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
    const boyaTipi = form.features.boya_degisen_tipi || "boyasiz_degisensiz"

    // Adım 0: kullanıcının hesabına atanmış vasıta kategorileri — hem create
    // hem edit modunda gerekli (edit modunda kayıttaki category_id'yi bu
    // listeden bulup selectedCategory'yi otomatik dolduruyoruz).
    useEffect(() => {
        if (authLoading) return
        if (!isAuthenticated) return
        api.get("/my-portfolio/available-categories")
            .then(res => setCategories((res.data.data || []).filter(c => c.form_component === "vehicle")))
            .catch(() => setCategories([]))
            .finally(() => setCategoriesLoading(false))
    }, [authLoading, isAuthenticated])

    // Yeni kayıt akışında kategori listesi geldiğinde ilk sıradaki kategori
    // otomatik seçili gelsin — kullanıcı elle seçmek zorunda kalmasın.
    // Edit modunda dokunmuyoruz (kategori zaten kayıttan geliyor ve select
    // disabled).
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
                    status: item.status || "available", district: item.district || "", features: item.features || {},
                })
                setImages(item.images || [])
                setDocuments(item.documents || [])
                setModerationStatus(item.moderation_status || null)
                setModerationNote(item.moderation_note || null)
                setOwnershipVerifiedAt(item.ownership_verified_at || null)
                setItemCategoryId(item.category_id || null)
                if (item.features?.marka) {
                    setSelBrand(item.features.marka)
                    if (item.features.model) setSelModel(item.features.model)
                    if (item.features.versiyon) setSelVersion(item.features.versiyon)
                }
                if (item.features?.il) {
                    const tryRestore = (attempt = 0) => {
                        const provList = loc.provinces
                        if (provList.length === 0 && attempt < 20) { setTimeout(() => tryRestore(attempt + 1), 200); return }
                        const p = provList.find(p => p.name === item.features.il)
                        if (p) {
                            loc.setSelectedProvince(p)
                            if (item.features?.ilce) {
                                setTimeout(() => {
                                    const d = loc.districts.find(d => d.name === item.features.ilce)
                                    if (d) loc.setSelectedDistrict(d)
                                }, 600)
                            }
                        }
                    }
                    setTimeout(tryRestore, 400)
                }
            })
            .catch(() => { toast({ message: "Veri yüklenemedi.", type: "error" }); navigate("/portfolio/vehicle") })
            .finally(() => setLoadingItem(false))
    }, [id, authLoading, isAuthenticated])

    // Edit modunda: kategori listesi + kayıt yüklendikten sonra, kayıttaki
    // category_id'yi listede bulup selectedCategory'yi otomatik dolduruyoruz
    // (Adım 0 ekranı edit'te hiç gösterilmiyor — kategori değiştirme
    // buradan desteklenmiyor, kota/limit mantığı karışmasın diye).
    useEffect(() => {
        if (!isEdit || selectedCategory || categoriesLoading || loadingItem || !itemCategoryId) return
        const found = categories.find(c => c.id === itemCategoryId)
        setSelectedCategory(found || { id: itemCategoryId, name: "Araç", slug: "" })
    }, [isEdit, selectedCategory, categoriesLoading, loadingItem, itemCategoryId, categories])

    // Otomatik başlık & açıklama — talep formundaki mantığın birebir aynısı.
    useEffect(() => {
        if (!selBrand || !selectedCategory) return
        setForm(f => ({
            ...f,
            title: buildPortfolioVehicleTitle({ isSifir, categoryName: selectedCategory.name, selBrand, selModel, selVersion }),
            description: buildPortfolioVehicleDescription({ isSifir, categoryName: selectedCategory.name, selBrand, selModel, selVersion, features: f.features, price: f.price }),
        }))
    }, [selectedCategory, isSifir, selBrand, selModel, selVersion, form.features, form.price])

    const validateStep = (step) => {
        const e = {}
        if (step === 1) {
            if (!selectedCategory) e.category = "Önce bir kategori seçmelisiniz."
            if (!selBrand) e.brand = "Araç markası zorunludur."
            if (!form.features.yil) e.yil = "Model yılı seçmelisiniz."
            // Sıfır araçta KM zorunlu değil — Adım 0'da "Sıfır Araç" kategorisi
            // seçilebilir hale geldiğinden bu ayrım gerekti.
            if (!isSifir && !form.features.km) e.km = "Kilometre bilgisi girilmelidir."
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
        if (!selectedCategory) { toast({ message: "Önce bir kategori seçmelisiniz.", type: "error" }); return }
        if (!validateStep(1) || !validateStep(3)) { setCurrentStep(!selBrand || !form.features.yil || (!isSifir && !form.features.km) ? 1 : 3); return }
        setSaving(true)
        try {
            const payload = {
                // Eskiden sabit "type: vasita" gönderiliyordu — backend bunu
                // Vasıta KÖK kategorisine eşliyordu, kullanıcının izinleri ise
                // yaprak kategorilerde tanımlı olduğundan kayıt her zaman 403
                // ile reddediliyordu. Artık Adım 0'da seçilen GERÇEK yaprak
                // kategori gönderiliyor.
                category_id: selectedCategory.id,
                ...form,
                price: form.price || null,
                district: loc.selectedProvince?.name
                    ? [loc.selectedDistrict?.name, loc.selectedProvince?.name].filter(Boolean).join(", ")
                    : form.district || null,
                features: {
                    ...form.features,
                    arac_tipi: selectedCategory.name,
                    marka: selBrand, model: selModel || null, versiyon: selVersion || null,
                    il: loc.selectedProvince?.name || form.features.il || "",
                    ilce: loc.selectedDistrict?.name || form.features.ilce || "",
                    tramer_tutari: form.features.tramer_tutari ? Number(form.features.tramer_tutari) : null,
                },
            }
            if (isEdit) {
                await api.put(`/agent/portfolio/${id}`, payload)
                toast({ message: "Araç güncellendi." })
            } else {
                await api.post("/agent/portfolio", payload)
                toast({ message: "Araç portföye eklendi." })
            }
            navigate("/portfolio/vehicle")
        } catch (err) {
            const code = err?.response?.data?.code
            if (code === "PORTFOLIO_LOCKED_BY_OFFERS") {
                toast({ message: err.response.data.message || "Bu araç için aktif teklifler var, önce onları geri çekmelisiniz.", type: "error" })
            } else {
                toast({ message: err?.response?.data?.message || "Kayıt başarısız.", type: "error" })
            }
        } finally { setSaving(false) }
    }

    // Edit modunda selectedCategory, kategori listesi + kayıt ikisi de
    // yüklenene kadar boş kalır — bu sürede Adım 0 ekranını YANLIŞLIKLA
    // göstermemek için genel yükleniyor ekranını uzatıyoruz.
    if (loadingItem || (isEdit && (categoriesLoading || !selectedCategory))) {
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

                {/* Breadcrumb — grid'in ÜSTÜNDE, tam genişlikte (liste sayfaları
                    ve RealEstateFormPage ile aynı mimari). */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-4">
                    <Link to="/portfolio" className="hover:text-purple-700 transition-colors">Portföy</Link>
                    <ChevronRight size={10} />
                    <Link to="/portfolio/vehicle" className="hover:text-purple-700 transition-colors">Vasıta</Link>
                    <ChevronRight size={10} />
                    <span className="text-gray-700">{isEdit ? "Düzenle" : "Yeni Araç"}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    {/* Sol: stok özeti — eski PortfolioSidebar burada gereksizdi
                        (zaten Vasıta > Araç Ekle akışındayız), VehicleListPage'deki
                        ile aynı özet kart kullanılıyor. */}
                    <div className="md:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                            <div className="h-[3px] bg-purple-600" />
                            <div className="p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shadow-sm flex-shrink-0">
                                        <Car size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Vasıta Portföyü</p>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Stok özetiniz</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {[
                                        { label: "Toplam Stok", value: counts.total },
                                        { label: "Satışta",     value: counts.available },
                                        { label: "Rezerve",     value: counts.reserved },
                                        { label: "Satıldı",     value: counts.sold },
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

                            {/* Form — talep formuyla (demands/create/vehicle) AYNI 3 adımlı
                                kabuk (FormShell) kullanılıyor: Model & Donanım / Durum & Geçmiş
                                / Fiyat & Yayın. Amaç: iki formun aynı yapıdan okunması ve
                                eşleştirme motoruna aynı formatta veri gitmesi. */}
                            <div className="xl:col-span-2 bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                                <FormShell
                                    icon={Car}
                                    title={isEdit ? "Aracı Düzenle" : "Yeni Araç Ekle"}
                                    subtitle="Talep formuyla aynı alanlar — eşleştirme doğruluğunu artırır"
                                    badge={{ label: user?.account_type_group?.name || "Vasıta Uzmanı", cls: "bg-purple-50 text-purple-700 border-purple-200" }}
                                    steps={[
                                        { step: 1, title: "Model & Donanım" },
                                        { step: 2, title: "Durum & Geçmiş" },
                                        { step: 3, title: "Fiyat & Yayın" },
                                    ]}
                                    currentStep={currentStep}
                                    onPrev={prevStep}
                                    onNext={nextStep}
                                    resetKey="vehicle-portfolio-form"
                                >
                                    {/* ── ADIM 1: Marka & Model ── */}
                                    {currentStep === 1 && (
                                        <div className="space-y-4">
                                            <div>
                                                <SectionHeader>KATEGORİ & MARKA</SectionHeader>
                                                <div className="mb-3">
                                                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                                        Araç Kategorisi <span className="text-red-500">*</span>
                                                    </label>
                                                    {categoriesLoading ? (
                                                        <div className="h-[38px] w-full bg-gray-100 rounded animate-pulse" />
                                                    ) : categories.length === 0 ? (
                                                        <p className="text-xs text-gray-400 font-medium">
                                                            Hesap türünüze tanımlı bir vasıta kategorisi bulunamadı. Yönetici ile iletişime geçin.
                                                        </p>
                                                    ) : (
                                                        <div className="relative w-full">
                                                            <select
                                                                value={selectedCategory?.id || ""}
                                                                disabled={isEdit}
                                                                onChange={e => setSelectedCategory(categories.find(c => c.id === Number(e.target.value)) || null)}
                                                                className={`w-full appearance-none px-3 py-2.5 bg-gray-50 hover:bg-white border text-xs font-medium text-gray-700 rounded outline-none cursor-pointer transition-all focus:bg-white focus:ring-1 focus:ring-purple-400 disabled:opacity-60 disabled:cursor-not-allowed ${errors.category ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400"}`}>
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
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <SelectField label="Marka" required error={errors.brand}
                                                                 value={selBrand}
                                                                 onChange={v => { setSelBrand(v); setSelModel(""); setSelVersion("") }}
                                                                 options={CAR_DATA.map(b => b.marka)}
                                                                 placeholder="Marka Seçin" />
                                                    <SelectField label="Model"
                                                                 value={selModel}
                                                                 onChange={v => { setSelModel(v); setSelVersion("") }}
                                                                 options={carModels.map(m => m.ad)}
                                                                 placeholder={selBrand ? "Model Seçin" : "Önce Marka"} />
                                                    <SelectField label="Donanım / Motor"
                                                                 value={selVersion}
                                                                 onChange={v => { const ver = carVersions.find(x => x.ad === v); setSelVersion(v); setFeature("yakit", ver?.yakit || form.features.yakit || ""); setFeature("vites", ver?.vites || form.features.vites || "") }}
                                                                 options={carVersions.map(v => ({ value: v.ad, label: `${v.ad} — ${v.yakit}, ${v.vites}` }))}
                                                                 placeholder={selModel ? "Donanım Seçin" : "Önce Model"} />
                                                </div>
                                                )}
                                            </div>

                                            {selectedCategory && (
                                            <div>
                                                <SectionHeader>TEKNİK ÖZELLİKLER</SectionHeader>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    <SelectField label="Model Yılı" required error={errors.yil} value={form.features.yil} onChange={v => setFeature("yil", v)} options={YILLAR} />
                                                    <div className="flex flex-col gap-1 text-left">
                                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                                            Kilometre <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <input type="text" inputMode="numeric" placeholder="örn. 78.500"
                                                                   value={form.features.km ? Number(form.features.km).toLocaleString("tr-TR") : ""}
                                                                   onChange={e => setFeature("km", sanitizePrice(e.target.value))}
                                                                   className={`w-full px-3 py-2.5 pr-9 bg-gray-50 border text-xs font-medium text-gray-700 rounded outline-none focus:bg-white transition-all placeholder:text-gray-400 ${errors.km ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400"}`} />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">km</span>
                                                        </div>
                                                        {errors.km && <p className="text-[10px] text-red-600 font-bold">{errors.km}</p>}
                                                    </div>
                                                    <SelectField label="Yakıt Tipi" value={form.features.yakit} onChange={v => setFeature("yakit", v)} options={YAKIT_OPTIONS} />
                                                    <SelectField label="Vites" value={form.features.vites} onChange={v => setFeature("vites", v)} options={VITES_OPTIONS} />
                                                    <SelectField label="Renk" value={form.features.renk} onChange={v => setFeature("renk", v)} options={RENK_OPTIONS} />
                                                    <div className="flex flex-col gap-1 text-left">
                                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Plaka İli</label>
                                                        <div className="relative">
                                                            <select value={loc.selectedProvince?.id || ""}
                                                                    disabled={!loc.provinces?.length}
                                                                    onChange={e => { const p = (loc.provinces || []).find(p => p.id === Number(e.target.value)); loc.setSelectedProvince(p || null); loc.setSelectedDistrict(null) }}
                                                                    className="w-full appearance-none px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white focus:ring-1 focus:ring-purple-400 text-xs font-medium text-gray-700 rounded outline-none cursor-pointer transition-all disabled:opacity-50">
                                                                <option value="">{loc.provinces?.length ? "İl Seçin" : "Yükleniyor..."}</option>
                                                                {(loc.provinces || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                            </select>
                                                            <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            )}

                                            {selectedCategory && (
                                            <div>
                                                <SectionHeader>PLAKA & ŞASİ <span className="normal-case font-medium text-gray-400">— sadece galericiye özel</span></SectionHeader>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1 text-left">
                                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                                            Plaka <span className="text-gray-400 font-normal normal-case">(opsiyonel)</span>
                                                        </label>
                                                        <input type="text" placeholder="34 ABC 123" maxLength={10}
                                                               value={form.features.plaka || ""}
                                                               onChange={e => {
                                                                   const raw = e.target.value.toUpperCase().replace(/[^A-ZÇĞİÖŞÜ0-9 ]/g, "")
                                                                   setFeature("plaka", raw)
                                                                   const kod = parseInt(raw.trim().split(/[\s-]/)[0], 10)
                                                                   if (kod >= 1 && kod <= 81 && loc.provinces?.length) {
                                                                       const ilAdi = PLAKA_IL[kod]
                                                                       if (ilAdi) {
                                                                           const p = loc.provinces.find(p => p.name.toLowerCase().includes(ilAdi.toLowerCase()) || ilAdi.toLowerCase().includes(p.name.toLowerCase()))
                                                                           if (p) { loc.setSelectedProvince(p); loc.setSelectedDistrict(null) }
                                                                       }
                                                                   }
                                                               }}
                                                               className="px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white focus:ring-1 focus:ring-purple-400 text-xs font-bold text-gray-800 tracking-widest rounded outline-none transition-all placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal uppercase" />
                                                        <p className="text-[9px] text-gray-400">
                                                            Örn: 34 ABC 123 — il otomatik seçilir
                                                            {loc.selectedProvince && form.features.plaka && (
                                                                <span className="ml-1 text-purple-700 font-bold">→ {loc.selectedProvince.name}</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col gap-1 text-left">
                                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                                            Şasi Numarası <span className="text-gray-400 font-normal normal-case">(opsiyonel)</span>
                                                        </label>
                                                        <input type="text" placeholder="WBA12345678901234" maxLength={17}
                                                               value={form.features.sasi_no || ""}
                                                               onChange={e => setFeature("sasi_no", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                                                               className="px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white focus:ring-1 focus:ring-purple-400 text-xs font-bold text-gray-800 tracking-widest rounded outline-none transition-all placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal uppercase" />
                                                        <p className="text-[9px] text-gray-400">17 haneli VIN/şasi kodu</p>
                                                    </div>
                                                </div>
                                            </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── ADIM 2: Durum & Geçmiş ── */}
                                    {currentStep === 2 && (
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-3">
                                                <SectionHeader>BOYA & DEĞİŞEN DURUMU <span className="normal-case font-medium text-gray-400">— talep formuyla aynı sınıflandırma</span></SectionHeader>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {BOYA_DEGISEN_TIPI_OPTIONS.map(opt => {
                                                        const sel = boyaTipi === opt.value
                                                        return (
                                                            <button key={opt.value} type="button"
                                                                    onClick={() => { setFeature("boya_degisen_tipi", opt.value); setFeature("boya_durumu", ""); setFeature("degisen_parca", ""); setFeature("mevcut_agir_sorunlar", []) }}
                                                                    className={`py-1.5 px-2 text-center border rounded text-[10px] font-bold transition-all leading-tight ${sel ? opt.cls : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}>
                                                                {opt.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                                {boyaTipi === "boya_degisen_olabilir" && (
                                                    <div className="space-y-3 pt-1">
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Boya Durumu</label>
                                                            <div className="flex gap-2">{BOYA_OPTIONS.map(opt => { const sel = form.features.boya_durumu === opt; return <button key={opt} type="button" onClick={() => setFeature("boya_durumu", sel ? "" : opt)} className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${sel ? "bg-purple-700 text-white border-purple-700" : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50"}`}>{opt}</button> })}</div>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Değişen Parça</label>
                                                            <div className="flex gap-2">{DEGISEN_OPTIONS.map(opt => { const sel = form.features.degisen_parca === opt; return <button key={opt} type="button" onClick={() => setFeature("degisen_parca", sel ? "" : opt)} className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${sel ? "bg-purple-700 text-white border-purple-700" : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50"}`}>{opt}</button> })}</div>
                                                        </div>
                                                        <div className="border-t border-gray-200 pt-3">
                                                            <p className="text-[9px] font-bold uppercase tracking-wider text-red-600 mb-2">Bu Araçta Olan Ciddi Durumlar</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {KABUL_EDILEMEZ.map(opt => { const sel = (form.features.mevcut_agir_sorunlar || []).includes(opt); return <button key={opt} type="button" onClick={() => { const curr = form.features.mevcut_agir_sorunlar || []; setFeature("mevcut_agir_sorunlar", sel ? curr.filter(v => v !== opt) : [...curr, opt]) }} className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${sel ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:bg-red-50"}`}>{opt}</button> })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {boyaTipi === "agir_hasarli" && (
                                                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded p-3">
                                                        <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                                                        <p className="text-[10px] text-red-700 font-semibold leading-relaxed">Araç ağır hasar kaydıyla listelenecek. Ekspertiz raporu eklemeniz önerilir.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <SectionHeader>DETAYLI HASAR ŞEMASI <span className="normal-case font-medium text-gray-400">— sadece galericiye özel</span></SectionHeader>
                                                <VehicleDamageSchema
                                                    value={form.features.parca_durumlari || {}}
                                                    onChange={v => setFeature("parca_durumlari", v)}
                                                />
                                            </div>

                                            <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-3">
                                                <SectionHeader>EKSPERTİZ & ARAÇ GEÇMİŞİ</SectionHeader>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1 text-left">
                                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Muayene Geçerlilik Tarihi</label>
                                                        <input type="date"
                                                               value={form.features.muayene_tarihi || ""}
                                                               onChange={e => setFeature("muayene_tarihi", e.target.value)}
                                                               className="px-3 py-2.5 bg-white border border-gray-200 hover:border-gray-300 focus:border-purple-400 text-xs font-medium text-gray-700 rounded outline-none transition-all" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2.5">
                                                    <CheckboxField
                                                        checked={!!form.features.agir_bakim_yapildi}
                                                        onChange={() => setFeature("agir_bakim_yapildi", !form.features.agir_bakim_yapildi)}
                                                        label="Ağır Bakımları Yapılmış"
                                                        sub="Periyodik büyük bakım (triger/debriyaj/rot-balans vb.) yapıldı" />
                                                    <CheckboxField
                                                        checked={!!form.features.eksper_raporu_mevcut}
                                                        onChange={() => setFeature("eksper_raporu_mevcut", !form.features.eksper_raporu_mevcut)}
                                                        label="Eksper Raporu Mevcut"
                                                        sub="Yetkili eksper tarafından hazırlanan rapor elinizde var" />
                                                    <CheckboxField
                                                        checked={!!form.features.tramer_bilgisi_paylasiyorum}
                                                        onChange={() => { setFeature("tramer_bilgisi_paylasiyorum", !form.features.tramer_bilgisi_paylasiyorum); if (form.features.tramer_bilgisi_paylasiyorum) { setFeature("tramer_tutari", ""); setFeature("tramer_tarihi", "") } }}
                                                        label="Tramer Bilgisini Paylaşıyorum"
                                                        sub="Kaza geçmişi ve tramer kaydı şeffaf paylaşılsın" />
                                                    {form.features.tramer_bilgisi_paylasiyorum && (
                                                        <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Tramer Tutarı (₺)</label>
                                                                <div className="relative">
                                                                    <input type="text" inputMode="numeric"
                                                                           value={form.features.tramer_tutari ? Number(form.features.tramer_tutari).toLocaleString("tr-TR") : ""}
                                                                           onChange={e => setFeature("tramer_tutari", sanitizePrice(e.target.value))}
                                                                           placeholder="ör. 45.000"
                                                                           className="w-full px-3 py-2.5 pr-8 bg-white border border-purple-200 focus:border-purple-400 text-xs font-medium text-gray-700 rounded outline-none transition-all placeholder:text-gray-400" />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₺</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Tramer Tarihi</label>
                                                                <input type="date"
                                                                       value={form.features.tramer_tarihi || ""}
                                                                       onChange={e => setFeature("tramer_tarihi", e.target.value)}
                                                                       className="w-full px-3 py-2.5 bg-white border border-purple-200 focus:border-purple-400 text-xs font-medium text-gray-700 rounded outline-none transition-all" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <CheckboxField
                                                        checked={!!form.features.katilim_finansi_uyumlu}
                                                        onChange={() => setFeature("katilim_finansi_uyumlu", !form.features.katilim_finansi_uyumlu)}
                                                        label="Katılım Finansı ile Satışa Uygun"
                                                        sub="Faizsiz finansman kuruluşlarıyla çalışmaya uygunuz"
                                                        color="green" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── ADIM 3: Fiyat & Yayın ── */}
                                    {currentStep === 3 && (
                                        <div className="space-y-4">
                                            <div>
                                                <SectionHeader>FİYAT & DURUM <span className="normal-case font-medium text-gray-400">— sadece galericiye özel</span></SectionHeader>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1 text-left">
                                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                                            Satış Fiyatı (₺) <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <input type="text" inputMode="numeric" placeholder="örn. 1.250.000"
                                                                   value={form.price ? Number(form.price).toLocaleString("tr-TR") : ""}
                                                                   onChange={e => setForm(f => ({ ...f, price: sanitizePrice(e.target.value) }))}
                                                                   className={`w-full px-3 py-2.5 pr-7 bg-gray-50 border text-xs font-medium text-gray-700 rounded outline-none focus:bg-white transition-all placeholder:text-gray-400 ${errors.price ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400"}`} />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₺</span>
                                                        </div>
                                                        {errors.price && <p className="text-[10px] text-red-600 font-bold">{errors.price}</p>}
                                                    </div>
                                                    <SelectField label="Stok Durumu" required value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={STATUS_OPTIONS} />
                                                </div>
                                            </div>

                                            <div>
                                                <SectionHeader>İLAN BAŞLIĞI & AÇIKLAMA</SectionHeader>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <input type="text" value={form.title}
                                                           onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                                           placeholder="Marka seçince otomatik oluşur..."
                                                           className={`flex-1 px-2.5 py-2 bg-gray-50 border text-[11px] font-medium text-gray-700 rounded outline-none focus:bg-white transition-all placeholder:text-gray-400 ${errors.title ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400"}`} />
                                                    {selBrand && (
                                                        <button type="button"
                                                                onClick={() => setForm(f => ({ ...f, title: buildPortfolioVehicleTitle({ isSifir, categoryName: selectedCategory.name, selBrand, selModel, selVersion }) }))}
                                                                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded text-[10px] font-bold transition-colors whitespace-nowrap">
                                                            <RefreshCw size={10} /> Yenile
                                                        </button>
                                                    )}
                                                </div>
                                                {errors.title && <p className="text-[10px] text-red-600 font-bold mb-1.5">{errors.title}</p>}
                                                <p className="text-[9px] font-bold text-gray-400 mb-1.5">Açıklama seçimlerinize göre otomatik oluşturulur — dilerseniz düzenleyebilirsiniz.</p>
                                                <textarea rows={4} placeholder="Araç hakkında ek bilgiler..."
                                                          value={form.description}
                                                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                                          className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white text-[11px] font-medium text-gray-700 rounded outline-none resize-none transition-all placeholder:text-gray-400 leading-relaxed" />

                                                <div className="flex flex-col gap-1 text-left mt-3">
                                                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                                        Garanti & Taahhüt Cümlesi
                                                        <span className="text-gray-400 font-normal normal-case ml-1">(düzenlenebilir)</span>
                                                    </label>
                                                    <textarea rows={2}
                                                              value={form.features.garanti_cumlesi ?? "Bu araç firmamızın garantisi altındadır; tüm bilgiler ekspertiz raporuna dayalı olup araç teslimde belirtilen özelliklere uygun olacaktır."}
                                                              onChange={e => setFeature("garanti_cumlesi", e.target.value)}
                                                              className="px-3 py-2.5 bg-purple-50/40 border border-purple-100 hover:border-purple-200 focus:border-purple-400 focus:bg-white text-xs font-medium text-gray-700 rounded outline-none transition-all resize-none" />
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-gray-100">
                                                <button type="button" onClick={handleSubmit} disabled={saving}
                                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-50 text-white py-3.5 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm">
                                                    {saving
                                                        ? <><Loader2 size={13} className="animate-spin" /> Kaydediliyor...</>
                                                        : <><Save size={13} /> {isEdit ? "Güncelle" : "Portföye Ekle"}</>}
                                                </button>
                                                <div className="flex items-start gap-2.5 mt-3.5 bg-purple-50/50 border border-purple-100 rounded p-3">
                                                    <AlertCircle size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
                                                    <p className="text-[10px] text-purple-800 font-semibold leading-relaxed">
                                                        Kaydettiğinizde bu araç, kriterlerine uyan aktif araç taleplerine göre otomatik eşleştirilir.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </FormShell>
                            </div>

                            {/* Sağ: Bilgi + İpuçları */}
                            <div className="xl:col-span-1 flex flex-col gap-4">
                                <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                                    <div className="h-[3px] bg-purple-600" />
                                    <div className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-11 h-11 rounded bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shadow-sm flex-shrink-0">
                                                <Car size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{isEdit ? "Aracı Düzenle" : "Yeni Araç"}</p>
                                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Vasıta Portföyü</p>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                            Marka, model ve donanım seçtiğinizde başlık otomatik oluşturulur; isterseniz kendiniz düzenleyebilirsiniz.
                                        </p>
                                        {form.title && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">İlan Başlığı</p>
                                                <p className="text-xs font-bold text-gray-800 leading-snug">{form.title}</p>
                                            </div>
                                        )}
                                        {form.price && (
                                            <div className="mt-3 flex items-center justify-between text-[11px]">
                                                <span className="text-gray-500 font-bold">Satış Fiyatı</span>
                                                <span className="font-bold text-gray-800">{Number(form.price).toLocaleString("tr-TR")} ₺</span>
                                            </div>
                                        )}
                                        <div className="mt-3 flex items-center justify-between text-[11px]">
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
                              Sahiplik belgesi (ruhsat) yüklenip onaylanmadan bu araçla teklif verilemez.
                            </span>
                                            </div>
                                        )}

                                        {isEdit && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Araç Fotoğrafları ({images.length})</p>
                                                    <button onClick={() => setShowGallery(true)}
                                                            className="flex items-center gap-1 text-[9px] font-bold text-purple-700 hover:text-purple-800 uppercase tracking-wider transition-colors">
                                                        <ImagePlus size={11} /> Galeriyi Yönet
                                                    </button>
                                                </div>
                                                {images.length > 0 ? (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {images.slice(0, 6).map((img, i) => (
                                                            <div key={img.id || i} onClick={() => setShowGallery(true)}
                                                                 className="aspect-square rounded overflow-hidden border border-gray-200 hover:border-gray-300 bg-gray-50 cursor-pointer transition-all">
                                                                <img src={getImageUrl(img)} alt={`Araç fotoğrafı ${i + 1}`} className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setShowGallery(true)}
                                                            className="w-full flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 rounded py-5 transition-all">
                                                        <Image size={18} className="text-gray-400" />
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fotoğraf Ekle</p>
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {isEdit && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Eksper Dökümanları ({documents.length})</p>
                                                    <button onClick={() => setShowDocs(true)}
                                                            className="flex items-center gap-1 text-[9px] font-bold text-purple-700 hover:text-purple-800 uppercase tracking-wider transition-colors">
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
                                                            className="w-full flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 rounded py-5 transition-all">
                                                        <FileText size={18} className="text-gray-400" />
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Belge Ekle</p>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-900 border border-gray-800 rounded-sm shadow-sm p-4 text-white">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-purple-400 mb-1.5">İpucu</p>
                                    <h3 className="font-bold text-sm text-white leading-snug mb-1">Eksiksiz bilgi, hızlı eşleşme</h3>
                                    <p className="text-gray-400 text-[10px] font-medium leading-relaxed">
                                        Yakıt, vites, renk ve KM durumu gibi detayları doldurmak; aracınızın gelen taleplerle otomatik eşleşme şansını artırır.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            {showGallery && (
                <ImageUploadModal
                    item={{ id, title: form.title, images }}
                    onClose={() => setShowGallery(false)}
                    onUpdate={setImages}
                />
            )}
            {showDocs && (
                <DocumentUploadModal
                    item={{ id, title: form.title }}
                    initialDocuments={documents}
                    onClose={() => setShowDocs(false)}
                    onUpdate={setDocuments}
                />
            )}
        </div>
    )
}
