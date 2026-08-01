// ─────────────────────────────────────────────────────────────
// realestate/index.jsx
// Gayrimenkul talebi "beyni": tüm state ve iş mantığı burada.
//   - Ortak alanlar (condition, duration, matchPercent, submit...) useDemandForm hook'undan.
//   - Lokasyon (il/ilçe/mahalle) useTurkiyeLocation hook'undan.
//   - Mahalle ÇOKLU seçim: loc.selectedNeighborhoods (obje dizisi) + loc.toggleNeighborhood.
//   - Otomatik başlık & açıklama üretimi useEffect ile.
//
// Formu değiştirmek → form.jsx | Sol widget → left.jsx | Sağ özet → right.jsx
// İş mantığı / API → burası ve _shared/useDemandForm.js
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import Header from "@/components/layout/Header"
import { UZMANLIK_MAP } from "@/pages/demands/_shared/demandFormUtils"
import { useDemandForm } from "@/pages/demands/_shared/useDemandForm"
import DemandLayout from "@/pages/demands/_shared/DemandLayout"
import DemandSuccess from "@/pages/demands/_shared/DemandSuccess"
import { useTurkiyeLocation } from "@/hooks/useTurkiyeLocation"
import {
    GAYRIMENKUL_KATEGORILERI, ISLEM_TIPLERI,
    buildRealEstateTitle, buildRealEstateDescription,
} from "./realEstateConfig"
import RealEstateLeft from "./left"
import RealEstateForm from "./form"
import RealEstateRight from "./right"

