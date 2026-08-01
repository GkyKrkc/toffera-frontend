// ─────────────────────────────────────────────────────────────
// GenericDemandPage.jsx
// Route: /demands/create/:categorySlug
//
// "vehicle" / "real_estate" DIŞINDAKİ tüm YAPRAK kategoriler (ör.
// Elektronik > Cep Telefonu, Klavye) buraya düşer. Kategorinin admin
// panelinde (Filament CategoryResource → "Form Alanları") tanımlanan
// form_schema'sı DynamicCategoryFields ile otomatik render edilir —
// böylece her yaprak kategori kendi özel alanlarını toplar.
//
// Aynı form_schema + aynı DynamicCategoryFields, portföy tarafında da
// (PortfolioCategoryPage.jsx) kullanılıyor — talep ile portföy aynı
// alanları topladığı için uzmanlar teklif verirken birebir kıyaslanabilir.
//
// Ortak state/submit akışı için _shared/useDemandForm.js kullanılır
// (aynı /buyer/demands endpoint'i, aynı budget/duration/matchPercent
// mantığı — sadece kategoriye özel alanlar burada dinamik).
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
    Tag, CheckCircle, Loader2, AlertCircle, Zap, ShieldCheck,
} from "lucide-react"
import api from "@/lib/axios.js"
import { useDemandForm } from "@/pages/demands/_shared/useDemandForm"
import { DURATION_PRESETS } from "@/pages/demands/_shared/demandFormUtils"
import DemandLayout from "@/pages/demands/_shared/DemandLayout"
import DemandSuccess from "@/pages/demands/_shared/DemandSuccess"
import RightPanel from "@/pages/demands/_shared/RightPanel"
import DynamicCategoryFields from "@/components/category/DynamicCategoryFields"
import Header from "@/components/layout/Header"

function SectionHeader({ children }) {
    return <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">{children}</p>
}

// Kategori ağacında slug'a göre YAPRAK kategoriyi arar (sınırsız derinlik).
function findCategoryBySlug(nodes, slug) {
    for (const node of nodes) {
        if (node.slug === slug) return node
        if (node.children?.length) {
            const found = findCategoryBySlug(node.children, slug)
            if (found) return found
        }
    }
    return null
}

