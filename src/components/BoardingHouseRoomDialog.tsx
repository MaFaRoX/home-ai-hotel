'use client'

import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Room, MonthlyRental, UtilityReading, PaymentMethod } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  User, 
  Phone, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Zap, 
  Droplets,
  Wifi,
  Plus,
  CheckCircle2,
  AlertCircle,
  Home,
  Building2,
  QrCode,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { BoardingHouseReceiptDialog } from './BoardingHouseReceiptDialog';
import { MoneyInput } from './MoneyInput';

interface BoardingHouseRoomDialogProps {
  room: Room;
  open: boolean;
  onClose: () => void;
}

export function BoardingHouseRoomDialog({ room, open, onClose }: BoardingHouseRoomDialogProps) {
  const { updateRoom, hotel } = useApp();
  const [activeTab, setActiveTab] = useState<'info' | 'payment' | 'add-tenant'>('info');
  const [paymentStep, setPaymentStep] = useState<'form' | 'qr-code'>('form');

  // Add tenant form
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantIdCard, setTenantIdCard] = useState('');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split('T')[0]);
  const [deposit, setDeposit] = useState('');
  const [monthlyRent, setMonthlyRent] = useState(room.price.toString());
  const [electricityPrice, setElectricityPrice] = useState('3500');
  const [waterPrice, setWaterPrice] = useState('15000');
  const [internetFee, setInternetFee] = useState('100000');

  // Monthly payment form
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [paymentMonth, setPaymentMonth] = useState(currentMonth);
  const [oldElectricity, setOldElectricity] = useState('0');
  const [newElectricity, setNewElectricity] = useState('0');
  const [oldWater, setOldWater] = useState('0');
  const [newWater, setNewWater] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Receipt dialog state
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastPayment, setLastPayment] = useState<MonthlyRental | null>(null);

  useEffect(() => {
    if (open) {
      // Reset receipt state when opening
      setShowReceipt(false);
      setLastPayment(null);
      setPaymentStep('form');
      
      if (room.tenant) {
        setActiveTab('info');
        // Pre-fill previous month readings
        const previousMonth = room.tenant.monthlyHistory[room.tenant.monthlyHistory.length - 1];
        if (previousMonth?.utilities?.electricity) {
          setOldElectricity(previousMonth.utilities.electricity.newReading.toString());
        }
        if (previousMonth?.utilities?.water) {
          setOldWater(previousMonth.utilities.water.newReading.toString());
        }
      } else {
        setActiveTab('add-tenant');
      }
    }
  }, [room, open]);

  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedRoom: Room = {
      ...room,
      status: 'occupied',
      tenant: {
        name: tenantName,
        phone: tenantPhone,
        idCard: tenantIdCard || undefined,
        moveInDate,
        deposit: parseFloat(deposit),
        monthlyRent: parseFloat(monthlyRent),
        electricityPrice: parseFloat(electricityPrice),
        waterPrice: parseFloat(waterPrice),
        internetFee: parseFloat(internetFee),
        monthlyHistory: []
      }
    };

    updateRoom(updatedRoom);
    toast.success(`Đã cho thuê phòng ${room.number} cho ${tenantName}`);
    onClose();
  };

  const handleMonthlyPayment = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if should show QR code first
    if (paymentMethod === 'bank-transfer' || paymentMethod === 'momo' || paymentMethod === 'vnpay') {
      setPaymentStep('qr-code');
      return;
    }

    // Process payment for cash/card
    processPayment();
  };

  const processPayment = () => {
    if (!room.tenant) return;

    const elecUsage = parseFloat(newElectricity) - parseFloat(oldElectricity);
    const waterUsage = parseFloat(newWater) - parseFloat(oldWater);
    
    const elecCost = elecUsage * (room.tenant.electricityPrice || 3500);
    const waterCost = waterUsage * (room.tenant.waterPrice || 15000);
    const internetCost = room.tenant.internetFee || 0;
    
    const totalUtilities = elecCost + waterCost + internetCost;
    const totalAmount = room.tenant.monthlyRent + totalUtilities;

    const utilities: UtilityReading = {
      electricity: {
        oldReading: parseFloat(oldElectricity),
        newReading: parseFloat(newElectricity),
        pricePerUnit: room.tenant.electricityPrice || 3500
      },
      water: {
        oldReading: parseFloat(oldWater),
        newReading: parseFloat(newWater),
        pricePerUnit: room.tenant.waterPrice || 15000
      },
      internet: room.tenant.internetFee
    };

    const newPayment: MonthlyRental = {
      month: paymentMonth,
      rentAmount: room.tenant.monthlyRent,
      utilities,
      paid: true,
      paidDate: new Date().toISOString(),
      paidAmount: totalAmount,
      paymentMethod: paymentMethod
    };

    const updatedHistory = [...room.tenant.monthlyHistory];
    const existingIndex = updatedHistory.findIndex(m => m.month === paymentMonth);
    
    if (existingIndex >= 0) {
      updatedHistory[existingIndex] = newPayment;
    } else {
      updatedHistory.push(newPayment);
    }

    const updatedRoom: Room = {
      ...room,
      tenant: {
        ...room.tenant,
        monthlyHistory: updatedHistory
      }
    };

    updateRoom(updatedRoom);
    setLastPayment(newPayment);
    toast.success(`Đã thu tiền phòng ${room.number} thành công!`);
    
    // Show receipt instead of closing
    setShowReceipt(true);
  };

  const handleEndRental = () => {
    if (!confirm(`Xác nhận trả phòng ${room.number}?`)) return;

    const updatedRoom: Room = {
      ...room,
      status: 'vacant-clean',
      tenant: undefined
    };

    updateRoom(updatedRoom);
    toast.success(`Đã trả phòng ${room.number}`);
    onClose();
  };

  // Calculate total amount for QR code
  const calculateTotalAmount = () => {
    if (!room.tenant) return 0;
    
    const elecUsage = parseFloat(newElectricity) - parseFloat(oldElectricity);
    const waterUsage = parseFloat(newWater) - parseFloat(oldWater);
    
    const elecCost = elecUsage * (room.tenant.electricityPrice || 3500);
    const waterCost = waterUsage * (room.tenant.waterPrice || 15000);
    const internetCost = room.tenant.internetFee || 0;
    
    return room.tenant.monthlyRent + elecCost + waterCost + internetCost;
  };

  // Generate QR code URL for bank transfer
  const generateQRCode = () => {
    if (!hotel?.bankAccount) return '';
    
    const totalAmount = calculateTotalAmount();
    const [year, month] = paymentMonth.split('-');
    
    const qrData = `Ngân hàng: ${hotel.bankAccount.bankName}\nSTK: ${hotel.bankAccount.accountNumber}\nChủ TK: ${hotel.bankAccount.accountHolder}\nSố tiền: ${totalAmount.toLocaleString()}đ\nNội dung: Tien phong ${room.number} thang ${month}/${year}`;
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
  };

  const currentMonthPayment = room.tenant?.monthlyHistory.find(m => m.month === currentMonth);
  const isCurrentMonthPaid = currentMonthPayment?.paid || false;

  // Show receipt dialog if payment was just made
  if (lastPayment && showReceipt) {
    return (
      <BoardingHouseReceiptDialog
        room={room}
        monthlyRental={lastPayment}
        open={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          setLastPayment(null);
          onClose();
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-3">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Home className="w-4 h-4 text-blue-600" />
            Phòng {room.number}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {room.tenant 
              ? `Quản lý thông tin và thu tiền phòng của ${room.tenant.name}` 
              : 'Cho thuê phòng mới'}
          </DialogDescription>
        </DialogHeader>

        {room.tenant ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="info" className="text-xs">
                <User className="w-3 h-3 mr-1" />
                Thông tin
              </TabsTrigger>
              <TabsTrigger value="payment" className="text-xs">
                <DollarSign className="w-3 h-3 mr-1" />
                Thu tiền
              </TabsTrigger>
            </TabsList>

            {/* Tab: Tenant Info */}
            <TabsContent value="info" className="space-y-2 mt-2">
              <Card className="p-2 bg-blue-50">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-600 mb-0.5">Người thuê</p>
                    <p className="text-sm font-bold text-gray-900">{room.tenant.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 mb-0.5">Số điện thoại</p>
                    <p className="text-sm font-bold text-gray-900">{room.tenant.phone}</p>
                  </div>
                  {room.tenant.idCard && (
                    <div>
                      <p className="text-[10px] text-gray-600 mb-0.5">CMND/CCCD</p>
                      <p className="text-xs font-medium text-gray-900">{room.tenant.idCard}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-gray-600 mb-0.5">Ngày vào</p>
                    <p className="text-xs font-medium text-gray-900">
                      {new Date(room.tenant.moveInDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-2">
                <p className="text-xs font-bold text-gray-900 mb-1.5">Chi phí hàng tháng</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-700 font-bold">Tiền thuê/tháng</span>
                    <span className="text-sm font-bold text-blue-600">
                      ₫{(room.tenant.monthlyRent || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[9px] text-gray-500">Điện</p>
                      <span className="text-[10px] text-gray-600">
                        ₫{(room.tenant.electricityPrice || 0).toLocaleString()}/kWh
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Nước</p>
                      <span className="text-[10px] text-gray-600">
                        ₫{(room.tenant.waterPrice || 0).toLocaleString()}/m³
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Internet</p>
                      <span className="text-[10px] text-gray-600">
                        ₫{(room.tenant.internetFee || 0).toLocaleString()}/tháng
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-700 font-bold">Tiền cọc</span>
                    <span className="text-sm font-bold text-orange-600">
                      ₫{(room.tenant.deposit || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Payment History */}
              <Card className="p-2">
                <p className="text-xs font-bold text-gray-900 mb-1.5">Lịch sử thanh toán</p>
                {room.tenant.monthlyHistory.length === 0 ? (
                  <p className="text-[10px] text-gray-500 text-center py-2">Chưa có thanh toán nào</p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {room.tenant.monthlyHistory
                      .sort((a, b) => b.month.localeCompare(a.month))
                      .map((payment, idx) => (
                        <div key={idx} className="flex justify-between items-center p-1.5 bg-gray-50 rounded">
                          <div>
                            <p className="text-xs font-medium text-gray-900">Tháng {payment.month}</p>
                            <p className="text-[10px] text-gray-600">
                              {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('vi-VN') : '-'}
                              {payment.paymentMethod && (
                                <span className="ml-1">
                                  {payment.paymentMethod === 'cash' && '💵'}
                                  {payment.paymentMethod === 'bank-transfer' && '🏦'}
                                  {payment.paymentMethod === 'momo' && '📱'}
                                  {payment.paymentMethod === 'vnpay' && '💳'}
                                  {payment.paymentMethod === 'card' && '💳'}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-gray-900">
                              ₫{payment.paidAmount?.toLocaleString()}
                            </p>
                            <Badge variant={payment.paid ? 'default' : 'destructive'} className="text-[10px] h-4 px-1">
                              {payment.paid ? 'Đã thu' : 'Chưa thu'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </Card>

              <Button
                variant="destructive"
                className="w-full text-sm py-4"
                onClick={handleEndRental}
              >
                Trả phòng
              </Button>
            </TabsContent>

            {/* Tab: Monthly Payment */}
            <TabsContent value="payment" className="mt-3">
              {paymentStep === 'form' ? (
                <form onSubmit={handleMonthlyPayment} className="space-y-3">
                  {/* Current Month Status */}
                  <Card className={`p-3 ${isCurrentMonthPaid ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isCurrentMonthPaid ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900">Tháng {currentMonth}</p>
                        <p className="text-xs text-gray-600">
                          {isCurrentMonthPaid ? 'Đã thu tiền tháng này' : 'Chưa thu tiền tháng này'}
                        </p>
                      </div>
                    </div>
                    {isCurrentMonthPaid && (
                      <div className="text-right">
                        <p className="text-base font-bold text-green-600">
                          ₫{currentMonthPayment?.paidAmount?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          {currentMonthPayment?.paidDate ? new Date(currentMonthPayment.paidDate).toLocaleDateString('vi-VN') : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Month Selector */}
                <div>
                  <Label htmlFor="payment-month" className="text-sm">Chọn tháng thu tiền</Label>
                  <Input
                    id="payment-month"
                    type="month"
                    value={paymentMonth}
                    onChange={(e) => setPaymentMonth(e.target.value)}
                    className="text-sm py-3"
                    required
                  />
                </div>

                <Separator />

                {/* Electricity */}
                <div>
                  <Label className="text-sm flex items-center gap-1 mb-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Điện (₫{room.tenant.electricityPrice?.toLocaleString()}/kWh)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="old-elec" className="text-xs">Số cũ</Label>
                      <Input
                        id="old-elec"
                        type="number"
                        value={oldElectricity}
                        onChange={(e) => setOldElectricity(e.target.value)}
                        className="text-sm py-3"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-elec" className="text-xs">Số mới</Label>
                      <Input
                        id="new-elec"
                        type="number"
                        value={newElectricity}
                        onChange={(e) => setNewElectricity(e.target.value)}
                        className="text-sm py-3"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Sử dụng: <span className="font-bold">{Math.max(0, parseFloat(newElectricity) - parseFloat(oldElectricity))} kWh</span>
                    {' → '}
                    <span className="font-bold text-yellow-600">
                      ₫{(Math.max(0, parseFloat(newElectricity) - parseFloat(oldElectricity)) * (room.tenant.electricityPrice || 0)).toLocaleString()}
                    </span>
                  </p>
                </div>

                {/* Water */}
                <div>
                  <Label className="text-sm flex items-center gap-1 mb-1">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    Nước (₫{room.tenant.waterPrice?.toLocaleString()}/m³)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="old-water" className="text-xs">Số cũ</Label>
                      <Input
                        id="old-water"
                        type="number"
                        value={oldWater}
                        onChange={(e) => setOldWater(e.target.value)}
                        className="text-sm py-3"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-water" className="text-xs">Số mới</Label>
                      <Input
                        id="new-water"
                        type="number"
                        value={newWater}
                        onChange={(e) => setNewWater(e.target.value)}
                        className="text-sm py-3"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Sử dụng: <span className="font-bold">{Math.max(0, parseFloat(newWater) - parseFloat(oldWater))} m³</span>
                    {' → '}
                    <span className="font-bold text-blue-600">
                      ₫{(Math.max(0, parseFloat(newWater) - parseFloat(oldWater)) * (room.tenant.waterPrice || 0)).toLocaleString()}
                    </span>
                  </p>
                </div>

                <Separator />

                {/* Payment Method */}
                <div>
                  <Label htmlFor="payment-method" className="text-sm flex items-center gap-1 mb-1">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    Hình thức thanh toán
                  </Label>
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger className="text-sm py-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash" className="text-sm">💵 Tiền mặt</SelectItem>
                      <SelectItem value="bank-transfer" className="text-sm">🏦 Chuyển khoản</SelectItem>
                      <SelectItem value="momo" className="text-sm">📱 Momo</SelectItem>
                      <SelectItem value="vnpay" className="text-sm">💳 VNPay</SelectItem>
                      <SelectItem value="card" className="text-sm">💳 Thẻ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Summary */}
                <Card className="p-3 bg-blue-50">
                  <p className="text-sm font-bold text-gray-900 mb-2">Tổng cộng tháng {paymentMonth}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-700">Tiền thuê</span>
                      <span className="text-sm font-medium">₫{room.tenant.monthlyRent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-700">Tiền điện</span>
                      <span className="text-sm font-medium">
                        ₫{((parseFloat(newElectricity) - parseFloat(oldElectricity)) * (room.tenant.electricityPrice || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-700">Tiền nước</span>
                      <span className="text-sm font-medium">
                        ₫{((parseFloat(newWater) - parseFloat(oldWater)) * (room.tenant.waterPrice || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-700">Internet</span>
                      <span className="text-sm font-medium">₫{(room.tenant.internetFee || 0).toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">TỔNG CỘNG</span>
                      <span className="text-lg font-bold text-blue-600">
                        ₫{(
                          room.tenant.monthlyRent +
                          ((parseFloat(newElectricity) - parseFloat(oldElectricity)) * (room.tenant.electricityPrice || 0)) +
                          ((parseFloat(newWater) - parseFloat(oldWater)) * (room.tenant.waterPrice || 0)) +
                          (room.tenant.internetFee || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>

                  <Button type="submit" className="w-full text-sm py-4 bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {(paymentMethod === 'bank-transfer' || paymentMethod === 'momo' || paymentMethod === 'vnpay') 
                      ? 'Tiếp tục' 
                      : 'Xác nhận đã thu tiền'}
                  </Button>
                </form>
              ) : (
                /* QR Code Payment Screen */
                <div className="space-y-4">
                  {/* Back Button */}
                  <Button
                    variant="ghost"
                    onClick={() => setPaymentStep('form')}
                    className="mb-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                  </Button>

                  {/* Payment Method Banner */}
                  <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                    <div className="flex items-center gap-3 justify-center">
                      <QrCode className="w-6 h-6 text-purple-600" />
                      <h3 className="text-lg font-bold text-purple-900">
                        {paymentMethod === 'momo' && 'Thanh toán qua Momo'}
                        {paymentMethod === 'vnpay' && 'Thanh toán qua VNPay'}
                        {paymentMethod === 'bank-transfer' && 'Chuyển khoản ngân hàng'}
                      </h3>
                    </div>
                  </Card>

                  {/* Bank Info or QR Code */}
                  {hotel?.bankAccount ? (
                    <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                      <h4 className="text-sm text-blue-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Thông tin {paymentMethod === 'bank-transfer' ? 'chuyển khoản' : 'thanh toán'}
                      </h4>
                      
                      <div className="space-y-3 mb-5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Ngân hàng:</span>
                          <span className="font-semibold text-blue-900">{hotel.bankAccount.bankName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Số tài khoản:</span>
                          <span className="font-semibold text-blue-900 tracking-wider">
                            {hotel.bankAccount.accountNumber}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Chủ tài khoản:</span>
                          <span className="font-semibold text-blue-900">{hotel.bankAccount.accountHolder}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Số tiền:</span>
                          <span className="text-xl font-bold text-blue-600">
                            ₫{calculateTotalAmount().toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-blue-700">Nội dung:</span>
                          <span className="font-medium text-blue-900 text-right">
                            Tien phong {room.number} thang {paymentMonth.split('-')[1]}/{paymentMonth.split('-')[0]}
                          </span>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex flex-col items-center">
                        <p className="text-sm text-blue-700 mb-3 flex items-center gap-2">
                          <QrCode className="w-4 h-4" />
                          Quét mã QR để thanh toán
                        </p>
                        <div className="bg-white p-4 rounded-xl border-2 border-blue-300 shadow-lg">
                          <img
                            src={generateQRCode()}
                            alt="QR Code thanh toán"
                            className="w-56 h-56"
                          />
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-4 bg-yellow-50 border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Chưa cấu hình thông tin tài khoản ngân hàng. Vui lòng liên hệ quản trị viên.
                      </p>
                    </Card>
                  )}

                  {/* Payment Summary */}
                  {room.tenant && (
                    <Card className="p-4 bg-gray-50">
                      <p className="text-sm font-bold text-gray-900 mb-3">Chi tiết thanh toán</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Tiền thuê</span>
                          <span className="font-medium">₫{room.tenant.monthlyRent.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Tiền điện</span>
                          <span className="font-medium">
                            ₫{((parseFloat(newElectricity) - parseFloat(oldElectricity)) * (room.tenant.electricityPrice || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Tiền nước</span>
                          <span className="font-medium">
                            ₫{((parseFloat(newWater) - parseFloat(oldWater)) * (room.tenant.waterPrice || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Internet</span>
                          <span className="font-medium">₫{(room.tenant.internetFee || 0).toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-base font-bold text-gray-900">TỔNG CỘNG</span>
                          <span className="text-xl font-bold text-blue-600">
                            ₫{calculateTotalAmount().toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Confirm Payment Button */}
                  <div className="space-y-3">
                    <Button 
                      onClick={processPayment}
                      className="w-full text-lg py-6 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Xác nhận đã thanh toán
                    </Button>
                    <p className="text-xs text-center text-gray-500">
                      Nhấn xác nhận sau khi khách hàng đã chuyển khoản thành công
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          /* Add Tenant Form */
          <form onSubmit={handleAddTenant} className="space-y-3 mt-3">
            <div>
              <Label htmlFor="tenant-name" className="text-sm">Tên người thuê *</Label>
              <Input
                id="tenant-name"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="text-sm py-3"
                required
              />
            </div>

            <div>
              <Label htmlFor="tenant-phone" className="text-sm">Số điện thoại *</Label>
              <Input
                id="tenant-phone"
                type="tel"
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                placeholder="0901234567"
                className="text-sm py-3"
                required
              />
            </div>

            <div>
              <Label htmlFor="tenant-id" className="text-sm">CMND/CCCD</Label>
              <Input
                id="tenant-id"
                value={tenantIdCard}
                onChange={(e) => setTenantIdCard(e.target.value)}
                placeholder="001234567890"
                className="text-sm py-3"
              />
            </div>

            <div>
              <Label htmlFor="move-in-date" className="text-sm">Ngày vào ở *</Label>
              <Input
                id="move-in-date"
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="text-sm py-3"
                required
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="monthly-rent" className="text-sm">Tiền thuê/tháng *</Label>
              <MoneyInput
                id="monthly-rent"
                value={monthlyRent}
                onChange={setMonthlyRent}
                placeholder="3000000"
                className="text-sm py-3"
                required
              />
            </div>

            <div>
              <Label htmlFor="deposit" className="text-sm">Tiền cọc</Label>
              <MoneyInput
                id="deposit"
                value={deposit}
                onChange={setDeposit}
                placeholder="3000000"
                className="text-sm py-3"
              />
            </div>

            <Separator />

            <p className="text-xs font-bold text-gray-700">Giá dịch vụ (có thể thay đổi sau)</p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="elec-price" className="text-xs">
                  <Zap className="w-3 h-3 inline mr-1 text-yellow-500" />
                  Điện (₫/kWh)
                </Label>
                <Input
                  id="elec-price"
                  type="number"
                  value={electricityPrice}
                  onChange={(e) => setElectricityPrice(e.target.value)}
                  className="text-sm py-2"
                />
              </div>
              <div>
                <Label htmlFor="water-price" className="text-xs">
                  <Droplets className="w-3 h-3 inline mr-1 text-blue-500" />
                  Nước (₫/m³)
                </Label>
                <Input
                  id="water-price"
                  type="number"
                  value={waterPrice}
                  onChange={(e) => setWaterPrice(e.target.value)}
                  className="text-sm py-2"
                />
              </div>
              <div>
                <Label htmlFor="internet-fee" className="text-xs">
                  <Wifi className="w-3 h-3 inline mr-1 text-green-500" />
                  Internet (₫/tháng)
                </Label>
                <Input
                  id="internet-fee"
                  type="number"
                  value={internetFee}
                  onChange={(e) => setInternetFee(e.target.value)}
                  className="text-sm py-2"
                />
              </div>
            </div>

            <Button type="submit" className="w-full text-sm py-4 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Cho thuê phòng
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}