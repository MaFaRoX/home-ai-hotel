'use client'

import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ExportReportButtons } from './ExportReportButtons';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Clock,
  Users,
  Home
} from 'lucide-react';

interface GuestHouseRevenueDialogProps {
  open: boolean;
  onClose: () => void;
}

interface RevenueData {
  date: string;
  amount: number;
  roomNumber: string;
  guestName: string;
  isHourly: boolean;
  paymentMethod: string;
}

export function GuestHouseRevenueDialog({ open, onClose }: GuestHouseRevenueDialogProps) {
  const { rooms } = useApp();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'today' | 'month' | 'year'>('today');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  // Collect all revenue data
  const revenueHistory = useMemo(() => {
    const history: RevenueData[] = [];
    
    rooms.forEach(room => {
      if (room.guest) {
        history.push({
          date: room.guest.checkInDate,
          amount: room.guest.totalAmount,
          roomNumber: room.number,
          guestName: room.guest.name,
          isHourly: room.guest.isHourly || false,
          paymentMethod: t('revenue.paid') // Simplified
        });
      }
    });

    // Sort by date descending
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [rooms]);

  // Today's revenue
  const todayRevenue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return revenueHistory.filter(r => r.date.startsWith(today));
  }, [revenueHistory]);

  const todayTotal = todayRevenue.reduce((sum, r) => sum + r.amount, 0);
  const todayHourly = todayRevenue.filter(r => r.isHourly).reduce((sum, r) => sum + r.amount, 0);
  const todayDaily = todayRevenue.filter(r => !r.isHourly).reduce((sum, r) => sum + r.amount, 0);

  // This month's revenue
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthRevenue = useMemo(() => {
    return revenueHistory.filter(r => r.date.startsWith(currentMonth));
  }, [revenueHistory, currentMonth]);

  const monthTotal = monthRevenue.reduce((sum, r) => sum + r.amount, 0);
  const monthHourly = monthRevenue.filter(r => r.isHourly).reduce((sum, r) => sum + r.amount, 0);
  const monthDaily = monthRevenue.filter(r => !r.isHourly).reduce((sum, r) => sum + r.amount, 0);

  // This year's revenue
  const currentYear = new Date().getFullYear().toString();
  const yearRevenue = useMemo(() => {
    return revenueHistory.filter(r => r.date.startsWith(currentYear));
  }, [revenueHistory, currentYear]);

  const yearTotal = yearRevenue.reduce((sum, r) => sum + r.amount, 0);
  const yearHourly = yearRevenue.filter(r => r.isHourly).reduce((sum, r) => sum + r.amount, 0);
  const yearDaily = yearRevenue.filter(r => !r.isHourly).reduce((sum, r) => sum + r.amount, 0);

  // Group by month for year view
  const monthlyBreakdown = useMemo(() => {
    const breakdown: { [month: string]: { total: number; count: number } } = {};
    
    yearRevenue.forEach(r => {
      const month = r.date.slice(0, 7); // YYYY-MM
      if (!breakdown[month]) {
        breakdown[month] = { total: 0, count: 0 };
      }
      breakdown[month].total += r.amount;
      breakdown[month].count += 1;
    });

    return Object.entries(breakdown)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, data]) => ({ month, ...data }));
  }, [yearRevenue]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `${t('revenue.monthFormat')} ${month}/${year}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            {t('revenue.title')}
          </DialogTitle>
          <DialogDescription>
            {t('revenue.description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today" className="text-base">
              {t('revenue.today')}
            </TabsTrigger>
            <TabsTrigger value="month" className="text-base">
              {t('revenue.month')}
            </TabsTrigger>
            <TabsTrigger value="year" className="text-base">
              {t('revenue.year')}
            </TabsTrigger>
          </TabsList>

          {/* Today Tab */}
          <TabsContent value="today" className="space-y-4">
            {/* Export Buttons */}
            <ExportReportButtons
              data={todayRevenue.map(r => ({
                date: r.date,
                roomNumber: r.roomNumber,
                guestName: r.guestName,
                amount: r.amount,
                type: r.isHourly ? 'Gio' : 'Ngay'
              }))}
              reportType="guesthouse"
              period="Hom nay"
              summary={{ total: todayTotal }}
            />

            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
                <p className="text-sm text-gray-600 mb-1">{t('revenue.total')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(todayTotal)}₫
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {todayRevenue.length} {t('revenue.transactions')}
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                <p className="text-sm text-gray-600 mb-1">{t('revenue.hourly')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(todayHourly)}₫
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {todayRevenue.filter(r => r.isHourly).length} {t('revenue.transactions')}
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
                <p className="text-sm text-gray-600 mb-1">{t('revenue.daily')}</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(todayDaily)}₫
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {todayRevenue.filter(r => !r.isHourly).length} {t('revenue.transactions')}
                </p>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-3">{t('revenue.todayDetails')}</h3>
              {todayRevenue.length === 0 ? (
                <p className="text-center text-gray-500 py-8">{t('revenue.noRevenueToday')}</p>
              ) : (
                <div className="space-y-2">
                  {todayRevenue.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Home className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{t('common.room')} {item.roomNumber}</p>
                          <p className="text-sm text-gray-600">{item.guestName}</p>
                          <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(item.amount)}₫
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {item.isHourly ? t('room.hourly') : t('room.daily')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Month Tab */}
          <TabsContent value="month" className="space-y-4">
            {/* Export Buttons */}
            <ExportReportButtons
              data={monthRevenue.map(r => ({
                date: r.date,
                roomNumber: r.roomNumber,
                guestName: r.guestName,
                amount: r.amount,
                type: r.isHourly ? 'Gio' : 'Ngay'
              }))}
              reportType="guesthouse"
              period={formatMonth(currentMonth)}
              summary={{ total: monthTotal }}
            />

            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
                <p className="text-sm text-gray-600 mb-1">{t('revenue.totalMonth')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(monthTotal)}₫
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {monthRevenue.length} {t('revenue.transactions')}
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                <p className="text-sm text-gray-600 mb-1">{t('revenue.hourly')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(monthHourly)}₫
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {monthRevenue.filter(r => r.isHourly).length} {t('revenue.transactions')}
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
                <p className="text-sm text-gray-600 mb-1">{t('revenue.daily')}</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(monthDaily)}₫
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {monthRevenue.filter(r => !r.isHourly).length} {t('revenue.transactions')}
                </p>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-3">
                {t('revenue.monthDetails')} {formatMonth(currentMonth)}
              </h3>
              {monthRevenue.length === 0 ? (
                <p className="text-center text-gray-500 py-8">{t('revenue.noRevenueMonth')}</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {monthRevenue.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Home className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{t('common.room')} {item.roomNumber}</p>
                          <p className="text-sm text-gray-600">{item.guestName}</p>
                          <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(item.amount)}₫
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {item.isHourly ? t('room.hourly') : t('room.daily')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Year Tab */}
          <TabsContent value="year" className="space-y-4">
            {/* Export Buttons */}
            <ExportReportButtons
              data={yearRevenue.map(r => ({
                date: r.date,
                roomNumber: r.roomNumber,
                guestName: r.guestName,
                amount: r.amount,
                type: r.isHourly ? 'Gio' : 'Ngay'
              }))}
              reportType="guesthouse"
              period={`Nam ${currentYear}`}
              summary={{ total: yearTotal }}
            />

            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
                <p className="text-sm text-gray-600 mb-1">{t('revenue.totalYear')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(yearTotal)}₫
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {yearRevenue.length} {t('revenue.transactions')}
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                <p className="text-sm text-gray-600 mb-1">{t('revenue.hourly')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(yearHourly)}₫
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {yearRevenue.filter(r => r.isHourly).length} {t('revenue.transactions')}
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
                <p className="text-sm text-gray-600 mb-1">{t('revenue.daily')}</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(yearDaily)}₫
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {yearRevenue.filter(r => !r.isHourly).length} {t('revenue.transactions')}
                </p>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('revenue.monthlyRevenue')} ({currentYear})
              </h3>
              {monthlyBreakdown.length === 0 ? (
                <p className="text-center text-gray-500 py-8">{t('revenue.noRevenueYear')}</p>
              ) : (
                <div className="space-y-2">
                  {monthlyBreakdown.map((item) => (
                    <div key={item.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{formatMonth(item.month)}</p>
                        <p className="text-sm text-gray-600">{item.count} {t('revenue.checkins')}</p>
                      </div>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(item.total)}₫
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