export default function GenericDemandPage() {
    const { categorySlug } = useParams()
    const navigate = useNavigate()

    const [category, setCategory] = useState(null)
    const [categoryLoading, setCategoryLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        setCategoryLoading(true)
        setNotFound(false)
        api.get("/categories")
            .then(r => {
                const found = findCategoryBySlug(r.data || [], categorySlug)
                if (!found) { setNotFound(true); return }
                // Zengin formu olan kategoriler kendi özel sayfalarına aittir —
                // biri doğrudan bu URL'e gelirse doğru sayfaya yönlendir.
                if (found.form_component === "vehicle") { navigate("/demands/create/vehicle", { replace: true }); return }
                if (found.form_component === "real_estate") { navigate("/demands/create/realestate", { replace: true }); return }
                setCategory(found)
            })
            .catch(() => setNotFound(true))
            .finally(() => setCategoryLoading(false))
    }, [categorySlug])

    const schema = category?.form_schema || []

    const f = useDemandForm({
        categorySlug,
        initialDurationHours: 24,
    })
    const {
        authLoading, features, setFeature,
        maxBudget, setMaxBudget, title, setTitle, desc, setDesc,
        duration, setDurationHours,
        matchPercent, setMatchPercent,
        errors, setErrors, submitting, submitted, result,
        submit, toast,
    } = f

    const validateAndSubmit = () => {
        const e = {}
        schema.forEach(field => {
            if (!field.required) return
            const val = features[field.key]
            const empty = field.type === "checkbox" ? !(Array.isArray(val) && val.length) : !val
            if (empty) e[field.key] = `${field.label} zorunludur.`
        })
        if (!title.trim()) e.title = "Talep başlığı boş bırakılamaz."
        if (!maxBudget || Number(maxBudget) <= 0) e.maxBudget = "Maksimum bütçe girilmelidir."
        if (!duration.expires_at) e.duration = "İlan süresi seçiniz."

        setErrors(e)
        if (Object.keys(e).length > 0) {
            toast({ message: Object.values(e)[0], type: "error" })
            return
        }
        submit()
    }

    if (authLoading || categoryLoading) {
        return (
            <div className="min-h-screen bg-gray-200 flex flex-col">
                <Header />
                <div className="flex items-center justify-center flex-1">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    if (notFound || !category) {
        return (
            <div className="min-h-screen bg-gray-200 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="max-w-sm w-full bg-white border border-gray-200 rounded-sm shadow-sm p-6 text-center">
                        <AlertCircle size={22} className="text-amber-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-700">Kategori bulunamadı</p>
                        <p className="text-xs text-gray-400 mt-1">Bu kategori kaldırılmış ya da geçersiz olabilir.</p>
                        <button onClick={() => navigate("/")}
                                className="mt-4 inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all">
                            Anasayfaya Dön
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-200 flex flex-col">
                <Header />
                <DemandSuccess
                    categoryLabel={`${category.name} talebiniz`}
                    demandNo={result?.demandNo}
                    title={title}
                    info={[
                        { label: "Kategori", value: category.name },
                        { label: "Maks. Bütçe", value: maxBudget ? Number(maxBudget).toLocaleString("tr-TR") + " ₺" : "—" },
                        { label: "Yayın Süresi", value: duration.duration_hours ? duration.duration_hours / 24 + " Gün" : "—" },
                    ]}
                    redirectTo="/"
                    redirectSeconds={5}
                />
            </div>
        )
    }

    const filledDynamicCount = schema.filter(field => {
        const val = features[field.key]
        return field.type === "checkbox" ? (Array.isArray(val) && val.length) : !!val
    }).length

    return (
        <DemandLayout
            breadcrumb={`${category.name} Talebi`}
            left={
                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                        <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">{category.name}</h2>
                        <p className="text-[10px] font-medium text-gray-500 mt-0.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                            Talep oluşturuyorsunuz
                        </p>
                    </div>
                    <div className="p-4 flex items-start gap-2.5">
                        <ShieldCheck size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                            Talebiniz bu kategoride yetkili onaylı satıcılara iletilir; size uygun teklifleri buradan takip edebilirsiniz.
                        </p>
                    </div>
                </div>
            }
            form={
                <>
                    <div className="border-b border-gray-200 px-6 pt-5 pb-4 bg-white">
                        <h1 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight flex items-center gap-2">
                            <Tag className="w-5 h-5 text-purple-600" /> {category.name} Talebi
                        </h1>
                        <p className="text-gray-500 text-[11px] sm:text-xs font-medium mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                            Aradığınız {category.name.toLowerCase()} için detayları girin
                        </p>
                    </div>

                    <div className="p-6 space-y-5">
                        {schema.length > 0 && (
                            <div>
                                <SectionHeader>{category.name.toUpperCase()} ÖZELLİKLERİ</SectionHeader>
                                <DynamicCategoryFields schema={schema} values={features} onChange={setFeature} errors={errors} />
                            </div>
                        )}

                        <div>
                            <SectionHeader>BÜTÇE LİMİTİ</SectionHeader>
                            <div className="flex flex-col gap-1 text-left max-w-xs">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Maksimum Bütçe <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input type="text" inputMode="numeric"
                                           value={maxBudget ? Number(maxBudget).toLocaleString("tr-TR") : ""}
                                           onChange={e => setMaxBudget(e.target.value.replace(/[^0-9]/g, ""))}
                                           placeholder="ör. 15.000"
                                           className={`w-full px-3 py-2.5 pr-8 bg-gray-50 border text-xs font-medium text-gray-700 rounded outline-none focus:bg-white transition-all placeholder:text-gray-400 ${errors.maxBudget ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400"}`} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₺</span>
                                </div>
                                {errors.maxBudget && <p className="text-[10px] text-red-600 font-bold">{errors.maxBudget}</p>}
                            </div>
                        </div>

                        <div>
                            <SectionHeader>İLAN AKTİF KALMA SÜRESİ</SectionHeader>
                            <div className="flex gap-2">
                                {DURATION_PRESETS.map(({ label, hrs }) => {
                                    const sel = duration.duration_hours === hrs
                                    return (
                                        <button key={hrs} type="button" onClick={() => setDurationHours(hrs)}
                                                className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${sel ? "bg-purple-700 text-white border-purple-700 shadow-sm" : "bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"}`}>
                                            {label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <SectionHeader>MİNİMUM EŞLEŞME ORANI</SectionHeader>
                            <div className="flex gap-2">
                                {[
                                    { label: "Farketmez", value: null },
                                    { label: "%60+", value: 60 },
                                    { label: "%80+", value: 80 },
                                    { label: "%100", value: 100 },
                                ].map(({ label, value }) => {
                                    const sel = matchPercent === value
                                    return (
                                        <button key={label} type="button" onClick={() => setMatchPercent(value)}
                                                className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${sel ? "bg-purple-700 text-white border-purple-700 shadow-sm" : "bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"}`}>
                                            {label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <SectionHeader>TALEP BAŞLIĞI & AÇIKLAMA</SectionHeader>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                   placeholder={`${category.name} arıyorum`}
                                   className={`w-full px-2.5 py-2 bg-gray-50 border text-[11px] font-medium text-gray-700 rounded outline-none focus:bg-white transition-all placeholder:text-gray-400 mb-1.5 ${errors.title ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400"}`} />
                            {errors.title && <p className="text-[10px] text-red-600 font-bold mb-1.5">{errors.title}</p>}
                            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4}
                                      placeholder="Aradığınız ürün/hizmet hakkında ek detay ekleyin (opsiyonel)..."
                                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white text-[11px] font-medium text-gray-700 rounded outline-none resize-none transition-all placeholder:text-gray-400 leading-relaxed" />
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <button type="button" onClick={validateAndSubmit} disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-3.5 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm">
                                {submitting
                                    ? <><Loader2 size={15} className="animate-spin" /> Talep Gönderiliyor...</>
                                    : <><CheckCircle size={15} /> Talebi Onaylı Satıcılara Gönder</>}
                            </button>
                            <div className="flex items-start gap-2.5 mt-3.5 bg-purple-50/50 border border-purple-100 rounded p-3">
                                <AlertCircle size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
                                <p className="text-[10px] text-purple-800 font-semibold leading-relaxed">
                                    Talep yayınlandığında, kriterlerinize uyan onaylı satıcılara anlık bildirim gönderilerek teklif sunmaları sağlanır.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            }
            right={
                <RightPanel
                    summaryTitle="Talep Özeti"
                    summary={
                        <>
                            <p className="text-xs font-bold text-purple-950 truncate">{title || `${category.name} Talebi`}</p>
                            <p className="text-[10px] text-purple-700 font-medium">
                                {maxBudget ? `Bütçe: en fazla ${Number(maxBudget).toLocaleString("tr-TR")} ₺` : "Bütçe belirtilmedi"}
                            </p>
                            {schema.length > 0 && (
                                <p className="text-[10px] text-purple-700 font-medium">{filledDynamicCount}/{schema.length} özellik dolduruldu</p>
                            )}
                        </>
                    }
                    checks={[
                        { ok: !!title.trim(), label: "Başlık girildi", warn: "Başlık girilmedi" },
                        { ok: !!maxBudget && Number(maxBudget) > 0, label: "Bütçe belirtildi", warn: "Bütçe belirtilmedi" },
                        { ok: !!duration.expires_at, label: "Yayın süresi seçildi", warn: "Yayın süresi seçilmedi" },
                        ...schema.filter(f => f.required).map(f => ({
                            ok: f.type === "checkbox" ? (Array.isArray(features[f.key]) && features[f.key].length) : !!features[f.key],
                            label: `${f.label} dolduruldu`,
                            warn: `${f.label} dolduruldu`,
                        })),
                    ]}
                    tips={[
                        { icon: <Zap size={13} />, color: "text-amber-400", bg: "border-gray-800", text: "Ne kadar çok alan doldurursanız, size o kadar isabetli teklifler gelir." },
                    ]}
                />
            }
        />
    )
}
