'use client'

import { useRef } from 'react';
import { Button } from './ui/button';
import { Download, Printer } from 'lucide-react';

interface InvoicePDFProps {
  invoice: {
    id: string;
    invoiceNumber?: string;
    customerName?: string;
    customerTaxCode?: string;
    customerEmail?: string;
    roomNumber: string;
    checkInDate: string;
    checkOutDate: string;
    amountBeforeVAT: number;
    vatRate: number;
    vatAmount: number;
    totalAmount: number;
    paymentMethod: string;
    createdAt: string;
    companyInfo: {
      name: string;
      taxCode: string;
      address: string;
      phone: string;
      email: string;
    };
  };
}

export function InvoicePDF({ invoice }: InvoicePDFProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    // Use browser's print to PDF feature
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = printRef.current?.innerHTML || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Hóa đơn ${invoice.invoiceNumber || invoice.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              background: white;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 1px solid #ddd;
              padding: 40px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
            .company-info { font-size: 12px; color: #666; line-height: 1.6; }
            .invoice-title {
              text-align: center;
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin: 30px 0;
            }
            .invoice-number {
              text-align: center;
              font-size: 14px;
              color: #666;
              margin-bottom: 30px;
            }
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-box {
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 4px;
            }
            .info-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 14px;
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
            }
            th {
              background: #f3f4f6;
              padding: 12px;
              text-align: left;
              font-size: 12px;
              font-weight: 600;
              border: 1px solid #ddd;
            }
            td {
              padding: 12px;
              border: 1px solid #ddd;
              font-size: 14px;
            }
            .text-right { text-align: right; }
            .total-section {
              margin-top: 20px;
              border-top: 2px solid #000;
              padding-top: 15px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 14px;
            }
            .total-row.final {
              font-size: 18px;
              font-weight: bold;
              color: #2563eb;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 11px;
              color: #666;
            }
            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-top: 40px;
              text-align: center;
            }
            .signature-box {
              padding: 20px 0;
            }
            .signature-title {
              font-weight: 600;
              margin-bottom: 60px;
            }
            .signature-name {
              font-style: italic;
              color: #666;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 100);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      {/* Action Buttons */}
      <div className="flex gap-2 mb-4 no-print">
        <Button onClick={handlePrint} variant="outline" className="flex-1">
          <Printer className="w-4 h-4 mr-2" />
          In hóa đơn
        </Button>
        <Button onClick={handleDownloadPDF} className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Tải PDF
        </Button>
      </div>

      {/* Invoice Template */}
      <div ref={printRef} className="invoice-container bg-white border rounded-lg p-8">
        {/* Header */}
        <div className="header text-center border-b-2 border-gray-800 pb-6 mb-8">
          <div className="company-name text-2xl font-bold mb-2">
            {invoice.companyInfo.name}
          </div>
          <div className="company-info text-sm text-gray-600">
            <p>Mã số thuế: {invoice.companyInfo.taxCode}</p>
            <p>Địa chỉ: {invoice.companyInfo.address}</p>
            <p>ĐT: {invoice.companyInfo.phone} | Email: {invoice.companyInfo.email}</p>
          </div>
        </div>

        {/* Title */}
        <div className="invoice-title text-3xl font-bold text-center text-blue-600 my-8">
          HÓA ĐƠN GIÁ TRỊ GIA TĂNG
        </div>

        {/* Invoice Number */}
        {invoice.invoiceNumber && (
          <div className="invoice-number text-center text-gray-600 mb-8">
            Số: {invoice.invoiceNumber}
          </div>
        )}

        {/* Customer & Invoice Info */}
        <div className="info-section grid grid-cols-2 gap-4 mb-8">
          <div className="info-box border rounded p-4">
            <div className="info-label text-xs text-gray-600 mb-1">Khách hàng</div>
            <div className="info-value font-semibold">{invoice.customerName || 'Khách lẻ'}</div>
          </div>
          
          <div className="info-box border rounded p-4">
            <div className="info-label text-xs text-gray-600 mb-1">Mã số thuế</div>
            <div className="info-value font-semibold">{invoice.customerTaxCode || '-'}</div>
          </div>

          <div className="info-box border rounded p-4">
            <div className="info-label text-xs text-gray-600 mb-1">Email</div>
            <div className="info-value font-semibold">{invoice.customerEmail || '-'}</div>
          </div>

          <div className="info-box border rounded p-4">
            <div className="info-label text-xs text-gray-600 mb-1">Ngày lập</div>
            <div className="info-value font-semibold">{formatDate(invoice.createdAt)}</div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <table className="w-full border-collapse my-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">STT</th>
              <th className="border p-3 text-left">Dịch vụ</th>
              <th className="border p-3 text-left">Thời gian</th>
              <th className="border p-3 text-right">Đơn giá</th>
              <th className="border p-3 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-3">1</td>
              <td className="border p-3">
                <div className="font-semibold">Dịch vụ lưu trú</div>
                <div className="text-sm text-gray-600">Phòng {invoice.roomNumber}</div>
              </td>
              <td className="border p-3 text-sm">
                <div>Nhận: {formatDate(invoice.checkInDate)}</div>
                <div>Trả: {formatDate(invoice.checkOutDate)}</div>
              </td>
              <td className="border p-3 text-right">
                {formatCurrency(invoice.amountBeforeVAT)}₫
              </td>
              <td className="border p-3 text-right font-semibold">
                {formatCurrency(invoice.amountBeforeVAT)}₫
              </td>
            </tr>
          </tbody>
        </table>

        {/* Total Section */}
        <div className="total-section border-t-2 border-gray-800 pt-4 mt-6">
          <div className="total-row flex justify-between py-2">
            <span>Tổng tiền hàng (chưa VAT)</span>
            <span className="font-semibold">{formatCurrency(invoice.amountBeforeVAT)}₫</span>
          </div>
          
          {invoice.vatRate > 0 && (
            <div className="total-row flex justify-between py-2">
              <span>VAT ({invoice.vatRate}%)</span>
              <span className="font-semibold">{formatCurrency(invoice.vatAmount)}₫</span>
            </div>
          )}
          
          <div className="total-row final flex justify-between py-3 mt-3 border-t text-lg font-bold text-blue-600">
            <span>TỔNG CỘNG</span>
            <span>{formatCurrency(invoice.totalAmount)}₫</span>
          </div>

          <div className="text-sm text-gray-600 mt-4">
            <p>Hình thức thanh toán: {invoice.paymentMethod}</p>
            <p className="italic mt-2">
              Số tiền bằng chữ: <span className="font-semibold">{convertNumberToVietnameseWords(invoice.totalAmount)} đồng</span>
            </p>
          </div>
        </div>

        {/* Signature Section */}
        <div className="signature-section grid grid-cols-2 gap-8 mt-12">
          <div className="signature-box text-center">
            <div className="signature-title font-semibold mb-16">Khách hàng</div>
            <div className="signature-name italic text-gray-600">(Ký, ghi rõ họ tên)</div>
          </div>
          <div className="signature-box text-center">
            <div className="signature-title font-semibold mb-16">Người lập phiếu</div>
            <div className="signature-name italic text-gray-600">(Ký, ghi rõ họ tên)</div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer text-center text-xs text-gray-500 mt-12 pt-6 border-t">
          <p>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
          <p className="mt-2">Hóa đơn được xuất tự động từ hệ thống quản lý khách sạn</p>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert number to Vietnamese words
function convertNumberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không';
  
  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
  const scales = ['', 'nghìn', 'triệu', 'tỷ'];

  function convertGroup(n: number): string {
    if (n === 0) return '';
    
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const one = n % 10;
    
    let result = '';
    
    if (hundred > 0) {
      result += ones[hundred] + ' trăm';
      if (ten === 0 && one > 0) result += ' lẻ';
    }
    
    if (ten > 1) {
      result += ' ' + tens[ten];
      if (one === 1) result += ' mốt';
      else if (one === 5) result += ' lăm';
      else if (one > 0) result += ' ' + ones[one];
    } else if (ten === 1) {
      result += ' mười';
      if (one === 5) result += ' lăm';
      else if (one > 0) result += ' ' + ones[one];
    } else if (one > 0) {
      result += ' ' + ones[one];
    }
    
    return result.trim();
  }

  const groups: string[] = [];
  let scaleIndex = 0;
  
  while (num > 0) {
    const group = num % 1000;
    if (group > 0) {
      const groupWords = convertGroup(group);
      groups.unshift(groupWords + (scaleIndex > 0 ? ' ' + scales[scaleIndex] : ''));
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }
  
  let result = groups.join(' ');
  result = result.charAt(0).toUpperCase() + result.slice(1);
  
  return result;
}
