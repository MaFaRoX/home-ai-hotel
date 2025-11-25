'use client'

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Search, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Booking {
  id: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  notes?: string;
}

export function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 1,
      guestName: 'Nguyễn Văn A',
      guestPhone: '0901234567',
      guestEmail: 'nguyenvana@email.com',
      roomNumber: '101',
      checkIn: '2025-11-12',
      checkOut: '2025-11-15',
      totalPrice: 1500000,
      status: 'confirmed',
    },
    {
      id: 2,
      guestName: 'Trần Thị B',
      guestPhone: '0907654321',
      guestEmail: 'tranthib@email.com',
      roomNumber: '205',
      checkIn: '2025-11-13',
      checkOut: '2025-11-14',
      totalPrice: 800000,
      status: 'pending',
    },
    {
      id: 3,
      guestName: 'Lê Văn C',
      guestPhone: '0912345678',
      guestEmail: 'levanc@email.com',
      roomNumber: '302',
      checkIn: '2025-11-12',
      checkOut: '2025-11-18',
      totalPrice: 9000000,
      status: 'checked-in',
    },
    {
      id: 4,
      guestName: 'Phạm Thị D',
      guestPhone: '0908765432',
      guestEmail: 'phamthid@email.com',
      roomNumber: '108',
      checkIn: '2025-11-10',
      checkOut: '2025-11-11',
      totalPrice: 500000,
      status: 'checked-out',
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'checked-in':
        return 'bg-green-100 text-green-700';
      case 'checked-out':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'checked-in':
        return 'Đã nhận phòng';
      case 'checked-out':
        return 'Đã trả phòng';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const handleAddBooking = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success('Đặt phòng mới đã được tạo!');
    setDialogOpen(false);
  };

  const handleCheckIn = (bookingId: number) => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status: 'checked-in' as const } : booking
    ));
    toast.success('Khách đã nhận phòng thành công!');
  };

  const handleCheckOut = (bookingId: number) => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status: 'checked-out' as const } : booking
    ));
    toast.success('Khách đã trả phòng thành công!');
  };

  const handleConfirm = (bookingId: number) => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status: 'confirmed' as const } : booking
    ));
    toast.success('Đã xác nhận đặt phòng!');
  };

  const handleCancel = (bookingId: number) => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status: 'cancelled' as const } : booking
    ));
    toast.info('Đã hủy đặt phòng!');
  };

  const filterBookings = (status?: string) => {
    let filtered = bookings;
    
    if (status) {
      filtered = filtered.filter(booking => booking.status === status);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.roomNumber.includes(searchTerm) ||
        booking.guestPhone.includes(searchTerm)
      );
    }
    
    return filtered;
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-gray-900 mb-1">{booking.guestName}</h3>
          <p className="text-sm text-gray-500">{booking.guestPhone}</p>
          <p className="text-sm text-gray-500">{booking.guestEmail}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
          {getStatusText(booking.status)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Phòng</span>
          <span className="text-gray-900">{booking.roomNumber}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Nhận phòng</span>
          <span className="text-gray-900">{booking.checkIn}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Trả phòng</span>
          <span className="text-gray-900">{booking.checkOut}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Tổng tiền</span>
          <span className="text-gray-900">₫{booking.totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        {booking.status === 'pending' && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleConfirm(booking.id)}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Xác nhận
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleCancel(booking.id)}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Hủy
            </Button>
          </>
        )}
        {booking.status === 'confirmed' && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => handleCheckIn(booking.id)}
          >
            Check-in
          </Button>
        )}
        {booking.status === 'checked-in' && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => handleCheckOut(booking.id)}
          >
            Check-out
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-gray-900 mb-2">Quản lý đặt phòng</h2>
          <p className="text-gray-500">Quản lý tất cả các đặt phòng</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Tạo đặt phòng mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo đặt phòng mới</DialogTitle>
              <DialogDescription>Nhập thông tin đặt phòng cho khách hàng</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guest-name">Tên khách hàng</Label>
                  <Input id="guest-name" placeholder="Nguyễn Văn A" required />
                </div>
                <div>
                  <Label htmlFor="guest-phone">Số điện thoại</Label>
                  <Input id="guest-phone" placeholder="0901234567" required />
                </div>
              </div>
              <div>
                <Label htmlFor="guest-email">Email</Label>
                <Input id="guest-email" type="email" placeholder="email@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room">Phòng</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phòng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="101">101 - Standard</SelectItem>
                      <SelectItem value="201">201 - Deluxe</SelectItem>
                      <SelectItem value="301">301 - Suite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="total-price">Tổng tiền (VNĐ)</Label>
                  <Input id="total-price" type="number" placeholder="1500000" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check-in">Ngày nhận phòng</Label>
                  <Input id="check-in" type="date" required />
                </div>
                <div>
                  <Label htmlFor="check-out">Ngày trả phòng</Label>
                  <Input id="check-out" type="date" required />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Input id="notes" placeholder="Ghi chú đặc biệt..." />
              </div>
              <Button type="submit" className="w-full">Tạo đặt phòng</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo tên, số phòng, số điện thoại..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">Tất cả ({bookings.length})</TabsTrigger>
          <TabsTrigger value="pending">Chờ xác nhận ({filterBookings('pending').length})</TabsTrigger>
          <TabsTrigger value="confirmed">Đã xác nhận ({filterBookings('confirmed').length})</TabsTrigger>
          <TabsTrigger value="checked-in">Đã nhận phòng ({filterBookings('checked-in').length})</TabsTrigger>
          <TabsTrigger value="checked-out">Đã trả phòng ({filterBookings('checked-out').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterBookings().map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterBookings('pending').map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="confirmed">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterBookings('confirmed').map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checked-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterBookings('checked-in').map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checked-out">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterBookings('checked-out').map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
