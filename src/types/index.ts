export type RoomStatus = 'vacant-clean' | 'occupied' | 'vacant-dirty' | 'due-out' | 'out-of-order';

export type RoomType = 'Single' | 'Double' | 'Deluxe' | 'Suite' | 'Family';

export type UserRole = 'admin' | 'receptionist' | 'housekeeping';

export type BusinessModel = 'hotel' | 'guesthouse' | 'boarding-house';

export type PaymentMethod = 'cash' | 'bank-transfer' | 'card' | 'momo' | 'vnpay';

export type DocumentType = 'receipt' | 'invoice';

// Hotel Service Catalog (Additional Services)
export interface HotelService {
  id: string;
  hotelId: string;
  name: string;
  description?: string;
  price: number;
  unit?: string; // e.g., "can", "bottle", "kg"
  category?: string; // e.g., "food", "drink", "laundry"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Guest Service (Service usage tracking for occupied rooms)
export interface GuestService {
  id: string;
  guestId: string;
  serviceId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  serviceName?: string;
  serviceUnit?: string;
}

// Legacy types (kept for backward compatibility)
export interface Service {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface IncidentalCharge {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  timestamp: string;
  addedBy: string;
}

export interface Payment {
  id: string;
  roomId?: string; // Link to room for building lookup
  roomNumber: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  roomCharge: number;
  isHourly?: boolean; // deprecated, use rentalType
  rentalType: 'daily' | 'hourly' | 'overnight' | 'monthly';
  services: Service[];
  incidentalCharges: IncidentalCharge[];
  subtotal: number;
  vat: number;
  total: number;
  paymentMethod: PaymentMethod;
  documentType: DocumentType;
  companyName?: string;
  companyTaxCode?: string;
  companyAddress?: string;
  timestamp: string;
  processedBy: string;
}

export interface Building {
  id: string;
  name: string;
  description?: string;
  order: number;
}

export interface UtilityReading {
  electricity?: {
    oldReading: number;
    newReading: number;
    pricePerUnit: number; // Price per kWh
  };
  water?: {
    oldReading: number;
    newReading: number;
    pricePerUnit: number; // Price per m³
  };
  internet?: number; // Fixed monthly fee
  other?: Array<{
    name: string;
    amount: number;
  }>;
}

export interface GuestAdditionalInfo {
  idNumber?: string;        // CCCD/CMND number
  address?: string;          // Address
  nationality?: string;      // Nationality
  passportNumber?: string;   // Passport number
}


export interface Room {
  id: string;
  number: string;
  floor: number;
  buildingId: string;
  type: RoomType;
  price: number;
  hourlyRate?: number; // Giá theo giờ (additional hours after base)
  hourlyBasePrice?: number; // Giá 2 giờ đầu (base price for first 2 hours)
  overnightPrice?: number; // Giá qua đêm
  monthlyPrice?: number; // Giá thuê tháng (30-day fixed period)
  status: RoomStatus;
  guest?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
    services?: Service[];
    incidentalCharges?: IncidentalCharge[];
    checkedInBy?: string; // Email or name of receptionist who checked in
    isHourly?: boolean; // deprecated, use rentalType
    rentalType?: 'daily' | 'hourly' | 'overnight' | 'monthly'; // Rental type
    additionalInfo?: GuestAdditionalInfo; // Additional guest information
  };
  booking?: {
    guestName: string;
    phone: string;
    email?: string;
    bookingDate: string;
    checkInDate: string;
    checkOutDate: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  hotelId: string;
  hotelName: string;
}

export interface Staff {
  id: string;
  email: string;
  name: string;
  role: 'receptionist' | 'housekeeping';
}

export interface Hotel {
  id: string;
  name: string;
  address?: string;
  adminEmail: string;
  businessModel: BusinessModel;
  buildings: Building[];
  staff: Staff[];
  bankAccount?: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountHolder: string;
  };
  taxCode?: string;
  phoneNumber?: string;
  email?: string;
  vatPercentage?: number;
}