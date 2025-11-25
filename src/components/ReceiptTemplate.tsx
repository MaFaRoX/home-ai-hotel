'use client'

import { forwardRef } from 'react';
import { Room, PaymentMethod, DocumentType, Service, IncidentalCharge } from '../types';

interface ReceiptTemplateProps {
  hotelName: string;
  hotelAddress?: string;
  hotelPhone?: string;
  room: Room;
  documentType: DocumentType;
  paymentMethod: PaymentMethod;
  roomCharge: number;
  services: Service[];
  incidentalCharges: IncidentalCharge[];
  subtotal: number;
  vat: number;
  total: number;
  nights: number;
  companyName?: string;
  companyTaxCode?: string;
  companyAddress?: string;
  processedBy: string;
  checkInDate: string;
  checkOutDate: string;
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  (props, ref) => {
    const {
      hotelName,
      hotelAddress,
      hotelPhone,
      room,
      documentType,
      paymentMethod,
      roomCharge,
      services,
      incidentalCharges,
      subtotal,
      vat,
      total,
      nights,
      companyName,
      companyTaxCode,
      companyAddress,
      processedBy,
      checkInDate,
      checkOutDate,
    } = props;

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const getPaymentMethodText = (method: PaymentMethod) => {
      switch (method) {
        case 'cash': return 'Tiền mặt';
        case 'card': return 'Thẻ tín dụng';
        case 'bank-transfer': return 'Chuyển khoản';
        case 'e-wallet': return 'Ví điện tử';
        default: return method;
      }
    };

    return (
      <div ref={ref} className="receipt-print-container">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .receipt-print-container,
            .receipt-print-container * {
              visibility: visible;
            }
            .receipt-print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20mm;
            }
            @page {
              size: A5;
              margin: 0;
            }
          }
        `}</style>

        <div className="max-w-[148mm] mx-auto p-8 bg-white text-black font-mono text-sm">
          {/* Header */}
          <div className="text-center mb-6 border-b-2 border-dashed border-gray-400 pb-4">
            <h1 className="text-2xl font-bold mb-2">{hotelName}</h1>
            {hotelAddress && <p className="text-xs">{hotelAddress}</p>}
            {hotelPhone && <p className="text-xs">ĐT: {hotelPhone}</p>}
          </div>

          {/* Document Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold uppercase">
              {documentType === 'invoice' ? 'HÓA ĐƠN VAT' : 'BIÊN LAI THANH TOÁN'}
            </h2>
            <p className="text-xs mt-1">
              {formatDate(new Date().toISOString())}
            </p>
          </div>

          {/* Guest Info */}
          <div className="mb-4 space-y-1">
            <div className="flex justify-between">
              <span>Khách hàng:</span>
              <span className="font-bold">{room.guest?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Điện thoại:</span>
              <span>{room.guest?.phone}</span>
            </div>
            {room.guest?.email && (
              <div className="flex justify-between">
                <span>Email:</span>
                <span>{room.guest.email}</span>
              </div>
            )}
          </div>

          {/* Invoice Company Info */}
          {documentType === 'invoice' && companyName && (
            <div className="mb-4 p-2 bg-gray-100 space-y-1">
              <div className="flex justify-between">
                <span>Công ty:</span>
                <span className="font-bold">{companyName}</span>
              </div>
              {companyTaxCode && (
                <div className="flex justify-between">
                  <span>MST:</span>
                  <span>{companyTaxCode}</span>
                </div>
              )}
              {companyAddress && (
                <div className="flex justify-between">
                  <span>Địa chỉ:</span>
                  <span className="text-right text-xs">{companyAddress}</span>
                </div>
              )}
            </div>
          )}

          <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

          {/* Room Info */}
          <div className="mb-4 space-y-1">
            <div className="flex justify-between">
              <span>Số phòng:</span>
              <span className="font-bold">{room.number}</span>
            </div>
            <div className="flex justify-between">
              <span>Loại phòng:</span>
              <span>{room.type}</span>
            </div>
            <div className="flex justify-between">
              <span>Check-in:</span>
              <span>{formatDate(checkInDate)}</span>
            </div>
            <div className="flex justify-between">
              <span>Check-out:</span>
              <span>{formatDate(checkOutDate)}</span>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

          {/* Charges Detail */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">CHI TIẾT THANH TOÁN</h3>
            
            {/* Room Charge */}
            <div className="flex justify-between mb-2">
              <div>
                <div>Tiền phòng</div>
                <div className="text-xs text-gray-600">
                  {nights} đêm × ₫{room.price.toLocaleString()}
                </div>
              </div>
              <div className="text-right font-bold">
                ₫{roomCharge.toLocaleString()}
              </div>
            </div>

            {/* Services */}
            {services.length > 0 && (
              <div className="mb-2">
                <div className="text-xs font-semibold text-gray-600 mb-1">Dịch vụ:</div>
                {services.map((service, idx) => (
                  <div key={idx} className="flex justify-between ml-2 text-sm">
                    <div>
                      • {service.name}
                      {service.quantity > 1 && ` × ${service.quantity}`}
                    </div>
                    <div>₫{(service.price * service.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Incidental Charges */}
            {incidentalCharges.length > 0 && (
              <div className="mb-2">
                <div className="text-xs font-semibold text-gray-600 mb-1">Phí phát sinh:</div>
                {incidentalCharges.map((charge, idx) => (
                  <div key={idx} className="flex justify-between ml-2 text-sm">
                    <div>
                      • {charge.description}
                      {charge.quantity > 1 && ` × ${charge.quantity}`}
                    </div>
                    <div>₫{(charge.amount * charge.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-400 my-3"></div>

          {/* Totals */}
          <div className="space-y-1 mb-4">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>₫{subtotal.toLocaleString()}</span>
            </div>
            
            {documentType === 'invoice' && vat > 0 && (
              <div className="flex justify-between">
                <span>VAT (8%):</span>
                <span>₫{vat.toLocaleString()}</span>
              </div>
            )}
            
            <div className="border-t-2 border-gray-800 pt-2 mt-2"></div>
            
            <div className="flex justify-between text-lg font-bold">
              <span>TỔNG CỘNG:</span>
              <span>₫{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

          {/* Payment Method */}
          <div className="mb-4">
            <div className="flex justify-between">
              <span>Hình thức thanh toán:</span>
              <span className="font-bold">{getPaymentMethodText(paymentMethod)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-400">
            <div className="flex justify-between text-xs">
              <div>
                <p className="mb-1">Người lập:</p>
                <p className="font-semibold">{processedBy}</p>
              </div>
              <div className="text-right">
                <p className="mb-1">Khách hàng</p>
                <p className="italic text-gray-600">(Ký, ghi rõ họ tên)</p>
              </div>
            </div>
          </div>

          {/* Thank you note */}
          <div className="text-center mt-6 pt-4 border-t-2 border-dashed border-gray-400">
            <p className="text-sm">Cảm ơn quý khách! Hẹn gặp lại!</p>
            <p className="text-xs text-gray-600 mt-1">
              {documentType === 'invoice' ? 'Hóa đơn' : 'Biên lai'} được in tự động
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';
