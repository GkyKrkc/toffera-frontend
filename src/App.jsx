import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./store/AuthContext.jsx"
import { ToastProvider } from "./components/ui/Toast.jsx"
import HomePage from "./pages/HomePage.jsx"
import VitrinPage from "./pages/VitrinPage.jsx"
import AuthPage from "./pages/AuthPage.jsx"
import DashboardPage from "./pages/DashboardPage.jsx"
import AccountPage from "./pages/AccountPage.jsx"
import SettingsPage from "./pages/SettingsPage.jsx"
import PortfolioRedirect from "./pages/PortfolioRedirect.jsx"
import PortfolioCategoryPage from "./pages/PortfolioCategoryPage.jsx"
import VehicleListPage from "./pages/portfolio/vehicle/VehicleListPage.jsx"
import VehicleFormPage from "./pages/portfolio/vehicle/VehicleFormPage.jsx"
import RealEstateListPage from "./pages/portfolio/realestate/RealEstateListPage.jsx"
import RealEstateFormPage from "./pages/portfolio/realestate/RealEstateFormPage.jsx"
import VehicleDemandPage from "./pages/demands/vehicle/index.jsx"
import RealEstateDemandPage from "./pages/demands/realestate/index.jsx"
import GenericDemandPage from "./pages/demands/GenericDemandPage.jsx"
import MarketPage from "./pages/MarketPage.jsx"
import DemandDetailPage from "./pages/DemandDetailPage.jsx"
import OfferDetailPage from "./pages/OfferDetailPage.jsx"
import PricingPage from "./pages/billing/PricingPage.jsx"
import CheckoutPage from "./pages/billing/CheckoutPage.jsx"
import PaymentResultPage from "./pages/billing/PaymentResultPage.jsx"
import BayilikLoginPage from "./pages/BayilikLoginPage.jsx"
import RequireAuth from "./components/auth/RequireAuth.jsx"
import LegalReconsentGate from "./components/legal/LegalReconsentGate.jsx"

// Aşama 1: HomePage + Login/Register + Dashboard (Panelim) + Account
// (Profilim) + Settings (Ayarlar) + Portföy sistemi + Araç Talep Sihirbazı
// + Gayrimenkul Talep Sihirbazı + Talep Pazaryeri + Talep Detay Sayfası
// tam kurulu. OfferDetailPage (/market/:id/offers/:offerId) sırada.
export default function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <LegalReconsentGate />
                <Routes>
                    {/* ── Herkese açık sayfalar ── */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/vitrin" element={<VitrinPage />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/register" element={<AuthPage />} />
                    <Route path="/market" element={<MarketPage />} />
                    <Route path="/market/:id" element={<DemandDetailPage />} />
                    <Route path="/odeme/basarili" element={<PaymentResultPage status="success" />} />
                    <Route path="/odeme/basarisiz" element={<PaymentResultPage status="fail" />} />
                    <Route path="/bayilik" element={<BayilikLoginPage />} />

                    {/* ── Özel sayfalar — giriş yapılmadan açılmaz ──
                        RequireAuth, AuthContext'in "loading" durumu bitene kadar
                        bekler, sonra isAuthenticated değilse /login'e (dönüş
                        adresini state.from'da taşıyarak) yönlendirir. */}
                    <Route element={<RequireAuth />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/account" element={<AccountPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/notifications" element={<Navigate to="/dashboard?tab=notifications" replace />} />
                        <Route path="/portfolio" element={<PortfolioRedirect />} />
                        <Route path="/portfolio/vehicle" element={<VehicleListPage />} />
                        <Route path="/portfolio/vehicle/add" element={<VehicleFormPage />} />
                        <Route path="/portfolio/vehicle/:id/edit" element={<VehicleFormPage />} />
                        <Route path="/portfolio/realestate" element={<RealEstateListPage />} />
                        <Route path="/portfolio/realestate/add" element={<RealEstateFormPage />} />
                        <Route path="/portfolio/realestate/:id/edit" element={<RealEstateFormPage />} />
                        {/* Genel, kategori parametreli portföy sayfası — /vehicle ve /realestate
                            gibi özel-form'lu sayfalardan SONRA tanımlı olmalı ki onlar önceliği
                            korusun; eşleşmeyen tüm diğer kategori slug'ları buraya düşer. */}
                        <Route path="/portfolio/:categorySlug" element={<PortfolioCategoryPage />} />
                        <Route path="/demands/create/vehicle" element={<VehicleDemandPage />} />
                        <Route path="/demands/create/new-vehicle" element={<VehicleDemandPage />} />
                        <Route path="/demands/create/used-vehicle" element={<VehicleDemandPage />} />
                        <Route path="/demands/create/realestate" element={<RealEstateDemandPage />} />
                        <Route path="/demands/create/new-property" element={<RealEstateDemandPage />} />
                        <Route path="/demands/create/used-property" element={<RealEstateDemandPage />} />
                        {/* Genel, kategori parametreli talep sayfası — vehicle/realestate gibi
                            özel-form'lu sayfalardan SONRA tanımlı olmalı ki onlar önceliği
                            korusun; form_component'i boş (jenerik) olan tüm yaprak kategoriler
                            (ör. Elektronik > Cep Telefonu) buraya düşer, form_schema'ya göre
                            dinamik alanlar render edilir. */}
                        <Route path="/demands/create/:categorySlug" element={<GenericDemandPage />} />
                        <Route path="/market/:demandId/offers/:offerId" element={<OfferDetailPage />} />
                        <Route path="/abonelik" element={<PricingPage />} />
                        <Route path="/odeme/checkout" element={<CheckoutPage />} />
                    </Route>
                </Routes>
            </ToastProvider>
        </AuthProvider>
    )
}