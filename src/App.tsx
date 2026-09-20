import { Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { CheckPage } from './features/check/CheckPage'
import { CollectionPage } from './features/collection/CollectionPage'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterByIsbnPage } from './features/register/RegisterByIsbnPage'
import { AppLayout } from './layout/AppLayout'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<CollectionPage />} />
          <Route path="eu-tenho" element={<CheckPage />} />
        </Route>
        <Route path="cadastro" element={<RegisterByIsbnPage />} />
      </Route>
    </Routes>
  )
}