export default function RealEstateDemandPage() {
    const [searchParams] = useSearchParams()

    // Emlağa özel state
    const [kategori, setKategori] = useState("konut")
    const [islemTipi, setIslemTipi] = useState("satilik")

    // Lokasyon (il/ilçe/mahalle)
    const loc = useTurkiyeLocation()

    // Ortak form altyapısı
    const f = useDemandForm({
        categorySlug: "gayrimenkul",
        initialCondition: "ikinci_el",
        initialDurationHours: 168,
        resolveUzmanlik: (condition) =>
            condition === "sifir" ? UZMANLIK_MAP["gayrimenkul-sifir"] : UZMANLIK_MAP["gayrimenkul-ikinci_el"],
        validateBeforeSubmit: () => validateStep(3),
        buildFeatures: ({ uploadUrl }) => ({
            ...featuresRef.current,
            kategori: kategoriRef.current,
            islem_tipi: islemTipiRef.current,
            il: locRef.current.selectedProvince?.name || null,
            ilce: locRef.current.selectedDistrict?.name || null,
            mahalleler: (locRef.current.selectedNeighborhoods || []).map(n => n.name),
            mahalle_idler: (locRef.current.selectedNeighborhoods || []).map(n => n.id),
            ...(uploadUrl ? { belgedosya_url: uploadUrl } : {}),
        }),
    })

    const {
        authLoading, condition, setCondition, features, setFeature,
        maxBudget, setMaxBudget, title, setTitle, desc, setDesc,
        uploadFile, setUploadFile, duration, setDurationHours,
        matchPercent, setMatchPercent,
        errors, setErrors, currentStep, submitting, submitted, result,
        resetForm, nextStep, prevStep, submit,
    } = f

    // Submit anında güncel değerleri garantilemek için ref'ler
    const kategoriRef = useRef(kategori); kategoriRef.current = kategori
    const islemTipiRef = useRef(islemTipi); islemTipiRef.current = islemTipi
    const featuresRef = useRef(features); featuresRef.current = features
    const locRef = useRef(loc); locRef.current = loc

    // URL param → islem & kategori
    useEffect(() => {
        const path = window.location.pathname
        const islem = searchParams.get("islem")
        const kat = searchParams.get("kategori")
        const c = searchParams.get("condition")
            || (path.includes("new-property") ? "sifir" : null)
            || (path.includes("used-property") ? "ikinci_el" : null)
        if (islem && ISLEM_TIPLERI.find(x => x.value === islem)) setIslemTipi(islem)
        if (kat && GAYRIMENKUL_KATEGORILERI.find(x => x.value === kat)) setKategori(kat)
        if (c === "sifir" || c === "ikinci_el") setCondition(c)
    }, [])

    // Durum değişince form + lokasyonu sıfırla
    const changeCondition = (newCondition) => {
        setCondition(newCondition)
        loc.reset()
        resetForm()
        window.history.replaceState(null, "",
            "/demands/create/realestate?condition=" + newCondition + "&kategori=" + kategori)
    }

    // Otomatik başlık & açıklama
    useEffect(() => {
        const il = loc.selectedProvince?.name
        const ilce = loc.selectedDistrict?.name
        if (!il) return
        const mahalleler = (loc.selectedNeighborhoods || []).map(n => n.name)
        setTitle(buildRealEstateTitle({ condition, kategori, islemTipi, il, ilce, features }))
        setDesc(buildRealEstateDescription({
            condition, kategori, islemTipi, il, ilce,
            mahalleler, features, maxBudget,
        }))
    }, [condition, kategori, islemTipi, loc.selectedProvince, loc.selectedDistrict, loc.selectedNeighborhoods, features, maxBudget])

    // Adım doğrulama
    const validateStep = (step) => {
        const e = {}
        if (step === 1) {
            if (!islemTipi) e.islemTipi = "İşlem tipini seçiniz."
            if (!kategori) e.kategori = "Kategori seçiniz."
            if (!loc.selectedProvince) e.location = "Şehir seçimi yapınız."
            else if (!loc.selectedDistrict) e.location = "İlçe seçimi yapınız."
        }
        if (step === 2) {
            if (kategori !== "arsa" && !features.oda_sayisi) e.oda_sayisi = "Oda sayısı zorunludur."
            if (!features.metrekare) e.metrekare = "Metrekare belirtmelisiniz."
        }
        if (step === 3) {
            if (!maxBudget || Number(maxBudget) <= 0) e.maxBudget = "Maksimum bütçe girilmelidir."
            if (!title.trim()) e.title = "Talep başlığı boş bırakılamaz."
        }
        setErrors(e)
        if (Object.keys(e).length > 0) {
            f.toast({ message: Object.values(e)[0], type: "error" })
            return false
        }
        return true
    }

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

    // Talep gönderildi → başarı ekranı
    if (submitted) {
        const il = loc.selectedProvince?.name
        const ilce = loc.selectedDistrict?.name
        const islemLbl = ISLEM_TIPLERI.find(t => t.value === islemTipi)?.label || "—"
        return (
            <div className="min-h-screen bg-gray-200 flex flex-col">
                <Header />
                <DemandSuccess
                    categoryLabel="Gayrimenkul talebiniz"
                    demandNo={result?.demandNo}
                    title={title}
                    info={[
                        { label: "İşlem", value: islemLbl },
                        { label: "Lokasyon", value: il ? `${il}${ilce ? " / " + ilce : ""}` : "—" },
                        { label: "Oda / m²", value: [features.oda_sayisi, features.metrekare ? features.metrekare + " m²" : null].filter(Boolean).join(" · ") || "—" },
                        { label: "Maks. Bütçe", value: maxBudget ? Number(maxBudget).toLocaleString("tr-TR") + " ₺" : "—" },
                    ]}
                    redirectTo="/"
                    redirectSeconds={5}
                />
            </div>
        )
    }

    return (
        <DemandLayout
            breadcrumb="Gayrimenkul Talebi"
            left={
                <RealEstateLeft
                    condition={condition}
                    onConditionChange={changeCondition}
                />
            }
            form={
                <RealEstateForm
                    condition={condition}
                    kategori={kategori} setKategori={setKategori}
                    islemTipi={islemTipi} setIslemTipi={setIslemTipi}
                    loc={loc}
                    features={features} setFeature={setFeature}
                    maxBudget={maxBudget} setMaxBudget={setMaxBudget}
                    title={title} setTitle={setTitle}
                    desc={desc} setDesc={setDesc}
                    duration={duration} setDurationHours={setDurationHours}
                    matchPercent={matchPercent} setMatchPercent={setMatchPercent}
                    uploadFile={uploadFile} setUploadFile={setUploadFile}
                    errors={errors}
                    currentStep={currentStep}
                    onPrev={prevStep}
                    onNext={() => nextStep(validateStep)}
                    submitting={submitting}
                    onSubmit={submit}
                />
            }
            right={
                <RealEstateRight
                    condition={condition}
                    kategori={kategori}
                    islemTipi={islemTipi}
                    il={loc.selectedProvince?.name}
                    ilce={loc.selectedDistrict?.name}
                    mahalleler={(loc.selectedNeighborhoods || []).map(n => n.name)}
                    maxBudget={maxBudget}
                    duration={duration}
                    features={features}
                    uploadFile={uploadFile}
                />
            }
        />
    )
}