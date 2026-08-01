import Echo from "laravel-echo"
import Pusher from "pusher-js"

window.Pusher = Pusher

// Prod'da Reverb https/443 üzerinden servis ediliyor (bkz. backend .env:
// REVERB_SCHEME=https, REVERB_PORT=443) — bu yüzden şema env'den okunuyor.
// Sabit "ws" + forceTLS:false bırakılsaydı, https sayfa üzerinde tarayıcı
// "mixed content" olarak engeller ve bağlantı hiç kurulamazdı.
const isSecure = (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https"

const echo = new Echo({
    broadcaster:       "reverb",
    key:               import.meta.env.VITE_REVERB_APP_KEY,
    wsHost:            import.meta.env.VITE_REVERB_HOST,
    wsPort:            import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort:           import.meta.env.VITE_REVERB_PORT ?? 8080,
    forceTLS:          isSecure,
    enabledTransports: ['ws', 'wss'],
    authEndpoint:      "/api/broadcasting/auth",
    auth: {
        headers: {
            Authorization: localStorage.getItem("token")
                ? `Bearer ${localStorage.getItem("token")}`
                : "",
            Accept: "application/json",
        },
    },
})

window.Echo = echo

export default echo

export function updateEchoToken(token) {
    try {
        // Her iki lokasyona da set et
        if (echo?.connector?.options?.auth?.headers) {
            echo.connector.options.auth.headers.Authorization = `Bearer ${token}`
        }
        if (echo?.connector?.pusher?.config?.auth?.headers) {
            echo.connector.pusher.config.auth.headers.Authorization = `Bearer ${token}`
        }
    } catch {}
}