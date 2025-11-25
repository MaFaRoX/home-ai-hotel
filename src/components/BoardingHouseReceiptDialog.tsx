'use client'

import { Room, MonthlyRental } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Card } from './ui/card';
import { 
  Printer, 
  Download, 
  CheckCircle2,
  Home,
  User,
  Calendar,
  Zap,
  Droplets,
  Wifi,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface BoardingHouseReceiptDialogProps {
  room: Room;
  monthlyRental: MonthlyRental;
  open: boolean;
  onClose: () => void;
}

const PAYMENT_METHOD_LABELS = {
  'cash': 'Tiền mặt',
  'bank-transfer': 'Chuyển khoản',
  'card': 'Thẻ',
  'momo': 'Momo',
  'vnpay': 'VNPay'
};

export function BoardingHouseReceiptDialog({ 
  room, 
  monthlyRental, 
  open, 
  onClose 
}: BoardingHouseReceiptDialogProps) {
  
  // Safety check
  if (!room.tenant) {
    return null;
  }
  
  const tenant = room.tenant;
  const utilities = monthlyRental.utilities;
  
  // Calculate amounts
  const electricityCost = utilities?.electricity 
    ? (utilities.electricity.newReading - utilities.electricity.oldReading) * utilities.electricity.pricePerUnit
    : 0;
  
  const waterCost = utilities?.water
    ? (utilities.water.newReading - utilities.water.oldReading) * utilities.water.pricePerUnit
    : 0;
  
  const internetCost = utilities?.internet || 0;
  
  const otherCosts = utilities?.other?.reduce((sum, item) => sum + item.amount, 0) || 0;
  
  const totalAmount = monthlyRental.rentAmount + electricityCost + waterCost + internetCost + otherCosts;

  const handlePrint = () => {
    window.print();
    toast.success('Đang in biên lai...');
  };

  const handleDownloadPDF = () => {
    // In production, you would implement PDF generation here
    toast.success('Tính năng xuất PDF sẽ được cập nhật sau!');
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `Tháng ${monthNum}/${year}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:max-w-full">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            Biên Lai Thu Tiền
          </DialogTitle>
          <DialogDescription>
            Biên lai thanh toán tiền thuê phòng {formatMonth(monthlyRental.month)}
          </DialogDescription>
        </DialogHeader>

        {/* Receipt Content */}
        <div className="space-y-6 print:p-8">
          {/* Header - Print only */}
          <div className="hidden print:block text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">BIÊN LAI THU TIỀN</h1>
            <p className="text-xl">Tiền thuê phòng {formatMonth(monthlyRental.month)}</p>
          </div>

          {/* Success Banner - Screen only */}
          <Card className="bg-green-50 border-green-200 p-6 print:hidden">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-green-900 mb-1">
                  Đã thu tiền thành công!
                </h3>
                <p className="text-green-700">
                  {formatMonth(monthlyRental.month)} - Phòng {room.number}
                </p>
              </div>
            </div>
          </Card>

          {/* Receipt Info */}
          <div className="grid grid-cols-2 gap-6">
            {/* Room & Tenant Info */}
            <Card className="p-5 print:border-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Home className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg">Thông tin phòng</h3>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số phòng</p>
                  <p className="text-xl font-bold">{room.number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tên người thuê</p>
                  <p className="font-semibold">{tenant.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại</p>
                  <p className="font-semibold">{tenant.phone}</p>
                </div>
              </div>
            </Card>

            {/* Payment Info */}
            <Card className="p-5 print:border-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-lg">Thông tin thanh toán</h3>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tháng thanh toán</p>
                  <p className="font-bold text-lg">{formatMonth(monthlyRental.month)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày thu tiền</p>
                  <p className="font-semibold">
                    {new Date(monthlyRental.paidDate!).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hình thức thanh toán</p>
                  <p className="font-semibold">
                    {PAYMENT_METHOD_LABELS[monthlyRental.paymentMethod || 'cash']}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Details */}
          <Card className="p-5 print:border-2">
            <h3 className="font-bold text-lg mb-4">Chi tiết thanh toán</h3>
            
            <div className="space-y-3">
              {/* Room Rent */}
              <div className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Tiền thuê phòng</span>
                </div>
                <span className="font-bold text-lg">
                  ₫{monthlyRental.rentAmount.toLocaleString()}
                </span>
              </div>

              {/* Electricity */}
              {utilities?.electricity && (
                <div className="flex justify-between items-center py-2 border-b">
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">Tiền điện</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">
                      {utilities.electricity.oldReading} → {utilities.electricity.newReading} kWh 
                      ({utilities.electricity.newReading - utilities.electricity.oldReading} kWh × ₫{utilities.electricity.pricePerUnit.toLocaleString()})
                    </p>
                  </div>
                  <span className="font-bold text-lg">
                    ₫{electricityCost.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Water */}
              {utilities?.water && (
                <div className="flex justify-between items-center py-2 border-b">
                  <div>
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Tiền nước</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">
                      {utilities.water.oldReading} → {utilities.water.newReading} m³ 
                      ({utilities.water.newReading - utilities.water.oldReading} m³ × ₫{utilities.water.pricePerUnit.toLocaleString()})
                    </p>
                  </div>
                  <span className="font-bold text-lg">
                    ₫{waterCost.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Internet */}
              {utilities?.internet && (
                <div className="flex justify-between items-center py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">Internet</span>
                  </div>
                  <span className="font-bold text-lg">
                    ₫{internetCost.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Other fees */}
              {utilities?.other && utilities.other.length > 0 && (
                utilities.other.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">{item.name}</span>
                    <span className="font-bold text-lg">
                      ₫{item.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}

              {/* Total */}
              <div className="flex justify-between items-center py-4 bg-blue-50 px-4 rounded-lg mt-4">
                <span className="text-xl font-bold">TỔNG CỘNG</span>
                <span className="text-2xl font-bold text-blue-600">
                  ₫{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Footer Note */}
          <div className="text-center text-sm text-gray-600 pt-4 border-t">
            <p>Cảm ơn quý khách đã thanh toán đúng hạn!</p>
            <p className="mt-1">Mọi thắc mắc xin liên hệ quản lý để được hỗ trợ.</p>
          </div>

          {/* Signature area - Print only */}
          <div className="hidden print:grid grid-cols-2 gap-8 mt-12">
            <div className="text-center">
              <p className="font-semibold mb-16">Người nộp tiền</p>
              <p className="font-semibold">{tenant.name}</p>
            </div>
            <div className="text-center">
              <p className="font-semibold mb-16">Người thu tiền</p>
              <p className="font-semibold">__________________</p>
            </div>
          </div>
        </div>

        {/* Footer Actions - Screen only */}
        <DialogFooter className="print:hidden gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            Xuất PDF
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            In biên lai
          </Button>
          <Button onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
