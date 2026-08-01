import { useState, useEffect } from "react"

const BASE = "https://api.turkiyeapi.dev/v1"

// Cache — sayfa yenilenene kadar tekrar istek atmaz
const cache = {}

async function fetchWithCache(url) {
  if (cache[url]) return cache[url]
  const res = await fetch(url)
  const data = await res.json()
  cache[url] = data
  return data
}

export function useTurkiyeLocation() {
  const [provinces, setProvinces]   = useState([])  // İller
  const [districts, setDistricts]   = useState([])  // İlçeler
  const [neighborhoods, setNeigh]   = useState([])  // Mahalleler

  const [selectedProvince, setSelectedProvince]     = useState(null)
  const [selectedDistrict, setSelectedDistrict]     = useState(null)
  const [selectedNeighborhood, setSelectedNeigh]    = useState(null)
  const [selectedNeighborhoods, setSelectedNeighs]  = useState([]) // çoklu seçim (ör. pazaryeri filtresi)

  const [loadingProv, setLoadingProv] = useState(false)
  const [loadingDist, setLoadingDist] = useState(false)
  const [loadingNeigh, setLoadingNeigh] = useState(false)

  // İlleri yükle
  useEffect(() => {
    setLoadingProv(true)
    fetchWithCache(`${BASE}/provinces?limit=100`)
        .then(data => setProvinces(data.data || []))
        .catch(() => setProvinces([]))
        .finally(() => setLoadingProv(false))
  }, [])

  // İl seçilince ilçeleri yükle
  useEffect(() => {
    if (!selectedProvince) { setDistricts([]); setNeigh([]); return }
    setLoadingDist(true)
    setDistricts([]); setNeigh([])
    setSelectedDistrict(null); setSelectedNeigh(null); setSelectedNeighs([])

    fetchWithCache(`${BASE}/provinces/${selectedProvince.id}`)
        .then(data => setDistricts(data.data?.districts || []))
        .catch(() => setDistricts([]))
        .finally(() => setLoadingDist(false))
  }, [selectedProvince])

  // İlçe seçilince mahalleleri yükle
  useEffect(() => {
    if (!selectedDistrict) { setNeigh([]); return }
    setLoadingNeigh(true)
    setNeigh([]); setSelectedNeigh(null); setSelectedNeighs([])

    fetchWithCache(`${BASE}/districts/${selectedDistrict.id}`)
        .then(data => setNeigh(data.data?.neighborhoods || []))
        .catch(() => setNeigh([]))
        .finally(() => setLoadingNeigh(false))
  }, [selectedDistrict])

  // Seçili konum string'i (örn: "Göksun, Kahramanmaraş")
  const locationString = [
    selectedNeighborhood?.name,
    selectedDistrict?.name,
    selectedProvince?.name,
  ].filter(Boolean).join(", ")

  return {
    // Listeler
    provinces,
    districts,
    neighborhoods,

    // Seçili değerler
    selectedProvince,
    selectedDistrict,
    selectedNeighborhood,
    selectedNeighborhoods,

    // Setter'lar
    setSelectedProvince,
    setSelectedDistrict,
    setSelectedNeighborhood: setSelectedNeigh,
    setSelectedNeighborhoods: setSelectedNeighs,

    // Çoklu mahalle seçiminde bir öğeyi ekler/çıkarır
    toggleNeighborhood: (n) => {
      setSelectedNeighs(prev =>
        prev.some(x => x.id === n.id) ? prev.filter(x => x.id !== n.id) : [...prev, n]
      )
    },
    clearNeighborhoods: () => setSelectedNeighs([]),

    // Loading durumları
    loadingProv,
    loadingDist,
    loadingNeigh,

    // Konum string'i
    locationString,

    // Sıfırla
    reset: () => {
      setSelectedProvince(null)
      setSelectedDistrict(null)
      setSelectedNeigh(null)
      setSelectedNeighs([])
    },
  }
}
