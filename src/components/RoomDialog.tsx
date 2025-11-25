'use client'

import { useState } from 'react';
import { Room, IncidentalCharge } from '../types';
import { useApp } from '../contexts/AppContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { CheckCircle, XCircle, Sparkles, DollarSign, User, Phone, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentDialog } from './PaymentDialog';
import { IncidentalChargesSection } from './IncidentalChargesSection';

interface RoomDialogProps {
  room: Room;
  open: boolean;
  onClose: () => void;
}

export function RoomDialog({ room, open, onClose }: RoomDialogProps) {
  const { user, checkIn, markRoomCleaned, updateRoom } = useApp();
  const [action, setAction] = useState<'info' | 'check-in' | 'check-out' | 'booking'>('info');
  const [showPayment, setShowPayment] = useState(false);
  const [pendingCheckIn, setPendingCheckIn] = useState<any>(null);
  
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState('');
  const [nights, setNights] = useState(1);

  const canCheckIn = user?.role === 'admin' || user?.role === 'receptionist';
  const canCheckOut = user?.role === 'admin' || user?.role === 'receptionist';
  const canClean = user?.role === 'admin' || user?.role === 'housekeeping';

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = room.price * nights;
    
    // Store pending check-in data and open payment dialog
    setPendingCheckIn({
      name: guestName,
      phone: guestPhone,
      email: guestEmail,
      checkInDate,
      checkOutDate,
      totalAmount,
    });
    
    setShowPayment(true);
  };
  
  const completeCheckIn = () => {
    if (!pendingCheckIn) return;
    
    checkIn(room.id, pendingCheckIn);
    toast.success(`Check-in thành công phòng ${room.number}!`);
    setPendingCheckIn(null);
    setShowPayment(false);
    onClose();
  };

  const handleOpenPayment = () => {
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    onClose();
  };

  const handleMarkCleaned = () => {
    markRoomCleaned(room.id);
    toast.success(`Phòng ${room.number} đã được dọn sạch!`);
    onClose();
  };

  const handleSetMaintenance = () => {
    updateRoom(room.id, { status: 'out-of-order' });
    toast.info(`Phòng ${room.number} đã chuyển sang chế độ bảo trì`);
    onClose();
  };

  const handleSetAvailable = () => {
    updateRoom(room.id, { status: 'vacant-clean' });
    toast.success(`Phòng ${room.number} đã sẵn sàng!`);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vacant-clean': return 'text-green-600 bg-green-50';
      case 'occupied': return 'text-red-600 bg-red-50';
      case 'vacant-dirty': return 'text-gray-600 bg-gray-50';
      case 'due-out': return 'text-orange-600 bg-orange-50';
      case 'out-of-order': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'vacant-clean': return 'Sạch, Sẵn sàng';
      case 'occupied': return 'Đang có khách';
      case 'vacant-dirty': return 'Bẩn, Chờ dọn';
      case 'due-out': return 'Sắp trả phòng';
      case 'out-of-order': return 'Bảo trì';
      default: return status;
    }
  };

  return (
    <>
    <Dialog open={open && !showPayment} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto p-2">
        <DialogHeader className="pb-1 space-y-0">
          <DialogTitle className="flex items-center justify-between text-base">
            <span>Phòng {room.number}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusColor(room.status)}`}>
              {getStatusText(room.status)}
            </span>
          </DialogTitle>
          <DialogDescription className="text-[10px]">
            {room.type} - Tầng {room.floor}
          </DialogDescription>
        </DialogHeader>

        {action === 'info' && (
          <div className="space-y-1.5 mt-2">
            {/* Room Info */}
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-gray-50 rounded">
              <div>
                <p className="text-[9px] text-gray-500">Loại phòng</p>
                <p className="text-xs text-gray-900">{room.type}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500">Giá/đêm</p>
                <p className="text-xs text-gray-900">₫{room.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500">Tầng</p>
                <p className="text-xs text-gray-900">{room.floor}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500">Số phòng</p>
                <p className="text-xs text-gray-900">{room.number}</p>
              </div>
            </div>

            {/* Guest Info */}
            {room.guest && (
              <>
                <Separator className="my-1" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-gray-900">Thông tin khách</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <User className="w-2.5 h-2.5 text-gray-400" />
                      <span className="text-gray-900">{room.guest.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-2.5 h-2.5 text-gray-400" />
                      <span className="text-gray-900">{room.guest.phone}</span>
                    </div>
                    {room.guest.email && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Mail className="w-2.5 h-2.5 text-gray-400" />
                        <span className="text-gray-900">{room.guest.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-2.5 h-2.5 text-gray-400" />
                      <span className="text-gray-900">
                        {room.guest.checkInDate} → {room.guest.checkOutDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <DollarSign className="w-2.5 h-2.5 text-gray-400" />
                      <span className="text-gray-900">₫{room.guest.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Incidental Charges Section */}
                <IncidentalChargesSection
                  room={room}
                  onUpdate={(charges) => {
                    const updatedRoom = {
                      ...room,
                      guest: {
                        ...room.guest!,
                        incidentalCharges: charges,
                      },
                    };
                    updateRoom(room.id, updatedRoom);
                  }}
                  userName={user?.name || 'Admin'}
                />
              </>
            )}

            {/* Actions */}
            <Separator className="my-1" />
            <div className="space-y-1.5">
              {room.status === 'vacant-clean' && canCheckIn && (
                <Button
                  className="w-full text-xs h-9"
                  onClick={() => setAction('check-in')}
                >
                  <CheckCircle className="w-3 h-3 mr-1.5" />
                  Check-in
                </Button>
              )}

              {(room.status === 'occupied' || room.status === 'due-out') && canCheckOut && (
                <Button
                  className="w-full text-xs h-9 bg-green-600 hover:bg-green-700"
                  onClick={handleOpenPayment}
                >
                  <DollarSign className="w-3 h-3 mr-1.5" />
                  Thanh toán & Check-out
                </Button>
              )}

              {room.status === 'vacant-dirty' && canClean && (
                <Button
                  className="w-full text-xs h-9 bg-green-600 hover:bg-green-700"
                  onClick={handleMarkCleaned}
                >
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Đã dọn xong
                </Button>
              )}

              {room.status === 'vacant-clean' && user?.role === 'admin' && (
                <Button
                  variant="outline"
                  className="w-full text-xs h-9"
                  onClick={handleSetMaintenance}
                >
                  Chuyển sang Bảo trì
                </Button>
              )}

              {room.status === 'out-of-order' && user?.role === 'admin' && (
                <Button
                  variant="outline"
                  className="w-full text-xs h-9"
                  onClick={handleSetAvailable}
                >
                  Đã sửa xong - Sẵn sàng
                </Button>
              )}
            </div>
          </div>
        )}

        {action === 'check-in' && (
          <form onSubmit={handleCheckIn} className="space-y-1.5 mt-2">
            <div>
              <Label htmlFor="guest-name" className="text-xs mb-0.5">Tên khách hàng *</Label>
              <Input
                id="guest-name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="text-xs h-8"
                required
              />
            </div>
            <div>
              <Label htmlFor="guest-phone" className="text-xs mb-0.5">Số điện thoại *</Label>
              <Input
                id="guest-phone"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="0901234567"
                className="text-xs h-8"
                required
              />
            </div>
            <div>
              <Label htmlFor="guest-email" className="text-xs mb-0.5">Email</Label>
              <Input
                id="guest-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="email@example.com"
                className="text-xs h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <Label htmlFor="check-in-date" className="text-xs mb-0.5">Nhận phòng</Label>
                <Input
                  id="check-in-date"
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>
              <div>
                <Label htmlFor="nights" className="text-xs mb-0.5">Số đêm</Label>
                <Input
                  id="nights"
                  type="number"
                  min="1"
                  value={nights}
                  onChange={(e) => {
                    const n = parseInt(e.target.value);
                    setNights(n);
                    const checkIn = new Date(checkInDate);
                    const checkOut = new Date(checkIn);
                    checkOut.setDate(checkOut.getDate() + n);
                    setCheckOutDate(checkOut.toISOString().split('T')[0]);
                  }}
                  className="text-xs h-8"
                  required
                />
              </div>
            </div>
            <div className="p-1.5 bg-blue-50 rounded">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-blue-900">Tổng tiền</span>
                <span className="text-xs font-bold text-blue-900">₫{(room.price * nights).toLocaleString()}</span>
              </div>
              <p className="text-[9px] text-blue-700">
                {nights} đêm × ₫{room.price.toLocaleString()}/đêm
              </p>
            </div>
            <div className="flex gap-1.5 pt-1">
              <Button type="button" variant="outline" onClick={() => setAction('info')} className="flex-1 text-xs h-9">
                Quay lại
              </Button>
              <Button type="submit" className="flex-1 text-xs h-9 bg-green-600 hover:bg-green-700">
                <DollarSign className="w-3 h-3 mr-1.5" />
                Thanh toán
              </Button>
            </div>
          </form>
        )}
      </DialogContent>

      {/* Payment Dialog for Check-out */}
      {showPayment && room.guest && (
        <PaymentDialog
          room={room}
          open={showPayment}
          onClose={() => setShowPayment(false)}
          onComplete={handlePaymentComplete}
        />
      )}
      
      {/* Payment Dialog for Check-in */}
      {showPayment && pendingCheckIn && (
        <PaymentDialog
          room={{...room, guest: pendingCheckIn}}
          open={showPayment}
          onClose={() => {
            setShowPayment(false);
            setPendingCheckIn(null);
          }}
          onComplete={completeCheckIn}
        />
      )}
    </Dialog>
    </>
  );
}