import { AppProvider, useApp } from './contexts/AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { LoginScreen } from './components/LoginScreen';
import { LiveGrid } from './components/LiveGrid';
import { Toaster } from './components/ui/sonner';

/**
 * Hotel Management App - Khách sạn có lễ tân
 * 
 * Features:
 * - Real-time room grid with color-coded status
 * - Check-in/Check-out management
 * - Incidental charges (minibar, room service)
 * - Payment with QR code
 * - Detailed reports & analytics
 * - Multi-user roles (Admin/Receptionist/Housekeeping)
 * - Bank account management
 */

function HotelAppContent() {
  const { user } = useApp();

  // Login/Setup
  if (!user) {
    return <LoginScreen />;
  }

  // Main app - Hotel LiveGrid
  return <LiveGrid />;
}

export default function HotelApp() {
  return (
    <AppProvider defaultBusinessModel="hotel">
      <LanguageProvider>
        <HotelAppContent />
        <Toaster position="top-right" richColors />
      </LanguageProvider>
    </AppProvider>
  );
}
