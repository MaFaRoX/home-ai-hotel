'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  vi: {
    // Header
    'header.admin': 'Quản trị viên',
    'header.receptionist': 'Lễ tân',
    'header.housekeeping': 'Buồng phòng',
    'header.logout': 'Đăng xuất',
    'header.search': 'Tìm kiếm',
    'header.language': 'Ngôn ngữ',
    'header.roomConfig': 'Cấu hình Phòng',
    
    // Room Status
    'status.vacant-clean': 'Trống - Sạch',
    'status.occupied': 'Có khách',
    'status.vacant-dirty': 'Trống - Bẩn',
    'status.due-out': 'Sắp trả',
    'status.out-of-order': 'Bảo trì',
    
    // Actions
    'action.checkin': 'Check-in',
    'action.checkout': 'Check-out',
    'action.payment': 'Thanh toán & Check-out',
    'action.clean': 'Dọn phòng',
    'action.cancel': 'Hủy',
    'action.confirm': 'Xác nhận',
    'action.back': 'Quay lại',
    'action.close': 'Đóng',
    
    // Search
    'search.title': 'Tìm kiếm phòng',
    'search.placeholder': 'Nhập số phòng, tên khách, số điện thoại...',
    'search.noResults': 'Không tìm thấy kết quả',
    'search.results': 'Kết quả tìm kiếm',
    
    // Common
    'common.room': 'Phòng',
    'common.guest': 'Khách',
    'common.phone': 'Số điện thoại',
    'common.floor': 'Tầng',
    'common.price': 'Giá',
    'common.total': 'Tổng cộng',
  },
  en: {
    // Header
    'header.admin': 'Administrator',
    'header.receptionist': 'Receptionist',
    'header.housekeeping': 'Housekeeping',
    'header.logout': 'Logout',
    'header.search': 'Search',
    'header.language': 'Language',
    'header.roomConfig': 'Room Configuration',
    
    // Room Status
    'status.vacant-clean': 'Vacant - Clean',
    'status.occupied': 'Occupied',
    'status.vacant-dirty': 'Vacant - Dirty',
    'status.due-out': 'Due Out',
    'status.out-of-order': 'Out of Order',
    
    // Actions
    'action.checkin': 'Check-in',
    'action.checkout': 'Check-out',
    'action.payment': 'Payment & Check-out',
    'action.clean': 'Clean Room',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.back': 'Back',
    'action.close': 'Close',
    
    // Search
    'search.title': 'Search Rooms',
    'search.placeholder': 'Enter room number, guest name, phone...',
    'search.noResults': 'No results found',
    'search.results': 'Search Results',
    
    // Common
    'common.room': 'Room',
    'common.guest': 'Guest',
    'common.phone': 'Phone',
    'common.floor': 'Floor',
    'common.price': 'Price',
    'common.total': 'Total',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi');

  useEffect(() => {
    const savedLang = localStorage.getItem('hotel-app-language') as Language;
    if (savedLang && (savedLang === 'vi' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('hotel-app-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.vi] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
