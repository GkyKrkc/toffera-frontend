// src/data/vehicleData.js
// Vasıta form şeması — CreateDemandPage ve VehicleFormPage tarafından kullanılır

export const YAKIT_OPTIONS  = ["Benzin","Dizel","Hibrit","Plug-in Hibrit","Elektrik","LPG"]
export const VITES_OPTIONS  = ["Otomatik","Manuel","Yarı Otomatik (DSG/CVT)"]
export const RENK_OPTIONS   = ["Fark Etmez","Beyaz","Siyah","Gri / Gümüş","Mavi","Kırmızı","Kahverengi / Bej","Yeşil","Sarı","Turuncu","Diğer"]
export const KM_OPTIONS     = ["0-10.000 km","10.000-30.000 km","30.000-60.000 km","60.000-100.000 km","100.000-150.000 km","150.000+ km"]
export const YIL_OPTIONS    = ["2026","2025","2024","2023","2022","2021","2020","2019","2018","2017","2016 ve öncesi"]
export const EKSPERTIZ_OPTIONS = ["Ekspertizli Görmek İstiyorum","Ekspertizsiz de Olur","Fark Etmez"]

// CreateDemandPage için talep kriterleri (alıcı tarafı)
export const VASITA_EXTRA = [
    { key: "yil",       label: "Model Yılı",      options: YIL_OPTIONS       },
    { key: "km",        label: "Maksimum KM",     options: KM_OPTIONS        },
    { key: "yakit",     label: "Yakıt Tipi",      options: YAKIT_OPTIONS     },
    { key: "vites",     label: "Vites Tipi",      options: VITES_OPTIONS     },
    { key: "ekspertiz", label: "Ekspertiz",       options: EKSPERTIZ_OPTIONS },
    { key: "renk",      label: "Renk Tercihi",    options: RENK_OPTIONS      },
]

// VehicleFormPage için portföy alanları (satıcı tarafı)
export const VASITA_PORTFOLIO_FIELDS = [
    { key: "yil",    label: "Model Yılı",  options: YIL_OPTIONS   },
    { key: "km",     label: "KM Durumu",   options: KM_OPTIONS    },
    { key: "yakit",  label: "Yakıt Tipi",  options: YAKIT_OPTIONS },
    { key: "vites",  label: "Vites",       options: VITES_OPTIONS },
    { key: "renk",   label: "Renk",        options: RENK_OPTIONS  },
]