import { AppProvider, useApp } from './contexts/AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { BusinessModelSelector } from './components/BusinessModelSelector';
import { LoginScreen } from './components/LoginScreen';
import { LiveGrid } from './components/LiveGrid';
import { BoardingHouseLiveGrid } from './components/BoardingHouseLiveGrid';
import { GuestHouseLiveGrid } from './components/GuestHouseLiveGrid';
import { Toaster } from './components/ui/sonner';

/**
 * Main App - Testing Guest House App
 * 
 * Currently testing: GUEST HOUSE APP 🏠
 * 
 * To test other apps, change the export below:
 * - Hotel: export { default } from './App-Hotel';
 * - Guest House: export { default } from './App-GuestHouse';
 * - Boarding House: export { default } from './App-BoardingHouse';
 */

export { default } from './App-GuestHouse';