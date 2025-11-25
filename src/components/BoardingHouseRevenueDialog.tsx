'use client'

import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ExportReportButtons } from './ExportReportButtons';
import { DollarSign, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface BoardingHouseRevenueDialogProps {
  open: boolean;
  onClose: () => void;
}

type ViewMode = 'month' | 'year';

export function BoardingHouseRevenueDialog({ open, onClose }: BoardingHouseRevenueDialogProps) {
  const { rooms } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Calculate revenue for selected period (month or year)
  const revenueData = useMemo(() => {
    let totalRent = 0;
    let totalElectricity = 0;
    let totalWater = 0;
    let totalInternet = 0;
    let totalOther = 0;
    let paidRooms = 0;
    let unpaidRooms = 0;
    const detailedData: any[] = [];
    const monthlyBreakdown: any[] = [];

    if (viewMode === 'month') {
      // Monthly calculation (existing logic)
      rooms.forEach(room => {
        if (!room.tenant) return;

        const monthData = room.tenant.monthlyHistory.find(m => m.month === selectedMonth);
        if (!monthData) return;

        if (monthData.paid) {
          paidRooms++;
          totalRent += monthData.rentAmount;

          let elecCost = 0;
          let waterCost = 0;
          let internetCost = 0;
          let otherCost = 0;

          if (monthData.utilities?.electricity) {
            elecCost = 
              (monthData.utilities.electricity.newReading - monthData.utilities.electricity.oldReading) * 
              monthData.utilities.electricity.pricePerUnit;
            totalElectricity += elecCost;
          }

          if (monthData.utilities?.water) {
            waterCost = 
              (monthData.utilities.water.newReading - monthData.utilities.water.oldReading) * 
              monthData.utilities.water.pricePerUnit;
            totalWater += waterCost;
          }

          if (monthData.utilities?.internet) {
            internetCost = monthData.utilities.internet;
            totalInternet += internetCost;
          }

          if (monthData.utilities?.other) {
            monthData.utilities.other.forEach(item => {
              otherCost += item.amount;
              totalOther += item.amount;
            });
          }

          detailedData.push({
            roomNumber: room.number,
            guestName: room.tenant.name,
            amount: monthData.rentAmount,
            utilities: {
              electricity: elecCost,
              water: waterCost,
              internet: internetCost,
              other: otherCost
            }
          });
        } else {
          unpaidRooms++;
        }
      });
    } else {
      // Yearly calculation - aggregate 12 months
      for (let month = 1; month <= 12; month++) {
        const monthStr = `${selectedYear}-${month.toString().padStart(2, '0')}`;
        let monthRent = 0;
        let monthElectricity = 0;
        let monthWater = 0;
        let monthInternet = 0;
        let monthOther = 0;
        let monthPaidRooms = 0;

        rooms.forEach(room => {
          if (!room.tenant) return;

          const monthData = room.tenant.monthlyHistory.find(m => m.month === monthStr);
          if (!monthData || !monthData.paid) return;

          monthPaidRooms++;
          monthRent += monthData.rentAmount;

          if (monthData.utilities?.electricity) {
            const elecCost = 
              (monthData.utilities.electricity.newReading - monthData.utilities.electricity.oldReading) * 
              monthData.utilities.electricity.pricePerUnit;
            monthElectricity += elecCost;
          }

          if (monthData.utilities?.water) {
            const waterCost = 
              (monthData.utilities.water.newReading - monthData.utilities.water.oldReading) * 
              monthData.utilities.water.pricePerUnit;
            monthWater += waterCost;
          }

          if (monthData.utilities?.internet) {
            monthInternet += monthData.utilities.internet;
          }

          if (monthData.utilities?.other) {
            monthData.utilities.other.forEach(item => {
              monthOther += item.amount;
            });
          }
        });

        const monthTotal = monthRent + monthElectricity + monthWater + monthInternet + monthOther;

        totalRent += monthRent;
        totalElectricity += monthElectricity;
        totalWater += monthWater;
        totalInternet += monthInternet;
        totalOther += monthOther;

        // Add to monthly breakdown for year report
        monthlyBreakdown.push({
          month: monthStr,
          monthName: new Date(monthStr + '-01').toLocaleDateString('vi-VN', { month: 'long' }),
          rent: monthRent,
          electricity: monthElectricity,
          water: monthWater,
          internet: monthInternet,
          other: monthOther,
          total: monthTotal,
          paidRooms: monthPaidRooms
        });
      }

      // For yearly view, show all unique tenants who paid at least once
      const tenantRooms = new Set<string>();
      rooms.forEach(room => {
        if (!room.tenant) return;
        const hasPaidInYear = room.tenant.monthlyHistory.some(
          m => m.month.startsWith(selectedYear) && m.paid
        );
        if (hasPaidInYear) {
          tenantRooms.add(room.number);
        }
      });
      paidRooms = tenantRooms.size;
    }

    const total = totalRent + totalElectricity + totalWater + totalInternet + totalOther;

    return {
      totalRent,
      totalElectricity,
      totalWater,
      totalInternet,
      totalOther,
      total,
      paidRooms,
      unpaidRooms,
      totalRooms: paidRooms + unpaidRooms,
      detailedData,
      monthlyBreakdown
    };
  }, [rooms, selectedMonth, selectedYear, viewMode]);

  // Generate month options (last 12 months + next 3 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    
    for (let i = -12; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthStr = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
      options.push({ value: monthStr, label: monthName });
    }
    
    return options.reverse();
  }, []);

  // Generate year options (last 5 years + next 2 years)
  const yearOptions = useMemo(() => {
    const options = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = -5; i <= 2; i++) {
      const year = currentYear + i;
      options.push({ value: year.toString(), label: `Năm ${year}` });
    }
    
    return options.reverse();
  }, []);

  // Navigate months
  const goToPreviousMonth = () => {
    const date = new Date(selectedMonth + '-01');
    date.setMonth(date.getMonth() - 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const goToNextMonth = () => {
    const date = new Date(selectedMonth + '-01');
    date.setMonth(date.getMonth() + 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  // Navigate years
  const goToPreviousYear = () => {
    const year = parseInt(selectedYear) - 1;
    setSelectedYear(year.toString());
  };

  const goToNextYear = () => {
    const year = parseInt(selectedYear) + 1;
    setSelectedYear(year.toString());
  };

  const formatCurrency = (amount: number) => {
    return `₫${amount.toLocaleString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <DollarSign className="w-7 h-7 text-green-600" />
            Báo Cáo Doanh Thu
          </DialogTitle>
          <DialogDescription>
            Xem chi tiết doanh thu theo tháng và năm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* View Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Theo Tháng
            </Button>
            <Button
              variant={viewMode === 'year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('year')}
              className="flex-1"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Theo Năm
            </Button>
          </div>

          {/* Export Buttons */}
          <ExportReportButtons
            data={viewMode === 'month' ? (revenueData.detailedData || []) : (revenueData.monthlyBreakdown || [])}
            reportType="boarding-house"
            period={viewMode === 'month' 
              ? (monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth)
              : `Năm ${selectedYear}`
            }
            summary={{
              totalRent: revenueData.totalRent,
              totalElectricity: revenueData.totalElectricity,
              totalWater: revenueData.totalWater,
              totalInternet: revenueData.totalInternet,
              totalOther: revenueData.totalOther,
              total: revenueData.total
            }}
            viewMode={viewMode}
          />

          {/* Period Selector */}
          {viewMode === 'month' ? (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                className="shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                className="shrink-0"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousYear}
                className="shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNextYear}
                className="shrink-0"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Total Revenue - Highlighted */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-300">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <h3 className="text-xl text-green-800">
                  {viewMode === 'month' ? 'Tổng Doanh Thu Tháng' : 'Tổng Doanh Thu Năm'}
                </h3>
              </div>
              <p className="text-5xl font-bold text-green-700 mb-2">
                {formatCurrency(revenueData.total)}
              </p>
              <div className="text-green-600 text-sm">
                {viewMode === 'month' 
                  ? `${revenueData.paidRooms}/${revenueData.totalRooms} phòng đã thu tiền`
                  : `${revenueData.paidRooms} phòng có doanh thu`
                }
              </div>
            </div>
          </Card>

          {/* Revenue Breakdown */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Chi Tiết Doanh Thu
            </h3>
            <div className="space-y-3">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Tiền Phòng</p>
                    <p className="text-sm text-gray-500">{revenueData.paidRooms} phòng</p>
                  </div>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(revenueData.totalRent)}
                  </p>
                </div>
              </Card>

              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Tiền Điện</p>
                    <p className="text-sm text-gray-500">Tổng điện năng tiêu thụ</p>
                  </div>
                  <p className="text-xl font-bold text-yellow-700">
                    {formatCurrency(revenueData.totalElectricity)}
                  </p>
                </div>
              </Card>

              <Card className="p-4 bg-cyan-50 border-cyan-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Tiền Nước</p>
                    <p className="text-sm text-gray-500">Tổng nước tiêu thụ</p>
                  </div>
                  <p className="text-xl font-bold text-cyan-700">
                    {formatCurrency(revenueData.totalWater)}
                  </p>
                </div>
              </Card>

              <Card className="p-4 bg-purple-50 border-purple-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Tiền Internet</p>
                    <p className="text-sm text-gray-500">Phí cố định hàng tháng</p>
                  </div>
                  <p className="text-xl font-bold text-purple-700">
                    {formatCurrency(revenueData.totalInternet)}
                  </p>
                </div>
              </Card>

              {revenueData.totalOther > 0 && (
                <Card className="p-4 bg-orange-50 border-orange-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Chi Phí Khác</p>
                      <p className="text-sm text-gray-500">Phí phát sinh</p>
                    </div>
                    <p className="text-xl font-bold text-orange-700">
                      {formatCurrency(revenueData.totalOther)}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-xs text-gray-600 mb-1">Đã Thu</p>
              <p className="text-2xl font-bold text-green-700">
                {revenueData.paidRooms}
              </p>
              <p className="text-xs text-green-600 mt-1">phòng</p>
            </Card>

            <Card className="p-4 bg-red-50 border-red-200">
              <p className="text-xs text-gray-600 mb-1">Chưa Thu</p>
              <p className="text-2xl font-bold text-red-700">
                {revenueData.unpaidRooms}
              </p>
              <p className="text-xs text-red-600 mt-1">phòng</p>
            </Card>
          </div>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full" variant="outline">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
