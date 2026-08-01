// src/data/realEstateData.js
// Gayrimenkul form şeması — CreateDemandPage ve RealEstateFormPage tarafından kullanılır

export const EMLAK_TIPLER = [
    "Daire", "Villa", "Arsa", "İşyeri", "Bağ Evi", "Dükkan", "Depo", "Rezidans"
]

export const EMLAK_FIELDS = {
    "Daire": [
        { key: "oda_sayisi", label: "Oda Sayısı",     options: ["1+1","2+1","3+1","4+1","5+1 ve üzeri"] },
        { key: "metrekare",  label: "Brüt Alan (m²)",  options: ["50-80 m²","80-120 m²","120-160 m²","160-200 m²","200+ m²"] },
        { key: "bina_yasi",  label: "Bina Yaşı",       options: ["Sıfır","1-5 Yıl","6-10 Yıl","11-20 Yıl","20+ Yıl"] },
        { key: "kat",        label: "Bulunduğu Kat",   options: ["Bahçe Katı","Giriş Katı","Ara Kat","En Üst Kat"] },
        { key: "isitma",     label: "Isıtma Tipi",     options: ["Yerden Isıtma","Kombi (Doğalgaz)","Merkezi","Klima"] },
        { key: "banyo",      label: "Banyo Sayısı",    options: ["1","2","3+"] },
    ],
    "Villa": [
        { key: "oda_sayisi", label: "Oda Sayısı",     options: ["3+1","4+1","5+1","6+2 ve üzeri"] },
        { key: "metrekare",  label: "Kullanım Alanı",  options: ["150-250 m²","250-350 m²","350-500 m²","500+ m²"] },
        { key: "bina_yasi",  label: "Bina Yaşı",       options: ["Sıfır","1-5 Yıl","6-10 Yıl","11+ Yıl"] },
        { key: "havuz",      label: "Havuz",           options: ["Müstakil Havuzlu","Ortak Havuzlu","Havuzsuz"] },
    ],
    "Arsa": [
        { key: "metrekare",     label: "Arsa Alanı",   options: ["100-500 m²","500-1000 m²","1000-3000 m²","3000-10000 m²","10000+ m²"] },
        { key: "tapu_durumu",   label: "Tapu Durumu",  options: ["Müstakil Parsel","Hisseli Tapu","İntikalli"] },
        { key: "parsel_durumu", label: "İmar Durumu",  options: ["Konut İmarlı","Ticari İmarlı","Tarla / Bağ","Sanayi İmarlı"] },
        { key: "kaks",          label: "KAKS / Emsal", options: ["0.30","0.50","1.00","1.50","2.00","2.50+"] },
    ],
    "İşyeri": [
        { key: "metrekare", label: "Kullanım Alanı",  options: ["30-80 m²","80-150 m²","150-300 m²","300+ m²"] },
        { key: "isitma",    label: "Isıtma",          options: ["Klima","Kombi","Merkezi","Yok"] },
        { key: "bina_yasi", label: "Bina Yaşı",        options: ["Sıfır","1-5 Yıl","6-10 Yıl","11+ Yıl"] },
        { key: "kullanim",  label: "Kullanım Durumu", options: ["Boş","Kiracılı","Komple Bina"] },
    ],
    "Bağ Evi": [
        { key: "metrekare",  label: "Arazi Alanı",  options: ["500-1500 m²","1500-5000 m²","5000-15000 m²","15000+ m²"] },
        { key: "bina_yasi",  label: "Bina Yaşı",     options: ["Sıfır","1-5 Yıl","5-10 Yıl","10+ Yıl"] },
        { key: "yol_durumu", label: "Yol / Ulaşım", options: ["Asfalt Yolu Var","Kadastro Yolu Var","Yolu Yok"] },
    ],
    "Dükkan": [
        { key: "metrekare", label: "Net Alan",  options: ["30-80 m²","80-150 m²","150-300 m²","300+ m²"] },
        { key: "bina_yasi", label: "Bina Yaşı", options: ["Sıfır","1-5 Yıl","6-10 Yıl","11+ Yıl"] },
        { key: "asma_kat",  label: "Asma Kat",  options: ["Var","Yok"] },
        { key: "kullanim",  label: "Durum",     options: ["Boş","Kiracılı"] },
    ],
    "Depo": [
        { key: "metrekare", label: "Alan (m²)", options: ["50-150 m²","150-500 m²","500-1000 m²","1000+ m²"] },
        { key: "bina_yasi", label: "Bina Yaşı", options: ["Sıfır","1-5 Yıl","6-10 Yıl","11+ Yıl"] },
        { key: "kullanim",  label: "Durum",     options: ["Boş","Kiracılı"] },
    ],
    "Rezidans": [
        { key: "oda_sayisi", label: "Oda Sayısı",     options: ["1+1","2+1","3+1","4+1"] },
        { key: "metrekare",  label: "Alan (m²)",       options: ["50-100 m²","100-150 m²","150-200 m²","200+ m²"] },
        { key: "bina_yasi",  label: "Bina Yaşı",       options: ["Sıfır","1-5 Yıl","6-10 Yıl"] },
        { key: "isitma",     label: "Isıtma",          options: ["Yerden Isıtma","Kombi","Merkezi"] },
    ],
}

