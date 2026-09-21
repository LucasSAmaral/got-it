import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'
import './index.css'
import { theme } from './theme.ts'

// O TanStack presume estar online ao iniciar; se o app abrir sem rede, o evento 'online' seguinte
// só é notado se ele já souber que estava offline.
onlineManager.setOnline(navigator.onLine)

// networkMode 'always': sem rede o TanStack pausaria as consultas por padrão, e a busca offline
// (fallback na própria função de busca) nem chegaria a rodar.
const queryClient = new QueryClient({ defaultOptions: { queries: { networkMode: 'always' } } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
