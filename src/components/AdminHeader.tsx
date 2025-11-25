'use client'

import { useState, useMemo } from 'react';
import { Room, RoomType } from '../types';
import { useApp } from '../contexts/AppContext';
import { useBusinessModel } from '../hooks/useBusinessModel';
import { DollarSign, Home, BedDouble, TrendingUp, Eye, Users, Building2, Layers, ArrowRight, UserCircle, Wallet, CreditCard, Banknote, Crown, UserCheck } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { BusinessModelBadge } from './BusinessModelBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface AdminHeaderProps {
  rooms: Room[];
}

type DialogType = 'revenue' | 'occupied' | 'vacant' | 'occupancy' | 'staff-revenue' | 'admin-revenue' | null;

export function AdminHeader({ rooms }: AdminHeaderProps) {
  const { payments, user, hotel } = useApp();
  const { features } = useBusinessModel();
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);

  const occupiedRooms = rooms.filter(r => r.status === 'occupied' || r.status === 'due-out');
  const vacantCleanRooms = rooms.filter(r => r.status === 'vacant-clean');
  const dirtyRooms = rooms.filter(r => r.status === 'vacant-dirty');
  const maintenanceRooms = rooms.filter(r => r.status === 'out-of-order');
  
  // Get admin email for filtering
  const adminEmail = hotel?.adminEmail || user?.email || '';
  
  // Calculate revenue from actual payments (real revenue that has been collected)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.timestamp);
    paymentDate.setHours(0, 0, 0, 0);
    return paymentDate.getTime() === today.getTime();
  });
  
  // Split payments by Admin and Receptionist
  const adminPayments = todayPayments.filter(p => p.processedBy === adminEmail || p.processedBy.includes('admin'));
  const receptionistPayments = todayPayments.filter(p => p.processedBy !== adminEmail && !p.processedBy.includes('admin'));
  
  const todayRevenue = todayPayments.reduce((sum, payment) => sum + payment.total, 0);
  const adminRevenue = adminPayments.reduce((sum, payment) => sum + payment.total, 0);
  const receptionistRevenue = receptionistPayments.reduce((sum, payment) => sum + payment.total, 0);
  
  // Expected revenue from currently occupied rooms (not yet checked out)
  const expectedRevenue = occupiedRooms.reduce((sum, room) => {
    return sum + (room.guest?.totalAmount || 0);
  }, 0);

  const occupancyRate = ((occupiedRooms.length / rooms.length) * 100).toFixed(1);

  // Room type names
  const roomTypeNames: Record<RoomType, string> = {
    'Single': 'Phòng Đơn',
    'Double': 'Phòng Đôi',
    'Deluxe': 'Phòng Deluxe',
    'Suite': 'Phòng Suite',
    'Family': 'Phòng Gia Đình',
  };

  // Calculate detailed stats
  const detailedStats = useMemo(() => {
    // Revenue breakdown
    const revenueByRoom = occupiedRooms.map(room => ({
      room,
      roomCharge: room.guest?.totalAmount || 0,
      servicesCharge: room.guest?.services?.reduce((sum, s) => sum + (s.price * s.quantity), 0) || 0,
    })).sort((a, b) => b.roomCharge - a.roomCharge);

    const totalRoomCharge = revenueByRoom.reduce((sum, item) => sum + item.roomCharge, 0);
    const totalServicesCharge = revenueByRoom.reduce((sum, item) => sum + item.servicesCharge, 0);

    // Floor breakdown
    const floorStats = new Map<number, {
      floor: number;
      total: number;
      occupied: number;
      clean: number;
      dirty: number;
      maintenance: number;
      occupancyRate: number;
    }>();

    rooms.forEach(room => {
      if (!floorStats.has(room.floor)) {
        floorStats.set(room.floor, {
          floor: room.floor,
          total: 0,
          occupied: 0,
          clean: 0,
          dirty: 0,
          maintenance: 0,
          occupancyRate: 0,
        });
      }
      const stat = floorStats.get(room.floor)!;
      stat.total++;
      if (room.status === 'occupied' || room.status === 'due-out') stat.occupied++;
      if (room.status === 'vacant-clean') stat.clean++;
      if (room.status === 'vacant-dirty') stat.dirty++;
      if (room.status === 'out-of-order') stat.maintenance++;
    });

    floorStats.forEach(stat => {
      stat.occupancyRate = stat.total > 0 ? Math.round((stat.occupied / stat.total) * 100) : 0;
    });

    // Room type breakdown
    const typeStats = new Map<RoomType, {
      type: RoomType;
      total: number;
      occupied: number;
      clean: number;
      dirty: number;
      maintenance: number;
      occupancyRate: number;
    }>();

    const roomTypes: RoomType[] = ['Single', 'Double', 'Deluxe', 'Suite', 'Family'];
    roomTypes.forEach(type => {
      typeStats.set(type, {
        type,
        total: 0,
        occupied: 0,
        clean: 0,
        dirty: 0,
        maintenance: 0,
        occupancyRate: 0,
      });
    });

    rooms.forEach(room => {
      const stat = typeStats.get(room.type)!;
      stat.total++;
      if (room.status === 'occupied' || room.status === 'due-out') stat.occupied++;
      if (room.status === 'vacant-clean') stat.clean++;
      if (room.status === 'vacant-dirty') stat.dirty++;
      if (room.status === 'out-of-order') stat.maintenance++;
    });

    typeStats.forEach(stat => {
      stat.occupancyRate = stat.total > 0 ? Math.round((stat.occupied / stat.total) * 100) : 0;
    });

    return {
      revenueByRoom,
      totalRoomCharge,
      totalServicesCharge,
      floorStats: Array.from(floorStats.values()).sort((a, b) => a.floor - b.floor),
      typeStats: Array.from(typeStats.values()).filter(s => s.total > 0),
    };
  }, [rooms, occupiedRooms]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Calculate staff revenue stats (only receptionists, excluding admin)
  const staffRevenueStats = useMemo(() => {
    const staffMap = new Map<string, {
      name: string;
      totalRevenue: number;
      cashRevenue: number;
      transferRevenue: number;
      transactions: number;
      rooms: Room[];
    }>();

    occupiedRooms.forEach(room => {
      const staffName = room.guest?.checkedInBy || 'Unknown';
      // Filter out admin
      if (staffName === adminEmail || staffName.toLowerCase().includes('admin')) {
        return;
      }
      
      if (!staffMap.has(staffName)) {
        staffMap.set(staffName, {
          name: staffName,
          totalRevenue: 0,
          cashRevenue: 0,
          transferRevenue: 0,
          transactions: 0,
          rooms: [],
        });
      }
      const stat = staffMap.get(staffName)!;
      stat.totalRevenue += room.guest?.totalAmount || 0;
      stat.transactions++;
      stat.rooms.push(room);
      // Note: For cash/transfer breakdown, we'd need payment method tracking
      // For now, we'll show this in payment records
    });

    return Array.from(staffMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [occupiedRooms, adminEmail]);

  return (
    <>
      <div className={`grid gap-2 ${features.staffManagement ? 'grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 lg:grid-cols-5'}`}>
        {/* Total Revenue Card */}
        <Card 
          className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
          onClick={() => setActiveDialog('revenue')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-emerald-700 mb-0.5 truncate">DT Tổng</p>
              <p className="text-sm text-emerald-900 truncate">₫{todayRevenue.toLocaleString()}</p>
              <p className="text-[9px] text-emerald-600 mt-0.5 truncate">{todayPayments.length} GD</p>
            </div>
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center ml-1.5 flex-shrink-0">
              <DollarSign className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </Card>

        {/* Admin Revenue Card */}
        <Card 
          className="p-2.5 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
          onClick={() => setActiveDialog('admin-revenue')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-amber-700 mb-0.5 truncate">DT Admin</p>
              <p className="text-sm text-amber-900 truncate">₫{adminRevenue.toLocaleString()}</p>
              <p className="text-[9px] text-amber-600 mt-0.5 truncate">{adminPayments.length} GD</p>
            </div>
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center ml-1.5 flex-shrink-0">
              <Crown className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </Card>

        {/* Receptionist Revenue Card - Only for hotels with staff */}
        {features.staffManagement && (
          <Card 
            className="p-2.5 bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => setActiveDialog('staff-revenue')}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-cyan-700 mb-0.5 truncate">DT Lễ tân</p>
                <p className="text-sm text-cyan-900 truncate">₫{receptionistRevenue.toLocaleString()}</p>
                <p className="text-[9px] text-cyan-600 mt-0.5 truncate">{receptionistPayments.length} GD</p>
              </div>
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center ml-1.5 flex-shrink-0">
                <UserCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </Card>
        )}

        {/* Occupied Rooms Card */}
        <Card 
          className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
          onClick={() => setActiveDialog('occupied')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-blue-700 mb-0.5 truncate">Có khách</p>
              <p className="text-sm text-blue-900 truncate">{occupiedRooms.length}/{rooms.length}</p>
            </div>
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center ml-1.5 flex-shrink-0">
              <Home className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </Card>

        {/* Vacant Clean Card */}
        <Card 
          className="p-2.5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
          onClick={() => setActiveDialog('vacant')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-purple-700 mb-0.5 truncate">Sẵn sàng</p>
              <p className="text-sm text-purple-900 truncate">{vacantCleanRooms.length}</p>
            </div>
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center ml-1.5 flex-shrink-0">
              <BedDouble className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </Card>

        {/* Occupancy Rate Card */}
        <Card 
          className="p-2.5 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
          onClick={() => setActiveDialog('occupancy')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-orange-700 mb-0.5 truncate">Lấp đầy</p>
              <p className="text-sm text-orange-900 truncate">{occupancyRate}%</p>
            </div>
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center ml-1.5 flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Total Revenue Dialog */}
      <Dialog open={activeDialog === 'revenue'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900">Doanh thu Tổng</h3>
                <p className="text-sm text-gray-500">Admin + Lễ tân • Thanh toán hôm nay</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Tổng doanh thu hôm nay: <strong className="text-emerald-600">₫{formatPrice(todayRevenue)}</strong> • 
              Admin: <strong className="text-amber-600">₫{formatPrice(adminRevenue)}</strong> • 
              Lễ tân: <strong className="text-cyan-600">₫{formatPrice(receptionistRevenue)}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 mt-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="p-4 bg-emerald-50 border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  <p className="text-xs text-emerald-700">Tổng đã thu</p>
                </div>
                <p className="text-2xl text-emerald-900">₫{formatPrice(todayRevenue)}</p>
                <p className="text-xs text-emerald-600 mt-1">{todayPayments.length} giao dịch</p>
              </Card>
              <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-amber-700" />
                  <p className="text-xs text-amber-700">DT Admin</p>
                </div>
                <p className="text-2xl text-amber-900">₫{formatPrice(adminRevenue)}</p>
                <p className="text-xs text-amber-600 mt-1">{adminPayments.length} giao dịch</p>
              </Card>
              <Card className="p-4 bg-cyan-50 border-cyan-200">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4 text-cyan-700" />
                  <p className="text-xs text-cyan-700">DT Lễ tân</p>
                </div>
                <p className="text-2xl text-cyan-900">₫{formatPrice(receptionistRevenue)}</p>
                <p className="text-xs text-cyan-600 mt-1">{receptionistPayments.length} giao dịch</p>
              </Card>
            </div>

            <Separator />

            {/* Today's Payments Section */}
            {todayPayments.length > 0 && (
              <>
                <div>
                  <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Thanh toán hôm nay ({todayPayments.length} giao dịch)
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Phòng</TableHead>
                          <TableHead>Khách</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead>PT Thanh toán</TableHead>
                          <TableHead>Lễ tân</TableHead>
                          <TableHead className="text-right">Tổng tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todayPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">{payment.roomNumber}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{payment.guestName}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(payment.checkInDate)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(payment.checkOutDate)}
                            </TableCell>
                            <TableCell className="text-sm">
                              <Badge variant="secondary">
                                {payment.paymentMethod === 'cash' ? 'Tiền mặt' :
                                 payment.paymentMethod === 'bank-transfer' ? 'Chuyển khoản' :
                                 payment.paymentMethod === 'card' ? 'Thẻ' :
                                 payment.paymentMethod === 'momo' ? 'MoMo' :
                                 payment.paymentMethod === 'vnpay' ? 'VNPay' : payment.paymentMethod}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{payment.processedBy}</TableCell>
                            <TableCell className="text-right text-green-700">
                              ₫{formatPrice(payment.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Current Occupied Rooms (Expected Revenue) */}
            {occupiedRooms.length > 0 && (
              <div>
                <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Phòng đang có khách - Doanh thu dự kiến ({occupiedRooms.length} phòng)
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phòng</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Khách</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead className="text-right">Dự kiến</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {occupiedRooms
                        .sort((a, b) => a.number.localeCompare(b.number))
                        .map(room => (
                          <TableRow key={room.id}>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">{room.number}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {roomTypeNames[room.type]}
                            </TableCell>
                            <TableCell className="text-sm">{room.guest?.name || 'N/A'}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {room.guest?.checkInDate ? formatDate(room.guest.checkInDate) : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {room.guest?.checkOutDate ? formatDate(room.guest.checkOutDate) : '-'}
                            </TableCell>
                            <TableCell className="text-right text-blue-700">
                              ₫{formatPrice(room.guest?.totalAmount || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Separator />

            {/* Revenue Breakdown Table */}
            <div>
              <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Chi tiết theo phòng ({occupiedRooms.length} phòng)
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phòng</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Khách</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead className="text-right">Tiền phòng</TableHead>
                      <TableHead className="text-right">Dịch vụ</TableHead>
                      <TableHead className="text-right">Tổng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailedStats.revenueByRoom.map(({ room, roomCharge, servicesCharge }) => (
                      <TableRow key={room.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">{room.number}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {roomTypeNames[room.type]}
                        </TableCell>
                        <TableCell className="text-sm">
                          {room.guest?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {room.guest?.checkInDate ? formatDate(room.guest.checkInDate) : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {room.guest?.checkOutDate ? formatDate(room.guest.checkOutDate) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          ₫{formatPrice(roomCharge - servicesCharge)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {servicesCharge > 0 ? `₫${formatPrice(servicesCharge)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right text-green-700">
                          ₫{formatPrice(roomCharge)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <Card className="p-3 bg-emerald-50 border-emerald-200 mt-4">
            <p className="text-xs text-emerald-900">
              💡 <strong>Ghi chú:</strong> Doanh thu tổng = Doanh thu Admin + Doanh thu Lễ tân. 
              Dữ liệu được phân chia dựa trên người xử lý thanh toán (processedBy).
            </p>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Admin Revenue Dialog */}
      <Dialog open={activeDialog === 'admin-revenue'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-md">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900">Doanh thu Admin</h3>
                <p className="text-sm text-gray-500">Giao dịch do Admin xử lý</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Doanh thu Admin hôm nay: <strong className="text-amber-600">₫{formatPrice(adminRevenue)}</strong> • 
              {adminPayments.length} giao dịch
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 mt-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-amber-700" />
                  <p className="text-xs text-amber-700">DT Admin</p>
                </div>
                <p className="text-2xl text-amber-900">₫{formatPrice(adminRevenue)}</p>
                <p className="text-xs text-amber-600 mt-1">{adminPayments.length} giao dịch</p>
              </Card>
              <Card className="p-4 bg-emerald-50 border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  <p className="text-xs text-emerald-700">% Tổng DT</p>
                </div>
                <p className="text-2xl text-emerald-900">
                  {todayRevenue > 0 ? ((adminRevenue / todayRevenue) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  của ₫{formatPrice(todayRevenue)}
                </p>
              </Card>
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-blue-700" />
                  <p className="text-xs text-blue-700">TB / Giao dịch</p>
                </div>
                <p className="text-2xl text-blue-900">
                  ₫{formatPrice(adminPayments.length > 0 ? adminRevenue / adminPayments.length : 0)}
                </p>
                <p className="text-xs text-blue-600 mt-1">Trung bình</p>
              </Card>
            </div>

            <Separator />

            {/* Admin Payments */}
            {adminPayments.length > 0 ? (
              <div>
                <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Giao dịch của Admin ({adminPayments.length})
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phòng</TableHead>
                        <TableHead>Khách</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>PT Thanh toán</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">{payment.roomNumber}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{payment.guestName}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(payment.checkInDate)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(payment.checkOutDate)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="secondary">
                              {payment.paymentMethod === 'cash' ? 'Tiền mặt' :
                               payment.paymentMethod === 'bank-transfer' ? 'Chuyển khoản' :
                               payment.paymentMethod === 'card' ? 'Thẻ' :
                               payment.paymentMethod === 'momo' ? 'MoMo' :
                               payment.paymentMethod === 'vnpay' ? 'VNPay' : payment.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-amber-700">
                            ₫{formatPrice(payment.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <Card className="p-8 text-center bg-gray-50">
                <Crown className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Chưa có giao dịch nào của Admin hôm nay</p>
                <p className="text-sm text-gray-500 mt-1">
                  Giao dịch sẽ được hiển thị khi Admin xử lý thanh toán
                </p>
              </Card>
            )}
          </div>

          <Card className="p-3 bg-amber-50 border-amber-200 mt-4">
            <p className="text-xs text-amber-900">
              👑 <strong>Admin:</strong> Doanh thu được tính từ các giao dịch thanh toán mà Admin xử lý. 
              Admin có đầy đủ quyền như Lễ tân và có thể thực hiện check-in/check-out.
            </p>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Occupied Rooms Dialog */}
      <Dialog open={activeDialog === 'occupied'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900">Phòng có khách</h3>
                <p className="text-sm text-gray-500">Danh sách phòng đang hoạt động</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              {occupiedRooms.length} phòng có khách / {rooms.length} tổng phòng
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 mt-4">
            {/* Status Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3 bg-red-50 border-red-200">
                <p className="text-xs text-red-700 mb-1">Đang có khách</p>
                <p className="text-xl text-red-900">
                  {rooms.filter(r => r.status === 'occupied').length}
                </p>
              </Card>
              <Card className="p-3 bg-orange-50 border-orange-200">
                <p className="text-xs text-orange-700 mb-1">Sắp trả phòng</p>
                <p className="text-xl text-orange-900">
                  {rooms.filter(r => r.status === 'due-out').length}
                </p>
              </Card>
              <Card className="p-3 bg-gray-50 border-gray-200">
                <p className="text-xs text-gray-700 mb-1">Cần dọn dẹp</p>
                <p className="text-xl text-gray-900">{dirtyRooms.length}</p>
              </Card>
              <Card className="p-3 bg-purple-50 border-purple-200">
                <p className="text-xs text-purple-700 mb-1">Đang bảo trì</p>
                <p className="text-xl text-purple-900">{maintenanceRooms.length}</p>
              </Card>
            </div>

            <Separator />

            {/* Guest List */}
            <div>
              <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Danh sách khách ({occupiedRooms.length} khách)
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phòng</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Tên khách</TableHead>
                      <TableHead>Điện thoại</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {occupiedRooms
                      .sort((a, b) => a.number.localeCompare(b.number))
                      .map(room => (
                        <TableRow key={room.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">{room.number}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {roomTypeNames[room.type]}
                          </TableCell>
                          <TableCell className="text-sm">
                            {room.guest?.name || 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {room.guest?.phone || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {room.guest?.checkInDate ? formatDate(room.guest.checkInDate) : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {room.guest?.checkOutDate ? formatDate(room.guest.checkOutDate) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              room.status === 'occupied' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-orange-100 text-orange-800'
                            }>
                              {room.status === 'occupied' ? 'Có khách' : 'Sắp trả'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-green-700">
                            ₫{formatPrice(room.guest?.totalAmount || 0)}
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
              💡 <strong>Mẹo:</strong> Phòng "Sắp trả" là phòng có khách và đến ngày check-out hôm nay.
            </p>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Vacant Clean Rooms Dialog */}
      <Dialog open={activeDialog === 'vacant'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                <BedDouble className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900">Phòng trống sẵn sàng</h3>
                <p className="text-sm text-gray-500">Phòng sạch có thể check-in ngay</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              {vacantCleanRooms.length} phòng sẵn sàng / {rooms.length} tổng phòng
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 mt-4">
            {/* Summary by Floor */}
            <div>
              <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Phân bố theo tầng
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {detailedStats.floorStats.map(stat => {
                  const cleanOnFloor = vacantCleanRooms.filter(r => r.floor === stat.floor).length;
                  return (
                    <Card key={stat.floor} className="p-3 bg-purple-50 border-purple-200">
                      <p className="text-xs text-purple-700 mb-1">Tầng {stat.floor}</p>
                      <p className="text-xl text-purple-900">{cleanOnFloor}</p>
                      <p className="text-xs text-gray-600">/ {stat.total} phòng</p>
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
                Phân bố theo loại phòng
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {detailedStats.typeStats.map(stat => {
                  const cleanByType = vacantCleanRooms.filter(r => r.type === stat.type).length;
                  return (
                    <Card key={stat.type} className="p-3 bg-green-50 border-green-200">
                      <p className="text-xs text-green-700 mb-1">{roomTypeNames[stat.type]}</p>
                      <p className="text-xl text-green-900">{cleanByType}</p>
                      <p className="text-xs text-gray-600">/ {stat.total} phòng</p>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Available Rooms List */}
            <div>
              <h4 className="text-sm text-gray-700 mb-3">Danh sách phòng sẵn sàng</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {vacantCleanRooms
                  .sort((a, b) => a.number.localeCompare(b.number))
                  .map(room => (
                    <Card 
                      key={room.id} 
                      className="p-2 bg-green-50 border-green-300 text-center hover:bg-green-100 cursor-pointer transition-colors"
                    >
                      <p className="font-mono text-sm text-green-900">{room.number}</p>
                      <p className="text-xs text-green-700">{roomTypeNames[room.type]}</p>
                    </Card>
                  ))}
              </div>
            </div>
          </div>

          <Card className="p-3 bg-purple-50 border-purple-200 mt-4">
            <p className="text-xs text-purple-900">
              ✨ <strong>Sẵn sàng check-in:</strong> Các phòng này đã được dọn dẹp và có thể nhận khách ngay lập tức.
            </p>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Occupancy Rate Dialog */}
      <Dialog open={activeDialog === 'occupancy'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900">Tỷ lệ lấp đầy</h3>
                <p className="text-sm text-gray-500">Phân tích chi tiết theo tầng & loại phòng</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Tỷ lệ lấp đầy trung bình: <strong className="text-orange-600">{occupancyRate}%</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 mt-4">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3 bg-blue-50 border-blue-200">
                <p className="text-xs text-blue-700 mb-1">Tổng phòng</p>
                <p className="text-xl text-blue-900">{rooms.length}</p>
              </Card>
              <Card className="p-3 bg-red-50 border-red-200">
                <p className="text-xs text-red-700 mb-1">Có khách</p>
                <p className="text-xl text-red-900">{occupiedRooms.length}</p>
              </Card>
              <Card className="p-3 bg-green-50 border-green-200">
                <p className="text-xs text-green-700 mb-1">Sẵn sàng</p>
                <p className="text-xl text-green-900">{vacantCleanRooms.length}</p>
              </Card>
              <Card className="p-3 bg-orange-50 border-orange-200">
                <p className="text-xs text-orange-700 mb-1">Tỷ lệ lấp đầy</p>
                <p className="text-xl text-orange-900">{occupancyRate}%</p>
              </Card>
            </div>

            <Separator />

            {/* Occupancy by Floor */}
            <div>
              <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Tỷ lệ lấp đầy theo tầng
              </h4>
              <div className="space-y-3">
                {detailedStats.floorStats.map(stat => (
                  <Card key={stat.floor} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                          <span className="text-sm">{stat.floor}</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">Tầng {stat.floor}</p>
                          <p className="text-xs text-gray-500">
                            {stat.occupied}/{stat.total} phòng • {stat.clean} sẵn sàng
                          </p>
                        </div>
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
                ))}
              </div>
            </div>

            <Separator />

            {/* Occupancy by Room Type */}
            <div>
              <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Tỷ lệ lấp đầy theo loại phòng
              </h4>
              <div className="space-y-3">
                {detailedStats.typeStats.map(stat => (
                  <Card key={stat.type} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm text-gray-900">{roomTypeNames[stat.type]}</p>
                        <p className="text-xs text-gray-500">
                          {stat.occupied}/{stat.total} phòng • {stat.clean} sẵn sàng
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
                ))}
              </div>
            </div>
          </div>

          <Card className="p-3 bg-orange-50 border-orange-200 mt-4">
            <p className="text-xs text-orange-900">
              📊 <strong>Phân tích:</strong> Tỷ lệ lấp đầy được tính dựa trên số phòng có khách / tổng số phòng. 
              Màu đỏ (≥80%), vàng (50-79%), xanh {'(<50%).'}.
            </p>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Staff Revenue Dialog */}
      <Dialog open={activeDialog === 'staff-revenue'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900">Doanh thu Lễ tân</h3>
                <p className="text-sm text-gray-500">Thống kê hiệu suất nhân viên (không bao gồm Admin)</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              {staffRevenueStats.length} lễ tân • Tổng doanh thu: <strong className="text-cyan-600">₫{formatPrice(receptionistRevenue)}</strong> • 
              {receptionistPayments.length} giao dịch
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 mt-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="p-3 bg-cyan-50 border-cyan-200">
                <p className="text-xs text-cyan-700 mb-1">Tổng lễ tân</p>
                <p className="text-xl text-cyan-900">{staffRevenueStats.length}</p>
              </Card>
              <Card className="p-3 bg-emerald-50 border-emerald-200">
                <p className="text-xs text-emerald-700 mb-1">DT Lễ tân</p>
                <p className="text-xl text-emerald-900">₫{formatPrice(receptionistRevenue)}</p>
              </Card>
              <Card className="p-3 bg-blue-50 border-blue-200">
                <p className="text-xs text-blue-700 mb-1">Giao dịch</p>
                <p className="text-xl text-blue-900">{receptionistPayments.length}</p>
              </Card>
            </div>

            <Separator />

            {/* Staff Performance Table */}
            <div>
              <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Hiệu suất từng lễ tân
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lễ tân</TableHead>
                      <TableHead className="text-center">Giao dịch</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                      <TableHead className="text-right">Trung bình/GD</TableHead>
                      <TableHead className="text-right">% Tổng DT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffRevenueStats.map((staff, index) => {
                      const avgPerTransaction = staff.transactions > 0 ? staff.totalRevenue / staff.transactions : 0;
                      const percentOfTotal = receptionistRevenue > 0 ? (staff.totalRevenue / receptionistRevenue) * 100 : 0;
                      
                      return (
                        <TableRow key={staff.name}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shadow-sm ${
                                index === 0 ? 'bg-yellow-500' :
                                index === 1 ? 'bg-gray-400' :
                                index === 2 ? 'bg-orange-600' :
                                'bg-blue-500'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm text-gray-900">{staff.name}</p>
                                {index === 0 && (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                    🏆 Top 1
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{staff.transactions}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-cyan-700">
                            ₫{formatPrice(staff.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-right text-gray-600">
                            ₫{formatPrice(avgPerTransaction)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className={
                              percentOfTotal >= 40 ? 'bg-cyan-500 text-white' :
                              percentOfTotal >= 20 ? 'bg-blue-500 text-white' :
                              'bg-gray-500 text-white'
                            }>
                              {percentOfTotal.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Separator />

            {/* Detailed Room List by Staff */}
            <div>
              <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Chi tiết phòng theo lễ tân
              </h4>
              {staffRevenueStats.map(staff => (
                <Card key={staff.name} className="p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-900">{staff.name}</p>
                      <p className="text-xs text-gray-500">
                        {staff.transactions} phòng • ₫{formatPrice(staff.totalRevenue)}
                      </p>
                    </div>
                    <Progress 
                      value={receptionistRevenue > 0 ? (staff.totalRevenue / receptionistRevenue) * 100 : 0} 
                      className="w-24 h-2" 
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {staff.rooms
                      .sort((a, b) => a.number.localeCompare(b.number))
                      .map(room => (
                        <Card 
                          key={room.id} 
                          className="p-2 bg-cyan-50 border-cyan-300 text-center hover:bg-cyan-100 cursor-pointer transition-colors"
                        >
                          <p className="font-mono text-sm text-cyan-900">{room.number}</p>
                          <p className="text-xs text-cyan-700">₫{formatPrice(room.guest?.totalAmount || 0)}</p>
                        </Card>
                      ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-3 bg-cyan-50 border-cyan-200 mt-4">
            <p className="text-xs text-cyan-900">
              💡 <strong>Ghi chú:</strong> Doanh thu Lễ tân được tính từ các phòng mà lễ tân đã check-in (không bao gồm Admin). 
              Dữ liệu được tracking tự động khi lễ tân thực hiện check-in cho khách.
            </p>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
