'use client'

import { useState } from 'react';
import { Room, PaymentMethod, DocumentType, Service, Payment } from '../types';
import { useApp } from '../contexts/AppContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card } from './ui/card';
import { 
  Receipt, 
  FileText, 
  Wallet, 
  CreditCard, 
  Building2,
  Smartphone,
  Printer,
  CheckCircle2,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { ReceiptTemplate } from './ReceiptTemplate';

interface PaymentDialogProps {
  room: Room;
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function PaymentDialog({ room, open, onClose, onComplete }: PaymentDialogProps) {
  const { user, hotel, checkOut: processCheckOut, addPayment } = useApp();
  const [step, setStep] = useState<'payment' | 'success'>('payment');
  
  // Document type
  const [documentType, setDocumentType] = useState<DocumentType>('receipt');
  
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  
  // Invoice details (only for invoice type)
  const [companyName, setCompanyName] = useState('');
  const [companyTaxCode, setCompanyTaxCode] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  
  // Additional services
  const [services, setServices] = useState<Service[]>(room.guest?.services || []);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceQty, setNewServiceQty] = useState('1');
  const [showAddService, setShowAddService] = useState(false);
  
  // Print receipt state
  const [showReceipt, setShowReceipt] = useState(false);

  if (!room.guest) return null;

  // Calculate dates
  const checkInDate = new Date(room.guest.checkInDate);
  const checkOutDate = new Date(room.guest.checkOutDate);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate amounts
  const roomCharge = room.price * nights;
  const servicesTotal = services.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  const incidentalChargesTotal = (room.guest.incidentalCharges || []).reduce(
    (sum, c) => sum + (c.amount * c.quantity), 
    0
  );
  const subtotal = roomCharge + servicesTotal + incidentalChargesTotal;
  const vatRate = documentType === 'invoice' ? 0.08 : 0; // 8% VAT for invoice
  const vat = subtotal * vatRate;
  const total = subtotal + vat;

  const addService = () => {
    if (!newServiceName || !newServicePrice) return;
    
    const service: Service = {
      id: Date.now().toString(),
      name: newServiceName,
      price: parseFloat(newServicePrice),
      quantity: parseInt(newServiceQty) || 1,
    };
    
    setServices([...services, service]);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceQty('1');
    setShowAddService(false);
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const handlePayment = () => {
    const payment: Payment = {
      id: Date.now().toString(),
      roomNumber: room.number,
      guestName: room.guest!.name,
      checkInDate: room.guest!.checkInDate,
      checkOutDate: room.guest!.checkOutDate,
      roomCharge,
      services,
      incidentalCharges: room.guest!.incidentalCharges || [],
      subtotal,
      vat,
      total,
      paymentMethod,
      documentType,
      companyName: documentType === 'invoice' ? companyName : undefined,
      companyTaxCode: documentType === 'invoice' ? companyTaxCode : undefined,
      companyAddress: documentType === 'invoice' ? companyAddress : undefined,
      timestamp: new Date().toISOString(),
      processedBy: user?.name || 'Unknown',
    };

    addPayment(payment);
    processCheckOut(room.id);
    setStep('success');
  };

  const handlePrint = () => {
    setShowReceipt(true);
    setTimeout(() => {
      window.print();
      setShowReceipt(false);
    }, 100);
  };

  const handlePreviewReceipt = () => {
    setShowReceipt(true);
  };

  const handlePrintAndClose = () => {
    handlePrint();
    setTimeout(() => {
      toast.success(`${documentType === 'invoice' ? 'Hóa đơn' : 'Biên lai'} đã được in!`);
      onComplete();
      onClose();
    }, 500);
  };

  // Generate QR code URL for bank transfer
  const generateQRCode = () => {
    if (!hotel?.bankAccount) return '';
    const qrData = `Ngân hàng: ${hotel.bankAccount.bankName}\nSTK: ${hotel.bankAccount.accountNumber}\nChủ TK: ${hotel.bankAccount.accountHolder}\nSố tiền: ${total.toLocaleString()}đ\nNội dung: Thanh toan phong ${room.number}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;
  };

  const paymentMethods = [
    { value: 'cash' as PaymentMethod, label: 'Tiền mặt', icon: Wallet },
    { value: 'bank-transfer' as PaymentMethod, label: 'Chuyển khoản', icon: Building2 },
    { value: 'card' as PaymentMethod, label: 'Thẻ tín dụng', icon: CreditCard },
    { value: 'momo' as PaymentMethod, label: 'MoMo', icon: Smartphone },
    { value: 'vnpay' as PaymentMethod, label: 'VNPay', icon: Smartphone },
  ];

  return (
    <>
      {/* Receipt Preview/Print */}
      {showReceipt && step === 'success' && (
        <Dialog open={showReceipt} onOpenChange={() => setShowReceipt(false)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
            <div className="p-4">
              <ReceiptTemplate
                hotelName={hotel?.name || 'Khách sạn'}
                hotelAddress={hotel?.address}
                hotelPhone={hotel?.phone}
                room={room}
                documentType={documentType}
                paymentMethod={paymentMethod}
                roomCharge={roomCharge}
                services={services}
                incidentalCharges={room.guest?.incidentalCharges || []}
                subtotal={subtotal}
                vat={vat}
                total={total}
                nights={nights}
                companyName={companyName}
                companyTaxCode={companyTaxCode}
                companyAddress={companyAddress}
                processedBy={user?.name || 'Admin'}
                checkInDate={room.guest?.checkInDate || ''}
                checkOutDate={room.guest?.checkOutDate || ''}
              />
            </div>
            <div className="p-4 border-t flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowReceipt(false)}
              >
                Đóng
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  window.print();
                  toast.success('Đang in...');
                }}
              >
                <Printer className="w-4 h-4 mr-2" />
                In biên lai
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {step === 'payment' ? (
            <>
              <DialogHeader>
                <DialogTitle>Thanh toán - Phòng {room.number}</DialogTitle>
                <DialogDescription>
                  Khách: {room.guest.name} • Check-out: {room.guest.checkOutDate}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Bill Summary */}
                <Card className="p-4 bg-gray-50">
                  <h3 className="text-gray-900 mb-3">Chi tiết thanh toán</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Tiền phòng ({nights} đêm × ₫{room.price.toLocaleString()})
                      </span>
                      <span className="text-gray-900">₫{roomCharge.toLocaleString()}</span>
                    </div>
                    
                    {services.map((service) => (
                      <div key={service.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-gray-600">
                            {service.name} × {service.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeService(service.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                        <span className="text-gray-900">
                          ₫{(service.price * service.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}

                    {/* Incidental Charges */}
                    {(room.guest.incidentalCharges || []).length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <div className="text-xs text-gray-500 mb-1">Phí phát sinh:</div>
                        {(room.guest.incidentalCharges || []).map((charge) => (
                          <div key={charge.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {charge.description}
                              {charge.quantity > 1 && ` × ${charge.quantity}`}
                            </span>
                            <span className="text-gray-900">
                              ₫{(charge.amount * charge.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </>
                    )}

                    {showAddService ? (
                      <div className="pt-2 pb-2 space-y-2 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Tên dịch vụ"
                            value={newServiceName}
                            onChange={(e) => setNewServiceName(e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            placeholder="Giá"
                            value={newServicePrice}
                            onChange={(e) => setNewServicePrice(e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            placeholder="SL"
                            value={newServiceQty}
                            onChange={(e) => setNewServiceQty(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={addService}
                            className="flex-1"
                          >
                            Thêm
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddService(false)}
                            className="flex-1"
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setShowAddService(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm dịch vụ
                      </Button>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạm tính</span>
                      <span className="text-gray-900">₫{subtotal.toLocaleString()}</span>
                    </div>
                    
                    {documentType === 'invoice' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">VAT (8%)</span>
                        <span className="text-gray-900">₫{vat.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between">
                      <span className="text-gray-900">Tổng cộng</span>
                      <span className="text-blue-600 text-xl">₫{total.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>

                {/* Document Type Selection */}
                <div>
                  <Label className="mb-3 block">Loại chứng từ</Label>
                  <RadioGroup value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
                    <div className="grid grid-cols-2 gap-3">
                      <Card 
                        className={`p-4 cursor-pointer transition-all ${
                          documentType === 'receipt' 
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setDocumentType('receipt')}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="receipt" id="receipt" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Receipt className="w-5 h-5 text-blue-600" />
                              <Label htmlFor="receipt" className="cursor-pointer">
                                Biên lai
                              </Label>
                            </div>
                            <p className="text-xs text-gray-500">Không có VAT</p>
                          </div>
                        </div>
                      </Card>
                      
                      <Card 
                        className={`p-4 cursor-pointer transition-all ${
                          documentType === 'invoice' 
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setDocumentType('invoice')}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="invoice" id="invoice" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-5 h-5 text-purple-600" />
                              <Label htmlFor="invoice" className="cursor-pointer">
                                Hóa đơn VAT
                              </Label>
                            </div>
                            <p className="text-xs text-gray-500">Có VAT 8%</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </RadioGroup>
                </div>

                {/* Invoice Details */}
                {documentType === 'invoice' && (
                  <Card className="p-4 bg-purple-50 border-purple-200">
                    <h4 className="text-sm text-purple-900 mb-3">Thông tin công ty</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="company-name" className="text-xs">Tên công ty</Label>
                        <Input
                          id="company-name"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Công ty TNHH ABC"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="tax-code" className="text-xs">Mã số thuế</Label>
                        <Input
                          id="tax-code"
                          value={companyTaxCode}
                          onChange={(e) => setCompanyTaxCode(e.target.value)}
                          placeholder="0123456789"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="company-address" className="text-xs">Địa chỉ công ty</Label>
                        <Input
                          id="company-address"
                          value={companyAddress}
                          onChange={(e) => setCompanyAddress(e.target.value)}
                          placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                          required
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Payment Method Selection */}
                <div>
                  <Label className="mb-3 block">Phương thức thanh toán</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <Card
                            key={method.value}
                            className={`p-3 cursor-pointer transition-all ${
                              paymentMethod === method.value
                                ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setPaymentMethod(method.value)}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <RadioGroupItem value={method.value} id={method.value} className="sr-only" />
                              <Icon className={`w-6 h-6 ${
                                paymentMethod === method.value ? 'text-green-600' : 'text-gray-400'
                              }`} />
                              <Label htmlFor={method.value} className="cursor-pointer text-xs text-center">
                                {method.label}
                              </Label>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </div>

                {/* Bank Transfer Info */}
                {paymentMethod === 'bank-transfer' && hotel?.bankAccount && (
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <h4 className="text-sm text-blue-900 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Thông tin chuyển khoản
                    </h4>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-700">Ngân hàng:</span>
                        <span className="text-sm text-blue-900">{hotel.bankAccount.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-700">Số tài khoản:</span>
                        <span className="text-sm text-blue-900 tracking-wider">
                          {hotel.bankAccount.accountNumber}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-700">Chủ tài khoản:</span>
                        <span className="text-sm text-blue-900">{hotel.bankAccount.accountHolder}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-700">Số tiền:</span>
                        <span className="text-blue-900">₫{total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-blue-700">Nội dung:</span>
                        <span className="text-sm text-blue-900 text-right">
                          Thanh toan phong {room.number}
                        </span>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex flex-col items-center">
                      <p className="text-xs text-blue-700 mb-2">Quét mã QR để thanh toán</p>
                      <div className="bg-white p-3 rounded-lg border-2 border-blue-300">
                        <img
                          src={generateQRCode()}
                          alt="QR Code thanh toán"
                          className="w-40 h-40"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {paymentMethod === 'bank-transfer' && !hotel?.bankAccount && (
                  <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Chưa cấu hình thông tin tài khoản ngân hàng. Vui lòng liên hệ quản trị viên.
                    </p>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handlePayment}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={documentType === 'invoice' && (!companyName || !companyTaxCode || !companyAddress)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Xác nhận thanh toán
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Thanh toán thành công!</DialogTitle>
                <DialogDescription>
                  {documentType === 'invoice' ? 'Hóa đơn VAT' : 'Biên lai'} đã được tạo
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-col items-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-gray-900 mb-2">Thanh toán thành công</h3>
                  <p className="text-gray-600 text-center">
                    Phòng {room.number} đã check-out
                  </p>
                </div>

                <Card className="p-4 bg-gray-50">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền</span>
                      <span className="text-gray-900">₫{total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phương thức</span>
                      <span className="text-gray-900">
                        {paymentMethods.find(m => m.value === paymentMethod)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chứng từ</span>
                      <span className="text-gray-900">
                        {documentType === 'invoice' ? 'Hóa đơn VAT' : 'Biên lai'}
                      </span>
                    </div>
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handlePreviewReceipt}
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Xem trước
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handlePrintAndClose}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    In & Đóng
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      toast.success(`${documentType === 'invoice' ? 'Hóa đơn' : 'Biên lai'} đã được tạo!`);
                      onComplete();
                      onClose();
                    }}
                  >
                    Hoàn tất
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}