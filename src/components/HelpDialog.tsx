'use client'

import { BookOpen, Home, DollarSign, Users, FileText, Settings, Zap, Coffee } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useLanguage } from '../contexts/LanguageContext';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-gray-900">
                {t('help.guesthouseTitle')}
              </h3>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6 space-y-6 pb-6">
              {/* Guesthouse Guide */}
              <Card className="p-5 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-blue-900">{t('help.quickStart')}</h4>
                </div>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>✅ <strong>{t('help.step1')}:</strong> {t('add.floorTitle')} {t('common.room')}</li>
                  <li>✅ <strong>{t('help.step2')}:</strong> {t('help.checkinDesc')}</li>
                  <li>✅ <strong>{t('help.step3')}:</strong> {t('room.rentalTypeLabel')} <strong>{t('room.hourly')}</strong>, <strong>{t('room.overnight')}</strong> {t('common.or')} <strong>{t('room.daily')}</strong></li>
                  <li>✅ <strong>{t('help.step4')}:</strong> {t('help.checkoutPaymentDesc')}</li>
                </ul>
              </Card>

              {/* Màu sắc phòng */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  {t('help.roomColors')}
                </h4>
                <div className="space-y-2">
                  <Card className="p-3 bg-gray-200 border-gray-400">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🏠 {t('help.vacantRoom')}</span>
                      <Badge variant="outline" className="bg-white">{t('help.ready')}</Badge>
                    </div>
                  </Card>
                  <Card className="p-3 bg-blue-100 border-blue-400">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🕐 {t('help.hourlyRent')}</span>
                      <Badge variant="outline" className="bg-white">{t('help.inUse')}</Badge>
                    </div>
                  </Card>
                  <Card className="p-3 bg-purple-100 border-purple-400">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🌙 {t('help.overnightRent')}</span>
                      <Badge variant="outline" className="bg-white">{t('help.inUse')}</Badge>
                    </div>
                  </Card>
                  <Card className="p-3 bg-green-100 border-green-400">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">📅 {t('help.dailyRent')}</span>
                      <Badge variant="outline" className="bg-white">{t('help.inUse')}</Badge>
                    </div>
                  </Card>
                  <Card className="p-3 bg-yellow-100 border-yellow-400">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🧹 {t('help.needsCleaning')}</span>
                      <Badge variant="outline" className="bg-white">{t('help.waitingCleaning')}</Badge>
                    </div>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* Quản lý khách */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('help.checkinProcess')}
                </h4>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <div>
                      <p className="font-semibold">{t('help.checkin')}</p>
                      <p className="text-gray-600">{t('help.checkinDesc')} ({t('room.hourly')}, {t('room.overnight')}, {t('room.daily')})</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <div>
                      <p className="font-semibold">{t('help.trackTime')}</p>
                      <p className="text-gray-600">{t('help.trackTimeDesc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <div>
                      <p className="font-semibold">{t('help.checkoutPayment')}</p>
                      <p className="text-gray-600">{t('help.checkoutPaymentDesc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <div>
                      <p className="font-semibold">{t('help.cleanRoom')}</p>
                      <p className="text-gray-600">{t('help.cleanRoomDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quản lý dịch vụ */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Coffee className="w-5 h-5" />
                  {t('help.serviceManagement')}
                </h4>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <div>
                      <p className="font-semibold">{t('help.addServiceList')}</p>
                      <p className="text-gray-600">{t('help.addServiceListDesc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <div>
                      <p className="font-semibold">{t('help.addServiceToRoom')}</p>
                      <p className="text-gray-600">{t('help.addServiceToRoomDesc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <div>
                      <p className="font-semibold">{t('help.servicePayment')}</p>
                      <p className="text-gray-600">{t('help.servicePaymentDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Giá phòng */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {t('help.flexiblePricing')}
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>🕐 <strong>{t('help.hourlyRentDesc')}</strong> {t('help.hourlyRentFull')}</p>
                  <p>🌙 <strong>{t('help.overnightRentDesc')}</strong> {t('help.overnightRentFull')}</p>
                  <p>📅 <strong>{t('help.dailyRentDesc')}</strong> {t('help.dailyRentFull')}</p>
                  <p>💰 <strong>{t('help.allInPricing')}</strong> {t('help.allInPricingDesc')}</p>
                  <p>⚡ <strong>{t('help.autoCalculate')}</strong> {t('help.autoCalculateDesc')}</p>
                </div>
              </div>

              <Separator />

              {/* Báo cáo */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('help.revenueReportGuesthouse')}
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>📊 {t('help.clickMenu')}</p>
                  <p>📅 {t('help.viewRevenue')}</p>
                  <p>📄 {t('help.exportExcelPdf')}</p>
                  <p>💳 {t('help.paymentMethods')}</p>
                </div>
              </div>

              <Separator />

              {/* Tips */}
              <Card className="p-4 bg-amber-50 border-amber-200">
                <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {t('help.tips')}
                </h4>
                <ul className="space-y-1.5 text-sm text-amber-800">
                  <li>💡 {t('help.tip1Guesthouse')}</li>
                  <li>💡 {t('help.tip2Guesthouse')}</li>
                  <li>💡 {t('help.tip3Guesthouse')}</li>
                  <li>💡 {t('help.tip4Guesthouse')}</li>
                </ul>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
