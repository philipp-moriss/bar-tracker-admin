import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './core/i18n'
import { I18nextProvider } from "react-i18next"
import i18n from './core/i18n'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/core/routing/routes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/core/components/ui/tooltip';
import { ThemeProvider } from './core/feauture/theme/theme-provider'
import { Toaster } from '@/core/components/ui/toast/sonner'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1 * 60 * 1000,
            gcTime: 3 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <TooltipProvider>
            <QueryClientProvider client={queryClient}>
                <I18nextProvider i18n={i18n}>
                    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
                        <RouterProvider router={router} />
                        <Toaster />
                    </ThemeProvider>
                </I18nextProvider>
            </QueryClientProvider>
        </TooltipProvider>
    </React.StrictMode>
)
