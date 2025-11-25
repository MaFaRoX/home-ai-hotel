'use client'

import { Room } from '../types';
import { BedDouble, Users, Wrench, Bell } from 'lucide-react';
import { isCheckingOutSoon, getMinutesUntilCheckout } from '../utils/checkoutAlerts';

interface RoomCardProps {
  room: Room;
  onClick: () => void;
}

export function RoomCard({ room, onClick }: RoomCardProps) {
  const checkingOutSoon = isCheckingOutSoon(room);
  const minutesUntilCheckout = getMinutesUntilCheckout(room);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vacant-clean':
        return 'bg-green-500 hover:bg-green-600 border-green-600';
      case 'occupied':
        return 'bg-red-500 hover:bg-red-600 border-red-600';
      case 'vacant-dirty':
        return 'bg-gray-400 hover:bg-gray-500 border-gray-500';
      case 'due-out':
        return 'bg-orange-500 hover:bg-orange-600 border-orange-600';
      case 'out-of-order':
        return 'bg-purple-500 hover:bg-purple-600 border-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600 border-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'vacant-clean':
        return 'Sạch, Sẵn sàng';
      case 'occupied':
        return 'Đang có khách';
      case 'vacant-dirty':
        return 'Bẩn, Chờ dọn';
      case 'due-out':
        return 'Sắp trả phòng';
      case 'out-of-order':
        return 'Bảo trì';
      default:
        return status;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`${getStatusColor(room.status)} border-2 rounded-lg p-3 text-white transition-all duration-200 transform hover:scale-105 active:scale-95 w-full h-full min-h-[120px] flex flex-col justify-between shadow-md relative ${checkingOutSoon ? 'ring-4 ring-yellow-300 animate-pulse' : ''}`}
    >
      {/* Urgent checkout indicator */}
      {checkingOutSoon && minutesUntilCheckout && minutesUntilCheckout <= 30 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg z-10 flex items-center gap-1 animate-bounce">
          <Bell className="w-3 h-3" />
          {minutesUntilCheckout}p
        </div>
      )}
      {checkingOutSoon && minutesUntilCheckout && minutesUntilCheckout > 30 && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg z-10 flex items-center gap-1">
          <Bell className="w-3 h-3" />
          {Math.floor(minutesUntilCheckout / 60)}h
        </div>
      )}
      
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <BedDouble className="w-5 h-5" />
          <span className="text-xl">{room.number}</span>
        </div>
        {room.status === 'out-of-order' && (
          <Wrench className="w-4 h-4" />
        )}
      </div>

      <div className="text-left space-y-1">
        <p className="text-sm opacity-90">{room.type}</p>
        
        {room.status === 'vacant-clean' && (
          <p className="text-sm">₫{room.price.toLocaleString()}/đêm</p>
        )}

        {(room.status === 'occupied' || room.status === 'due-out') && room.guest && (
          <>
            <p className="text-sm truncate">{room.guest.name}</p>
            <p className="text-xs opacity-75">→ {room.guest.checkOutDate}</p>
          </>
        )}

        {room.status === 'vacant-dirty' && (
          <div className="flex items-center gap-1 text-xs opacity-90">
            <Users className="w-3 h-3" />
            <span>Cần dọn dẹp</span>
          </div>
        )}
      </div>

      <div className="pt-2 mt-auto border-t border-white/20">
        <p className="text-xs opacity-75">{getStatusText(room.status)}</p>
      </div>
    </button>
  );
}
