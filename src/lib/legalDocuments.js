import api from "@/lib/axios.js"

// GET /legal-documents auth GEREKTİRMEZ (bkz. backend routes/api.php) —
// kayıt formu kullanıcı henüz yokken de çağırabilsin diye. Tek seferlik
// modül-seviyeli cache: aynı oturumda tekrar tekrar istek atılmaz.
let cache = null
let inFlight = null

export async function fetchLegalDocuments({ force = false } = {}) {
    if (cache && !force) return cache
    if (inFlight) return inFlight

    inFlight = api.get("/legal-documents")
        .then(res => {
            cache = res.data?.data || []
            return cache
        })
        .finally(() => { inFlight = null })

    return inFlight
}

export function getLegalDocument(type) {
    return (cache || []).find(d => d.type === type) || null
}
