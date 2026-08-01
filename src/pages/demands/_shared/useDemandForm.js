// ─────────────────────────────────────────────────────────────
// useDemandForm.js
// Tüm talep (demand) kategorilerinin PAYLAŞTIĞI state ve iş mantığı.
// Kategoriye özel alanlar (features, kaskad seçimler) index.jsx'te kalır;
// burada yalnızca her kategoride tekrar eden ortak alanlar yönetilir:
//   condition, features, maxBudget, title, desc, duration, matchPercent,
//   errors, submit akışı, dosya yükleme.
//
// Kategoriye özel index.jsx bu hook'u çağırır, dönen değerleri form/left/right'a
// props olarak dağıtır. Ortak bir davranışı değiştirmek gerektiğinde (ör. submit
// endpoint'i, süre mantığı) yalnızca bu dosya düzenlenir.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/store/AuthContext.jsx"
import { useToast } from "@/components/ui/Toast.jsx"
import api from "@/lib/axios.js"

const DEFAULT_HOURS = 24

export function useDemandForm({
                                  categorySlug,          // "vasita" | "gayrimenkul" | ...
                                  initialCondition = "ikinci_el",
                                  initialDurationHours = DEFAULT_HOURS,
                                  resolveUzmanlik,       // (condition) => uzmanlik_alani string
                                  buildFeatures,         // () => kategoriye özel features nesnesi (index'te tanımlanır)
                                  validateBeforeSubmit,  // () => boolean; false ise submit iptal
                                  onSubmitted,           // opsiyonel: başarı sonrası çağrılır
                              } = {}) {
    const { isAuthenticated, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const toast = useToast()

    // ── Ortak state ──
    const [condition, setCondition] = useState(initialCondition)
    const [features, setFeatures] = useState({})
    const [maxBudget, setMaxBudget] = useState("")
    const [title, setTitle] = useState("")
    const [desc, setDesc] = useState("")
    const [uploadFile, setUploadFile] = useState(null)   // ekspertiz / tapu / fatura vb.
    const [duration, setDuration] = useState({
        mode: "preset",
        duration_hours: initialDurationHours,
        expires_at: new Date(Date.now() + initialDurationHours * 3600000).toISOString(),
    })
    // Talep sahibinin istediği minimum eşleşme yüzdesi.
    // null = "Farketmez" (eşik uygulanmaz); 60 | 80 | 100 = katı eşik.
    const [matchPercent, setMatchPercent] = useState(null)
    const [errors, setErrors] = useState({})
    const [currentStep, setCurrentStep] = useState(1)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)   // başarı ekranı bayrağı
    const [result, setResult] = useState(null)          // backend'den dönen talep verisi (no vb.)

    const setFeature = useCallback((k, v) => setFeatures(f => ({ ...f, [k]: v })), [])
    const setError = useCallback((k, v) => setErrors(e => ({ ...e, [k]: v })), [])
    const clearError = useCallback((k) => setErrors(e => ({ ...e, [k]: "" })), [])

    // Süre seçimi (preset buton -> saat)
    const setDurationHours = useCallback((hrs) => {
        setDuration({
            mode: "preset",
            duration_hours: hrs,
            expires_at: new Date(Date.now() + hrs * 3600000).toISOString(),
        })
    }, [])

    // Formu tamamen sıfırla (ör. condition değişince)
    const resetForm = useCallback(() => {
        setFeatures({})
        setMaxBudget("")
        setTitle("")
        setDesc("")
        setUploadFile(null)
        setMatchPercent(null)
        setErrors({})
        setCurrentStep(1)
    }, [])

    // Auth guard
    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate("/")
    }, [authLoading, isAuthenticated])

    // ── Adım gezinme ──
    const nextStep = useCallback((validateStep) => {
        if (!validateStep || validateStep(currentStep)) {
            setCurrentStep(s => Math.min(s + 1, 3))
            window.scrollTo({ top: 0, behavior: "smooth" })
        }
    }, [currentStep])

    const prevStep = useCallback(() => {
        setCurrentStep(s => Math.max(s - 1, 1))
        window.scrollTo({ top: 0, behavior: "smooth" })
    }, [])

    // ── Ortak submit akışı ──
    // buildFeatures() index.jsx'te kategoriye özel feature payload'ını döndürür.
    const submit = useCallback(async () => {
        if (validateBeforeSubmit && !validateBeforeSubmit()) return
        setSubmitting(true)
        try {
            // Dosya (varsa) önce yüklenir
            let uploadUrl = null
            if (uploadFile) {
                const fd = new FormData()
                fd.append("file", uploadFile)
                fd.append("type", categorySlug === "gayrimenkul" ? "estate_document" : "expertise")
                const up = await api.post("/uploads/document", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
                uploadUrl = up.data?.url || null
            }

            const featurePayload = buildFeatures ? buildFeatures({ uploadUrl }) : { ...features }

            const res = await api.post("/buyer/demands", {
                category_slug: categorySlug,
                condition,
                uzmanlik_alani: resolveUzmanlik ? resolveUzmanlik(condition) : null,
                title: title.trim(),
                description: desc.trim().substring(0, 1000),
                max_budget: maxBudget || null,
                duration_hours: duration.duration_hours || null,
                expires_at: duration.expires_at || null,
                features: featurePayload,
                min_match_percent: matchPercent,
            })

            // Backend'den dönen talep verisini sakla (talep no vb.)
            const data = res?.data?.data || res?.data || {}
            const demandNo = data.demand_no || data.reference_no || data.code
                || (data.id ? `TM-${new Date().getFullYear()}-${String(data.id).padStart(6, "0")}` : null)

            setResult({ ...data, demandNo })
            toast({ message: "Talebiniz başarıyla iletildi!", type: "success" })
            setSubmitted(true)               // başarı ekranını göster
            if (onSubmitted) onSubmitted(data)
        } catch (err) {
            toast({ message: err?.response?.data?.message || "Gönderim başarısız.", type: "error" })
        } finally {
            setSubmitting(false)
        }
    }, [
        categorySlug, condition, features, maxBudget, title, desc,
        duration, uploadFile, matchPercent, resolveUzmanlik, buildFeatures,
        validateBeforeSubmit, onSubmitted,
    ])

    return {
        // durum bayrakları
        authLoading, isAuthenticated,
        // dış araçlar
        navigate, toast,
        // state + setter'lar
        condition, setCondition,
        features, setFeatures, setFeature,
        maxBudget, setMaxBudget,
        title, setTitle,
        desc, setDesc,
        uploadFile, setUploadFile,
        duration, setDuration, setDurationHours,
        matchPercent, setMatchPercent,
        errors, setErrors, setError, clearError,
        currentStep, setCurrentStep,
        submitting, submitted, result,
        // aksiyonlar
        resetForm, nextStep, prevStep, submit,
    }
}