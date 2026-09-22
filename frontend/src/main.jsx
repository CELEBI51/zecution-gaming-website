import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ModGallery from './pages/Mods/ModGallery.jsx'
import ModDetail from './pages/Mods/ModDetail.jsx'
import Store from './pages/Store/Store.jsx'
import ProductDetail from './pages/Store/ProductDetail.jsx'
import QuoteForm from './pages/Quotes/QuoteForm.jsx'
import QuoteList from './pages/Admin/Quotes/QuoteList.jsx'
import QuoteDetail from './pages/Admin/Quotes/QuoteDetail.jsx'

// Admin Paneli Sayfaları
import AdminLayout from './pages/Admin/AdminLayout.jsx'
import Login from './pages/Admin/Login/Login.jsx'
import Dashboard from './pages/Admin/Dashboard/Dashboard.jsx'
import ContentList from './pages/Admin/Contents/ContentList.jsx'
import ContentForm from './pages/Admin/Contents/ContentForm.jsx'
import CategoryManager from './pages/Admin/Categories/CategoryManager.jsx'
import SettingsManager from './pages/Admin/Settings/SettingsManager.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Herkese Açık Sayfalar */}
        <Route path="/" element={<App />} />
        <Route path="/teklif-al" element={<QuoteForm />} />
        <Route path="/modlar" element={<ModGallery />} />
        <Route path="/modlar/:slug" element={<ModDetail />} />
        <Route path="/magaza" element={<Store />} />
        <Route path="/magaza/:slug" element={<ProductDetail />} />

        {/* Admin Paneli */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="icerikler" element={<ContentList />} />
          <Route path="icerikler/yeni" element={<ContentForm />} />
          <Route path="icerikler/:id/duzenle" element={<ContentForm />} />
          <Route path="kategoriler" element={<CategoryManager />} />
          <Route path="ayarlar" element={<SettingsManager />} />
          <Route path="talepler" element={<QuoteList />} />
          <Route path="talepler/:id" element={<QuoteDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
