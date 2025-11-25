'use client'

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Plus, Search, Mail, Phone, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface Guest {
  id: number;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  totalBookings: number;
  totalSpent: number;
  lastVisit: string;
  status: 'active' | 'vip' | 'regular';
}

export function GuestManagement() {
  const [guests, setGuests] = useState<Guest[]>([
    {
      id: 1,
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@email.com',
      phone: '0901234567',
      idNumber: '079012345678',
      totalBookings: 5,
      totalSpent: 7500000,
      lastVisit: '2025-11-12',
      status: 'vip',
    },
    {
      id: 2,
      name: 'Trần Thị B',
      email: 'tranthib@email.com',
      phone: '0907654321',
      idNumber: '079087654321',
      totalBookings: 2,
      totalSpent: 1600000,
      lastVisit: '2025-11-13',
      status: 'regular',
    },
    {
      id: 3,
      name: 'Lê Văn C',
      email: 'levanc@email.com',
      phone: '0912345678',
      idNumber: '079098765432',
      totalBookings: 8,
      totalSpent: 15000000,
      lastVisit: '2025-11-12',
      status: 'vip',
    },
    {
      id: 4,
      name: 'Phạm Thị D',
      email: 'phamthid@email.com',
      phone: '0908765432',
      idNumber: '079011223344',
      totalBookings: 1,
      totalSpent: 500000,
      lastVisit: '2025-11-10',
      status: 'regular',
    },
    {
      id: 5,
      name: 'Hoàng Văn E',
      email: 'hoangvane@email.com',
      phone: '0905556677',
      idNumber: '079044556677',
      totalBookings: 12,
      totalSpent: 25000000,
      lastVisit: '2025-11-08',
      status: 'vip',
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'regular':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'vip':
        return 'VIP';
      case 'active':
        return 'Hoạt động';
      case 'regular':
        return 'Thường xuyên';
      default:
        return status;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.phone.includes(searchTerm)
  );

  const handleAddGuest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success('Khách hàng mới đã được thêm!');
    setDialogOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-gray-900 mb-2">Quản lý khách hàng</h2>
          <p className="text-gray-500">Quản lý thông tin khách hàng</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Thêm khách hàng
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm khách hàng mới</DialogTitle>
              <DialogDescription>Nhập thông tin khách hàng vào hệ thống</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddGuest} className="space-y-4">
              <div>
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" placeholder="Nguyễn Văn A" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" required />
              </div>
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" placeholder="0901234567" required />
              </div>
              <div>
                <Label htmlFor="id-number">Số CMND/CCCD</Label>
                <Input id="id-number" placeholder="079012345678" required />
              </div>
              <Button type="submit" className="w-full">Thêm khách hàng</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tổng khách hàng</p>
              <p className="text-gray-900">{guests.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Khách VIP</p>
              <p className="text-gray-900">{guests.filter(g => g.status === 'vip').length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tổng doanh thu</p>
              <p className="text-gray-900">₫{guests.reduce((sum, g) => sum + g.totalSpent, 0).toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Guests Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm text-gray-500">Khách hàng</th>
                <th className="text-left py-4 px-6 text-sm text-gray-500">Liên hệ</th>
                <th className="text-left py-4 px-6 text-sm text-gray-500">CMND/CCCD</th>
                <th className="text-left py-4 px-6 text-sm text-gray-500">Số lượt đặt</th>
                <th className="text-left py-4 px-6 text-sm text-gray-500">Tổng chi tiêu</th>
                <th className="text-left py-4 px-6 text-sm text-gray-500">Lần cuối</th>
                <th className="text-left py-4 px-6 text-sm text-gray-500">Trạng thái</th>
                <th className="text-left py-4 px-6 text-sm text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(guest.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-900">{guest.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{guest.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{guest.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-700">{guest.idNumber}</td>
                  <td className="py-4 px-6 text-gray-700">{guest.totalBookings}</td>
                  <td className="py-4 px-6 text-gray-900">₫{guest.totalSpent.toLocaleString()}</td>
                  <td className="py-4 px-6 text-gray-700">{guest.lastVisit}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(guest.status)}`}>
                      {getStatusText(guest.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGuest(guest)}
                    >
                      Chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Guest Detail Dialog */}
      <Dialog open={!!selectedGuest} onOpenChange={() => setSelectedGuest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết khách hàng</DialogTitle>
            <DialogDescription>Xem thông tin chi tiết của khách hàng</DialogDescription>
          </DialogHeader>
          {selectedGuest && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                    {getInitials(selectedGuest.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-gray-900">{selectedGuest.name}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs border mt-1 ${getStatusColor(selectedGuest.status)}`}>
                    {getStatusText(selectedGuest.status)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-900">{selectedGuest.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Điện thoại</span>
                  <span className="text-gray-900">{selectedGuest.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">CMND/CCCD</span>
                  <span className="text-gray-900">{selectedGuest.idNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Số lượt đặt</span>
                  <span className="text-gray-900">{selectedGuest.totalBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Tổng chi tiêu</span>
                  <span className="text-gray-900">₫{selectedGuest.totalSpent.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Lần cuối ghé thăm</span>
                  <span className="text-gray-900">{selectedGuest.lastVisit}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
