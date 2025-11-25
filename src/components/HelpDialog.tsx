'use client'

import { HelpCircle, BookOpen, Home, DollarSign, Users, FileText, Clock, Calendar, Banknote, Settings, Zap, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
  businessModel: 'boarding-house' | 'guesthouse';
}

export function HelpDialog({ open, onClose, businessModel }: HelpDialogProps) {
  const isBoardingHouse = businessModel === 'boarding-house';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-gray-900">
                {isBoardingHouse ? 'Hướng Dẫn Sử Dụng - Nhà Trọ' : 'Hướng Dẫn Sử Dụng - Nhà Nghỉ'}
              </h3>
            </div>
          </DialogTitle>
          <DialogDescription>
            {isBoardingHouse ? 'Quản lý cho thuê theo tháng với tính năng thu tiền điện nước' : 'Quản lý cho thuê theo giờ/ngày với all-in pricing'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {isBoardingHouse ? (
              <>
                {/* Boarding House Guide */}
                <Card className="p-5 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-blue-900">Bắt Đầu Nhanh</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>✅ <strong>Bước 1:</strong> Thêm tòa nhà (nếu có nhiều tòa)</li>
                    <li>✅ <strong>Bước 2:</strong> Thêm tầng và phòng</li>
                    <li>✅ <strong>Bước 3:</strong> Click vào phòng trống để cho thuê</li>
                    <li>✅ <strong>Bước 4:</strong> Thu tiền hàng tháng vào đầu tháng</li>
                  </ul>
                </Card>

                {/* Màu sắc phòng */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Màu Sắc Phòng
                  </h4>
                  <div className="space-y-2">
                    <Card className="p-3 bg-gray-200 border-gray-400">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🏠 Phòng Trống</span>
                        <Badge variant="outline" className="bg-white">Chưa có khách</Badge>
                      </div>
                    </Card>
                    <Card className="p-3 bg-green-100 border-green-400">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">✅ Đã Thu Tiền Tháng Này</span>
                        <Badge variant="outline" className="bg-white">Đã thanh toán</Badge>
                      </div>
                    </Card>
                    <Card className="p-3 bg-red-100 border-red-400">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">⚠️ Chưa Thu Tiền Tháng Này</span>
                        <Badge variant="outline" className="bg-white">Cần thu tiền</Badge>
                      </div>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* Quản lý khách thuê */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Quản Lý Khách Thuê
                  </h4>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex gap-2">
                      <span className="text-blue-600 font-bold">1.</span>
                      <div>
                        <p className="font-semibold">Cho thuê phòng mới:</p>
                        <p className="text-gray-600">Click vào phòng trống → Nhập thông tin khách → Đặt giá thuê hàng tháng</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-600 font-bold">2.</span>
                      <div>
                        <p className="font-semibold">Thu tiền hàng tháng:</p>
                        <p className="text-gray-600">Click vào phòng → Chọn tháng cần thu → Nhập số điện nước → Xác nhận thanh toán</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-600 font-bold">3.</span>
                      <div>
                        <p className="font-semibold">Trả phòng:</p>
                        <p className="text-gray-600">Click vào phòng → Nút "Trả Phòng" → Xác nhận</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tính năng điện nước */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Banknote className="w-5 h-5" />
                    Quản Lý Điện - Nước - Internet
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>📊 <strong>Điện:</strong> Nhập chỉ số cũ/mới, đơn giá tự động tính</p>
                    <p>💧 <strong>Nước:</strong> Nhập chỉ số cũ/mới, đơn giá tự động tính</p>
                    <p>📡 <strong>Internet:</strong> Phí cố định hàng tháng</p>
                    <p>➕ <strong>Chi phí khác:</strong> Thêm phí phát sinh (rác, bảo vệ...)</p>
                  </div>
                </div>

                <Separator />

                {/* Báo cáo */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Báo Cáo Doanh Thu
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>📈 Click vào card <strong className="text-yellow-700">"Doanh thu"</strong> trên header</p>
                    <p>📅 <strong>Theo Tháng:</strong> Xem chi tiết từng phòng đã thu tiền</p>
                    <p>📆 <strong>Theo Năm:</strong> Xem tổng 12 tháng, breakdown theo tháng</p>
                    <p>📄 <strong>Xuất báo cáo:</strong> Excel hoặc PDF với đầy đủ chi tiết</p>
                  </div>
                </div>

                <Separator />

                {/* Tips */}
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Mẹo Sử Dụng
                  </h4>
                  <ul className="space-y-1.5 text-sm text-amber-800">
                    <li>💡 Nhập chỉ số điện nước vào <strong>cuối tháng</strong> để tính đúng tiền</li>
                    <li>💡 Sử dụng tính năng <strong>Xuất Excel</strong> để lưu trữ báo cáo hàng tháng</li>
                    <li>💡 Đánh dấu màu đỏ giúp bạn nhớ phòng nào <strong>chưa thu tiền</strong></li>
                    <li>💡 Có thể quản lý <strong>nhiều tòa nhà</strong> trong cùng một hệ thống</li>
                  </ul>
                </Card>
              </>
            ) : (
              <>
                {/* Guesthouse Guide */}
                <Card className="p-5 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-blue-900">Bắt Đầu Nhanh</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>✅ <strong>Bước 1:</strong> Thêm tầng và phòng</li>
                    <li>✅ <strong>Bước 2:</strong> Click vào phòng trống để nhận khách</li>
                    <li>✅ <strong>Bước 3:</strong> Chọn thuê <strong>Theo Giờ</strong> hoặc <strong>Theo Ngày</strong></li>
                    <li>✅ <strong>Bước 4:</strong> Thanh toán khi khách trả phòng</li>
                  </ul>
                </Card>

                {/* Màu sắc phòng */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Màu Sắc Phòng
                  </h4>
                  <div className="space-y-2">
                    <Card className="p-3 bg-gray-200 border-gray-400">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🏠 Phòng Trống</span>
                        <Badge variant="outline" className="bg-white">Sẵn sàng</Badge>
                      </div>
                    </Card>
                    <Card className="p-3 bg-blue-100 border-blue-400">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🕐 Thuê Theo Giờ</span>
                        <Badge variant="outline" className="bg-white">Đang sử dụng</Badge>
                      </div>
                    </Card>
                    <Card className="p-3 bg-green-100 border-green-400">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">📅 Thuê Theo Ngày</span>
                        <Badge variant="outline" className="bg-white">Đang sử dụng</Badge>
                      </div>
                    </Card>
                    <Card className="p-3 bg-yellow-100 border-yellow-400">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🧹 Cần Dọn Dẹp</span>
                        <Badge variant="outline" className="bg-white">Chờ dọn</Badge>
                      </div>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* Quản lý khách */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Quy Trình Nhận - Trả Phòng
                  </h4>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex gap-2">
                      <span className="text-blue-600 font-bold">1.</span>
                      <div>
                        <p className="font-semibold">Nhận phòng:</p>
                        <p className="text-gray-600">Click phòng trống → Chọn <strong>Giờ</strong> hoặc <strong>Ngày</strong> → Nhập thông tin khách</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-600 font-bold">2.</span>
                      <div>
                        <p className="font-semibold">Theo dõi thời gian:</p>
                        <p className="text-gray-600">Hệ thống tự động hiển thị thời gian check-in/out trên thẻ phòng</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-600 font-bold">3.</span>
                      <div>
                        <p className="font-semibold">Trả phòng & thanh toán:</p>
                        <p className="text-gray-600">Click vào phòng → Nút "Trả Phòng" → Chọn phương thức thanh toán → Xác nhận</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-600 font-bold">4.</span>
                      <div>
                        <p className="font-semibold">Dọn phòng:</p>
                        <p className="text-gray-600">Sau khi trả, phòng chuyển sang <strong className="text-yellow-600">màu vàng</strong> → Click để đánh dấu "Đã dọn xong"</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Giá phòng */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Giá Phòng Linh Hoạt
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>🕐 <strong>Thuê Giờ:</strong> Tính theo số giờ × đơn giá (tối thiểu 3 giờ)</p>
                    <p>📅 <strong>Thuê Ngày:</strong> Giá cố định theo ngày, không phụ thuộc giờ</p>
                    <p>💰 <strong>All-in Pricing:</strong> Giá đã bao gồm điện, nước, internet</p>
                    <p>⚡ <strong>Tính tiền tự động:</strong> Hệ thống tính toán khi trả phòng</p>
                  </div>
                </div>

                <Separator />

                {/* Báo cáo */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Báo Cáo Doanh Thu
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>📊 Click vào <strong>"Menu"</strong> → <strong>"Báo cáo"</strong></p>
                    <p>📅 Xem doanh thu <strong>hôm nay</strong>, <strong>tháng này</strong>, hoặc tùy chọn</p>
                    <p>📄 Xuất báo cáo <strong>Excel</strong> hoặc <strong>PDF</strong></p>
                    <p>💳 Chi tiết theo <strong>phương thức thanh toán</strong> (tiền mặt, chuyển khoản...)</p>
                  </div>
                </div>

                <Separator />

                {/* Tips */}
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Mẹo Sử Dụng
                  </h4>
                  <ul className="space-y-1.5 text-sm text-amber-800">
                    <li>💡 Giao diện <strong>đơn giản</strong> - chỉ cần 1 chạm để nhận/trả phòng</li>
                    <li>💡 Màu sắc <strong>trực quan</strong> - dễ dàng phân biệt trạng thái phòng</li>
                    <li>💡 <strong>All-in pricing</strong> - không cần tính điện nước riêng</li>
                    <li>💡 Phù hợp cho <strong>người không am hiểu công nghệ</strong></li>
                  </ul>
                </Card>
              </>
            )}

            {/* Footer Note */}
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <div className="text-center text-sm text-gray-700">
                <p className="mb-2">
                  <strong>Cần hỗ trợ thêm?</strong>
                </p>
                <p className="text-xs text-gray-600">
                  Bạn có thể quay lại màn hình chọn mô hình bằng nút <strong>"Đổi mô hình"</strong> trên góc phải header
                </p>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
