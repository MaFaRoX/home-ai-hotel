import { AppProvider, useApp } from './contexts/AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { LoginScreen } from './components/LoginScreen';
import { BoardingHouseLiveGrid } from './components/BoardingHouseLiveGrid';
import { Toaster } from './components/ui/sonner';

/**
 * Boarding House Management App - Nhà trọ
 * 
 * Features:
 * - Monthly rent management
 * - Electricity & water billing (optional)
 * - Deposit tracking
 * - Simple payment collection
 * - Receipt generation
 * - Monthly revenue reports
 * - All-in pricing option (no utilities)
 * - User-friendly for non-tech owners
 */

function BoardingHouseAppContent() {
  const { user } = useApp();

  // Login/Setup
  if (!user) {
    return <LoginScreen />;
  }

  // Main app - Boarding House LiveGrid
  return <BoardingHouseLiveGrid />;
}

export default function BoardingHouseApp() {
  return (
    <AppProvider defaultBusinessModel="boarding-house">
      <LanguageProvider>
        <BoardingHouseAppContent />
        <Toaster position="top-right" richColors />
      </LanguageProvider>
    </AppProvider>
  );
}
