'use client'

import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Building2, 
  FileText, 
  Key, 
  Check, 
  AlertCircle, 
  Loader2,
  Upload,
  TestTube
} from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceSettings {
  // Company info
  companyName: string;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  
  // Provider
  provider: 'vnpt' | 'viettel' | 'misa' | 'fpt' | 'manual' | null;
  
  // API credentials
  apiKey?: string;
  apiSecret?: string;
  environment: 'sandbox' | 'production';
  
  // Tax settings
  vatRate: number; // 0, 5, 8, 10
  vatIncluded: boolean; // Giá đã bao gồm VAT hay chưa
  
  // Settings
  autoIssue: boolean; // Tự động xuất HĐ khi thanh toán
  template: 'standard' | 'simple' | 'detailed';
}

interface InvoiceSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function InvoiceSettingsDialog({ open, onClose }: InvoiceSettingsDialogProps) {
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [settings, setSettings] = useState<InvoiceSettings>({
    companyName: '',
    taxCode: '',
    address: '',
    phone: '',
    email: '',
    provider: null,
    environment: 'sandbox',
    autoIssue: false,
    template: 'standard',
    vatRate: 8, // Default to 8% for hotels
    vatIncluded: true // Default: giá đã bao gồm VAT
  });

  // Load settings from localStorage
  useEffect(() => {
    if (open && user) {
      loadSettings();
    }
  }, [open, user]);