// RealEstateFormPage için teknik alanlar (portfolio formunda kullanılır)
export const BINA_OPTIONS  = ["Sıfır","1-5 Yıl","6-10 Yıl","11-20 Yıl","20+ Yıl"]
export const ODA_OPTIONS   = ["1+0","1+1","2+1","3+1","4+1","5+1","6+1 ve üzeri"]
export const M2_OPTIONS    = ["30-60 m²","60-100 m²","100-150 m²","150-200 m²","200-300 m²","300-500 m²","500+ m²"]
export const KAT_OPTIONS   = ["Bahçe Katı","Giriş Katı","1. Kat","2. Kat","3. Kat","4. Kat","5+ Kat","En Üst Kat"]
export const ISITMA_OPTIONS= ["Yerden Isıtma","Kombi (Doğalgaz)","Merkezi","Soba","Klima","Yok"]
export const TAPU_OPTIONS  = ["Müstakil Parsel","Hisseli Tapu","Kat Mülkiyeti","Arsa Tapusu"]
export const IMAR_OPTIONS  = ["Konut İmarlı","Ticari İmarlı","Tarla / Bağ","Sanayi İmarlı","İmarsız"]

export const FIELD_META = {
    oda_sayisi:   { label: "Oda Sayısı",    options: ODA_OPTIONS   },
    metrekare:    { label: "Alan (m²)",      options: M2_OPTIONS    },
    bina_yasi:    { label: "Bina Yaşı",      options: BINA_OPTIONS  },
    kat:          { label: "Kat Bilgisi",    options: KAT_OPTIONS   },
    isitma:       { label: "Isıtma Tipi",   options: ISITMA_OPTIONS },
    tapu_durumu:  { label: "Tapu Durumu",   options: TAPU_OPTIONS  },
    imar_durumu:  { label: "İmar Durumu",   options: IMAR_OPTIONS  },
}

export const FIELD_GROUPS = {
    "Daire":   ["oda_sayisi","metrekare","bina_yasi","kat","isitma"],
    "Villa":   ["oda_sayisi","metrekare","bina_yasi","isitma"],
    "Arsa":    ["metrekare","tapu_durumu","imar_durumu"],
    "İşyeri":  ["metrekare","bina_yasi","kat","isitma"],
    "Bağ Evi": ["metrekare","bina_yasi"],
    "Dükkan":  ["metrekare","bina_yasi","kat"],
    "Depo":    ["metrekare","bina_yasi"],
    "Rezidans":["oda_sayisi","metrekare","bina_yasi","kat","isitma"],
}