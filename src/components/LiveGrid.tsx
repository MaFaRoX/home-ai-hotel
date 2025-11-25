'use client'

import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBusinessModel } from '../hooks/useBusinessModel';
import { RoomCard } from './RoomCard';
import { RoomDialog } from './RoomDialog';
import { AdminHeader } from './AdminHeader';
import { AppMenu } from './AppMenu';
import { SearchDialog } from './SearchDialog';
import { RoomConfigDialog } from './RoomConfigDialog';
import { ReportsManagement } from './ReportsManagement';
import { BusinessModelBadge } from './BusinessModelBadge';
import { BackToModelSelectorButton } from './BackToModelSelectorButton';
import { Room, RoomType } from '../types';
import { useCheckoutAlerts } from '../utils/checkoutAlerts';
import { Menu, LogOut, Search, Globe, Settings, TrendingUp, Users, Home, BedDouble, Eye, Building2, Layers, Wallet, CreditCard, Banknote, HelpCircle, MapPin, FileText, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

type ReceptionistDialogType = 'occupied' | 'vacant' | 'occupancy' | 'my-revenue' | null;

export function LiveGrid() {
  const { user, hotel, rooms, payments, logout } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const { features } = useBusinessModel();
  const { alerts, alertCount } = useCheckoutAlerts(rooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [receptionistDialog, setReceptionistDialog] = useState<ReceptionistDialogType>(null);
  const [showReports, setShowReports] = useState(false);
  const [showAdminStats, setShowAdminStats] = useState(true);
  const [showReceptionistStats, setShowReceptionistStats] = useState(true);
  const [showRoomTypes, setShowRoomTypes] = useState(true);
  const [showAdminRoomTypes, setShowAdminRoomTypes] = useState(true);
  const [collapsedBuildings, setCollapsedBuildings] = useState<Set<string>>(new Set());

  // Group rooms by building, then by floor
  const roomsByBuilding = useMemo(() => {
    const grouped: { [buildingId: string]: { [floor: number]: Room[] } } = {};
    
    rooms.forEach(room => {
      const buildingId = room.buildingId || 'default';
      if (!grouped[buildingId]) {
        grouped[buildingId] = {};
      }
      if (!grouped[buildingId][room.floor]) {
        grouped[buildingId][room.floor] = [];
      }
      grouped[buildingId][room.floor].push(room);
    });
    
    return grouped;
  }, [rooms]);

  const toggleBuilding = (buildingId: string) => {
    const newCollapsed = new Set(collapsedBuildings);
    if (newCollapsed.has(buildingId)) {
      newCollapsed.delete(buildingId);
    } else {
      newCollapsed.add(buildingId);
    }
    setCollapsedBuildings(newCollapsed);
  };

  // Legacy support for old data without buildingId
  const roomsByFloor = useMemo(() => {
    const grouped: { [key: number]: Room[] } = {};
    rooms.forEach(room => {
      if (!grouped[room.floor]) {
        grouped[room.floor] = [];
      }
      grouped[room.floor].push(room);
    });
    return grouped;
  }, [rooms]);

  const floors = Object.keys(roomsByFloor).map(Number).sort((a, b) => b - a);

  // Room type names
  const roomTypeNames: Record<RoomType, { vi: string; en: string }> = {
    'Single': { vi: 'Phòng Đơn', en: 'Single' },
    'Double': { vi: 'Phòng Đôi', en: 'Double' },
    'Deluxe': { vi: 'Phòng Deluxe', en: 'Deluxe' },
    'Suite': { vi: 'Phòng Suite', en: 'Suite' },
    'Family': { vi: 'Phòng Gia Đình', en: 'Family' },
  };

  // Calculate stats per room type
  const roomTypeStats = useMemo(() => {
    const stats: Record<RoomType, {
      type: RoomType;
      total: number;
      occupied: number;
      clean: number;
      dirty: number;
      dueOut: number;
      outOfOrder: number;
      occupancyRate: number;
      rooms: Room[];
    }> = {
      'Single': { type: 'Single', total: 0, occupied: 0, clean: 0, dirty: 0, dueOut: 0, outOfOrder: 0, occupancyRate: 0, rooms: [] },
      'Double': { type: 'Double', total: 0, occupied: 0, clean: 0, dirty: 0, dueOut: 0, outOfOrder: 0, occupancyRate: 0, rooms: [] },
      'Deluxe': { type: 'Deluxe', total: 0, occupied: 0, clean: 0, dirty: 0, dueOut: 0, outOfOrder: 0, occupancyRate: 0, rooms: [] },
      'Suite': { type: 'Suite', total: 0, occupied: 0, clean: 0, dirty: 0, dueOut: 0, outOfOrder: 0, occupancyRate: 0, rooms: [] },
      'Family': { type: 'Family', total: 0, occupied: 0, clean: 0, dirty: 0, dueOut: 0, outOfOrder: 0, occupancyRate: 0, rooms: [] },
    };

    rooms.forEach(room => {
      const stat = stats[room.type];
      // Skip if room type is not in the predefined list
      if (!stat) {
        console.warn(`Room ${room.number} has unknown type: ${room.type}`);
        return;
      }
      
      stat.total++;
      stat.rooms.push(room);
      
      if (room.status === 'occupied') stat.occupied++;
      if (room.status === 'vacant-clean') stat.clean++;
      if (room.status === 'vacant-dirty') stat.dirty++;
      if (room.status === 'due-out') stat.dueOut++;
      if (room.status === 'out-of-order') stat.outOfOrder++;
    });

    // Calculate occupancy rates
    Object.values(stats).forEach(stat => {
      stat.occupancyRate = stat.total > 0 ? Math.round((stat.occupied / stat.total) * 100) : 0;
    });

    return stats;
  }, [rooms]);

  // Overall stats for receptionist
  const overallStats = useMemo(() => {
    const occupiedRooms = rooms.filter(r => r.status === 'occupied' || r.status === 'due-out');
    const vacantCleanRooms = rooms.filter(r => r.status === 'vacant-clean');
    const dirtyRooms = rooms.filter(r => r.status === 'vacant-dirty');
    const maintenanceRooms = rooms.filter(r => r.status === 'out-of-order');
    const occupancyRate = rooms.length > 0 ? ((occupiedRooms.length / rooms.length) * 100).toFixed(1) : '0.0';

    return {
      occupiedRooms,
      vacantCleanRooms,
      dirtyRooms,
      maintenanceRooms,
      occupancyRate,
    };
  }, [rooms]);

  // My revenue stats (for receptionist)
  const myRevenueStats = useMemo(() => {
    if (user?.role !== 'receptionist') return null;

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate revenue from actual payments made by this receptionist today
    const myPaymentsToday = payments.filter(payment => {
      const paymentDate = new Date(payment.timestamp);
      paymentDate.setHours(0, 0, 0, 0);
      return (
        paymentDate.getTime() === today.getTime() &&
        payment.processedBy === user.name
      );
    });

    const totalRevenue = myPaymentsToday.reduce((sum, payment) => sum + payment.total, 0);

    // Also get expected revenue from current occupied rooms checked in by this receptionist
    const myCurrentRooms = rooms.filter(r => 
      (r.status === 'occupied' || r.status === 'due-out') && 
      (r.guest?.checkedInBy === user.email || r.guest?.checkedInBy === user.name)
    );
    const expectedRevenue = myCurrentRooms.reduce((sum, room) => sum + (room.guest?.totalAmount || 0), 0);

    return {
      totalRevenue, // Actual revenue collected today
      expectedRevenue, // Expected from current rooms
      transactions: myPaymentsToday.length,
      currentRooms: myCurrentRooms.length,
    };
  }, [rooms, user, payments]);

  // Filter rooms based on user role
  const filteredRooms = useMemo(() => {
    if (user?.role === 'housekeeping') {
      // Housekeeping only sees dirty rooms
      return rooms.filter(r => r.status === 'vacant-dirty');
    }
    return rooms;
  }, [rooms, user?.role]);

  const filteredRoomsByBuilding = useMemo(() => {
    const grouped: { [buildingId: string]: { [floor: number]: Room[] } } = {};
    
    // Helper function to get priority based on status
    const getPriority = (room: Room) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Check if checkout is today or tomorrow (due out soon)
      const checkOut = room.guest?.checkOutDate ? new Date(room.guest.checkOutDate) : null;
      const isDueSoon = checkOut && checkOut <= tomorrow;
      
      if (room.status === 'occupied' && !isDueSoon) return 1; // Đang có khách
      if (room.status === 'occupied' && isDueSoon) return 2; // Sắp trả phòng
      if (room.status === 'due-out') return 2; // Sắp trả phòng
      if (room.status === 'vacant-clean') return 3; // Sẵn sàng
      if (room.status === 'vacant-dirty') return 4; // Cần dọn dẹp
      if (room.status === 'out-of-order') return 5; // Bảo trì
      return 6;
    };
    
    // DEBUG: Log filtered rooms
    console.log('🔍 [LiveGrid] Filtered Rooms:', filteredRooms.length, filteredRooms.map(r => ({
      id: r.id,
      number: r.number,
      buildingId: r.buildingId,
      floor: r.floor,
      status: r.status
    })));
    
    // Group rooms by building and floor
    filteredRooms.forEach(room => {
      const buildingId = room.buildingId || 'default';
      if (!grouped[buildingId]) {
        grouped[buildingId] = {};
      }
      if (!grouped[buildingId][room.floor]) {
        grouped[buildingId][room.floor] = [];
      }
      grouped[buildingId][room.floor].push(room);
    });
    
    // DEBUG: Log grouped data
    console.log('🏢 [LiveGrid] Grouped by Building:', JSON.stringify(
      Object.entries(grouped).map(([buildingId, floors]) => ({
        buildingId,
        floors: Object.entries(floors).map(([floor, rooms]) => ({
          floor,
          roomCount: rooms.length,
          rooms: rooms.map(r => r.number)
        }))
      })),
      null,
      2
    ));
    
    // Sort rooms in each floor by status priority
    Object.keys(grouped).forEach(buildingId => {
      Object.keys(grouped[buildingId]).forEach(floor => {
        grouped[buildingId][parseInt(floor)].sort((a, b) => {
          const priorityA = getPriority(a);
          const priorityB = getPriority(b);
          
          // Sort by priority first, then by room number
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          return a.number.localeCompare(b.number);
        });
      });
    });
    
    return grouped;
  }, [filteredRooms]);

  // Legacy support - also create filteredRoomsByFloor for old dialogs
  const filteredRoomsByFloor = useMemo(() => {
    const grouped: { [key: number]: Room[] } = {};
    
    filteredRooms.forEach(room => {
      if (!grouped[room.floor]) {
        grouped[room.floor] = [];
      }
      grouped[room.floor].push(room);
    });
    
    return grouped;
  }, [filteredRooms]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Row: Menu, Hotel Info, Actions */}
          <div className="flex items-center justify-between mb-3">
            {/* Left: Menu Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(true)}
                className="text-white hover:bg-white/20"
              >
                <Menu className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGuideOpen(true)}
                className="text-white hover:bg-white/20 sm:hidden"
                title={language === 'vi' ? 'Hướng dẫn' : 'Guide'}
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
              <div className="hidden lg:block">
                <p className="text-xs text-white/80">
                  {user?.role === 'admin' && t('header.admin')}
                  {user?.role === 'receptionist' && t('header.receptionist')}
                  {user?.role === 'housekeeping' && t('header.housekeeping')}
                </p>
                <p className="text-sm text-white">{user?.name}</p>
              </div>
            </div>

            {/* Center: Hotel Name & Address */}
            <div className="flex-1 text-center px-2 sm:px-4 min-w-0">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-bold tracking-tight drop-shadow-lg truncate">
                  {hotel?.name || 'Live Grid Hotel'}
                </h1>
                <div className="hidden sm:block">
                  <BusinessModelBadge />
                </div>
              </div>
              {hotel?.address && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-white/90 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-white/90 drop-shadow truncate">
                    {hotel.address}
                  </p>
                </div>
              )}
            </div>
            
            {/* Right: Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 justify-end">
              {/* Back to Model Selector */}
              <BackToModelSelectorButton />

              {/* Guide Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGuideOpen(true)}
                className="text-white hover:bg-white/20 hidden sm:flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{language === 'vi' ? 'Hướng dẫn' : 'Guide'}</span>
              </Button>

              {/* Alerts Button (Admin & Receptionist only) */}
              {(user?.role === 'admin' || user?.role === 'receptionist') && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAlertsOpen(true)}
                  title={language === 'vi' ? 'Phòng sắp trả' : 'Checkout Alerts'}
                  className={`text-white hover:bg-white/20 relative ${alertCount > 0 ? 'animate-pulse' : ''}`}
                >
                  <Bell className="w-5 h-5" />
                  {alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg">
                      {alertCount}
                    </span>
                  )}
                </Button>
              )}

              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                title={t('header.search')}
                className="text-white hover:bg-white/20"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Language Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t('header.language')}
                    className="text-white hover:bg-white/20"
                  >
                    <Globe className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setLanguage('vi')}
                    className={language === 'vi' ? 'bg-blue-50' : ''}
                  >
                    <span className="mr-2">🇻🇳</span>
                    Tiếng Việt
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLanguage('en')}
                    className={language === 'en' ? 'bg-blue-50' : ''}
                  >
                    <span className="mr-2">🇬🇧</span>
                    English
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">{t('header.logout')}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Section with White Background */}
        <div className="bg-white border-t border-white/30">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            {/* Admin Stats */}
            {user?.role === 'admin' && (
              <>
                {/* Admin Stats Toggle Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={() => setShowAdminStats(!showAdminStats)}
                    variant={showAdminStats ? "default" : "outline"}
                    size="sm"
                    className="gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    {language === 'vi' ? 'Thống kê tổng quan' : 'Overview Stats'}
                    {showAdminStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Admin Stats - Expandable */}
                {showAdminStats && (
                  <>
                    <AdminHeader rooms={rooms} />
                    
                    {/* Reports Toggle Button */}
                    <div className="flex justify-center">
                      <Button
                        onClick={() => setShowReports(!showReports)}
                        variant={showReports ? "default" : "outline"}
                        className="gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        {language === 'vi' ? 'Báo cáo & Thống kê Chi tiết' : 'Detailed Reports & Analytics'}
                        {showReports ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>

                    {/* Reports Section - Expandable */}
                    {showReports && (
                      <Card className="border-2 border-primary/20 shadow-xl">
                        <ReportsManagement />
                      </Card>
                    )}
                  </>
                )}
              </>
            )}

            {/* Receptionist Stats */}
            {user?.role === 'receptionist' && (
              <>
                {/* Receptionist Stats Toggle Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={() => setShowReceptionistStats(!showReceptionistStats)}
                    variant={showReceptionistStats ? "default" : "outline"}
                    size="sm"
                    className="gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    {language === 'vi' ? 'Thống kê tổng quan' : 'Overview Stats'}
                    {showReceptionistStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Receptionist Stats - Expandable */}
                {showReceptionistStats && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Occupied Rooms Card */}
              <Card 
                className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => setReceptionistDialog('occupied')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 mb-1">
                      {language === 'vi' ? 'Có khách' : 'Occupied'}
                    </p>
                    <p className="text-blue-900">{overallStats.occupiedRooms.length}/{rooms.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                </div>
              </Card>

              {/* Vacant Clean Card */}
              <Card 
                className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => setReceptionistDialog('vacant')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 mb-1">
                      {language === 'vi' ? 'Trống (Sạch)' : 'Vacant (Clean)'}
                    </p>
                    <p className="text-green-900">{overallStats.vacantCleanRooms.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <BedDouble className="w-5 h-5 text-white" />
                  </div>
                </div>
              </Card>

              {/* Occupancy Rate Card */}
              <Card 
                className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => setReceptionistDialog('occupancy')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700 mb-1">
                      {language === 'vi' ? 'Tỷ lệ lấp đầy' : 'Occupancy Rate'}
                    </p>
                    <p className="text-orange-900">{overallStats.occupancyRate}%</p>
                  </div>
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                </div>
              </Card>

              {/* My Revenue Card */}
              <Card 
                className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => setReceptionistDialog('my-revenue')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 mb-1">
                      {language === 'vi' ? 'DT đã thu (hôm nay)' : 'Revenue Collected'}
                    </p>
                    <p className="text-purple-900">
                      ₫{myRevenueStats?.totalRevenue.toLocaleString() || '0'}
                    </p>
                    {myRevenueStats && myRevenueStats.expectedRevenue > 0 && (
                      <p className="text-xs text-purple-600 mt-1">
                        {language === 'vi' ? 'Dự kiến' : 'Expected'}: ₫{myRevenueStats.expectedRevenue.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                </div>
              </Card>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Receptionist Room Types Section */}
      {user?.role === 'receptionist' && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            {/* Room Types Toggle Button */}
            <div className="flex justify-center">
              <Button
                onClick={() => setShowRoomTypes(!showRoomTypes)}
                variant={showRoomTypes ? "default" : "outline"}
                size="sm"
                className="gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Home className="w-4 h-4" />
                {language === 'vi' ? 'Phân loại phòng' : 'Room Types'}
                {showRoomTypes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {/* Room Type Buttons - Expandable */}
            {showRoomTypes && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm text-gray-700">
                    {language === 'vi' ? 'Phân loại & Tỷ lệ lấp đầy' : 'Room Types & Occupancy'}
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(Object.keys(roomTypeStats) as RoomType[]).map((roomType) => {
                  const stat = roomTypeStats[roomType];
                  const occupancyColor = 
                    stat.occupancyRate >= 80 ? 'bg-red-50 border-red-300 hover:bg-red-100' :
                    stat.occupancyRate >= 50 ? 'bg-amber-50 border-amber-300 hover:bg-amber-100' :
                    'bg-green-50 border-green-300 hover:bg-green-100';
                  
                  const occupancyTextColor = 
                    stat.occupancyRate >= 80 ? 'text-red-700' :
                    stat.occupancyRate >= 50 ? 'text-amber-700' :
                    'text-green-700';

                  const occupancyBadgeColor = 
                    stat.occupancyRate >= 80 ? 'bg-red-500' :
                    stat.occupancyRate >= 50 ? 'bg-amber-500' :
                    'bg-green-500';

                  if (stat.total === 0) return null;

                  return (
                    <Card
                      key={roomType}
                      className={`p-3 cursor-pointer transition-all hover:shadow-md border-2 ${occupancyColor}`}
                      onClick={() => setSelectedRoomType(roomType)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600">
                            {roomTypeNames[roomType][language === 'vi' ? 'vi' : 'en']}
                          </p>
                          <Badge 
                            className={`${occupancyBadgeColor} text-white text-xs px-1.5 py-0`}
                          >
                            {stat.occupancyRate}%
                          </Badge>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xl ${occupancyTextColor}`}>
                            {stat.occupied}
                          </span>
                          <span className="text-sm text-gray-500">/ {stat.total}</span>
                        </div>
                        <Progress 
                          value={stat.occupancyRate} 
                          className="h-1.5"
                        />
                      </div>
                    </Card>
                  );
                })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Config Section - Below Header */}
      {user?.role === 'admin' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            {/* Config Button + Room Types Toggle - Same Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <Button
                onClick={() => setConfigOpen(true)}
                variant="default"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
              >
                <Settings className="w-4 h-4 mr-2" />
                {language === 'vi' ? 'Cấu hình Phòng' : 'Room Configuration'}
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">
                  {rooms.length} {language === 'vi' ? 'phòng' : 'rooms'}
                </span>
              </Button>
              
              <Button
                onClick={() => setShowAdminRoomTypes(!showAdminRoomTypes)}
                variant={showAdminRoomTypes ? "default" : "outline"}
                size="sm"
                className="gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Home className="w-4 h-4" />
                {language === 'vi' ? 'Phân loại phòng' : 'Room Types'}
                {showAdminRoomTypes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {/* Room Type Buttons - Expandable */}
            {showAdminRoomTypes && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm text-gray-700">
                    {language === 'vi' ? 'Phân loại & Tỷ lệ lấp đầy' : 'Room Types & Occupancy'}
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {(Object.keys(roomTypeStats) as RoomType[]).map((roomType) => {
                    const stat = roomTypeStats[roomType];
                    const occupancyColor = 
                      stat.occupancyRate >= 80 ? 'bg-red-50 border-red-300 hover:bg-red-100' :
                      stat.occupancyRate >= 50 ? 'bg-amber-50 border-amber-300 hover:bg-amber-100' :
                      'bg-green-50 border-green-300 hover:bg-green-100';
                    
                    const occupancyTextColor = 
                      stat.occupancyRate >= 80 ? 'text-red-700' :
                      stat.occupancyRate >= 50 ? 'text-amber-700' :
                      'text-green-700';

                    const occupancyBadgeColor = 
                      stat.occupancyRate >= 80 ? 'bg-red-500' :
                      stat.occupancyRate >= 50 ? 'bg-amber-500' :
                      'bg-green-500';

                    if (stat.total === 0) return null;

                    return (
                      <Card
                        key={roomType}
                        className={`p-3 cursor-pointer transition-all hover:shadow-md border-2 ${occupancyColor}`}
                        onClick={() => setSelectedRoomType(roomType)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-600">
                              {roomTypeNames[roomType][language === 'vi' ? 'vi' : 'en']}
                            </p>
                            <Badge 
                              className={`${occupancyBadgeColor} text-white text-xs px-1.5 py-0`}
                            >
                              {stat.occupancyRate}%
                            </Badge>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-xl ${occupancyTextColor}`}>
                              {stat.occupied}
                            </span>
                            <span className="text-sm text-gray-500">/ {stat.total}</span>
                          </div>
                          <Progress 
                            value={stat.occupancyRate} 
                            className="h-1.5"
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Room Grid */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {user?.role === 'housekeeping' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900">
              Hiển thị {filteredRooms.length} phòng cần dọn dẹp
            </p>
          </div>
        )}

        <div className="space-y-6">
          {hotel?.buildings && hotel.buildings.length > 0 ? (
            // Group by buildings
            hotel.buildings.sort((a, b) => a.order - b.order).map(building => {
              const buildingRoomsData = filteredRoomsByBuilding[building.id];
              
              // DEBUG: Log building data
              console.log(`🏢 [LiveGrid] Building ${building.name} (ID: ${building.id}):`, {
                hasData: !!buildingRoomsData,
                floors: buildingRoomsData ? Object.keys(buildingRoomsData) : [],
                totalRooms: buildingRoomsData ? Object.values(buildingRoomsData).flat().length : 0
              });
              
              // Show warning if building has no rooms
              if (!buildingRoomsData || Object.keys(buildingRoomsData).length === 0) {
                console.warn(`⚠️ [LiveGrid] Building "${building.name}" (ID: ${building.id}) has no rooms!`);
                console.log(`Available rooms by buildingId:`, 
                  Object.entries(filteredRoomsByBuilding).map(([id, data]) => ({
                    buildingId: id,
                    totalRooms: Object.values(data).flat().length
                  }))
                );
                return null;
              }

              const buildingFloors = Object.keys(buildingRoomsData).map(Number).sort((a, b) => b - a);
              const totalBuildingRooms = buildingFloors.reduce((sum, floor) => sum + buildingRoomsData[floor].length, 0);
              const isCollapsed = collapsedBuildings.has(building.id);

              return (
                <div key={building.id} className="space-y-4">
                  {/* Building Header */}
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-3 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => toggleBuilding(building.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-white" />
                        <div>
                          <h2 className="text-white font-medium">{building.name}</h2>
                          {building.description && (
                            <p className="text-white/80 text-xs">{building.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {totalBuildingRooms} {language === 'vi' ? 'phòng' : 'rooms'}
                        </Badge>
                        {isCollapsed ? (
                          <ChevronDown className="w-5 h-5 text-white" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Building Floors */}
                  {!isCollapsed && (
                    <div className="space-y-4">
                      {buildingFloors.map(floor => {
                        const floorRooms = buildingRoomsData[floor];
                        
                        // DEBUG: Log floor data
                        console.log(`🏢 [LiveGrid] Rendering Building ${building.id} - Floor ${floor}:`, {
                          floorRooms: floorRooms?.length || 0,
                          rooms: floorRooms?.map(r => r.number) || []
                        });
                        
                        if (!floorRooms || floorRooms.length === 0) return null;

                        // Calculate floor stats
                        const occupiedCount = floorRooms.filter(r => r.status === 'occupied' || r.status === 'due-out').length;
                        const vacantCleanCount = floorRooms.filter(r => r.status === 'vacant-clean').length;
                        const vacantDirtyCount = floorRooms.filter(r => r.status === 'vacant-dirty').length;

                        return (
                          <div key={floor} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            {/* Floor Header with Stats */}
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-gray-600" />
                                <h3 className="text-gray-900 font-medium">
                                  {language === 'vi' ? 'Tầng' : 'Floor'} {floor}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {floorRooms.length} {language === 'vi' ? 'phòng' : 'rooms'}
                                </Badge>
                              </div>
                              
                              {/* Mini Stats */}
                              <div className="flex items-center gap-2 text-xs">
                                {occupiedCount > 0 && (
                                  <Badge className="bg-red-100 text-red-700 border-red-200">
                                    {occupiedCount} {language === 'vi' ? 'có khách' : 'occupied'}
                                  </Badge>
                                )}
                                {vacantCleanCount > 0 && (
                                  <Badge className="bg-green-100 text-green-700 border-green-200">
                                    {vacantCleanCount} {language === 'vi' ? 'sạch' : 'clean'}
                                  </Badge>
                                )}
                                {vacantDirtyCount > 0 && (
                                  <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                                    {vacantDirtyCount} {language === 'vi' ? 'cần dọn' : 'dirty'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Room Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5">
                              {floorRooms.map(room => (
                                <RoomCard
                                  key={room.id}
                                  room={room}
                                  onClick={() => setSelectedRoom(room)}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // Fallback: Group by floors only (for old data without buildings)
            floors.map(floor => {
              const floorRooms = filteredRoomsByFloor[floor];
              if (!floorRooms || floorRooms.length === 0) return null;

              // Calculate floor stats
              const occupiedCount = floorRooms.filter(r => r.status === 'occupied' || r.status === 'due-out').length;
              const vacantCleanCount = floorRooms.filter(r => r.status === 'vacant-clean').length;
              const vacantDirtyCount = floorRooms.filter(r => r.status === 'vacant-dirty').length;

              return (
                <div key={floor} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {/* Floor Header with Stats */}
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-gray-600" />
                      <h2 className="text-gray-900 font-medium">
                        {language === 'vi' ? 'Tầng' : 'Floor'} {floor}
                      </h2>
                      <Badge variant="outline" className="text-xs">
                        {floorRooms.length} {language === 'vi' ? 'phòng' : 'rooms'}
                      </Badge>
                    </div>
                    
                    {/* Mini Stats */}
                    <div className="flex items-center gap-2 text-xs">
                      {occupiedCount > 0 && (
                        <Badge className="bg-red-100 text-red-700 border-red-200">
                          {occupiedCount} {language === 'vi' ? 'có khách' : 'occupied'}
                        </Badge>
                      )}
                      {vacantCleanCount > 0 && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          {vacantCleanCount} {language === 'vi' ? 'sạch' : 'clean'}
                        </Badge>
                      )}
                      {vacantDirtyCount > 0 && (
                        <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                          {vacantDirtyCount} {language === 'vi' ? 'cần dọn' : 'dirty'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Room Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5">
                    {floorRooms.map(room => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onClick={() => setSelectedRoom(room)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Room Dialog */}
      {selectedRoom && (
        <RoomDialog
          room={selectedRoom}
          open={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}

      {/* Search Dialog */}
      <SearchDialog
        rooms={rooms}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectRoom={(room) => {
          setSelectedRoom(room);
          setSearchOpen(false);
        }}
      />

      {/* Room Configuration Dialog */}
      <RoomConfigDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
      />

      {/* Room Type Detail Dialog */}
      {selectedRoomType && (
        <Dialog open={!!selectedRoomType} onOpenChange={() => setSelectedRoomType(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md ${
                  roomTypeStats[selectedRoomType].occupancyRate >= 80 ? 'bg-red-500' :
                  roomTypeStats[selectedRoomType].occupancyRate >= 50 ? 'bg-amber-500' :
                  'bg-green-500'
                }`}>
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-gray-900">
                    {roomTypeNames[selectedRoomType][language === 'vi' ? 'vi' : 'en']}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {language === 'vi' ? 'Thông tin chi tiết' : 'Detailed Information'}
                  </p>
                </div>
              </DialogTitle>
              <DialogDescription>
                {language === 'vi' 
                  ? `${roomTypeStats[selectedRoomType].total} phòng • Tỷ lệ lấp đầy ${roomTypeStats[selectedRoomType].occupancyRate}%`
                  : `${roomTypeStats[selectedRoomType].total} rooms ��� ${roomTypeStats[selectedRoomType].occupancyRate}% occupancy`}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 mt-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">
                    {language === 'vi' ? 'Tổng phòng' : 'Total Rooms'}
                  </p>
                  <p className="text-2xl text-blue-900">
                    {roomTypeStats[selectedRoomType].total}
                  </p>
                </Card>

                <Card className="p-3 bg-red-50 border-red-200">
                  <p className="text-xs text-red-700 mb-1">
                    {language === 'vi' ? 'Có khách' : 'Occupied'}
                  </p>
                  <p className="text-2xl text-red-900">
                    {roomTypeStats[selectedRoomType].occupied}
                  </p>
                </Card>

                <Card className="p-3 bg-green-50 border-green-200">
                  <p className="text-xs text-green-700 mb-1">
                    {language === 'vi' ? 'Sẵn sàng' : 'Clean'}
                  </p>
                  <p className="text-2xl text-green-900">
                    {roomTypeStats[selectedRoomType].clean}
                  </p>
                </Card>

                <Card className="p-3 bg-gray-50 border-gray-200">
                  <p className="text-xs text-gray-700 mb-1">
                    {language === 'vi' ? 'Cần dọn' : 'Dirty'}
                  </p>
                  <p className="text-2xl text-gray-900">
                    {roomTypeStats[selectedRoomType].dirty}
                  </p>
                </Card>

                <Card className="p-3 bg-orange-50 border-orange-200">
                  <p className="text-xs text-orange-700 mb-1">
                    {language === 'vi' ? 'Sắp trả' : 'Due Out'}
                  </p>
                  <p className="text-2xl text-orange-900">
                    {roomTypeStats[selectedRoomType].dueOut}
                  </p>
                </Card>

                <Card className="p-3 bg-purple-50 border-purple-200">
                  <p className="text-xs text-purple-700 mb-1">
                    {language === 'vi' ? 'Bảo trì' : 'Maintenance'}
                  </p>
                  <p className="text-2xl text-purple-900">
                    {roomTypeStats[selectedRoomType].outOfOrder}
                  </p>
                </Card>
              </div>

              {/* Occupancy Progress */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">
                      {language === 'vi' ? 'Tỷ lệ lấp đầy' : 'Occupancy Rate'}
                    </span>
                  </div>
                  <span className="text-blue-900">
                    {roomTypeStats[selectedRoomType].occupancyRate}%
                  </span>
                </div>
                <Progress value={roomTypeStats[selectedRoomType].occupancyRate} className="h-3" />
              </Card>

              <Separator />

              {/* Room List */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm text-gray-700">
                    {language === 'vi' ? 'Danh sách phòng' : 'Room List'}
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {roomTypeStats[selectedRoomType].rooms
                    .sort((a, b) => a.number.localeCompare(b.number))
                    .map(room => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onClick={() => {
                          setSelectedRoom(room);
                          setSelectedRoomType(null);
                        }}
                      />
                    ))}
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <Card className="p-3 bg-blue-50 border-blue-200 mt-4">
              <p className="text-xs text-blue-900">
                💡 <strong>{language === 'vi' ? 'Mẹo:' : 'Tip:'}</strong>{' '}
                {language === 'vi'
                  ? 'Click vào thẻ phòng để xem chi tiết và thực hiện các thao tác.'
                  : 'Click on room card to view details and perform actions.'}
              </p>
            </Card>
          </DialogContent>
        </Dialog>
      )}

      {/* Receptionist Dialogs */}
      {user?.role === 'receptionist' && (
        <>
          {/* Occupied Rooms Dialog */}
          <Dialog open={receptionistDialog === 'occupied'} onOpenChange={() => setReceptionistDialog(null)}>
            <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-900">
                      {language === 'vi' ? 'Phòng có khách' : 'Occupied Rooms'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {language === 'vi' ? 'Danh sách phòng đang hoạt động' : 'List of active rooms'}
                    </p>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {overallStats.occupiedRooms.length} {language === 'vi' ? 'phòng có khách' : 'occupied rooms'} / {rooms.length} {language === 'vi' ? 'tổng phòng' : 'total rooms'}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4 mt-4">
                {/* Status Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="p-3 bg-red-50 border-red-200">
                    <p className="text-xs text-red-700 mb-1">
                      {language === 'vi' ? 'Đang có khách' : 'Occupied'}
                    </p>
                    <p className="text-xl text-red-900">
                      {rooms.filter(r => r.status === 'occupied').length}
                    </p>
                  </Card>
                  <Card className="p-3 bg-orange-50 border-orange-200">
                    <p className="text-xs text-orange-700 mb-1">
                      {language === 'vi' ? 'Sắp trả phòng' : 'Due Out'}
                    </p>
                    <p className="text-xl text-orange-900">
                      {rooms.filter(r => r.status === 'due-out').length}
                    </p>
                  </Card>
                  <Card className="p-3 bg-gray-50 border-gray-200">
                    <p className="text-xs text-gray-700 mb-1">
                      {language === 'vi' ? 'Cần dọn dẹp' : 'Dirty'}
                    </p>
                    <p className="text-xl text-gray-900">{overallStats.dirtyRooms.length}</p>
                  </Card>
                  <Card className="p-3 bg-purple-50 border-purple-200">
                    <p className="text-xs text-purple-700 mb-1">
                      {language === 'vi' ? 'Đang bảo trì' : 'Maintenance'}
                    </p>
                    <p className="text-xl text-purple-900">{overallStats.maintenanceRooms.length}</p>
                  </Card>
                </div>

                <Separator />

                {/* Guest List */}
                <div>
                  <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {language === 'vi' ? 'Danh sách khách' : 'Guest List'} ({overallStats.occupiedRooms.length})
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === 'vi' ? 'Phòng' : 'Room'}</TableHead>
                          <TableHead>{language === 'vi' ? 'Loại' : 'Type'}</TableHead>
                          <TableHead>{language === 'vi' ? 'Tên khách' : 'Guest Name'}</TableHead>
                          <TableHead>{language === 'vi' ? 'Điện thoại' : 'Phone'}</TableHead>
                          <TableHead>{language === 'vi' ? 'Check-in' : 'Check-in'}</TableHead>
                          <TableHead>{language === 'vi' ? 'Check-out' : 'Check-out'}</TableHead>
                          <TableHead>{language === 'vi' ? 'Trạng thái' : 'Status'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overallStats.occupiedRooms
                          .sort((a, b) => a.number.localeCompare(b.number))
                          .map(room => (
                            <TableRow key={room.id} className="cursor-pointer hover:bg-gray-50" onClick={() => {
                              setSelectedRoom(room);
                              setReceptionistDialog(null);
                            }}>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">{room.number}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {roomTypeNames[room.type][language === 'vi' ? 'vi' : 'en']}
                              </TableCell>
                              <TableCell className="text-sm">
                                {room.guest?.name || 'N/A'}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {room.guest?.phone || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {room.guest?.checkInDate ? new Date(room.guest.checkInDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {room.guest?.checkOutDate ? new Date(room.guest.checkOutDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  room.status === 'occupied' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }>
                                  {room.status === 'occupied' 
                                    ? (language === 'vi' ? 'Có khách' : 'Occupied')
                                    : (language === 'vi' ? 'Sắp trả' : 'Due Out')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <Card className="p-3 bg-blue-50 border-blue-200 mt-4">
                <p className="text-xs text-blue-900">
                  💡 <strong>{language === 'vi' ? 'Mẹo:' : 'Tip:'}</strong>{' '}
                  {language === 'vi'
                    ? 'Click vào dòng để xem chi tiết phòng và thực hiện các thao tác.'
                    : 'Click on a row to view room details and perform actions.'}
                </p>
              </Card>
            </DialogContent>
          </Dialog>

          {/* Vacant Clean Rooms Dialog */}
          <Dialog open={receptionistDialog === 'vacant'} onOpenChange={() => setReceptionistDialog(null)}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
                    <BedDouble className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-900">
                      {language === 'vi' ? 'Phòng trống sẵn sàng' : 'Available Rooms'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {language === 'vi' ? 'Phòng sạch có thể check-in ngay' : 'Clean rooms ready for check-in'}
                    </p>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {overallStats.vacantCleanRooms.length} {language === 'vi' ? 'phòng sẵn sàng' : 'available rooms'} / {rooms.length} {language === 'vi' ? 'tổng phòng' : 'total rooms'}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4 mt-4">
                {/* Summary by Floor */}
                <div>
                  <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    {language === 'vi' ? 'Phân bố theo tầng' : 'Distribution by Floor'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {floors.map(floor => {
                      const cleanOnFloor = overallStats.vacantCleanRooms.filter(r => r.floor === floor).length;
                      const totalOnFloor = roomsByFloor[floor]?.length || 0;
                      return (
                        <Card key={floor} className="p-3 bg-green-50 border-green-200">
                          <p className="text-xs text-green-700 mb-1">
                            {language === 'vi' ? 'Tầng' : 'Floor'} {floor}
                          </p>
                          <p className="text-xl text-green-900">{cleanOnFloor}</p>
                          <p className="text-xs text-gray-600">/ {totalOnFloor} {language === 'vi' ? 'phòng' : 'rooms'}</p>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Summary by Type */}
                <div>
                  <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {language === 'vi' ? 'Phân bố theo loại phòng' : 'Distribution by Room Type'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(Object.keys(roomTypeStats) as RoomType[])
                      .filter(type => roomTypeStats[type].total > 0)
                      .map(type => {
                        const cleanByType = overallStats.vacantCleanRooms.filter(r => r.type === type).length;
                        return (
                          <Card key={type} className="p-3 bg-blue-50 border-blue-200">
                            <p className="text-xs text-blue-700 mb-1">
                              {roomTypeNames[type][language === 'vi' ? 'vi' : 'en']}
                            </p>
                            <p className="text-xl text-blue-900">{cleanByType}</p>
                            <p className="text-xs text-gray-600">/ {roomTypeStats[type].total} {language === 'vi' ? 'phòng' : 'rooms'}</p>
                          </Card>
                        );
                      })}
                  </div>
                </div>

                <Separator />

                {/* Available Rooms List */}
                <div>
                  <h4 className="text-sm text-gray-700 mb-3">
                    {language === 'vi' ? 'Danh sách phòng sẵn sàng' : 'Available Rooms List'}
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {overallStats.vacantCleanRooms
                      .sort((a, b) => a.number.localeCompare(b.number))
                      .map(room => (
                        <Card 
                          key={room.id} 
                          className="p-2 bg-green-50 border-green-300 text-center hover:bg-green-100 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedRoom(room);
                            setReceptionistDialog(null);
                          }}
                        >
                          <p className="font-mono text-sm text-green-900">{room.number}</p>
                          <p className="text-xs text-green-700">{roomTypeNames[room.type][language === 'vi' ? 'vi' : 'en']}</p>
                        </Card>
                      ))}
                  </div>
                </div>
              </div>

              <Card className="p-3 bg-green-50 border-green-200 mt-4">
                <p className="text-xs text-green-900">
                  ✨ <strong>{language === 'vi' ? 'Sẵn sàng check-in:' : 'Ready for check-in:'}</strong>{' '}
                  {language === 'vi'
                    ? 'Các phòng này đã được dọn dẹp và có thể nhận khách ngay lập tức.'
                    : 'These rooms have been cleaned and are ready for immediate check-in.'}
                </p>
              </Card>
            </DialogContent>
          </Dialog>

          {/* Occupancy Rate Dialog */}
          <Dialog open={receptionistDialog === 'occupancy'} onOpenChange={() => setReceptionistDialog(null)}>
            <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-900">
                      {language === 'vi' ? 'Tỷ lệ lấp đầy' : 'Occupancy Rate'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {language === 'vi' ? 'Phân tích chi tiết theo tầng & loại phòng' : 'Detailed analysis by floor & room type'}
                    </p>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {language === 'vi' ? 'Tỷ lệ lấp đầy trung bình:' : 'Average occupancy rate:'} <strong className="text-orange-600">{overallStats.occupancyRate}%</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4 mt-4">
                {/* Overall Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <p className="text-xs text-blue-700 mb-1">
                      {language === 'vi' ? 'Tổng phòng' : 'Total Rooms'}
                    </p>
                    <p className="text-xl text-blue-900">{rooms.length}</p>
                  </Card>
                  <Card className="p-3 bg-red-50 border-red-200">
                    <p className="text-xs text-red-700 mb-1">
                      {language === 'vi' ? 'Có khách' : 'Occupied'}
                    </p>
                    <p className="text-xl text-red-900">{overallStats.occupiedRooms.length}</p>
                  </Card>
                  <Card className="p-3 bg-green-50 border-green-200">
                    <p className="text-xs text-green-700 mb-1">
                      {language === 'vi' ? 'Sẵn sàng' : 'Available'}
                    </p>
                    <p className="text-xl text-green-900">{overallStats.vacantCleanRooms.length}</p>
                  </Card>
                  <Card className="p-3 bg-orange-50 border-orange-200">
                    <p className="text-xs text-orange-700 mb-1">
                      {language === 'vi' ? 'Tỷ lệ' : 'Rate'}
                    </p>
                    <p className="text-xl text-orange-900">{overallStats.occupancyRate}%</p>
                  </Card>
                </div>

                <Separator />

                {/* Occupancy by Floor */}
                <div>
                  <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    {language === 'vi' ? 'Tỷ lệ lấp đầy theo tầng' : 'Occupancy by Floor'}
                  </h4>
                  <div className="space-y-3">
                    {floors.map(floor => {
                      const floorRooms = roomsByFloor[floor] || [];
                      const occupiedOnFloor = floorRooms.filter(r => r.status === 'occupied' || r.status === 'due-out').length;
                      const cleanOnFloor = floorRooms.filter(r => r.status === 'vacant-clean').length;
                      const occupancyRate = floorRooms.length > 0 ? Math.round((occupiedOnFloor / floorRooms.length) * 100) : 0;
                      
                      return (
                        <Card key={floor} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                                <span className="text-sm">{floor}</span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-900">
                                  {language === 'vi' ? 'Tầng' : 'Floor'} {floor}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {occupiedOnFloor}/{floorRooms.length} {language === 'vi' ? 'phòng' : 'rooms'} • {cleanOnFloor} {language === 'vi' ? 'sẵn sàng' : 'available'}
                                </p>
                              </div>
                            </div>
                            <Badge className={
                              occupancyRate >= 80 ? 'bg-red-500 text-white' :
                              occupancyRate >= 50 ? 'bg-amber-500 text-white' :
                              'bg-green-500 text-white'
                            }>
                              {occupancyRate}%
                            </Badge>
                          </div>
                          <Progress value={occupancyRate} className="h-2" />
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Occupancy by Room Type */}
                <div>
                  <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {language === 'vi' ? 'Tỷ lệ lấp đầy theo loại phòng' : 'Occupancy by Room Type'}
                  </h4>
                  <div className="space-y-3">
                    {(Object.keys(roomTypeStats) as RoomType[])
                      .filter(type => roomTypeStats[type].total > 0)
                      .map(type => {
                        const stat = roomTypeStats[type];
                        return (
                          <Card key={type} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-sm text-gray-900">
                                  {roomTypeNames[type][language === 'vi' ? 'vi' : 'en']}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {stat.occupied}/{stat.total} {language === 'vi' ? 'phòng' : 'rooms'} • {stat.clean} {language === 'vi' ? 'sẵn sàng' : 'available'}
                                </p>
                              </div>
                              <Badge className={
                                stat.occupancyRate >= 80 ? 'bg-red-500 text-white' :
                                stat.occupancyRate >= 50 ? 'bg-amber-500 text-white' :
                                'bg-green-500 text-white'
                              }>
                                {stat.occupancyRate}%
                              </Badge>
                            </div>
                            <Progress value={stat.occupancyRate} className="h-2" />
                          </Card>
                        );
                      })}
                  </div>
                </div>
              </div>

              <Card className="p-3 bg-orange-50 border-orange-200 mt-4">
                <p className="text-xs text-orange-900">
                  📊 <strong>{language === 'vi' ? 'Phân tích:' : 'Analysis:'}</strong>{' '}
                  {language === 'vi'
                    ? 'Tỷ lệ lấp đầy được tính dựa trên số phòng có khách / tổng số phòng. Màu đỏ (≥80%), vàng (50-79%), xanh (<50%).'
                    : 'Occupancy rate is calculated based on occupied rooms / total rooms. Red (≥80%), yellow (50-79%), green (<50%).'}
                </p>
              </Card>
            </DialogContent>
          </Dialog>

          {/* My Revenue Dialog */}
          <Dialog open={receptionistDialog === 'my-revenue'} onOpenChange={() => setReceptionistDialog(null)}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-900">
                      {language === 'vi' ? 'Doanh thu của tôi' : 'My Revenue'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {user?.name}
                    </p>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {myRevenueStats?.transactions || 0} {language === 'vi' ? 'giao dịch' : 'transactions'} • 
                  <strong className="text-purple-600 ml-1">
                    ₫{myRevenueStats?.totalRevenue.toLocaleString() || '0'}
                  </strong>
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4 mt-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3 bg-green-50 border-green-200">
                    <p className="text-xs text-green-700 mb-1">
                      {language === 'vi' ? 'Đã thu (hôm nay)' : 'Collected Today'}
                    </p>
                    <p className="text-xl text-green-900">₫{myRevenueStats?.totalRevenue.toLocaleString() || '0'}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {myRevenueStats?.transactions || 0} {language === 'vi' ? 'thanh toán' : 'payments'}
                    </p>
                  </Card>
                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <p className="text-xs text-blue-700 mb-1">
                      {language === 'vi' ? 'Dự kiến (phòng hiện tại)' : 'Expected (Current Rooms)'}
                    </p>
                    <p className="text-xl text-blue-900">₫{myRevenueStats?.expectedRevenue.toLocaleString() || '0'}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {myRevenueStats?.currentRooms || 0} {language === 'vi' ? 'phòng' : 'rooms'}
                    </p>
                  </Card>
                </div>

                <Separator />

                {/* Today's Payments */}
                {myRevenueStats && myRevenueStats.transactions > 0 && (() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const myPaymentsToday = payments.filter(payment => {
                    const paymentDate = new Date(payment.timestamp);
                    paymentDate.setHours(0, 0, 0, 0);
                    return (
                      paymentDate.getTime() === today.getTime() &&
                      payment.processedBy === user?.name
                    );
                  });
                  
                  return myPaymentsToday.length > 0 ? (
                    <>
                      <div>
                        <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          {language === 'vi' ? 'Thanh toán hôm nay' : "Today's Payments"} ({myPaymentsToday.length})
                        </h4>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{language === 'vi' ? 'Phòng' : 'Room'}</TableHead>
                                <TableHead>{language === 'vi' ? 'Khách' : 'Guest'}</TableHead>
                                <TableHead>{language === 'vi' ? 'PT Thanh toán' : 'Payment Method'}</TableHead>
                                <TableHead>{language === 'vi' ? 'Thời gian' : 'Time'}</TableHead>
                                <TableHead className="text-right">{language === 'vi' ? 'Số tiền' : 'Amount'}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {myPaymentsToday.map((payment) => (
                                <TableRow key={payment.id}>
                                  <TableCell>
                                    <Badge variant="outline" className="font-mono">{payment.roomNumber}</Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">{payment.guestName}</TableCell>
                                  <TableCell className="text-sm">
                                    <Badge variant="secondary">
                                      {payment.paymentMethod === 'cash' ? (language === 'vi' ? 'Tiền mặt' : 'Cash') :
                                       payment.paymentMethod === 'bank-transfer' ? (language === 'vi' ? 'Chuyển khoản' : 'Bank Transfer') :
                                       payment.paymentMethod === 'card' ? (language === 'vi' ? 'Thẻ' : 'Card') :
                                       payment.paymentMethod === 'momo' ? 'MoMo' :
                                       payment.paymentMethod === 'vnpay' ? 'VNPay' : payment.paymentMethod}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-gray-600">
                                    {new Date(payment.timestamp).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </TableCell>
                                  <TableCell className="text-right text-green-700">
                                    ₫{payment.total.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      <Separator />
                    </>
                  ) : null;
                })()}

                {/* Current Rooms with Expected Revenue */}
                {myRevenueStats && myRevenueStats.currentRooms > 0 ? (
                  <div>
                    <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {language === 'vi' ? 'Phòng hiện tại - Doanh thu dự kiến' : 'Current Rooms - Expected Revenue'}
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{language === 'vi' ? 'Phòng' : 'Room'}</TableHead>
                            <TableHead>{language === 'vi' ? 'Loại' : 'Type'}</TableHead>
                            <TableHead>{language === 'vi' ? 'Tên khách' : 'Guest Name'}</TableHead>
                            <TableHead>{language === 'vi' ? 'Điện thoại' : 'Phone'}</TableHead>
                            <TableHead>{language === 'vi' ? 'Check-in' : 'Check-in'}</TableHead>
                            <TableHead>{language === 'vi' ? 'Check-out' : 'Check-out'}</TableHead>
                            <TableHead className="text-right">{language === 'vi' ? 'Dự kiến' : 'Expected'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rooms
                            .filter(r => 
                              (r.status === 'occupied' || r.status === 'due-out') && 
                              (r.guest?.checkedInBy === user?.email || r.guest?.checkedInBy === user?.name)
                            )
                            .sort((a, b) => a.number.localeCompare(b.number))
                            .map(room => (
                              <TableRow 
                                key={room.id} 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => {
                                  setSelectedRoom(room);
                                  setReceptionistDialog(null);
                                }}
                              >
                                <TableCell>
                                  <Badge variant="outline" className="font-mono">{room.number}</Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {roomTypeNames[room.type][language === 'vi' ? 'vi' : 'en']}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {room.guest?.name || 'N/A'}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {room.guest?.phone || '-'}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {room.guest?.checkInDate 
                                    ? new Date(room.guest.checkInDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') 
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {room.guest?.checkOutDate 
                                    ? new Date(room.guest.checkOutDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') 
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-right text-blue-700">
                                  ₫{(room.guest?.totalAmount || 0).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Wallet className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-700 mb-1">
                          {language === 'vi' ? 'Chưa có giao dịch nào' : 'No transactions yet'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {language === 'vi' 
                            ? 'Thực hiện check-in cho khách để bắt đầu tracking doanh thu'
                            : 'Perform check-ins to start tracking your revenue'}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {myRevenueStats && myRevenueStats.currentRooms > 0 && (() => {
                  const myCurrentRooms = rooms.filter(r => 
                    (r.status === 'occupied' || r.status === 'due-out') && 
                    (r.guest?.checkedInBy === user?.email || r.guest?.checkedInBy === user?.name)
                  );
                  
                  return (
                    <>
                      <Separator />

                      {/* Room Distribution */}
                      <div>
                        <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {language === 'vi' ? 'Phân bố theo loại phòng' : 'Distribution by Room Type'}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {(Object.keys(roomTypeStats) as RoomType[])
                            .map(type => {
                              const myRoomsOfType = myCurrentRooms.filter(r => r.type === type);
                              const revenue = myRoomsOfType.reduce((sum, r) => sum + (r.guest?.totalAmount || 0), 0);
                              
                              if (myRoomsOfType.length === 0) return null;
                              
                              return (
                                <Card key={type} className="p-3 bg-purple-50 border-purple-200">
                                  <p className="text-xs text-purple-700 mb-1">
                                    {roomTypeNames[type][language === 'vi' ? 'vi' : 'en']}
                                  </p>
                                  <p className="text-lg text-purple-900">{myRoomsOfType.length}</p>
                                  <p className="text-xs text-gray-600">₫{revenue.toLocaleString()}</p>
                                </Card>
                              );
                            })
                            .filter(Boolean)}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <Card className="p-3 bg-purple-50 border-purple-200 mt-4">
                <p className="text-xs text-purple-900">
                  💰 <strong>{language === 'vi' ? 'Lưu ý:' : 'Note:'}</strong>{' '}
                  {language === 'vi'
                    ? 'Doanh thu được tính từ tất cả phòng bạn đã thực hiện check-in. Dữ liệu được cập nhật real-time.'
                    : 'Revenue is calculated from all rooms you checked in. Data is updated in real-time.'}
                </p>
              </Card>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* App Menu */}
      <AppMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Checkout Alerts Dialog */}
      <Dialog open={alertsOpen} onOpenChange={setAlertsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900">
                  {language === 'vi' ? '⏰ Phòng sắp trả' : '⏰ Checkout Alerts'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'vi' ? 'Phòng sẽ trả trong vòng 2 giờ' : 'Rooms checking out within 2 hours'}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription>
              {alertCount === 0 
                ? (language === 'vi' ? 'Không có phòng nào sắp trả' : 'No upcoming checkouts')
                : (language === 'vi' 
                  ? `${alertCount} phòng sẽ trả trong vòng 2 giờ tới` 
                  : `${alertCount} room${alertCount > 1 ? 's' : ''} checking out within 2 hours`)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4">
            {alertCount === 0 ? (
              <Card className="p-8 bg-green-50 border-green-200 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Bell className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg text-green-900 mb-1">
                      {language === 'vi' ? '✅ Tất cả đều ổn' : '✅ All Clear'}
                    </p>
                    <p className="text-sm text-green-700">
                      {language === 'vi' 
                        ? 'Không có phòng nào sắp trả trong 2 giờ tới' 
                        : 'No rooms checking out in the next 2 hours'}
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {alerts
                  .sort((a, b) => a.minutesUntilCheckout - b.minutesUntilCheckout)
                  .map(alert => {
                    const room = rooms.find(r => r.id === alert.roomId);
                    const hours = Math.floor(alert.minutesUntilCheckout / 60);
                    const minutes = alert.minutesUntilCheckout % 60;
                    const timeString = hours > 0 
                      ? `${hours}h ${minutes}p` 
                      : `${minutes} ${language === 'vi' ? 'phút' : 'min'}`;
                    
                    const urgency = alert.minutesUntilCheckout <= 30 
                      ? 'urgent' 
                      : alert.minutesUntilCheckout <= 60 
                      ? 'warning' 
                      : 'normal';

                    return (
                      <Card 
                        key={alert.roomId}
                        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                          urgency === 'urgent' 
                            ? 'bg-red-50 border-red-300 hover:bg-red-100' 
                            : urgency === 'warning'
                            ? 'bg-orange-50 border-orange-300 hover:bg-orange-100'
                            : 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100'
                        }`}
                        onClick={() => {
                          if (room) setSelectedRoom(room);
                          setAlertsOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="font-mono text-base">
                                {alert.roomNumber}
                              </Badge>
                              {urgency === 'urgent' && (
                                <Badge className="bg-red-500 text-white animate-pulse">
                                  {language === 'vi' ? 'KHẨN' : 'URGENT'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-1">
                              <strong>{language === 'vi' ? 'Khách:' : 'Guest:'}</strong> {alert.guestName}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>{language === 'vi' ? 'Check-out:' : 'Check-out:'}</strong>{' '}
                              {new Date(alert.checkoutTime).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className={`text-2xl font-bold ${
                              urgency === 'urgent' 
                                ? 'text-red-700' 
                                : urgency === 'warning'
                                ? 'text-orange-700'
                                : 'text-yellow-700'
                            }`}>
                              {timeString}
                            </p>
                            <p className="text-xs text-gray-600">
                              {language === 'vi' ? 'còn lại' : 'remaining'}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>

          <Card className="p-3 bg-blue-50 border-blue-200 mt-4">
            <p className="text-xs text-blue-900">
              💡 <strong>{language === 'vi' ? 'Mẹo:' : 'Tip:'}</strong>{' '}
              {language === 'vi' 
                ? 'Hệ thống tự động kiểm tra mỗi phút và thông báo khi có phòng sắp trả trong 2 giờ. Click vào thẻ để xem chi tiết phòng.'
                : 'System automatically checks every minute and alerts when rooms are checking out within 2 hours. Click cards to view room details.'}
            </p>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Guide Dialog */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900">
                  {language === 'vi' ? 'Hướng dẫn Sử dụng' : 'User Guide'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'vi' ? 'Live Grid Hotel Management System' : 'Live Grid Hotel Management System'}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Introduction */}
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">
                {language === 'vi' ? '🎯 Triết lý "Một màn hình, Một chạm"' : '🎯 "One Screen, One Tap" Philosophy'}
              </h4>
              <p className="text-sm text-blue-800">
                {language === 'vi' 
                  ? 'Tất cả thao tác chính đều thực hiện trực tiếp trên Live Grid. Tap vào thẻ phòng để check-in, check-out, dọn phòng, hoặc xem thông tin.'
                  : 'All main operations are performed directly on the Live Grid. Tap room cards to check-in, check-out, clean rooms, or view information.'}
              </p>
            </Card>

            {/* Room Status Colors */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                {language === 'vi' ? '🎨 Mã màu Trạng thái Phòng' : '🎨 Room Status Colors'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <p className="font-semibold text-green-900">
                      {language === 'vi' ? 'Xanh lá' : 'Green'}
                    </p>
                  </div>
                  <p className="text-sm text-green-800">
                    {language === 'vi' ? 'Phòng trống, đã dọn sạch, sẵn sàng check-in' : 'Vacant, clean, ready for check-in'}
                  </p>
                </Card>

                <Card className="p-3 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <p className="font-semibold text-red-900">
                      {language === 'vi' ? 'Đỏ' : 'Red'}
                    </p>
                  </div>
                  <p className="text-sm text-red-800">
                    {language === 'vi' ? 'Phòng đang có khách, occupied' : 'Room occupied with guests'}
                  </p>
                </Card>

                <Card className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-gray-500 rounded"></div>
                    <p className="font-semibold text-gray-900">
                      {language === 'vi' ? 'Xám' : 'Gray'}
                    </p>
                  </div>
                  <p className="text-sm text-gray-800">
                    {language === 'vi' ? 'Phòng bẩn, cần dọn dẹp' : 'Vacant dirty, needs cleaning'}
                  </p>
                </Card>

                <Card className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <p className="font-semibold text-orange-900">
                      {language === 'vi' ? 'Cam' : 'Orange'}
                    </p>
                  </div>
                  <p className="text-sm text-orange-800">
                    {language === 'vi' ? 'Sắp trả phòng, chuẩn bị check-out' : 'Due out, preparing for check-out'}
                  </p>
                </Card>

                <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <p className="font-semibold text-purple-900">
                      {language === 'vi' ? 'Tím' : 'Purple'}
                    </p>
                  </div>
                  <p className="text-sm text-purple-800">
                    {language === 'vi' ? 'Phòng đang bảo trì, out of order' : 'Out of order, under maintenance'}
                  </p>
                </Card>
              </div>
            </div>

            {/* Role-specific Guide */}
            {user?.role === 'admin' && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  👑 {language === 'vi' ? 'Chức năng Admin' : 'Admin Features'}
                </h4>
                <div className="space-y-2 text-sm">
                  <Card className="p-3 bg-purple-50 border-purple-200">
                    <p className="text-purple-900">
                      <strong>{language === 'vi' ? 'Menu:' : 'Menu:'}</strong>{' '}
                      {language === 'vi' 
                        ? 'Cấu hình khách sạn, Quản lý giá phòng, Thêm nhân viên'
                        : 'Hotel configuration, Room pricing, Add staff'}
                    </p>
                  </Card>
                  <Card className="p-3 bg-green-50 border-green-200">
                    <p className="text-green-900">
                      <strong>{language === 'vi' ? 'Dashboard:' : 'Dashboard:'}</strong>{' '}
                      {language === 'vi' 
                        ? 'Doanh thu, Phòng có khách, Tỷ lệ lấp đầy, Doanh thu theo lễ tân'
                        : 'Revenue, Occupied rooms, Occupancy rate, Staff revenue'}
                    </p>
                  </Card>
                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <p className="text-blue-900">
                      <strong>{language === 'vi' ? 'Quyền:' : 'Permissions:'}</strong>{' '}
                      {language === 'vi' 
                        ? 'Toàn quyền - Check-in/out, Dọn phòng, Xem báo cáo'
                        : 'Full access - Check-in/out, Cleaning, View reports'}
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {user?.role === 'receptionist' && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  👔 {language === 'vi' ? 'Chức năng Lễ tân' : 'Receptionist Features'}
                </h4>
                <div className="space-y-2 text-sm">
                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <p className="text-blue-900">
                      <strong>{language === 'vi' ? 'Nhiệm vụ chính:' : 'Main Tasks:'}</strong>{' '}
                      {language === 'vi' 
                        ? 'Check-in khách, Check-out & thanh toán, Quản lý booking'
                        : 'Guest check-in, Check-out & payment, Booking management'}
                    </p>
                  </Card>
                  <Card className="p-3 bg-purple-50 border-purple-200">
                    <p className="text-purple-900">
                      <strong>{language === 'vi' ? 'Doanh thu:' : 'Revenue:'}</strong>{' '}
                      {language === 'vi' 
                        ? 'Xem doanh thu cá nhân từ các phòng đã check-in'
                        : 'View personal revenue from checked-in rooms'}
                    </p>
                  </Card>
                  <Card className="p-3 bg-green-50 border-green-200">
                    <p className="text-green-900">
                      <strong>{language === 'vi' ? 'Dashboard:' : 'Dashboard:'}</strong>{' '}
                      {language === 'vi' 
                        ? 'Phòng có khách, Trống sạch, Tỷ lệ lấp đầy'
                        : 'Occupied rooms, Vacant clean, Occupancy rate'}
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {user?.role === 'housekeeping' && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  🧹 {language === 'vi' ? 'Chức năng Buồng phòng' : 'Housekeeping Features'}
                </h4>
                <div className="space-y-2 text-sm">
                  <Card className="p-3 bg-orange-50 border-orange-200">
                    <p className="text-orange-900">
                      <strong>{language === 'vi' ? 'Nhiệm vụ:' : 'Tasks:'}</strong>{' '}
                      {language === 'vi' 
                        ? 'Dọn dẹp phòng bẩn (màu xám), đưa về trạng thái sạch (màu xanh)'
                        : 'Clean dirty rooms (gray), return to clean status (green)'}
                    </p>
                  </Card>
                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <p className="text-blue-900">
                      <strong>{language === 'vi' ? 'Hiển thị:' : 'Display:'}</strong>{' '}
                      {language === 'vi' 
                        ? 'Chỉ hiển thị phòng cần dọn để tập trung công việc'
                        : 'Only shows rooms that need cleaning for focused work'}
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {/* Quick Tips */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                💡 {language === 'vi' ? 'Mẹo nhanh' : 'Quick Tips'}
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <Card className="p-3 bg-yellow-50 border-yellow-200">
                  <p>
                    🔍 <strong>{language === 'vi' ? 'Tìm kiếm:' : 'Search:'}</strong>{' '}
                    {language === 'vi' 
                      ? 'Dùng thanh tìm kiếm để nhanh chóng tìm phòng theo số, tên khách, hoặc điện thoại'
                      : 'Use search bar to quickly find rooms by number, guest name, or phone'}
                  </p>
                </Card>
                <Card className="p-3 bg-cyan-50 border-cyan-200">
                  <p>
                    🌍 <strong>{language === 'vi' ? 'Ngôn ngữ:' : 'Language:'}</strong>{' '}
                    {language === 'vi' 
                      ? 'Chuyển đổi giữa Tiếng Việt và English bất cứ lúc nào'
                      : 'Switch between Vietnamese and English anytime'}
                  </p>
                </Card>
                <Card className="p-3 bg-pink-50 border-pink-200">
                  <p>
                    📱 <strong>{language === 'vi' ? 'Mobile:' : 'Mobile:'}</strong>{' '}
                    {language === 'vi' 
                      ? 'Ứng dụng tối ưu cho cả desktop và mobile, hoạt động tốt trên mọi thiết bị'
                      : 'App optimized for both desktop and mobile, works great on all devices'}
                  </p>
                </Card>
              </div>
            </div>

            {/* Support */}
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
              <p className="text-sm text-indigo-900">
                ❓ <strong>{language === 'vi' ? 'Cần hỗ trợ?' : 'Need help?'}</strong>{' '}
                {language === 'vi' 
                  ? 'Liên hệ quản trị viên hoặc nhấn vào icon "?" trên header để mở lại hướng dẫn này.'
                  : 'Contact administrator or click the "?" icon in the header to reopen this guide.'}
              </p>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
