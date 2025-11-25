'use client'

import { AppProvider } from '@/contexts/AppContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { LoginScreen } from '@/components/LoginScreen'
import { LiveGrid } from '@/components/LiveGrid'
import { Toaster } from '@/components/ui/sonner'
import { useApp } from '@/contexts/AppContext'

function HotelAppContent() {
  const { user } = useApp()

  if (!user) {
    return <LoginScreen />
  }

  return <LiveGrid />
}

export default function HotelPage() {
  return (
    <AppProvider defaultBusinessModel="hotel">
      <LanguageProvider>
        <HotelAppContent />
        <Toaster position="top-right" richColors />
      </LanguageProvider>
    </AppProvider>
  )
}

