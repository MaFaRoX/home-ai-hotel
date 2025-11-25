'use client'

import { Card } from './ui/card';
import { BedDouble, Calendar, Users, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';

export function Dashboard() {
  const stats = [
    {
      title: 'Tổng phòng',
      value: '48',
      change: '+2',
      trend: 'up',
      icon: BedDouble,
      color: 'bg-blue-500',
    },
    {
      title: 'Phòng đã đặt',
      value: '32',
      change: '+8',
      trend: 'up',
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: 'Khách hàng',
      value: '156',
      change: '+12',
      trend: 'up',
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: 'Doanh thu tháng',
      value: '₫45.2M',
      change: '-2.4%',
      trend: 'down',
      icon: DollarSign,
      color: 'bg-orange-500',
    },
  ];

  const recentBookings = [
    {
      id: 1,
      guest: 'Nguyễn Văn A',
      room: '101',
      checkIn: '2025-11-12',
      checkOut: '2025-11-15',
      status: 'confirmed',
    },
    {
      id: 2,
      guest: 'Trần Thị B',
      room: '205',
      checkIn: '2025-11-13',
      checkOut: '2025-11-14',
      status: 'pending',
    },
    {
      id: 3,
      guest: 'Lê Văn C',
      room: '302',
      checkIn: '2025-11-12',
      checkOut: '2025-11-18',
      status: 'checked-in',
    },
    {
      id: 4,
      guest: 'Phạm Thị D',
      room: '108',
      checkIn: '2025-11-14',
      checkOut: '2025-11-16',
      status: 'confirmed',
    },
  ];

  const roomStatus = [
    { status: 'Trống', count: 16, color: 'bg-green-500' },
    { status: 'Đã đặt', count: 32, color: 'bg-blue-500' },
    { status: 'Bảo trì', count: 0, color: 'bg-red-500' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'checked-in':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Chờ xác nhận';
      case 'checked-in':
        return 'Đã nhận phòng';
      default:
        return status;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-gray-900 mb-2">Tổng quan</h2>
        <p className="text-gray-500">Thống kê tổng quan hệ thống quản lý khách sạn</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                <p className="text-gray-900">{stat.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-gray-900 mb-4">Đặt phòng gần đây</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500">Khách hàng</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500">Phòng</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500">Nhận phòng</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500">Trả phòng</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{booking.guest}</td>
                    <td className="py-3 px-4 text-gray-700">{booking.room}</td>
                    <td className="py-3 px-4 text-gray-700">{booking.checkIn}</td>
                    <td className="py-3 px-4 text-gray-700">{booking.checkOut}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Room Status */}
        <Card className="p-6">
          <h3 className="text-gray-900 mb-4">Tình trạng phòng</h3>
          <div className="space-y-4">
            {roomStatus.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">{item.status}</span>
                  <span className="text-gray-900">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{ width: `${(item.count / 48) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">Tỷ lệ lấp đầy</span>
              <span className="text-gray-900">66.7%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '66.7%' }} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
