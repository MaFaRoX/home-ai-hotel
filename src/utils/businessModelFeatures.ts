import { BusinessModel } from '../types';

export interface BusinessModelFeatures {
  multiBuilding: boolean;
  staffManagement: boolean;
  housekeeping: boolean;
  nightlyBilling: boolean;
  monthlyBilling: boolean;
  utilities: boolean; // Điện, nước, internet cho nhà trọ
  contractManagement: boolean; // Hợp đồng dài hạn
  advancedReports: boolean;
  qrPayment: boolean;
  bookingSystem: boolean;
}

export const businessModelFeatures: Record<BusinessModel, BusinessModelFeatures> = {
  hotel: {
    multiBuilding: true,
    staffManagement: true,
    housekeeping: true,
    nightlyBilling: true,
    monthlyBilling: false,
    utilities: false,
    contractManagement: false,
    advancedReports: true,
    qrPayment: true,
    bookingSystem: true,
  },
  guesthouse: {
    multiBuilding: false,
    staffManagement: false,
    housekeeping: true,
    nightlyBilling: true,
    monthlyBilling: false,
    utilities: false,
    contractManagement: false,
    advancedReports: false,
    qrPayment: true,
    bookingSystem: true,
  },
  'boarding-house': {
    multiBuilding: false,
    staffManagement: false,
    housekeeping: false,
    nightlyBilling: false,
    monthlyBilling: true,
    utilities: true,
    contractManagement: true,
    advancedReports: false,
    qrPayment: true,
    bookingSystem: false,
  },
};

export function getFeatures(model: BusinessModel): BusinessModelFeatures {
  return businessModelFeatures[model];
}

export const businessModelInfo = {
  hotel: {
    title: 'Khách sạn',
    subtitle: 'Khách sạn lớn - Quản lý chuyên nghiệp',
    description: 'Phù hợp với khách sạn có lễ tân, buồng phòng, nhiều tầng/tòa. Quản lý nhân sự, báo cáo chi tiết, thanh toán QR.',
    icon: '🏨',
    features: [
      'Quản lý nhiều tòa nhà',
      'Phân quyền Admin/Lễ tân/Buồng phòng',
      'Báo cáo doanh thu chi tiết',
      'Thanh toán QR + Ngân hàng',
    ],
  },
  guesthouse: {
    title: 'Nhà nghỉ',
    subtitle: 'Khách sạn nhỏ - Admin là lễ tân',
    description: 'Phù hợp với nhà nghỉ, khách sạn mini 5-15 phòng. Chủ tự quản lý, giao diện đơn giản, dễ sử dụng.',
    icon: '🏡',
    features: [
      'Giao diện đơn giản, dễ dùng',
      'Admin tự làm tất cả',
      'Quản lý 1 tòa nhà',
      'Thanh toán QR nhanh chóng',
    ],
  },
  'boarding-house': {
    title: 'Nhà trọ',
    subtitle: 'Cho thuê theo tháng',
    description: 'Giao diện đơn giản, dễ sử dụng. Tính tiền điện, nước tự động. Theo dõi thanh toán theo tháng.',
    icon: '🏘️',
    features: [
      'Giao diện lớn, dễ nhìn',
      'Tính tiền điện nước tự động',
      'Thu tiền theo tháng',
      'Theo dõi phòng chưa thu tiền',
      'Không cần đào tạo, dễ sử dụng',
    ],
  },
};
