 // ← bu satırı sil
export function sanitizePrice(val) {
    return String(val).replace(/[^0-9]/g, "")
}

export const BOYA_OPTIONS    = ["1-3 Parça", "3-5 Parça", "5+ Parça"]
export const DEGISEN_OPTIONS = ["1-3 Parça", "3-5 Parça", "5+ Parça"]
export const KABUL_EDILEMEZ_OPTIONS = [
    "Ön Kaput", "Tavan", "Sağ Ön Çamurluk", "Sol Ön Çamurluk",
    "Bagaj Kapağı", "Direkler (A/B/C)", "Podye / Şase", "Motor",
    "Sel / Su Baskını", "İç Döşeme Hasarı", "Ağır Koku",
]
export const TESLIM_TARIHI_OPTIONS = [
    "Hazır / Hemen", "3-6 Ay", "6-12 Ay", "1-2 Yıl", "2+ Yıl (proje aşaması)",
]
export const DURATION_PRESETS = [
    { label:"1 Gün", hrs:24 },
    { label:"2 Gün", hrs:48 },
    { label:"3 Gün", hrs:72 },
    { label:"5 Gün", hrs:120 },
]

// Uzmanlik alanı mapping
export const UZMANLIK_MAP = {
    "vasita-sifir":      "plaza_dealer",
    "vasita-ikinci_el":  "used_vehicle_advisor",
    "gayrimenkul-sifir": "construction_firm",
    "gayrimenkul-ikinci_el": "real_estate_advisor",
}

// ── Otomatik başlık ───────────────────────────────────────────
export function buildTitle(category, car, features, address) {
    if (category === "vasita" && car?.marka) {
        return [...[car.marka, car.model, car.versiyon].filter(Boolean), "aranıyor"].join(" ")
    }
    if (category === "gayrimenkul") {
        const parts = [
            address?.district,
            features?.oda_sayisi,
            features?.emlak_tipi,
        ].filter(Boolean)
        return parts.length ? [...parts, "aranıyor"].join(" ") : ""
    }
    return ""
}

// ── Otomatik açıklama ─────────────────────────────────────────
export function buildDescription(category, condition, car, features, address, budget) {
    const bolge = [address?.neighborhood, address?.district].filter(Boolean).join(", ")

    if (category === "vasita") {
        if (!car?.marka) return ""
        const parts = [`${[car.marka, car.model, car.versiyon].filter(Boolean).join(" ")} satın almak istiyorum.`]
        if (features?.yil)   parts.push(`${features.yil} model`)
        if (features?.km)    parts.push(`en fazla ${features.km}`)
        if (features?.yakit) parts.push(`${features.yakit} yakıt`)

        if (condition === "sifir") {
            parts.push("Sıfır kilometre, yetkili bayi veya plazadan satın almak istiyorum")
            if (features?.renk_tercihi) parts.push(`Renk tercihi: ${features.renk_tercihi}`)
            if (features?.bekleme_suresi) parts.push(`${features.bekleme_suresi} bekleme süresini kabul ediyorum`)
        } else {
            // ikinci_el
            if (features?.boya_degisen_tipi === "boyasiz_degisensiz") {
                parts.push("Boyasız ve değişensiz araç istiyorum")
            } else if (features?.boya_degisen_tipi === "boya_degisen_olabilir") {
                const boyaStr    = features.boya_durumu   ? `en fazla ${features.boya_durumu} boyalı` : null
                const degisenStr = features.degisen_parca ? `en fazla ${features.degisen_parca} değişen parça` : null
                const detay = [boyaStr, degisenStr].filter(Boolean).join(", ")
                parts.push(`Boya/değişen kabul ediyorum${detay ? ` (${detay})` : ""}`)
                if ((features.kabul_edilemez || []).length > 0)
                    parts.push(`Kabul etmediğim durumlar: ${features.kabul_edilemez.join(", ")}`)
            }
            if (features?.tramer_bilgisi_istiyorum) {
                const l = features.tramer_limit ? `en fazla ${Number(features.tramer_limit).toLocaleString("tr-TR")} ₺` : "sınırsız"
                parts.push(`Tramer bilgisi görmek istiyorum (${l})`)
            }
            if (features?.eksper_raporu_istiyorum) parts.push("Detaylı eksper raporu talep ediyorum")
            if (features?.takas === "evet") {
                const takasArac  = [features.takas_marka, features.takas_model].filter(Boolean).join(" ")
                const takasDetay = [takasArac, features.takas_km && `${features.takas_km} km`, features.takas_hasar].filter(Boolean).join(", ")
                parts.push(`Takas düşünürüm${takasDetay ? ` (${takasDetay})` : ""}`)
            }
        }
        if (features?.katilim_finansi) parts.push("Katılım finansı ile anlaşmalı satıcılardan almak istiyorum")
        if (budget?.max) parts.push(`Bütçem: ${Number(budget.max).toLocaleString("tr-TR")} ₺`)
        return parts.join(". ") + "."
    }

    if (category === "gayrimenkul") {
        if (!features?.emlak_tipi) return ""
        const parts = []
        if (bolge) parts.push(`${bolge} bölgesinde`)
        if (features.oda_sayisi) parts.push(features.oda_sayisi)
        if (features.metrekare)  parts.push(features.metrekare)
        if (condition === "sifir") {
            parts.push(`sıfır ${features.emlak_tipi} satın almak istiyorum.`)
            if (features.proje_adi)     parts.push(`Proje adı tercihi: ${features.proje_adi}`)
            if (features.teslim_tarihi) parts.push(`Teslim tarihi: ${features.teslim_tarihi}`)
            if (features.kat_tercihi)   parts.push(`Kat tercihi: ${features.kat_tercihi}`)
        } else {
            parts.push(`${features.emlak_tipi} satın almak istiyorum.`)
        }
        if (budget?.max) parts.push(`Bütçem: ${Number(budget.max).toLocaleString("tr-TR")} TL.`)
        return parts.join(" ")
    }
    return ""
}