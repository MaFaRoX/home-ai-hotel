'use client'

import { AppProvider, useApp } from '@/contexts/AppContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { LoginScreen } from '@/components/LoginScreen'
import { BoardingHouseLiveGrid } from '@/components/BoardingHouseLiveGrid'
import { Toaster } from '@/components/ui/sonner'

function BoardingHouseAppContent() {
  const { user } = useApp()

  if (!user) {
    return <LoginScreen />
  }

  return <BoardingHouseLiveGrid />
}

export default function BoardingHousePage() {
  return (
    <AppProvider defaultBusinessModel="boarding-house">
      <LanguageProvider>
        <BoardingHouseAppContent />
        <Toaster position="top-right" richColors />
      </LanguageProvider>
    </AppProvider>
  )
}

