import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ModGallery from './pages/Mods/ModGallery.jsx'
import ModDetail from './pages/Mods/ModDetail.jsx'
import Store from './pages/Store/Store.jsx'
import ProductDetail from './pages/Store/ProductDetail.jsx'
import QuoteForm from './pages/Quotes/QuoteForm.jsx'
import QuoteList from './pages/Admin/Quotes/QuoteList.jsx'
import QuoteDetail from './pages/Admin/Quotes/QuoteDetail.jsx'
import ModSubmissionForm from './pages/ModSubmissions/ModSubmissionForm.jsx'
import ModSubmissionList from './pages/Admin/ModSubmissions/ModSubmissionList.jsx'
import ModSubmissionDetail from './pages/Admin/ModSubmissions/ModSubmissionDetail.jsx'

// Admin Paneli Sayfaları & Rota Yapılandırması
import { ADMIN_BASE_PATH, ADMIN_LOGIN_PATH } from './config/routes.js'
import AdminLayout from './pages/Admin/AdminLayout.jsx'
import Login from './pages/Admin/Login/Login.jsx'
import Dashboard from './pages/Admin/Dashboard/Dashboard.jsx'
import ContentList from './pages/Admin/Contents/ContentList.jsx'
import ContentForm from './pages/Admin/Contents/ContentForm.jsx'
import CategoryManager from './pages/Admin/Categories/CategoryManager.jsx'
import SettingsManager from './pages/Admin/Settings/SettingsManager.jsx'
import ReviewList from './pages/Admin/Reviews/ReviewList.jsx'
import AdminGuideList from './pages/Admin/Guides/AdminGuideList.jsx'
import AdminGuideForm from './pages/Admin/Guides/AdminGuideForm.jsx'

import { AuthProvider } from './context/AuthContext.jsx'
import AuthModal from './components/AuthModal.jsx'
import AuthPage from './pages/Auth/AuthPage.jsx'
import GuidesPage from './pages/Guides/GuidesPage.jsx'
import GuideDetail from './pages/Guides/GuideDetail.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthModal />
        <Routes>
          {/* Herkese Açık Sayfalar */}
          <Route path="/" element={<App />} />
          <Route path="/teklif-al" element={<QuoteForm />} />
          <Route path="/mod-yayinla" element={<ModSubmissionForm />} />
          <Route path="/mod-gonder" element={<ModSubmissionForm />} />
          <Route path="/modlar" element={<ModGallery />} />
          <Route path="/modlar/:slug" element={<ModDetail />} />
          <Route path="/magaza" element={<Store />} />
          <Route path="/magaza/:slug" element={<ProductDetail />} />
          <Route path="/rehberler" element={<GuidesPage />} />
          <Route path="/rehberler/:slug" element={<GuideDetail />} />
          <Route path="/giris" element={<AuthPage initialMode="login" />} />
          <Route path="/kayit-ol" element={<AuthPage initialMode="register" />} />

          {/* Eski /admin Yolunu Tamamen Gizle ve Anasayfaya Yönlendir */}
          <Route path="/admin" element={<Navigate to="/" replace />} />
          <Route path="/admin/*" element={<Navigate to="/" replace />} />

          {/* Yeni Gizli Admin Paneli */}
          <Route path={ADMIN_LOGIN_PATH} element={<Login />} />
          <Route path={ADMIN_BASE_PATH} element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="icerikler" element={<ContentList />} />
            <Route path="icerikler/yeni" element={<ContentForm />} />
            <Route path="icerikler/:id/duzenle" element={<ContentForm />} />
            <Route path="rehberler" element={<AdminGuideList />} />
            <Route path="rehberler/yeni" element={<AdminGuideForm />} />
            <Route path="rehberler/:id/duzenle" element={<AdminGuideForm />} />
            <Route path="yorumlar" element={<ReviewList />} />
            <Route path="kategoriler" element={<CategoryManager />} />
            <Route path="ayarlar" element={<SettingsManager />} />
            <Route path="talepler" element={<QuoteList />} />
            <Route path="talepler/:id" element={<QuoteDetail />} />
            <Route path="mod-basvurulari" element={<ModSubmissionList />} />
            <Route path="mod-basvurulari/:id" element={<ModSubmissionDetail />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
