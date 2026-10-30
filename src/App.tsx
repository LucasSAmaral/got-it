import { Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { PrivacyPage } from './features/account/PrivacyPage'
import { AdminEditionsPage } from './features/admin/AdminEditionsPage'
import { ModerationPage } from './features/admin/ModerationPage'
import { StoreArrivalsPage } from './features/admin/StoreArrivalsPage'
import { CheckPage } from './features/check/CheckPage'
import { CollectionPage } from './features/collection/CollectionPage'
import { CopyDetailPage } from './features/copy/CopyDetailPage'
import { LoginPage } from './features/auth/LoginPage'
import { ResetPasswordPage } from './features/auth/ResetPasswordPage'
import { SignUpPage } from './features/auth/SignUpPage'
import { RegisterByIsbnPage } from './features/register/RegisterByIsbnPage'
import { SeriesListPage } from './features/series/SeriesListPage'
import { SeriesPage } from './features/series/SeriesPage'
import { HomePage } from './features/home/HomePage'
import { StorePage } from './features/store/StorePage'
import { AppLayout } from './layout/AppLayout'
import { PublicLayout } from './layout/PublicLayout'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/criar-conta" element={<SignUpPage />} />
      <Route path="/recuperar-senha" element={<ResetPasswordPage />} />
      {/* Públicas: quem chega pelo link da loja ou conhecendo o app pode não ter conta; a privacidade se lê antes de criar. */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="loja/:slug" element={<StorePage />} />
        <Route path="privacidade" element={<PrivacyPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="colecao" element={<CollectionPage />} />
          <Route path="eu-tenho" element={<CheckPage />} />
          <Route path="exemplar/:copyId" element={<CopyDetailPage />} />
          <Route path="series" element={<SeriesListPage />} />
          <Route path="serie/:workId" element={<SeriesPage />} />
          <Route path="admin" element={<AdminEditionsPage />} />
          <Route path="admin/chegadas" element={<StoreArrivalsPage />} />
          <Route path="admin/revisao" element={<ModerationPage />} />
        </Route>
        <Route path="cadastro" element={<RegisterByIsbnPage />} />
      </Route>
    </Routes>
  )
}
