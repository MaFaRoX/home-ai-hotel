'use client'

import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Download,
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  DollarSign,
  BedDouble,
  FileText,
  Percent,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

export function ReportsManagement() {
  const { rooms, payments, hotel } = useApp();
  const { language, t } = useLanguage();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [selectedReceptionist, setSelectedReceptionist] = useState<string>('all');

  // Filter payments by date range
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const paymentDate = parseISO(payment.timestamp);
      const inDateRange = isWithinInterval(paymentDate, { start: dateRange.from, end: dateRange.to });
      
      let matchesRoomType = true;
      if (selectedRoomType !== 'all') {
        const room = rooms.find(r => r.number === payment.roomNumber);
        matchesRoomType = room?.type === selectedRoomType;
      }

      let matchesReceptionist = true;
      if (selectedReceptionist !== 'all') {
        matchesReceptionist = payment.processedBy === selectedReceptionist;
      }

      return inDateRange && matchesRoomType && matchesReceptionist;
    });
  }, [payments, dateRange, selectedRoomType, selectedReceptionist, rooms]);

  // Calculate overview statistics
  const stats = useMemo(() => {
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.total, 0);
    const totalBookings = filteredPayments.length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const totalRooms = rooms.length;
    const occupancyRate = (occupiedRooms / totalRooms) * 100;
    const avgRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    return {
      totalRevenue,
      totalBookings,
      occupancyRate,
      avgRevenuePerBooking,
      occupiedRooms,
      totalRooms,
    };
  }, [filteredPayments, rooms]);

  // Revenue by day
  const revenueByDay = useMemo(() => {
    const dayMap = new Map<string, number>();
    
    filteredPayments.forEach(payment => {
      const day = format(parseISO(payment.timestamp), 'dd/MM', {
        locale: language === 'vi' ? vi : enUS,
      });
      dayMap.set(day, (dayMap.get(day) || 0) + payment.total);
    });

    return Array.from(dayMap.entries())
      .map(([day, revenue]) => ({ day, revenue }))
      .slice(-14); // Last 14 days
  }, [filteredPayments, language]);

  // Revenue by room type
  const revenueByRoomType = useMemo(() => {
    const typeMap = new Map<string, number>();
    
    filteredPayments.forEach(payment => {
      const room = rooms.find(r => r.number === payment.roomNumber);
      if (room) {
        typeMap.set(room.type, (typeMap.get(room.type) || 0) + payment.total);
      }
    });

    return Array.from(typeMap.entries()).map(([type, revenue]) => ({
      type,
      revenue,
    }));
  }, [filteredPayments, rooms]);

  // Payment methods distribution
  const paymentMethodsData = useMemo(() => {
    const methodMap = new Map<string, number>();
    
    filteredPayments.forEach(payment => {
      methodMap.set(payment.paymentMethod, (methodMap.get(payment.paymentMethod) || 0) + 1);
    });

    return Array.from(methodMap.entries()).map(([method, count]) => ({
      method,
      count,
    }));
  }, [filteredPayments]);

  // Receptionist performance
  const receptionistPerformance = useMemo(() => {
    const perfMap = new Map<string, { bookings: number; revenue: number }>();
    
    filteredPayments.forEach(payment => {
      const current = perfMap.get(payment.processedBy) || { bookings: 0, revenue: 0 };
      perfMap.set(payment.processedBy, {
        bookings: current.bookings + 1,
        revenue: current.revenue + payment.total,
      });
    });

    return Array.from(perfMap.entries())
      .map(([name, data]) => ({
        name,
        bookings: data.bookings,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredPayments]);

  // Top rooms by revenue
  const topRooms = useMemo(() => {
    const roomMap = new Map<string, number>();
    
    filteredPayments.forEach(payment => {
      roomMap.set(payment.roomNumber, (roomMap.get(payment.roomNumber) || 0) + payment.total);
    });

    return Array.from(roomMap.entries())
      .map(([number, revenue]) => {
        const room = rooms.find(r => r.number === number);
        return { number, revenue, type: room?.type || 'Unknown' };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredPayments, rooms]);

  // Helper to remove Vietnamese accents for PDF
  const removeVietnameseAccents = (str: string): string => {
    if (!str) return '';
    
    const accents: { [key: string]: string } = {
      'à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ': 'a',
      'è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ': 'e',
      'ì|í|ị|ỉ|ĩ': 'i',
      'ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ': 'o',
      'ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ': 'u',
      'ỳ|ý|ỵ|ỷ|ỹ': 'y',
      'đ': 'd',
      'À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ': 'A',
      'È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ': 'E',
      'Ì|Í|Ị|Ỉ|Ĩ': 'I',
      'Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ': 'O',
      'Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ': 'U',
      'Ỳ|Ý|Ỵ|Ỷ|Ỹ': 'Y',
      'Đ': 'D',
    };
    
    let result = str;
    for (const [accented, plain] of Object.entries(accents)) {
      result = result.replace(new RegExp(accented, 'g'), plain);
    }
    
    return result;
  };

  // Export to Excel
  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Overview
    const overviewData = [
      ['BÁO CÁO DOANH THU', '', '', ''],
      [hotel?.name || '', '', '', ''],
      [`Từ ${format(dateRange.from, 'dd/MM/yyyy')} đến ${format(dateRange.to, 'dd/MM/yyyy')}`, '', '', ''],
      ['', '', '', ''],
      ['TỔNG QUAN', '', '', ''],
      ['Tổng doanh thu', `₫${stats.totalRevenue.toLocaleString('vi-VN')}`, '', ''],
      ['Tổng bookings', stats.totalBookings, '', ''],
      ['Tỷ lệ lấp đầy', `${stats.occupancyRate.toFixed(1)}%`, '', ''],
      ['Trung bình/booking', `₫${stats.avgRevenuePerBooking.toLocaleString('vi-VN')}`, '', ''],
      ['', '', '', ''],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');
    
    // Sheet 2: Details
    const detailsHeaders = ['Ngày', 'Phòng', 'Khách', 'Loại phòng', 'Check-in', 'Check-out', 'Phương thức', 'Lễ tân', 'Doanh thu'];
    const detailsRows = filteredPayments.map(p => {
      const room = rooms.find(r => r.number === p.roomNumber);
      return [
        format(parseISO(p.timestamp), 'dd/MM/yyyy HH:mm'),
        p.roomNumber,
        p.guestName,
        room?.type || '',
        format(parseISO(p.checkInDate), 'dd/MM/yyyy'),
        format(parseISO(p.checkOutDate), 'dd/MM/yyyy'),
        p.paymentMethod,
        p.processedBy,
        p.total,
      ];
    });
    const ws2 = XLSX.utils.aoa_to_sheet([detailsHeaders, ...detailsRows]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Chi tiết');
    
    // Sheet 3: Revenue by Room Type
    const roomTypeHeaders = ['Loại phòng', 'Doanh thu'];
    const roomTypeRows = revenueByRoomType.map(r => [r.type, r.revenue]);
    const ws3 = XLSX.utils.aoa_to_sheet([roomTypeHeaders, ...roomTypeRows]);
    XLSX.utils.book_append_sheet(wb, ws3, 'Theo loại phòng');
    
    // Sheet 4: Receptionist Performance
    const perfHeaders = ['Lễ tân', 'Số bookings', 'Doanh thu', 'TB/Booking'];
    const perfRows = receptionistPerformance.map(p => [
      p.name,
      p.bookings,
      p.revenue,
      p.bookings > 0 ? p.revenue / p.bookings : 0,
    ]);
    const ws4 = XLSX.utils.aoa_to_sheet([perfHeaders, ...perfRows]);
    XLSX.utils.book_append_sheet(wb, ws4, 'Hiệu suất LT');
    
    // Sheet 5: Top Rooms
    const topRoomsHeaders = ['STT', 'Phòng', 'Loại', 'Doanh thu'];
    const topRoomsRows = topRooms.map((r, idx) => [idx + 1, r.number, r.type, r.revenue]);
    const ws5 = XLSX.utils.aoa_to_sheet([topRoomsHeaders, ...topRoomsRows]);
    XLSX.utils.book_append_sheet(wb, ws5, 'Top phòng');
    
    // Download
    XLSX.writeFile(wb, `bao-cao-${format(new Date(), 'dd-MM-yyyy-HHmm')}.xlsx`);
  };

  // Helper function to create chart canvas
  const createChartCanvas = (data: any[], type: 'bar' | 'pie', title: string, colors: string[]) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (type === 'bar') {
      const maxValue = Math.max(...data.map(d => d.value));
      const barWidth = 60;
      const spacing = 80;
      const chartHeight = 300;
      const chartTop = 80;
      
      // Draw bars
      data.forEach((item, index) => {
        const x = 50 + index * spacing;
        const barHeight = (item.value / maxValue) * chartHeight;
        const y = chartTop + chartHeight - barHeight;
        
        // Bar
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Label
        ctx.fillStyle = '#333333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, x + barWidth / 2, chartTop + chartHeight + 20);
        
        // Value
        ctx.fillStyle = '#666666';
        ctx.font = '11px Arial';
        ctx.fillText(item.displayValue || item.value.toString(), x + barWidth / 2, y - 5);
      });
    } else if (type === 'pie') {
      const centerX = 400;
      const centerY = 200;
      const radius = 120;
      
      const total = data.reduce((sum, d) => sum + d.value, 0);
      let currentAngle = -Math.PI / 2;
      
      data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        // Slice
        ctx.fillStyle = colors[index % colors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        // Label
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius + 40);
        const labelY = centerY + Math.sin(labelAngle) * (radius + 40);
        
        ctx.fillStyle = '#333333';
        ctx.font = '12px Arial';
        ctx.textAlign = labelX > centerX ? 'left' : 'right';
        ctx.fillText(item.label, labelX, labelY);
        
        // Percentage
        const percentage = ((item.value / total) * 100).toFixed(1);
        ctx.fillStyle = '#666666';
        ctx.font = '11px Arial';
        ctx.fillText(`${percentage}%`, labelX, labelY + 15);
        
        currentAngle += sliceAngle;
      });
    }
    
    return canvas;
  };

  // Export to PDF
  const exportToPDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    
    // Configure font for better Vietnamese support
    doc.setFont('helvetica');
    
    // Title - Page 1
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94);
    doc.text('BAO CAO DOANH THU', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(removeVietnameseAccents(hotel?.name || ''), 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Tu ${format(dateRange.from, 'dd/MM/yyyy')} den ${format(dateRange.to, 'dd/MM/yyyy')}`,
      105,
      37,
      { align: 'center' }
    );
    
    // Overview stats with colored boxes
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('TONG QUAN', 14, 50);
    
    const statsBoxes = [
      { label: 'Tong doanh thu', value: `${stats.totalRevenue.toLocaleString('vi-VN')} VND`, color: [34, 197, 94] },
      { label: 'Tong bookings', value: `${stats.totalBookings}`, color: [59, 130, 246] },
      { label: 'Ty le lap day', value: `${stats.occupancyRate.toFixed(1)}%`, color: [139, 92, 246] },
      { label: 'Trung binh/booking', value: `${stats.avgRevenuePerBooking.toLocaleString('vi-VN')} VND`, color: [249, 115, 22] },
    ];
    
    let boxX = 14;
    let boxY = 55;
    statsBoxes.forEach((stat, index) => {
      if (index === 2) {
        boxX = 14;
        boxY = 85;
      }
      
      // Box background
      doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
      doc.roundedRect(boxX, boxY, 90, 25, 3, 3, 'F');
      
      // Label
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(stat.label, boxX + 5, boxY + 8);
      
      // Value
      doc.setFontSize(12);
      doc.text(stat.value, boxX + 5, boxY + 18);
      
      boxX += 95;
    });
    
    // Chart 1: Revenue by Day (Bar Chart)
    if (revenueByDay.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('DOANH THU THEO NGAY', 14, 125);
      
      const chartData = revenueByDay.slice(-7).map(d => ({
        label: d.day,
        value: d.revenue,
        displayValue: `${(d.revenue / 1000).toFixed(0)}K`,
      }));
      
      const barCanvas = createChartCanvas(chartData, 'bar', 'Revenue', ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1']);
      const barImage = barCanvas.toDataURL('image/png');
      doc.addImage(barImage, 'PNG', 14, 130, 180, 90);
    }
    
    // Chart 2: Payment Methods (Pie Chart)
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.text('PHAN TICH CHI TIET', 105, 20, { align: 'center' });
    
    if (paymentMethodsData.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('PHUONG THUC THANH TOAN', 14, 35);
      
      const pieData = paymentMethodsData.map(d => ({
        label: removeVietnameseAccents(d.method),
        value: d.count,
      }));
      
      const pieCanvas = createChartCanvas(pieData, 'pie', 'Payment Methods', ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']);
      const pieImage = pieCanvas.toDataURL('image/png');
      doc.addImage(pieImage, 'PNG', 14, 40, 180, 90);
    }
    
    // Revenue by Room Type table
    if (revenueByRoomType.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('DOANH THU THEO LOAI PHONG', 14, 145);
      
      const roomTypeData = revenueByRoomType.map(r => [
        removeVietnameseAccents(r.type),
        `${r.revenue.toLocaleString('vi-VN')} VND`,
      ]);
      
      autoTable(doc, {
        startY: 150,
        head: [['Loai phong', 'Doanh thu']],
        body: roomTypeData,
        theme: 'grid',
        headStyles: { 
          fillColor: [139, 92, 246],
          fontSize: 11,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 10,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });
    }
    
    // Chart 3: Receptionist Performance
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.text('HIEU SUAT NHAN VIEN', 105, 20, { align: 'center' });
    
    if (receptionistPerformance.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('DOANH THU THEO LE TAN', 14, 35);
      
      const perfChartData = receptionistPerformance.slice(0, 6).map(p => ({
        label: removeVietnameseAccents(p.name.substring(0, 10)),
        value: p.revenue,
        displayValue: `${(p.revenue / 1000000).toFixed(1)}M`,
      }));
      
      const perfCanvas = createChartCanvas(perfChartData, 'bar', 'Performance', ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']);
      const perfImage = perfCanvas.toDataURL('image/png');
      doc.addImage(perfImage, 'PNG', 14, 40, 180, 90);
      
      // Detailed table
      doc.setFontSize(14);
      doc.text('CHI TIET HIEU SUAT', 14, 145);
      
      const perfData = receptionistPerformance.map(p => [
        removeVietnameseAccents(p.name),
        `${p.bookings}`,
        `${p.revenue.toLocaleString('vi-VN')} VND`,
        `${(p.revenue / p.bookings).toLocaleString('vi-VN')} VND`,
      ]);
      
      autoTable(doc, {
        startY: 150,
        head: [['Le tan', 'Bookings', 'Doanh thu', 'TB/Booking']],
        body: perfData,
        theme: 'grid',
        headStyles: { 
          fillColor: [16, 185, 129],
          fontSize: 10,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });
    }
    
    // Details page
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.text('CHI TIET GIAO DICH', 105, 20, { align: 'center' });
    
    const detailsData = filteredPayments.slice(0, 40).map(p => {
      const room = rooms.find(r => r.number === p.roomNumber);
      return [
        format(parseISO(p.timestamp), 'dd/MM HH:mm'),
        p.roomNumber,
        removeVietnameseAccents(p.guestName.substring(0, 20)),
        removeVietnameseAccents(room?.type || ''),
        removeVietnameseAccents(p.paymentMethod),
        `${p.total.toLocaleString('vi-VN')}`,
      ];
    });
    
    autoTable(doc, {
      startY: 28,
      head: [['Ngay', 'Phong', 'Khach', 'Loai', 'PT', 'Doanh thu']],
      body: detailsData,
      theme: 'striped',
      headStyles: { 
        fillColor: [59, 130, 246],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });
    
    if (filteredPayments.length > 40) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`(Hien thi 40/${filteredPayments.length} giao dich dau tien)`, 14, (doc as any).lastAutoTable.finalY + 8);
    }
    
    // Footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      
      // Bottom border line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, doc.internal.pageSize.height - 15, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 15);
      
      doc.text(
        `Trang ${i}/${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
      
      doc.text(
        `Tao luc: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        doc.internal.pageSize.width - 14,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    }
    
    doc.save(`bao-cao-${format(new Date(), 'dd-MM-yyyy-HHmm')}.pdf`);
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  const translations = {
    vi: {
      title: 'Báo Cáo & Thống Kê',
      overview: 'Tổng Quan',
      revenue: 'Doanh Thu',
      rooms: 'Phòng',
      staff: 'Nhân Viên',
      details: 'Chi Tiết',
      totalRevenue: 'Tổng doanh thu',
      totalBookings: 'Tổng booking',
      occupancyRate: 'Tỷ lệ lấp đầy',
      avgRevenue: 'TB/Booking',
      revenueByDay: 'Doanh thu theo ngày',
      revenueByRoomType: 'Doanh thu theo loại phòng',
      paymentMethods: 'Phương thức thanh toán',
      topRooms: 'Top 10 phòng theo doanh thu',
      receptionistPerf: 'Hiệu suất lễ tân',
      dateRange: 'Khoảng thời gian',
      filterRoomType: 'Lọc theo loại phòng',
      filterReceptionist: 'Lọc theo lễ tân',
      export: 'Xuất CSV',
      exportExcel: 'Xuất Excel',
      exportPDF: 'Xuất PDF',
      print: 'In báo cáo',
      room: 'Phòng',
      type: 'Loại',
      bookings: 'Bookings',
      receptionist: 'Lễ tân',
      all: 'Tất cả',
      date: 'Ngày',
      guest: 'Khách',
      method: 'Phương thức',
      noData: 'Không có dữ liệu trong khoảng thời gian này',
    },
    en: {
      title: 'Reports & Analytics',
      overview: 'Overview',
      revenue: 'Revenue',
      rooms: 'Rooms',
      staff: 'Staff',
      details: 'Details',
      totalRevenue: 'Total Revenue',
      totalBookings: 'Total Bookings',
      occupancyRate: 'Occupancy Rate',
      avgRevenue: 'Avg/Booking',
      revenueByDay: 'Revenue by Day',
      revenueByRoomType: 'Revenue by Room Type',
      paymentMethods: 'Payment Methods',
      topRooms: 'Top 10 Rooms by Revenue',
      receptionistPerf: 'Receptionist Performance',
      dateRange: 'Date Range',
      filterRoomType: 'Filter by Room Type',
      filterReceptionist: 'Filter by Receptionist',
      export: 'Export CSV',
      exportExcel: 'Export Excel',
      exportPDF: 'Export PDF',
      print: 'Print Report',
      room: 'Room',
      type: 'Type',
      bookings: 'Bookings',
      receptionist: 'Receptionist',
      all: 'All',
      date: 'Date',
      guest: 'Guest',
      method: 'Method',
      noData: 'No data in this period',
    },
  };

  const tr = translations[language];

  const roomTypes = Array.from(new Set(rooms.map(r => r.type)));
  const receptionists = Array.from(new Set(payments.map(p => p.processedBy)));

  return (
    <div className="p-4 space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {tr.title}
            </h2>
            <p className="text-muted-foreground">
              {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToExcel} variant="outline" className="gap-2 bg-green-50 hover:bg-green-100 border-green-300">
              <FileSpreadsheet className="w-4 h-4 text-green-700" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button onClick={exportToPDF} variant="outline" className="gap-2 bg-red-50 hover:bg-red-100 border-red-300">
              <FileDown className="w-4 h-4 text-red-700" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                {tr.dateRange}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex flex-col gap-2 p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
                  }}
                >
                  {language === 'vi' ? 'Tháng này' : 'This month'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const lastMonth = subMonths(new Date(), 1);
                    setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
                  }}
                >
                  {language === 'vi' ? 'Tháng trước' : 'Last month'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const threeMonthsAgo = subMonths(new Date(), 3);
                    setDateRange({ from: startOfMonth(threeMonthsAgo), to: new Date() });
                  }}
                >
                  {language === 'vi' ? '3 tháng' : '3 months'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={tr.filterRoomType} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr.all}</SelectItem>
              {roomTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedReceptionist} onValueChange={setSelectedReceptionist}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={tr.filterReceptionist} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr.all}</SelectItem>
              {receptionists.map(name => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="overview">{tr.overview}</TabsTrigger>
          <TabsTrigger value="revenue">{tr.revenue}</TabsTrigger>
          <TabsTrigger value="rooms">{tr.rooms}</TabsTrigger>
          <TabsTrigger value="staff">{tr.staff}</TabsTrigger>
          <TabsTrigger value="details">{tr.details}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">{tr.totalRevenue}</p>
                  <h3 className="mt-1">₫{stats.totalRevenue.toLocaleString('vi-VN')}</h3>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">{tr.totalBookings}</p>
                  <h3 className="mt-1">{stats.totalBookings}</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">{tr.occupancyRate}</p>
                  <h3 className="mt-1">{stats.occupancyRate.toFixed(1)}%</h3>
                  <p className="text-muted-foreground">{stats.occupiedRooms}/{stats.totalRooms}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Percent className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">{tr.avgRevenue}</p>
                  <h3 className="mt-1">₫{stats.avgRevenuePerBooking.toLocaleString('vi-VN')}</h3>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BedDouble className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Quick charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-4">{tr.revenueByDay}</h3>
              {revenueByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `₫${value.toLocaleString('vi-VN')}`} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-10">{tr.noData}</p>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="mb-4">{tr.paymentMethods}</h3>
              {paymentMethodsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={paymentMethodsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={entry => entry.method}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {paymentMethodsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-10">{tr.noData}</p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-4">{tr.revenueByDay}</h3>
            {revenueByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₫${value.toLocaleString('vi-VN')}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name={tr.revenue} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">{tr.noData}</p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="mb-4">{tr.revenueByRoomType}</h3>
            {revenueByRoomType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByRoomType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="type" />
                  <Tooltip formatter={(value: number) => `₫${value.toLocaleString('vi-VN')}`} />
                  <Bar dataKey="revenue" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">{tr.noData}</p>
            )}
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-4">{tr.topRooms}</h3>
            {topRooms.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{tr.room}</TableHead>
                    <TableHead>{tr.type}</TableHead>
                    <TableHead className="text-right">{tr.revenue}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topRooms.map((room, index) => (
                    <TableRow key={room.number}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{room.number}</Badge>
                      </TableCell>
                      <TableCell>{room.type}</TableCell>
                      <TableCell className="text-right">
                        ₫{room.revenue.toLocaleString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-10">{tr.noData}</p>
            )}
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-4">{tr.receptionistPerf}</h3>
            {receptionistPerformance.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={receptionistPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `₫${value.toLocaleString('vi-VN')}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name={tr.revenue} />
                  </BarChart>
                </ResponsiveContainer>

                <Table className="mt-6">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tr.receptionist}</TableHead>
                      <TableHead className="text-right">{tr.bookings}</TableHead>
                      <TableHead className="text-right">{tr.revenue}</TableHead>
                      <TableHead className="text-right">{tr.avgRevenue}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receptionistPerformance.map(perf => (
                      <TableRow key={perf.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {perf.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{perf.bookings}</TableCell>
                        <TableCell className="text-right">
                          ₫{perf.revenue.toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right">
                          ₫{(perf.revenue / perf.bookings).toLocaleString('vi-VN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-10">{tr.noData}</p>
            )}
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-4">{tr.details}</h3>
            {filteredPayments.length > 0 ? (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tr.date}</TableHead>
                      <TableHead>{tr.room}</TableHead>
                      <TableHead>{tr.guest}</TableHead>
                      <TableHead>{tr.type}</TableHead>
                      <TableHead>{tr.method}</TableHead>
                      <TableHead>{tr.receptionist}</TableHead>
                      <TableHead className="text-right">{tr.revenue}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map(payment => {
                      const room = rooms.find(r => r.number === payment.roomNumber);
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(parseISO(payment.timestamp), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.roomNumber}</Badge>
                          </TableCell>
                          <TableCell>{payment.guestName}</TableCell>
                          <TableCell>{room?.type || '-'}</TableCell>
                          <TableCell>
                            <Badge>{payment.paymentMethod}</Badge>
                          </TableCell>
                          <TableCell>{payment.processedBy}</TableCell>
                          <TableCell className="text-right">
                            ₫{payment.total.toLocaleString('vi-VN')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">{tr.noData}</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
