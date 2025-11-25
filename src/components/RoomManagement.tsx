'use client'

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, BedDouble, Users, Wifi, Tv, Coffee } from 'lucide-react';
import { toast } from 'sonner';

interface Room {
  id: number;
  number: string;
  type: string;
  floor: number;
  capacity: number;
  price: number;
  status: 'available' | 'occupied' | 'maintenance';
  amenities: string[];
}

export function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: 1,
      number: '101',
      type: 'Standard',
      floor: 1,
      capacity: 2,
      price: 500000,
      status: 'available',
      amenities: ['wifi', 'tv'],
    },
    {
      id: 2,
      number: '102',
      type: 'Standard',
      floor: 1,
      capacity: 2,
      price: 500000,
      status: 'occupied',
      amenities: ['wifi', 'tv'],
    },
    {
      id: 3,
      number: '201',
      type: 'Deluxe',
      floor: 2,
      capacity: 3,
      price: 800000,
      status: 'available',
      amenities: ['wifi', 'tv', 'minibar'],
    },
    {
      id: 4,
      number: '202',
      type: 'Deluxe',
      floor: 2,
      capacity: 3,
      price: 800000,
      status: 'occupied',
      amenities: ['wifi', 'tv', 'minibar'],
    },
    {
      id: 5,
      number: '301',
      type: 'Suite',
      floor: 3,
      capacity: 4,
      price: 1500000,
      status: 'available',
      amenities: ['wifi', 'tv', 'minibar', 'jacuzzi'],
    },
    {
      id: 6,
      number: '302',
      type: 'Suite',
      floor: 3,
      capacity: 4,
      price: 1500000,
      status: 'occupied',
      amenities: ['wifi', 'tv', 'minibar', 'jacuzzi'],
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'occupied':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'maintenance':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Trống';
      case 'occupied':
        return 'Đã đặt';
      case 'maintenance':
        return 'Bảo trì';
      default:
        return status;
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'wifi':
        return <Wifi className="w-4 h-4" />;
      case 'tv':
        return <Tv className="w-4 h-4" />;
      case 'minibar':
      case 'jacuzzi':
        return <Coffee className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const statusMatch = filterStatus === 'all' || room.status === filterStatus;
    const typeMatch = filterType === 'all' || room.type === filterType;
    return statusMatch && typeMatch;
  });

  const handleAddRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success('Phòng mới đã được thêm!');
    setDialogOpen(false);
  };

  const handleStatusChange = (roomId: number, newStatus: 'available' | 'occupied' | 'maintenance') => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, status: newStatus } : room
    ));
    toast.success('Cập nhật trạng thái phòng thành công!');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-gray-900 mb-2">Quản lý phòng</h2>
          <p className="text-gray-500">Quản lý tất cả các phòng trong khách sạn</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Thêm phòng mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm phòng mới</DialogTitle>
              <DialogDescription>Nhập thông tin phòng mới vào hệ thống</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddRoom} className="space-y-4">
              <div>
                <Label htmlFor="room-number">Số phòng</Label>
                <Input id="room-number" placeholder="101" required />
              </div>
              <div>
                <Label htmlFor="room-type">Loại phòng</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại phòng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="floor">Tầng</Label>
                <Input id="floor" type="number" placeholder="1" required />
              </div>
              <div>
                <Label htmlFor="capacity">Sức chứa</Label>
                <Input id="capacity" type="number" placeholder="2" required />
              </div>
              <div>
                <Label htmlFor="price">Giá (VNĐ/đêm)</Label>
                <Input id="price" type="number" placeholder="500000" required />
              </div>
              <Button type="submit" className="w-full">Thêm phòng</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label className="text-sm text-gray-600 mb-2 block">Trạng thái</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="available">Trống</SelectItem>
                <SelectItem value="occupied">Đã đặt</SelectItem>
                <SelectItem value="maintenance">Bảo trì</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-sm text-gray-600 mb-2 block">Loại phòng</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Deluxe">Deluxe</SelectItem>
                <SelectItem value="Suite">Suite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <Card key={room.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BedDouble className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-gray-900">Phòng {room.number}</h3>
                  <p className="text-sm text-gray-500">{room.type}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(room.status)}`}>
                {getStatusText(room.status)}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tầng</span>
                <span className="text-gray-900">{room.floor}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Sức chứa
                </span>
                <span className="text-gray-900">{room.capacity} người</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Giá/đêm</span>
                <span className="text-gray-900">₫{room.price.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {room.amenities.map((amenity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                >
                  {getAmenityIcon(amenity)}
                  <span className="capitalize">{amenity}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Label className="text-sm text-gray-600 mb-2 block">Đổi trạng thái</Label>
              <Select
                value={room.status}
                onValueChange={(value: 'available' | 'occupied' | 'maintenance') => 
                  handleStatusChange(room.id, value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Trống</SelectItem>
                  <SelectItem value="occupied">Đã đặt</SelectItem>
                  <SelectItem value="maintenance">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
