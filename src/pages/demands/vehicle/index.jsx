// ─────────────────────────────────────────────────────────────
// vehicle/index.jsx
// Araç talebi "beyni": tüm state ve iş mantığı burada toplanır.
//   - Ortak alanlar (condition, duration, submit...) useDemandForm hook'undan.
//   - Araca özel alanlar (kategori, marka/model/donanım kaskadı, takas) burada.
//   - Otomatik başlık & açıklama üretimi useEffect ile.
//   - Görünüm: DemandLayout içine left / form / right yerleştirilir.
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
import {
    ARAC_KATEGORILERI, buildVehicleTitle, buildVehicleDescription,
} from "./vehicleConfig"
import VehicleLeft from "./left"
import VehicleForm from "./form"
import VehicleRight from "./right"

export default function VehicleDemandPage() {
    const [searchParams] = useSearchParams()

    const [kategori, setKategori] = useState("otomobil")
    const [selBrand, setSelBrand] = useState("")
    const [selModel, setSelModel] = useState("")
    const [selVersion, setSelVersion] = useState("")
    const [takasBrand, setTakasBrand] = useState("")
    const [takasModel, setTakasModel] = useState("")
    const [takasVersion, setTakasVersion] = useState("")

    const kategoriRef = useRef(kategori); kategoriRef.current = kategori
    const selBrandRef = useRef(selBrand); selBrandRef.current = selBrand
    const selModelRef = useRef(selModel); selModelRef.current = selModel
    const selVersionRef = useRef(selVersion); selVersionRef.current = selVersion

    const f = useDemandForm({
        categorySlug: "vasita",
        initialCondition: "ikinci_el",
        initialDurationHours: 24,
        resolveUzmanlik: (condition) =>
            condition === "sifir" ? UZMANLIK_MAP["vasita-sifir"] : UZMANLIK_MAP["vasita-ikinci_el"],
        validateBeforeSubmit: () => validateStep(3),
        buildFeatures: ({ uploadUrl }) => ({
            ...featuresRef.current,
            arac_tipi: kategoriRef.current,
            marka: selBrandRef.current,
            model: selModelRef.current || null,
            versiyon: selVersionRef.current || null,
            ...(uploadUrl ? { expertise_url: uploadUrl } : {}),
        }),
    })

    const {
        authLoading, condition, setCondition, features, setFeature, setFeatures,
        maxBudget, setMaxBudget, title, setTitle, desc, setDesc,
        uploadFile, setUploadFile, duration, setDurationHours,
        matchPercent, setMatchPercent,
        errors, setErrors, currentStep, submitting, submitted, result,
        resetForm, nextStep, prevStep, submit,
    } = f

    const featuresRef = useRef(features); featuresRef.current = features

    // URL param → condition & kategori
    useEffect(() => {
        const path = window.location.pathname
        const c = searchParams.get("condition")
            || (path.includes("new-vehicle") ? "sifir" : null)
            || (path.includes("used-vehicle") ? "ikinci_el" : null)
        const k = searchParams.get("kategori")
        if (c === "sifir" || c === "ikinci_el") setCondition(c)
        if (k && ARAC_KATEGORILERI.find(x => x.value === k)) setKategori(k)
    }, [])

    const changeCondition = (newCondition) => {
        setCondition(newCondition)
        setSelBrand(""); setSelModel(""); setSelVersion("")
        setTakasBrand(""); setTakasModel(""); setTakasVersion("")
        resetForm()
        window.history.replaceState(null, "",
            "/demands/create/vehicle?condition=" + newCondition + "&kategori=" + kategori)
    }

    // Otomatik başlık & açıklama
    useEffect(() => {
        if (!selBrand) return
        setTitle(buildVehicleTitle({ condition, kategori, selBrand, selModel, selVersion }))
        setDesc(buildVehicleDescription({ condition, kategori, selBrand, selModel, selVersion, features, maxBudget }))
    }, [condition, kategori, selBrand, selModel, selVersion, features, maxBudget])

    const validateStep = (step) => {
        const e = {}
        if (step === 1) {
            if (!selBrand) e.brand = "Araç markası zorunludur."
            if (!features.yil) e.yil = "Model yılı seçmelisiniz."
            if (condition === "ikinci_el" && !features.km) e.km = "Kilometre limiti seçmelisiniz."
        }
        if (step === 3) {
            if (!maxBudget || Number(maxBudget) <= 0) e.maxBudget = "Maksimum bütçe girilmelidir."
            if (!duration.expires_at) e.duration = "İlan süresi seçiniz."
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
        const durumLbl = condition === "sifir" ? "Sıfır" : "2. El"
        return (
            <div className="min-h-screen bg-gray-200 flex flex-col">
                <Header />
                <DemandSuccess
                    categoryLabel="Araç talebiniz"
                    demandNo={result?.demandNo}
                    title={title}
                    info={[
                        { label: "Araç", value: [durumLbl, selBrand, selModel].filter(Boolean).join(" ") || "—" },
                        { label: "Maks. Bütçe", value: maxBudget ? Number(maxBudget).toLocaleString("tr-TR") + " ₺" : "—" },
                        { label: "Model Yılı", value: features.yil || "—" },
                        { label: "Yayın Süresi", value: duration.duration_hours ? duration.duration_hours / 24 + " Gün" : "—" },
                    ]}
                    redirectTo="/"
                    redirectSeconds={5}
                />
            </div>
        )
    }

    return (
        <DemandLayout
            breadcrumb="Araç Talebi"
            left={
                <VehicleLeft condition={condition} onConditionChange={changeCondition} />
            }
            form={
                <VehicleForm
                    condition={condition}
                    kategori={kategori} setKategori={setKategori}
                    selBrand={selBrand} setSelBrand={setSelBrand}
                    selModel={selModel} setSelModel={setSelModel}
                    selVersion={selVersion} setSelVersion={setSelVersion}
                    takasBrand={takasBrand} setTakasBrand={setTakasBrand}
                    takasModel={takasModel} setTakasModel={setTakasModel}
                    takasVersion={takasVersion} setTakasVersion={setTakasVersion}
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
                <VehicleRight
                    condition={condition}
                    kategori={kategori}
                    selBrand={selBrand}
                    selModel={selModel}
                    maxBudget={maxBudget}
                    duration={duration}
                    features={features}
                    uploadFile={uploadFile}
                />
            }
        />
    )
}