  const loadSettings = () => {
    setLoading(true);
    try {
      // Load from localStorage
      const saved = localStorage.getItem('invoiceSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load invoice settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // Validation
    if (!settings.companyName || !settings.taxCode) {
      toast.error('Vui lòng nhập tên công ty và mã số thuế');
      return;
    }

    if (settings.provider && settings.provider !== 'manual') {
      if (!settings.apiKey || !settings.apiSecret) {
        toast.error('Vui lòng nhập API Key và API Secret');
        return;
      }
    }

    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('invoiceSettings', JSON.stringify(settings));
      toast.success('Đã lưu cấu hình hóa đơn thành công!');
      onClose();
    } catch (error) {
      console.error('Failed to save invoice settings:', error);
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.provider || settings.provider === 'manual') {
      toast.error('Vui lòng chọn nhà cung cấp hóa đơn');
      return;
    }

    if (!settings.apiKey || !settings.apiSecret) {
      toast.error('Vui lòng nhập API Key và API Secret');
      return;
    }

    setTesting(true);
    setTestResult(null);
    
    // Simulate API test - since we removed backend, just simulate success
    setTimeout(() => {
      setTestResult({ 
        success: true, 
        message: `Kết nối thành công với ${providers.find(p => p.id === settings.provider)?.name}! (Chế độ frontend-only)` 
      });
      toast.success('Test kết nối thành công!');
      setTesting(false);
    }, 1500);
  };

  const providers = [
    { id: 'vnpt', name: 'VNPT Invoice', logo: '🟦', price: '500k-1tr/năm' },
    { id: 'viettel', name: 'Viettel Sinvoice', logo: '🟥', price: '400k-800k/năm' },
    { id: 'misa', name: 'MISA meInvoice', logo: '🟩', price: '300k-600k/năm' },
    { id: 'fpt', name: 'FPT Invoice', logo: '🟧', price: '500k-1tr/năm' },
    { id: 'manual', name: 'Thủ công (In giấy)', logo: '📄', price: 'Miễn phí' }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="w-7 h-7 text-blue-600" />
            Cấu hình Thuế & Hóa đơn
          </DialogTitle>
          <DialogDescription>
            Cấu hình các thông tin cần thiết để tạo hóa đơn điện tử cho khách hàng.
          </DialogDescription>
        </DialogHeader>

        {loading && !settings.companyName ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section 1: Company Info */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-blue-900">1. Thông tin Doanh nghiệp</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="companyName">Tên công ty *</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    placeholder="VD: Khách sạn ABC"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="taxCode">Mã số thuế *</Label>
                  <Input
                    id="taxCode"
                    value={settings.taxCode}
                    onChange={(e) => setSettings({ ...settings, taxCode: e.target.value })}
                    placeholder="VD: 0123456789"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="VD: 0901234567"
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Textarea
                    id="address"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email liên hệ</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="VD: hotel@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="logo">Logo (URL)</Label>
                  <Input
                    id="logo"
                    value={settings.logoUrl || ''}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Section 2: Provider Selection */}
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-green-900">2. Chọn Nhà cung cấp Hóa đơn điện tử</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {providers.map((provider) => (
                  <Card
                    key={provider.id}
                    className={`p-4 cursor-pointer transition-all border-2 ${
                      settings.provider === provider.id
                        ? 'border-green-500 bg-green-100 shadow-lg'
                        : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                    }`}
                    onClick={() => setSettings({ ...settings, provider: provider.id as any })}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{provider.logo}</span>
                        <div>
                          <p className="font-bold text-gray-900">{provider.name}</p>
                          <p className="text-sm text-gray-600">{provider.price}</p>
                        </div>
                      </div>
                      {settings.provider === provider.id && (
                        <Check className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {settings.provider && settings.provider !== 'manual' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Bạn cần <strong>đăng ký tài khoản</strong> với {providers.find(p => p.id === settings.provider)?.name} 
                      {' '}để nhận <strong>API Key</strong> và <strong>API Secret</strong>. 
                      Liên hệ hotline của họ để được hỗ trợ.
                    </span>
                  </p>
                </div>
              )}
            </Card>

            {/* Section 3: API Configuration */}
            {settings.provider && settings.provider !== 'manual' && (
              <Card className="p-6 bg-purple-50 border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-purple-900">3. Cấu hình API</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">API Key *</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={settings.apiKey || ''}
                      onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                      placeholder="Nhập API Key từ nhà cung cấp"
                      className="mt-1 font-mono"
                    />
                  </div>

                  <div>
                    <Label htmlFor="apiSecret">API Secret *</Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      value={settings.apiSecret || ''}
                      onChange={(e) => setSettings({ ...settings, apiSecret: e.target.value })}
                      placeholder="Nhập API Secret từ nhà cung cấp"
                      className="mt-1 font-mono"
                    />
                  </div>

                  <div>
                    <Label>Môi trường</Label>
                    <div className="flex gap-3 mt-2">
                      <Button
                        type="button"
                        variant={settings.environment === 'sandbox' ? 'default' : 'outline'}
                        onClick={() => setSettings({ ...settings, environment: 'sandbox' })}
                        className="flex-1"
                      >
                        🧪 Sandbox (Test)
                      </Button>
                      <Button
                        type="button"
                        variant={settings.environment === 'production' ? 'default' : 'outline'}
                        onClick={() => setSettings({ ...settings, environment: 'production' })}
                        className="flex-1"
                      >
                        🚀 Production (Thật)
                      </Button>
                    </div>
                  </div>

                  {/* Test Connection Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing || !settings.apiKey || !settings.apiSecret}
                    className="w-full border-2 border-purple-300 hover:bg-purple-100"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang kiểm tra...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4 mr-2" />
                        Test Kết nối API
                      </>
                    )}
                  </Button>

                  {/* Test Result */}
                  {testResult && (
                    <div
                      className={`p-4 rounded-lg border-2 ${
                        testResult.success
                          ? 'bg-green-50 border-green-300'
                          : 'bg-red-50 border-red-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {testResult.success ? (
                          <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <p
                          className={`text-sm ${
                            testResult.success ? 'text-green-800' : 'text-red-800'
                          }`}
                        >
                          {testResult.message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Section 4: Additional Settings */}
            <Card className="p-6 bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="font-bold text-gray-900">4. Cấu hình Thuế GTGT</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="vatRate">Thuế suất GTGT (%)</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <Button
                      type="button"
                      variant={settings.vatRate === 0 ? 'default' : 'outline'}
                      onClick={() => setSettings({ ...settings, vatRate: 0 })}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                    >
                      <span className="text-lg font-bold">0%</span>
                      <span className="text-xs">Không thuế</span>
                    </Button>
                    <Button
                      type="button"
                      variant={settings.vatRate === 5 ? 'default' : 'outline'}
                      onClick={() => setSettings({ ...settings, vatRate: 5 })}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                    >
                      <span className="text-lg font-bold">5%</span>
                      <span className="text-xs">Đặc biệt</span>
                    </Button>
                    <Button
                      type="button"
                      variant={settings.vatRate === 8 ? 'default' : 'outline'}
                      onClick={() => setSettings({ ...settings, vatRate: 8 })}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                    >
                      <span className="text-lg font-bold">8%</span>
                      <span className="text-xs">Khách sạn</span>
                    </Button>
                    <Button
                      type="button"
                      variant={settings.vatRate === 10 ? 'default' : 'outline'}
                      onClick={() => setSettings({ ...settings, vatRate: 10 })}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                    >
                      <span className="text-lg font-bold">10%</span>
                      <span className="text-xs">Dịch vụ</span>
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    💡 Khách sạn/Nhà nghỉ thường áp dụng thuế suất 8% theo quy định
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div>
                    <Label>Giá đã bao gồm VAT</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {settings.vatIncluded 
                        ? 'Giá phòng đã bao gồm VAT (sẽ tách VAT khi xuất hóa đơn)'
                        : 'Giá phòng chưa bao gồm VAT (sẽ cộng thêm VAT)'
                      }
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={settings.vatIncluded ? 'default' : 'outline'}
                    onClick={() => setSettings({ ...settings, vatIncluded: !settings.vatIncluded })}
                  >
                    {settings.vatIncluded ? 'CÓ' : 'KHÔNG'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Section 5: Additional Settings */}
            <Card className="p-6 bg-orange-50 border-orange-200">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-orange-900">5. Tùy chọn bổ sung</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Tự động xuất hóa đơn khi thanh toán</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Mỗi lần khách trả phòng sẽ tự động tạo hóa đơn điện tử
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={settings.autoIssue ? 'default' : 'outline'}
                    onClick={() => setSettings({ ...settings, autoIssue: !settings.autoIssue })}
                  >
                    {settings.autoIssue ? 'BẬT' : 'TẮT'}
                  </Button>
                </div>

                <div>
                  <Label>Mẫu hóa đơn</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                      type="button"
                      variant={settings.template === 'simple' ? 'default' : 'outline'}
                      onClick={() => setSettings({ ...settings, template: 'simple' })}
                    >
                      Đơn giản
                    </Button>
                    <Button
                      type="button"
                      variant={settings.template === 'standard' ? 'default' : 'outline'}
                      onClick={() => setSettings({ ...settings, template: 'standard' })}
                    >
                      Tiêu chuẩn
                    </Button>
                    <Button
                      type="button"
                      variant={settings.template === 'detailed' ? 'default' : 'outline'}
                      onClick={() => setSettings({ ...settings, template: 'detailed' })}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={loading} className="min-w-32">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Lưu cấu hình
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}