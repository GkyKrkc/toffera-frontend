// ─────────────────────────────────────────────────────────────
// realEstateConfig.js
// Gayrimenkul (emlak) kategorisine özel sabitler ve metin üreticiler.
// form.jsx ve index.jsx buradan besleniyor.
// ─────────────────────────────────────────────────────────────

export const GAYRIMENKUL_KATEGORILERI = [
    { value: "konut", label: "Konut (Daire, Villa, Müstakil)" },
    { value: "ticari", label: "Ticari (Ofis, Mağaza, Plaza)" },
    { value: "arsa", label: "Arsa & Arazi" },
    { value: "projeler", label: "Konut Projeleri / Residence" },
    { value: "turistik", label: "Turistik Tesis & Otel" },
]

export const ISLEM_TIPLERI = [
    { value: "satilik", label: "Satılık" },
    { value: "kiralik", label: "Kiralık" },
    { value: "gunluk_kiralik", label: "Günlük / Sezonluk Kiralık" },
]

export const ODA_SAYILARI = [
    "Stüdyo (1+0)", "1+1", "2+1", "3+1", "4+1", "4+2", "5+1 ve üzeri", "Farketmez",
]

export const ISITMA_TIPLERI = [
    "Kombi (Doğalgaz)", "Yerden Isıtma", "Merkezi Sistem (Pay Ölçer)",
    "Klima", "Isı Pompası", "Isıtma Yok", "Farketmez",
]

export const BULUNDUGU_KATLAR = [
    "Giriş Kat / Bahçe Katı", "Yüksek Giriş", "Ara Kat", "En Üst Kat",
    "Çatı Dubleksi", "Müstakil / Villa Tipi", "Farketmez",
]

export const BINA_YASLARI = [
    "Sıfır Yapı (Yeni)", "1-5 Yıl Arası", "6-10 Yıl Arası",
    "11-15 Yıl Arası", "16-20 Yıl Arası", "21 Yıl ve Üzeri", "Farketmez",
]

export const KABUL_EDILEMEZ_KUSURLAR = [
    "Giriş/Bodrum Kat", "Yüksek Aidat (>5000 ₺)", "Rutubet/Nem Sorunu",
    "Karanlık/Kör Oda", "Kuzey Cephe", "Asansörsüz Yüksek Kat",
    "Deprem Hasar Kaydı", "Krediye Uygun Olmayan", "İskansız Bina",
]

export const TAPU_DURUMLARI = ["Kat Mülkiyeti (İskanlı)", "Kat İrtifakı", "Arsa Tapulu", "Farketmez"]
export const KREDI_UYGUNLUK = ["Krediye Uygun Olsun", "Kredi Önemli Değil (Nakit)"]

export const BEKLEME_OPTIONS = ["Hemen Taşınmaya Hazır", "1-3 Ay İçinde", "3-6 Ay İçinde", "Proje Aşamasında / Farketmez"]

export const DURATION_PRESETS = [
    { label: "3 Gün", hrs: 72 },
    { label: "7 Gün", hrs: 168 },
    { label: "15 Gün", hrs: 360 },
    { label: "30 Gün", hrs: 720 },
]

export const katLabelOf = (kategori) =>
    GAYRIMENKUL_KATEGORILERI.find(k => k.value === kategori)?.label || ""

export const islemLabelOf = (islem) =>
    ISLEM_TIPLERI.find(t => t.value === islem)?.label || ""

// Seçili mahalleleri okunur metne çevir
const mahalleText = (mahalleler) => {
    if (!mahalleler || !mahalleler.length) return ""
    if (mahalleler.length <= 3) return mahalleler.join(", ")
    return `${mahalleler.slice(0, 3).join(", ")} +${mahalleler.length - 3} mahalle`
}

// ── Otomatik başlık ──
// Lokasyon + oda + kategori + işlem tipi
export function buildRealEstateTitle({ condition, kategori, islemTipi, il, ilce, features }) {
    if (!il || !ilce) return ""
    const durumLbl = condition === "sifir" ? "sıfır" : ""
    const islemLbl = islemTipi === "satilik" ? "satılık" : islemTipi === "kiralik" ? "kiralık" : "günlük kiralık"
    const oda = features.oda_sayisi && features.oda_sayisi !== "Farketmez" ? features.oda_sayisi : ""
    const kat = katLabelOf(kategori).split(" ")[0].toLowerCase()
    return [`${ilce}, ${il} bölgesinde`, "acil", durumLbl, islemLbl, oda, kat, "arıyorum"]
        .filter(Boolean).join(" ")
}

// ── Otomatik detaylı açıklama ──
// Formdaki tüm seçili özelliklerin özeti.
export function buildRealEstateDescription({ condition, kategori, islemTipi, il, ilce, mahalleler, features, maxBudget }) {
    if (!il) return ""
    const durumLbl = condition === "sifir" ? "Sıfır proje / 1. el" : "Hazır / 2. el"
    const katLbl = katLabelOf(kategori)
    const islemLbl = islemLabelOf(islemTipi)

    const satirlar = []

    const bolge = [ilce, il].filter(Boolean).join(", ")
    const mahStr = mahalleText(mahalleler)
    satirlar.push(`${bolge} bölgesinde${mahStr ? ` (${mahStr})` : ""} ${durumLbl} ${islemLbl.toLowerCase()} ${katLbl.toLowerCase()} arıyorum.`)

    const yapisal = []
    if (features.oda_sayisi) yapisal.push(`Oda sayısı: ${features.oda_sayisi}`)
    if (features.metrekare) yapisal.push(`Metrekare: ${features.metrekare} m²`)
    if (features.bina_yasi) yapisal.push(`Bina yaşı: ${features.bina_yasi}`)
    if (features.bulundugu_kat) yapisal.push(`Kat: ${features.bulundugu_kat}`)
    if (features.isitma) yapisal.push(`Isıtma: ${features.isitma}`)
    if (yapisal.length) satirlar.push("Yapısal özellikler — " + yapisal.join(", ") + ".")

    if ((features.kabul_edilemez || []).length) {
        satirlar.push(`Kabul edilemez kriterler: ${features.kabul_edilemez.join(", ")}.`)
    }

    if (features.deprem_yonetmeligi) satirlar.push("Yalnızca 2018 deprem yönetmeliğine uygun binalar tercih ediliyor.")

    if (islemTipi === "satilik") {
        const tapuKredi = []
        if (features.tapu_durumu) tapuKredi.push(`tapu: ${features.tapu_durumu}`)
        if (features.kredi_uygunluk) tapuKredi.push(features.kredi_uygunluk.toLowerCase())
        if (tapuKredi.length) satirlar.push("Tapu & kredi — " + tapuKredi.join(", ") + ".")
    }

    if (features.bekleme_suresi) satirlar.push(`Taşınma / teslim beklentisi: ${features.bekleme_suresi}.`)

    // NOT: Maksimum bütçe artık açıklama metnine eklenmiyor — bütçe bilgisi
    // talep detay sayfasında herkese açık şekilde gösterilmiyor.

    return satirlar.join(" ")
}