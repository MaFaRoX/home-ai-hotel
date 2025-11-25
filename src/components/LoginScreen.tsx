'use client'

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Hotel, Mail } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { BusinessModel } from '../types';
import { businessModelInfo } from '../utils/businessModelFeatures';
import { toast } from 'sonner';

export function LoginScreen() {
  const { hotel, businessModel, login, setupHotel } = useApp();
  const [email, setEmail] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [hotelName, setHotelName] = useState('');
  const [adminName, setAdminName] = useState('');

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hotel) {
      // No hotel setup yet, show setup dialog
      setShowSetup(true);
      return;
    }

    // Check if this email is registered
    const isAdmin = email === hotel.adminEmail;
    const staff = hotel.staff.find(s => s.email === email);

    if (isAdmin) {
      // Auto-fill admin name for demo
      login(email, 'Admin');
      toast.success('Đăng nhập thành công!');
    } else if (staff) {
      login(email, staff.name);
      toast.success('Đăng nhập thành công!');
    } else {
      toast.error('Email chưa được đăng ký. Vui lòng liên hệ quản trị viên.');
    }
  };

  const handleSetupHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessModel) {
      toast.error('Vui lòng chọn mô hình kinh doanh trước');
      return;
    }
    setupHotel(hotelName, email, adminName, businessModel);
    setShowSetup(false);
    toast.success('Khách sạn đã được thiết lập thành công!');
  };

  const handleGoogleLogin = () => {
    // Demo: login as admin with pre-set email
    if (!hotel) {
      setEmail('admin@hotel.com');
      setShowSetup(true);
    } else {
      setEmail(hotel.adminEmail);
      login(hotel.adminEmail, 'Admin');
      toast.success('Đăng nhập với Google thành công!');
    }
  };

  // Get business model info for display
  const modelInfo = businessModel ? businessModelInfo[businessModel] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Hotel className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-gray-900 mb-2">Live Grid Hotel</h1>
          <p className="text-gray-500">Một màn hình, Một chạm</p>
          {modelInfo && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
              <span className="text-xl">{modelInfo.icon}</span>
              <span className="text-sm text-blue-900">{modelInfo.title}</span>
            </div>
          )}
        </div>

        {/* Social Login */}
        <div className="space-y-3 mb-6">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Tiếp tục với Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Tiếp tục với Apple
          </Button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Hoặc</span>
          </div>
        </div>

        {/* Email Login */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Gửi link đăng nhập qua Email
          </Button>
        </form>

        {hotel && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4 mb-3">
              <p className="text-sm text-blue-900 mb-2">
                <strong>Hướng dẫn đăng nhập:</strong>
              </p>
              <p className="text-xs text-blue-700 mb-1">
                Nhập một trong các email dưới đây vào ô email và nhấn nút đăng nhập
              </p>
            </div>
            <p className="text-sm text-gray-700 mb-2">Tài khoản demo:</p>
            <div className="space-y-2">
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-purple-600 mb-1">👑 Quản trị viên</p>
                <p className="text-sm text-purple-900 font-mono">{hotel.adminEmail}</p>
              </div>
              {hotel.staff.map((s, i) => (
                <div key={i} className={`rounded-lg p-3 border ${
                  s.role === 'receptionist' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <p className={`text-xs mb-1 ${
                    s.role === 'receptionist' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {s.role === 'receptionist' ? '👔 Lễ tân' : '🧹 Buồng phòng'}
                  </p>
                  <p className={`text-sm font-mono ${
                    s.role === 'receptionist' ? 'text-green-900' : 'text-orange-900'
                  }`}>
                    {s.email}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{s.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Setup Hotel Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thiết lập Khách sạn</DialogTitle>
            <DialogDescription>
              Nhập thông tin khách sạn của bạn để bắt đầu
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSetupHotel} className="space-y-4">
            <div>
              <Label htmlFor="admin-name">Tên của bạn</Label>
              <Input
                id="admin-name"
                placeholder="Nguyễn Văn A"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="hotel-name">Tên khách sạn/nhà nghỉ</Label>
              <Input
                id="hotel-name"
                placeholder="ABC Hotel"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                required
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-blue-900">
                Email của bạn ({email}) sẽ được đăng ký làm tài khoản quản trị viên (Admin).
              </p>
              {businessModel === 'hotel' && (
                <>
                  <p className="text-xs text-blue-700">
                    Hệ thống sẽ tự động tạo 2 tài khoản nhân viên demo để bạn thử nghiệm:
                  </p>
                  <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                    <li><strong>letan@demo.com</strong> - Lễ tân (có thể check-in/check-out)</li>
                    <li><strong>buongphong@demo.com</strong> - Buồng phòng (có thể dọn phòng)</li>
                  </ul>
                </>
              )}
              {(businessModel === 'guesthouse' || businessModel === 'boarding-house') && (
                <p className="text-xs text-blue-700">
                  Với mô hình {businessModel === 'guesthouse' ? 'Nhà nghỉ' : 'Nhà trọ'}, bạn sẽ tự quản lý tất cả (không có nhân viên riêng).
                </p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Hoàn tất thiết lập
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
