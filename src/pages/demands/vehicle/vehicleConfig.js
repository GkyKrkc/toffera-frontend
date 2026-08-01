// ─────────────────────────────────────────────────────────────
// vehicleConfig.js
// Araç (vasıta) kategorisine özel sabitler ve metin üreticiler.
// form.jsx ve index.jsx buradan besleniyor.
// ─────────────────────────────────────────────────────────────

export const ARAC_KATEGORILERI = [
    { value: "otomobil", label: "Otomobil" },
    { value: "arazi_suv_pickup", label: "Arazi, SUV & Pickup" },
    { value: "elektrikli", label: "Elektrikli Araçlar" },
    { value: "motosiklet", label: "Motosiklet" },
    { value: "minivan_panelvan", label: "Minivan & Panelvan" },
    { value: "ticari", label: "Ticari Araçlar" },
]

export const BOYA_OPTIONS = ["1-3 Parça", "3-5 Parça", "5+ Parça"]
export const DEGISEN_OPTIONS = ["1-3 Parça", "3-5 Parça", "5+ Parça"]
export const KABUL_EDILEMEZ = [
    "Ön Kaput", "Tavan", "Bagaj Kapağı", "Direkler (A/B/C)",
    "Podye / Şase", "Motor", "Sel / Su Baskını", "İç Döşeme Hasarı", "Ağır Koku",
]
export const DURATION_PRESETS = [
    { label: "1 Gün", hrs: 24 },
    { label: "2 Gün", hrs: 48 },
    { label: "3 Gün", hrs: 72 },
    { label: "5 Gün", hrs: 120 },
]
export const YILLAR = Array.from({ length: 26 }, (_, i) => (2025 - i).toString())
export const KM_OPTIONS = [
    "10.000 km'ye kadar", "25.000 km'ye kadar", "50.000 km'ye kadar",
    "75.000 km'ye kadar", "100.000 km'ye kadar", "150.000 km'ye kadar",
    "200.000 km'ye kadar", "200.000 km üzeri", "Farketmez",
]
export const YAKIT_OPTIONS = ["Benzin", "Dizel", "LPG", "Hibrit", "Elektrik", "Benzin & LPG", "Farketmez"]
export const VITES_OPTIONS = ["Otomatik", "Manuel", "Yarı Otomatik", "Farketmez"]
export const RENK_OPTIONS = ["Beyaz", "Siyah", "Gri", "Gümüş", "Mavi", "Kırmızı", "Kahverengi", "Yeşil", "Bej", "Sarı", "Turuncu", "Mor", "Farketmez"]
export const BEKLEME_OPTIONS = ["Hazır / Stokta Var", "1-3 Ay", "3-6 Ay", "6-12 Ay", "Süre Önemli Değil"]

export const BOYA_LABEL = {
    boyasiz_degisensiz: "Boyasız & değişensiz",
    boya_degisen_olabilir: "Boya/değişen olabilir",
    agir_hasarli: "Ağır hasarlı olabilir",
}

export const katLabelOf = (kategori) =>
    ARAC_KATEGORILERI.find(k => k.value === kategori)?.label || ""

// ── Otomatik başlık ──
// Durum + Kategori + Marka + Model + Donanım
export function buildVehicleTitle({ condition, kategori, selBrand, selModel, selVersion }) {
    if (!selBrand) return ""
    const durumLbl = condition === "sifir" ? "Sıfır" : "2. El"
    return [durumLbl, katLabelOf(kategori), selBrand, selModel, selVersion]
        .filter(Boolean).join(" ") + " arıyorum"
}

// ── Otomatik detaylı açıklama ──
// Formdaki tüm seçili özelliklerin özeti.
export function buildVehicleDescription({ condition, kategori, selBrand, selModel, selVersion, features, maxBudget }) {
    if (!selBrand) return ""
    const durumLbl = condition === "sifir" ? "Sıfır" : "2. El"
    const katLbl = katLabelOf(kategori)
    const bt = features.boya_degisen_tipi || "boyasiz_degisensiz"

    const satirlar = []
    satirlar.push(`${durumLbl} ${katLbl} kategorisinde ${selBrand}${selModel ? " " + selModel : ""}${selVersion ? " " + selVersion : ""} arıyorum.`)

    const teknik = []
    if (features.yil) teknik.push(`Model yılı: ${features.yil}`)
    if (condition === "ikinci_el" && features.km) teknik.push(`Maksimum KM: ${features.km}`)
    if (features.yakit) teknik.push(`Yakıt: ${features.yakit}`)
    if (features.vites) teknik.push(`Vites: ${features.vites}`)
    if (features.renk) teknik.push(`Renk: ${features.renk}`)
    if (condition === "sifir" && features.bekleme_suresi) teknik.push(`Bekleme süresi: ${features.bekleme_suresi}`)
    if (teknik.length) satirlar.push("Teknik tercihler — " + teknik.join(", ") + ".")

    if (condition === "ikinci_el") {
        let hasarStr = `Boya & değişen durumu: ${BOYA_LABEL[bt]}`
        if (bt === "boya_degisen_olabilir") {
            const ek = []
            if (features.boya_durumu) ek.push(`kabul edilebilir boya: ${features.boya_durumu}`)
            if (features.degisen_parca) ek.push(`kabul edilebilir değişen: ${features.degisen_parca}`)
            if ((features.kabul_edilemez || []).length) ek.push(`kabul edilemez: ${features.kabul_edilemez.join(", ")}`)
            if (ek.length) hasarStr += " (" + ek.join("; ") + ")"
        }
        satirlar.push(hasarStr + ".")

        if (features.tramer_bilgisi_istiyorum) {
            satirlar.push(`Tramer bilgisi talep ediliyor${features.tramer_limit ? ` (maks. ${Number(features.tramer_limit).toLocaleString("tr-TR")} ₺)` : ""}.`)
        }
        if (features.eksper_raporu_istiyorum) satirlar.push("Detaylı eksper raporu talep ediliyor.")

        if (features.takas === "evet") {
            const tk = []
            if (features.takas_marka) tk.push(`${features.takas_marka}${features.takas_model ? " " + features.takas_model : ""}${features.takas_versiyon ? " " + features.takas_versiyon : ""}`)
            if (features.takas_km) tk.push(`${Number(features.takas_km).toLocaleString("tr-TR")} km`)
            if (features.takas_hasar) tk.push(features.takas_hasar)
            if (features.takas_fiyat) tk.push(`${Number(features.takas_fiyat).toLocaleString("tr-TR")} ₺ değerinde`)
            satirlar.push("Takas düşünülüyor" + (tk.length ? ": " + tk.join(", ") : "") + ".")
        }
    }

    if (features.katilim_finansi) satirlar.push("Katılım finansına uygun satıcılar tercih ediliyor.")
    // NOT: Maksimum bütçe artık açıklama metnine eklenmiyor — bütçe bilgisi
    // talep detay sayfasında herkese açık şekilde gösterilmiyor.

    return satirlar.join(" ")
}