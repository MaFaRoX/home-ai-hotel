'use client'

import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Room, PaymentMethod, IncidentalCharge, RoomType, RoomStatus, Payment, HotelService, GuestService } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  User,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  X,
  Layers,
  Building2,
  Bed,
  DoorOpen,
  Coffee,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { GuestHousePaymentDialog } from './GuestHousePaymentDialog';
import { useLanguage } from '../contexts/LanguageContext';
import { MoneyInput } from './MoneyInput';
import { roomApi, serviceApi } from '../utils/api/guesthouse';

interface GuestHouseRoomDialogProps {
  room: Room;
  open: boolean;
  onClose: () => void;
}

export function GuestHouseRoomDialog({ room, open, onClose }: GuestHouseRoomDialogProps) {
  const { updateRoom, user, hotel, checkIn, checkOut, markRoomCleaned, addPayment, rooms, hotelServices, loadHotelServices, guestServices, loadAllGuestServices, isGuestMode } = useApp();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'info' | 'checkin' | 'services'>('info');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Room editing state (for empty rooms)
  const [isEditing, setIsEditing] = useState(false);

  // Current display values (updated after save)
  const [currentRoomType, setCurrentRoomType] = useState<Room['type']>(room.type);
  const [currentPrice, setCurrentPrice] = useState(room.price);
  const [currentHourlyRate, setCurrentHourlyRate] = useState(room.hourlyRate || 0);
  const [currentHourlyBasePrice, setCurrentHourlyBasePrice] = useState(room.hourlyBasePrice || 0);
  const [currentOvernightPrice, setCurrentOvernightPrice] = useState(room.overnightPrice || 0);
  const [currentMonthlyPrice, setCurrentMonthlyPrice] = useState(room.monthlyPrice || 0);
  const [currentStatus, setCurrentStatus] = useState<Room['status']>(room.status);

  // Editing values
  const [editedRoomType, setEditedRoomType] = useState<Room['type']>(room.type);
  const [editedPrice, setEditedPrice] = useState(room.price.toString());
  const [editedHourlyRate, setEditedHourlyRate] = useState((room.hourlyRate || 0).toString());
  const [editedHourlyBasePrice, setEditedHourlyBasePrice] = useState((room.hourlyBasePrice || 0).toString());
  const [editedOvernightPrice, setEditedOvernightPrice] = useState((room.overnightPrice || 0).toString());
  const [editedMonthlyPrice, setEditedMonthlyPrice] = useState((room.monthlyPrice || 0).toString());
  const [editedStatus, setEditedStatus] = useState<Room['status']>(room.status);

  // Check-in form
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestIdNumber, setGuestIdNumber] = useState('');
  const [guestAddress, setGuestAddress] = useState('');
  const [guestNationality, setGuestNationality] = useState('');
  const [guestPassportNumber, setGuestPassportNumber] = useState('');
  const [rentalType, setRentalType] = useState<'hourly' | 'daily' | 'overnight' | 'monthly'>('daily');
  const [hours, setHours] = useState('2'); // Minimum 2 hours for hourly rental
  const [months, setMonths] = useState('1'); // Minimum 1 month for monthly rental
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // State for editing guest checkout date (when room is occupied)
  const [editedGuestCheckOutDate, setEditedGuestCheckOutDate] = useState('');

  // Services state - now filtered from context
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [serviceQuantity, setServiceQuantity] = useState('1');

  // Filter guest services from context by current guest ID
  const currentGuestServices = room.guest
    ? guestServices.filter(gs => gs.guestId === room.guest!.id)
    : [];

  // Handle date picker focus/blur with delay to prevent dialog from closing
  const handleDatePickerFocus = () => {
    setIsDatePickerOpen(true);
  };

  const handleDatePickerBlur = () => {
    // Delay blur to allow click events to be processed first
    setTimeout(() => {
      setIsDatePickerOpen(false);
    }, 200);
  };

  // Helper to convert date string to datetime-local format
  const toDateTimeLocal = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Calculate guest total based on edited checkout date
  const calculateGuestTotal = () => {
    if (!room.guest) return 0;

    const checkIn = new Date(room.guest.checkInDate);
    const checkOut = new Date(editedGuestCheckOutDate || room.guest.checkOutDate);

    if (room.guest.rentalType === 'hourly' || room.guest.isHourly) {
      const hours = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
      const actualHours = Math.max(2, hours); // Minimum 2 hours

      // Two-tier pricing: base price for first 2 hours + hourly rate for additional hours
      const basePrice = Number(currentHourlyBasePrice) || 0;
      const hourlyRate = Number(currentHourlyRate) || 0;

      if (actualHours <= 2) {
        return basePrice;
      } else {
        const additionalHours = actualHours - 2;
        return basePrice + (hourlyRate * additionalHours);
      }
    } else if (room.guest.rentalType === 'overnight') {
      return Number(currentOvernightPrice || currentPrice);
    } else if (room.guest.rentalType === 'monthly') {
      return Number(currentMonthlyPrice || currentPrice * 30);
    } else {
      // Calculate days based on 12:00 PM boundaries
      // Any stay crosses a 12:00 PM marker counts as a new day
      let noon = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate(), 12, 0, 0, 0);
      if (noon <= checkIn) {
        noon.setDate(noon.getDate() + 1);
      }

      let noonCrossedCount = 0;
      while (noon < checkOut) {
        noonCrossedCount++;
        noon.setDate(noon.getDate() + 1);
      }

      const days = noonCrossedCount + 1;
      return currentPrice * Math.max(1, days);
    }
  };

  // Handle guest checkout date change with validation
  const handleGuestCheckOutDateChange = (value: string) => {
    if (!room.guest) return;

    const checkIn = new Date(room.guest.checkInDate);
    const checkOut = new Date(value);
    const originalCheckOut = new Date(room.guest.checkOutDate);

    if (checkOut <= checkIn) {
      toast.error(t('room.errorCheckOutBeforeCheckIn'));
      return;
    }

    if (checkOut > originalCheckOut) {
      toast.error(t('room.errorCheckOutAfterOriginal'));
      return;
    }

    setEditedGuestCheckOutDate(value);
  };

  useEffect(() => {
    if (open) {
      if (room.guest) {
        setActiveTab('info');
        // Auto-fill guest info when already checked in
        setGuestName(room.guest.name || '');
        setGuestPhone(room.guest.phone || '');
        // Initialize edited checkout date
        setEditedGuestCheckOutDate(toDateTimeLocal(room.guest.checkOutDate));
        // Load hotel services if not loaded
        if (hotelServices.length === 0) {
          loadHotelServices();
        }
      } else {
        setActiveTab('info');
        // Reset form for new check-in
        setGuestName('');
        setGuestPhone('');
        setGuestIdNumber('');
        setGuestAddress('');
        setGuestNationality('');
        setGuestPassportNumber('');
        setCheckInDate(toDateTimeLocal(new Date().toISOString()));
      }

      // Reset editing state and sync with room data
      setIsEditing(false);

      // Update current display values
      setCurrentRoomType(room.type);
      setCurrentPrice(room.price);
      setCurrentHourlyRate(room.hourlyRate || 0);
      setCurrentHourlyBasePrice(room.hourlyBasePrice || 0);
      setCurrentOvernightPrice(room.overnightPrice || 0);
      setCurrentMonthlyPrice(room.monthlyPrice || 0);
      setCurrentStatus(room.status);

      // Update editing values
      setEditedRoomType(room.type);
      // Ensure we pass clean numeric strings to MoneyInput (remove any formatting)
      setEditedPrice(Math.round(room.price).toString());
      setEditedHourlyRate(Math.round(room.hourlyRate || 0).toString());
      setEditedHourlyBasePrice(Math.round(room.hourlyBasePrice || 0).toString());
      setEditedOvernightPrice(Math.round(room.overnightPrice || 0).toString());
      setEditedMonthlyPrice(Math.round(room.monthlyPrice || 0).toString());
      setEditedStatus(room.status);

      // Auto-calculate checkout based on rental type
      if (!room.guest) {
        updateCheckOutDate();
      }
    } else {
      // Reset services when dialog closes
      setSelectedServiceId('');
      setServiceQuantity('1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, open]);

  useEffect(() => {
    if (open && !room.guest) {
      updateCheckOutDate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentalType, hours, months, checkInDate]);

  const updateCheckOutDate = () => {
    const checkIn = new Date(checkInDate);
    let checkOut = new Date(checkIn);

    if (rentalType === 'hourly') {
      // Add hours using milliseconds for accurate calculation
      const hoursToAdd = parseInt(hours || '3');
      checkOut.setTime(checkOut.getTime() + (hoursToAdd * 60 * 60 * 1000));
    } else if (rentalType === 'overnight') {
      // Overnight: Checkout at 12:00 PM next day
      const nextDay = new Date(checkIn);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(12, 0, 0, 0);
      checkOut = nextDay;
    } else if (rentalType === 'monthly') {
      // Monthly: Checkout based on calendar months, preserving check-in time
      const monthsToAdd = parseInt(months || '1');
      const expectedDay = checkOut.getDate();
      checkOut.setMonth(checkOut.getMonth() + monthsToAdd);

      // If the day changed (e.g., Jan 31st shifted to Mar 3rd), 
      // it means the target month has fewer days, so we snap to the end of that month.
      if (checkOut.getDate() !== expectedDay) {
        checkOut.setDate(0);
      }
    } else {
      checkOut.setDate(checkOut.getDate() + 1);
      checkOut.setHours(12, 0, 0, 0);
    }

    // Format as local datetime for datetime-local input
    const year = checkOut.getFullYear();
    const month = String(checkOut.getMonth() + 1).padStart(2, '0');
    const day = String(checkOut.getDate()).padStart(2, '0');
    const hoursStr = String(checkOut.getHours()).padStart(2, '0');
    const minutesStr = String(checkOut.getMinutes()).padStart(2, '0');
    setCheckOutDate(`${year}-${month}-${day}T${hoursStr}:${minutesStr}`);
  };

  const calculateTotal = () => {
    if (rentalType === 'hourly') {
      const hoursNum = Math.max(2, parseInt(hours || '2')); // Minimum 2 hours

      // Two-tier pricing: base price for first 2 hours + hourly rate for additional hours
      const basePrice = Number(currentHourlyBasePrice) || 0;
      const hourlyRate = Number(currentHourlyRate) || 0;

      if (hoursNum <= 2) {
        return basePrice;
      } else {
        const additionalHours = hoursNum - 2;
        return basePrice + (hourlyRate * additionalHours);
      }
    } else if (rentalType === 'overnight') {
      return Number(currentOvernightPrice || currentPrice);
    } else if (rentalType === 'monthly') {
      const monthsNum = Math.max(1, parseInt(months || '1')); // Minimum 1 month
      return Number(currentMonthlyPrice || currentPrice * 30) * monthsNum;
    } else {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);

      // Calculate days based on 12:00 PM boundaries
      let noon = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate(), 12, 0, 0, 0);
      if (noon <= checkIn) {
        noon.setDate(noon.getDate() + 1);
      }

      let noonCrossedCount = 0;
      while (noon < checkOut) {
        noonCrossedCount++;
        noon.setDate(noon.getDate() + 1);
      }

      const days = noonCrossedCount + 1;
      return currentPrice * Math.max(1, days);
    }
  };

  const getTotalWithIncidentals = () => {
    if (!room.guest) return 0;
    // Use recalculated total based on edited checkout date + services
    const roomTotal = Number(calculateGuestTotal()) || 0;
    const servicesTotal = Number(getServicesTotal()) || 0;
    return roomTotal + servicesTotal;
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim()) {
      toast.error(t('room.errorGuestName'));
      return;
    }

    const checkInTime = new Date(checkInDate).getTime();
    const checkOutTime = new Date(checkOutDate).getTime();

    if (checkOutTime <= checkInTime) {
      toast.error(t('room.errorCheckOutBeforeCheckIn'));
      return;
    }

    // Validate minimum 2 hours for hourly rental
    if (rentalType === 'hourly') {
      const hoursBooked = parseInt(hours);
      if (hoursBooked < 2) {
        toast.error(t('room.errorMinimum2Hours'));
        return;
      }
    }

    const total = calculateTotal();

    try {
      // Build additionalInfo only if at least one field has a value
      const additionalInfo: any = {};
      if (guestIdNumber.trim()) additionalInfo.idNumber = guestIdNumber.trim();
      if (guestAddress.trim()) additionalInfo.address = guestAddress.trim();
      if (guestNationality.trim()) additionalInfo.nationality = guestNationality.trim();
      if (guestPassportNumber.trim()) additionalInfo.passportNumber = guestPassportNumber.trim();

      const hasAdditionalInfo = Object.keys(additionalInfo).length > 0;

      const payload = {
        name: guestName.trim(),
        phone: guestPhone.trim() || undefined,
        email: '',
        checkInDate: new Date(checkInDate).toISOString(),
        checkOutDate: new Date(checkOutDate).toISOString(),
        totalAmount: total,
        isHourly: rentalType === 'hourly', // Backward compatibility
        rentalType: rentalType,
        checkedInBy: user?.name || user?.email,
        ...(hasAdditionalInfo && { additionalInfo }),
      };

      await checkIn(room.id, payload);

      const rentalTypeText = rentalType === 'hourly'
        ? `${hours} ${t('room.hours')}`
        : rentalType === 'overnight'
          ? t('room.overnight')
          : t('room.checkinSuccessDaily');

      toast.success(`✅ ${t('room.checkinSuccessHourly')} ${room.number} (${rentalTypeText})`
      );

      // Reset form
      setGuestName('');
      setGuestPhone('');
      setGuestIdNumber('');
      setGuestAddress('');
      setGuestNationality('');
      setGuestPassportNumber('');
      onClose();
    } catch (error) {
      // Error already handled in AppContext
    }
  };

  const handleStartCheckOut = () => {
    setShowPaymentDialog(true);
  };

  const completeCheckOut = async (paymentMethod: PaymentMethod) => {
    if (!room.guest) return;

    try {
      // Get the latest room data from state to ensure we have the correct room ID
      // The room prop might be stale, so we look it up from the current rooms state
      const currentRoom = rooms.find(r => r.id === room.id);
      if (!currentRoom || !currentRoom.guest) {
        toast.error('Room not found or guest data is missing');
        return;
      }

      // Use edited checkout date and recalculated totals
      const finalCheckOutDate = editedGuestCheckOutDate
        ? new Date(editedGuestCheckOutDate).toISOString()
        : currentRoom.guest.checkOutDate;
      const roomCharge = calculateGuestTotal(); // Only room charge
      const servicesTotal = getServicesTotal(); // Services total
      const finalTotal = roomCharge + servicesTotal; // Total including both

      // Calculate VAT
      const vatRate = hotel?.vatPercentage || 0;
      const vatAmount = Math.round(finalTotal * (vatRate / 100));
      const totalPayment = finalTotal + vatAmount;

      // Update guest info in backend if checkout date or total changed
      const hasCheckOutDateChanged = finalCheckOutDate !== currentRoom.guest.checkOutDate;
      const hasTotalChanged = finalTotal !== currentRoom.guest.totalAmount;

      if (hasCheckOutDateChanged || hasTotalChanged) {
        await roomApi.updateGuest(currentRoom.id, {
          checkOutDate: finalCheckOutDate,
          totalAmount: finalTotal, // Store subtotal (consistent with current logic)
        });
      }

      // Convert currentGuestServices to legacy Service format for payment record
      const servicesForPayment = currentGuestServices.map(gs => ({
        id: gs.id, // Keep the guest_service ID for reference
        name: gs.serviceName || 'Service',
        price: gs.unitPrice,
        quantity: gs.quantity,
      }));

      // Create payment record before checking out
      const payment: Payment = {
        id: `payment-${Date.now()}`,
        roomId: currentRoom.id,
        roomNumber: currentRoom.number,
        guestName: currentRoom.guest.name,
        checkInDate: currentRoom.guest.checkInDate,
        checkOutDate: finalCheckOutDate,
        roomCharge: roomCharge, // Only room charge
        isHourly: currentRoom.guest.isHourly ?? false,
        rentalType: currentRoom.guest.rentalType || (currentRoom.guest.isHourly ? 'hourly' : 'daily'),
        services: servicesForPayment, // New services from guest_services table
        incidentalCharges: currentRoom.guest.incidentalCharges || [],
        subtotal: finalTotal,
        vat: vatAmount,
        total: totalPayment, // Total including services and VAT
        paymentMethod: paymentMethod,
        documentType: 'receipt',
        timestamp: new Date().toISOString(),
        processedBy: user?.name || user?.email || 'Unknown',
      };

      // Add payment first (this creates the revenue record)
      await addPayment(payment, currentRoom.id);

      // Then check out (which removes the guest)
      await checkOut(currentRoom.id);

      toast.success(`✅ ${t('room.checkoutSuccess')} ${currentRoom.number} ${t('action.payment')}`);
      setShowPaymentDialog(false);
      onClose();
    } catch (error) {
      // Error already handled in AppContext
    }
  };

  const handleCancelRoom = async () => {
    if (!room.guest) return;

    try {
      await checkOut(room.id);
      await markRoomCleaned(room.id);
      toast.success(`✅ ${t('room.cancelRoom')} ${room.number}`);
      setShowCancelConfirm(false);
      onClose();
    } catch (error) {
      // Error already handled in AppContext
    }
  };

  const handleMarkClean = async () => {
    try {
      await markRoomCleaned(room.id);
      toast.success(`${t('common.room')} ${room.number} ${t('room.markedClean')}`);
      onClose();
    } catch (error) {
      // Error already handled in AppContext
    }
  };


  const handleSaveRoomInfo = async () => {
    const price = parseFloat(editedPrice);
    const hourlyRate = parseFloat(editedHourlyRate);
    const hourlyBasePrice = parseFloat(editedHourlyBasePrice);

    if (isNaN(price) || price <= 0) {
      toast.error(t('room.errorPriceDaily'));
      return;
    }

    if (isNaN(hourlyRate) || hourlyRate < 0) {
      toast.error(t('room.errorPriceHourly'));
      return;
    }

    if (isNaN(hourlyBasePrice) || hourlyBasePrice < 0) {
      toast.error(t('room.errorPriceHourlyBase'));
      return;
    }

    try {
      await updateRoom(room.id, {
        type: editedRoomType,
        price: price,
        hourlyRate: hourlyRate > 0 ? hourlyRate : undefined,
        hourlyBasePrice: hourlyBasePrice > 0 ? hourlyBasePrice : undefined,
        overnightPrice: parseFloat(editedOvernightPrice) > 0 ? parseFloat(editedOvernightPrice) : undefined,
        monthlyPrice: parseFloat(editedMonthlyPrice) > 0 ? parseFloat(editedMonthlyPrice) : undefined,
        status: editedStatus,
      });

      // Update current display values immediately
      setCurrentRoomType(editedRoomType);
      setCurrentPrice(price);
      setCurrentHourlyRate(hourlyRate);
      setCurrentHourlyBasePrice(hourlyBasePrice);
      setCurrentOvernightPrice(parseFloat(editedOvernightPrice) || 0);
      setCurrentMonthlyPrice(parseFloat(editedMonthlyPrice) || 0);
      setCurrentStatus(editedStatus);

      setIsEditing(false);
      toast.success(`${t('room.updateSuccess')} ${room.number}`);
    } catch (error) {
      // Error already handled in AppContext
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to current display values (which may have been updated after last save)
    setEditedRoomType(currentRoomType);
    setEditedPrice(currentPrice.toString());
    setEditedHourlyRate(currentHourlyRate.toString());
    setEditedHourlyBasePrice(currentHourlyBasePrice.toString());
    setEditedOvernightPrice(currentOvernightPrice.toString());
    setEditedStatus(currentStatus);
  };

  const getRoomStatusColor = () => {
    if (room.guest) return 'bg-green-100 border-green-300';
    if (room.status === 'vacant-dirty') return 'bg-yellow-100 border-yellow-300';
    return 'bg-gray-100 border-gray-300';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    // Don't close dialog if date picker is open
    if (!newOpen && isDatePickerOpen) {
      return;
    }
    onClose();
  };

  // Helper to get translated rental type label
  const getRentalTypeLabel = (type?: string, isHourly?: boolean) => {
    if (type === 'monthly') return t('room.monthly');
    if (type === 'overnight') return t('room.overnight');
    if (type === 'hourly' || isHourly) return t('room.hourly');
    return t('room.daily');
  };



  const handleAddService = async () => {
    if (!selectedServiceId || !room.guest) return;
    const qty = parseFloat(serviceQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error(t('room.serviceQtyError'));
      return;
    }

    try {
      if (isGuestMode) {
        // Guest mode: handle locally with localStorage
        const savedGuestServices = localStorage.getItem('hotel-app-guest-services');
        let guestServicesData: GuestService[] = savedGuestServices ? JSON.parse(savedGuestServices) : [];

        // Find the hotel service to get price
        const hotelService = hotelServices.find(s => s.id === selectedServiceId);
        if (!hotelService) {
          toast.error('Service not found');
          return;
        }

        const newGuestService: GuestService = {
          id: `gs-${Date.now()}`,
          guestId: room.guest.id,
          serviceId: selectedServiceId,
          quantity: qty,
          unitPrice: hotelService.price,
          totalPrice: hotelService.price * qty,
          serviceName: hotelService.name,
          serviceUnit: hotelService.unit,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        guestServicesData.push(newGuestService);
        localStorage.setItem('hotel-app-guest-services', JSON.stringify(guestServicesData));
        await loadAllGuestServices();
        setServiceQuantity('1');
        setSelectedServiceId('');
        toast.success(`✅ ${t('room.serviceAdded')}`);
      } else {
        // API mode
        await serviceApi.addToGuest({
          guestId: room.guest.id,
          serviceId: selectedServiceId,
          quantity: qty,
        });
        // Refresh guest services from context
        await loadAllGuestServices();
        setServiceQuantity('1');
        setSelectedServiceId('');
        toast.success(`✅ ${t('room.serviceAdded')}`);
      }
    } catch (error: any) {
      toast.error(error.message || t('room.serviceAddError'));
    }
  };

  const handleRemoveService = async (guestServiceId: string) => {
    try {
      if (isGuestMode) {
        // Guest mode: handle locally with localStorage
        const savedGuestServices = localStorage.getItem('hotel-app-guest-services');
        let guestServicesData: GuestService[] = savedGuestServices ? JSON.parse(savedGuestServices) : [];
        guestServicesData = guestServicesData.filter(gs => gs.id !== guestServiceId);
        localStorage.setItem('hotel-app-guest-services', JSON.stringify(guestServicesData));
        await loadAllGuestServices();
        toast.success(t('room.serviceRemoved'));
      } else {
        // API mode
        await serviceApi.removeFromGuest(guestServiceId);
        // Refresh guest services from context
        await loadAllGuestServices();
        toast.success(t('room.serviceRemoved'));
      }
    } catch (error: any) {
      toast.error(error.message || t('room.serviceRemoveError'));
    }
  };

  const getServicesTotal = () => {
    return currentGuestServices.reduce((sum, gs) => sum + Number(gs.totalPrice || 0), 0);
  };

  return (
    <>
      <Dialog open={open && !showPaymentDialog} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto p-3 sm:p-4 mx-2 sm:mx-4">
          <DialogHeader className="pb-1 space-y-0">
            <DialogTitle className="text-lg font-bold">
              {t('common.room')} {room.number}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="info" className="text-xs">
                {t('room.info')}
              </TabsTrigger>
              {room.guest ? (
                <TabsTrigger value="services" className="text-xs py-1.5 flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5" />
                  {t('room.services')}
                </TabsTrigger>
              ) : (
                <TabsTrigger value="checkin" className="text-xs">
                  {t('room.checkin')}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-2 mt-2">
              {room.guest ? (
                <>
                  {/* Guest Info */}
                  <Card className={`${getRoomStatusColor()} p-2 border`}>
                    <div className="space-y-2">
                      {/* Name - Full width */}
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-gray-600" />
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-600">{t('room.guest')}</p>
                          <p className="text-sm font-bold text-gray-800">{room.guest.name}</p>
                        </div>
                      </div>

                      {/* Grid layout for other fields - 2 columns */}
                      <div className="grid grid-cols-2 gap-2">
                        {room.guest.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gray-600">{t('room.phone')}</p>
                              <p className="text-xs font-semibold truncate">{room.guest.phone}</p>
                            </div>
                          </div>
                        )}

                        {room.guest.additionalInfo?.idNumber && (
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-gray-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gray-600">{t('room.idNumber')}</p>
                              <p className="text-xs font-semibold truncate">{room.guest.additionalInfo.idNumber}</p>
                            </div>
                          </div>
                        )}

                        {room.guest.additionalInfo?.nationality && (
                          <div className="flex items-center gap-2">
                            <DoorOpen className="w-3 h-3 text-gray-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gray-600">{t('room.nationality')}</p>
                              <p className="text-xs font-semibold truncate">{room.guest.additionalInfo.nationality}</p>
                            </div>
                          </div>
                        )}

                        {room.guest.additionalInfo?.passportNumber && (
                          <div className="flex items-center gap-2">
                            <DoorOpen className="w-3 h-3 text-gray-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gray-600">{t('room.passportNumber')}</p>
                              <p className="text-xs font-semibold truncate">{room.guest.additionalInfo.passportNumber}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Address - Full width if exists */}
                      {room.guest.additionalInfo?.address && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3 text-gray-600" />
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-600">{t('room.address')}</p>
                            <p className="text-xs font-semibold">{room.guest.additionalInfo.address}</p>
                          </div>
                        </div>
                      )}

                      <Separator className="my-1" />

                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-gray-600" />
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-600">{t('room.checkinDate')}</p>
                          <p className="text-[11px] font-semibold">{formatDate(room.guest.checkInDate)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-600" />
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-600">{t('room.checkoutExpected')}</p>
                          <Input
                            type="datetime-local"
                            value={editedGuestCheckOutDate}
                            onChange={(e) => handleGuestCheckOutDateChange(e.target.value)}
                            onFocus={handleDatePickerFocus}
                            onBlur={handleDatePickerBlur}
                            min={toDateTimeLocal(room.guest.checkInDate)}
                            max={toDateTimeLocal(room.guest.checkOutDate)}
                            className="text-[11px] h-7 w-full"
                          />
                        </div>
                      </div>

                      <Separator className="my-1" />

                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] text-gray-600">{t('room.rentalType')}</p>
                            <Badge variant="outline" className="text-[10px] mt-0.5 h-6 px-2 py-1">
                              {getRentalTypeLabel(room.guest.rentalType, room.guest.isHourly)}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-600">{t('room.roomCharge')}</p>
                            <p className="text-sm font-bold text-gray-700">
                              {formatCurrency(calculateGuestTotal())}₫
                            </p>
                          </div>
                        </div>

                        {currentGuestServices.length > 0 && (
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] text-gray-600">{t('room.services')}</p>
                              <Badge variant="outline" className="text-[10px] mt-0.5 h-6 px-2 py-1">
                                <Coffee className="w-3 h-3 mr-1" />
                                {currentGuestServices.length} {currentGuestServices.length > 1 ? t('room.items') : t('room.item')}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-600">{t('room.servicesTotal')}</p>
                              <p className="text-sm font-bold text-blue-600">
                                {formatCurrency(getServicesTotal())}₫
                              </p>
                            </div>
                          </div>
                        )}

                        <Separator />

                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] text-gray-600 font-semibold">{t('room.totalAmount')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(getTotalWithIncidentals())}₫
                            </p>
                          </div>
                        </div>
                      </div>

                      {room.guest.checkedInBy && (
                        <p className="text-[10px] text-gray-500 italic">
                          {t('room.checkedInBy')}: {room.guest.checkedInBy}
                        </p>
                      )}
                    </div>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelConfirm(true)}
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-xs h-9"
                    >
                      <X className="w-3 h-3 mr-1.5" />
                      {t('room.cancelRoom')}
                    </Button>
                    <Button
                      onClick={handleStartCheckOut}
                      className="flex-[2] bg-red-600 hover:bg-red-700 text-xs h-9"
                    >
                      <LogOut className="w-3 h-3 mr-1.5" />
                      {t('room.checkout')}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Empty Room Info - Editable */}
                  <Card className={`${getRoomStatusColor()} p-3 border`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-800">{t('room.roomInfo')}</h3>
                      {!isEditing && room.status !== 'vacant-dirty' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditing(true)}
                          className="h-6 px-2 text-xs"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          {t('room.edit')}
                        </Button>
                      )}
                      {isEditing && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSaveRoomInfo}
                            className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Room Number - Read Only */}
                        <div className="flex items-center gap-2">
                          <DoorOpen className="w-4 h-4 text-gray-500" />
                          <div className="flex-1">
                            <Label className="text-[10px] text-gray-600">{t('room.roomNumber')}</Label>
                            <p className="text-sm font-bold text-gray-800">{room.number}</p>
                          </div>
                        </div>

                        {/* Room Type */}
                        {isEditing ? (
                          <div className="space-y-1">
                            <Label className="text-[10px] text-gray-600 flex items-center gap-1">
                              <Bed className="w-3 h-3" />
                              {t('room.roomType')}
                            </Label>
                            <Select value={editedRoomType} onValueChange={(value) => setEditedRoomType(value as RoomType)}>
                              <SelectTrigger className="text-xs h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Single">{t('roomType.single')}</SelectItem>
                                <SelectItem value="Double">{t('roomType.double')}</SelectItem>
                                <SelectItem value="Deluxe">{t('roomType.deluxe')}</SelectItem>
                                <SelectItem value="Suite">{t('roomType.suite')}</SelectItem>
                                <SelectItem value="Family">{t('roomType.family')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Bed className="w-4 h-4 text-gray-500" />
                            <div className="flex-1">
                              <Label className="text-[10px] text-gray-600">{t('room.roomType')}</Label>
                              <p className="text-sm font-semibold text-gray-800">{t(`roomType.${currentRoomType.toLowerCase()}` as any)}</p>
                            </div>
                          </div>
                        )}

                        {/* Floor - Read Only */}
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-gray-500" />
                          <div className="flex-1">
                            <Label className="text-[10px] text-gray-600">{t('room.floor')}</Label>
                            <p className="text-sm font-semibold text-gray-800">{t('room.floor')} {room.floor}</p>
                          </div>
                        </div>

                        {/* Building - Read Only */}
                        {hotel?.buildings && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <div className="flex-1">
                              <Label className="text-[10px] text-gray-600">{t('room.building')}</Label>
                              <p className="text-sm font-semibold text-gray-800">
                                {hotel.buildings.find(b => b.id === room.buildingId)?.name || 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      {isEditing ? (
                        <div className="space-y-1">
                          <Label className="text-[10px] text-gray-600">{t('room.status')}</Label>
                          <Select value={editedStatus} onValueChange={(value) => setEditedStatus(value as RoomStatus)}>
                            <SelectTrigger className="text-xs h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vacant-clean">{t('room.statusVacantClean')}</SelectItem>
                              <SelectItem value="vacant-dirty">{t('room.statusVacantDirty')}</SelectItem>
                              {/* <SelectItem value="out-of-order" disabled>{t('room.statusOutOfOrder')}</SelectItem> */}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label className="text-[10px] text-gray-600">{t('room.status')}</Label>
                            <Badge variant="outline" className="text-[10px] mt-0.5">
                              {currentStatus === 'vacant-clean' ? t('room.statusVacantClean') :
                                currentStatus === 'vacant-dirty' ? t('room.statusVacantDirty') :
                                  currentStatus === 'out-of-order' ? t('room.statusOutOfOrder') : currentStatus}
                            </Badge>
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Hourly Base Price (2 hours minimum) */}
                      {isEditing ? (
                        <div className="space-y-1">
                          <Label className="text-[10px] text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t('room.hourlyBasePrice')}
                          </Label>
                          <MoneyInput
                            id="edit-hourly-base-price"
                            value={editedHourlyBasePrice}
                            onChange={setEditedHourlyBasePrice}
                            placeholder="0"
                            className="text-xs h-8"
                            suffix={` (2${t('room.hours').toLowerCase()})`}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t('room.hourlyBasePrice')}
                          </span>
                          <span className="text-sm font-bold text-purple-600">
                            {formatCurrency(currentHourlyBasePrice)}₫ (2h)
                          </span>
                        </div>
                      )}

                      {/* Hourly Rate */}
                      {isEditing ? (
                        <div className="space-y-1">
                          <Label className="text-[10px] text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t('room.hourlyPricePerHour')}
                          </Label>
                          <MoneyInput
                            id="edit-hourly-rate"
                            value={editedHourlyRate}
                            onChange={setEditedHourlyRate}
                            placeholder="0"
                            className="text-xs h-8"
                            suffix={`/${t('room.hours').toLowerCase()}`}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t('room.hourlyPrice')}
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            {formatCurrency(currentHourlyRate)}₫/{t('room.hours').toLowerCase()}
                          </span>
                        </div>
                      )}

                      {/* Overnight Price */}
                      {isEditing ? (
                        <div className="space-y-1">
                          <Label className="text-[10px] text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t('room.overnightPrice')}
                          </Label>
                          <MoneyInput
                            id="edit-overnight-price"
                            value={editedOvernightPrice}
                            onChange={setEditedOvernightPrice}
                            placeholder="0"
                            className="text-xs h-8"
                            suffix={`/${t('room.overnight').toLowerCase()}`}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t('room.overnightPrice')}
                          </span>
                          <span className="text-sm font-bold text-indigo-600">
                            {formatCurrency(currentOvernightPrice)}₫/{t('room.overnight').toLowerCase()}
                          </span>
                        </div>
                      )}

                      {/* Monthly Price */}
                      {isEditing ? (
                        <div className="space-y-1">
                          <Label className="text-[10px] text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {t('room.priceMonthly')}
                          </Label>
                          <MoneyInput
                            id="edit-monthly-price"
                            value={editedMonthlyPrice}
                            onChange={setEditedMonthlyPrice}
                            placeholder="0"
                            className="text-xs h-8"
                            suffix={`/${t('room.monthly').toLowerCase()}`}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {t('room.priceMonthly')}
                          </span>
                          <span className="text-sm font-bold text-orange-600">
                            {formatCurrency(currentMonthlyPrice)}₫/{t('room.monthly').toLowerCase()}
                          </span>
                        </div>
                      )}

                      {/* Daily Price */}
                      {isEditing ? (
                        <div className="space-y-1">
                          <Label className="text-[10px] text-gray-600 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {t('room.dailyPricePerDay')}
                          </Label>
                          <MoneyInput
                            id="edit-daily-price"
                            value={editedPrice}
                            onChange={setEditedPrice}
                            placeholder="0"
                            className="text-xs h-8"
                            suffix={`/${t('room.dailyRate').toLowerCase()}`}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {t('room.dailyPrice')}
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(currentPrice)}₫/{t('room.dailyRate').toLowerCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>

                  {room.status === 'vacant-dirty' && (
                    <Button
                      onClick={handleMarkClean}
                      className="w-full bg-green-600 hover:bg-green-700 text-xs h-9"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1.5" />
                      {t('room.markClean')}
                    </Button>
                  )}

                  {!isEditing && (
                    <Button
                      onClick={() => setActiveTab('checkin')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-9"
                    >
                      {t('room.checkinNow')}
                    </Button>
                  )}
                </>
              )}
            </TabsContent>

            {/* Check-in Tab */}
            <TabsContent value="checkin" className="space-y-2 mt-2">
              <form onSubmit={handleCheckIn} className="space-y-2">
                {/* Rental Type */}
                <Card className="p-2">
                  <Label className="text-xs font-semibold mb-0.5 block">{t('room.rentalTypeLabel')}</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <Button
                      type="button"
                      variant={rentalType === 'hourly' ? 'default' : 'outline'}
                      className="h-9 text-xs"
                      onClick={() => setRentalType('hourly')}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {t('room.hourly')}
                    </Button>
                    <Button
                      type="button"
                      variant={rentalType === 'daily' ? 'default' : 'outline'}
                      className="h-9 text-xs"
                      onClick={() => setRentalType('daily')}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      {t('room.daily')}
                    </Button>
                    <Button
                      type="button"
                      variant={rentalType === 'overnight' ? 'default' : 'outline'}
                      className="h-9 text-xs"
                      onClick={() => setRentalType('overnight')}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      {t('room.overnight')}
                    </Button>
                    <Button
                      type="button"
                      variant={rentalType === 'monthly' ? 'default' : 'outline'}
                      className={`h-9 text-xs ${rentalType === 'monthly' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                      onClick={() => setRentalType('monthly')}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      {t('room.monthly')}
                    </Button>
                  </div>
                </Card>

                {/* Guest Info */}
                <Card className="p-2">
                  <div className="mb-0">
                    <Label htmlFor="guestName" className="text-xs font-semibold mb-0 block">
                      {t('room.guestName')} *
                    </Label>
                    <Input
                      id="guestName"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder={t('room.guestNamePlaceholder')}
                      className="text-xs h-8 mb-0"
                      required
                    />
                  </div>

                  <div className={rentalType === 'hourly' || rentalType === 'monthly' ? "grid grid-cols-2 gap-2 -mt-2" : "-mt-2"}>
                    <div>
                      <Label htmlFor="guestPhone" className="text-xs font-semibold mb-0.5 block">
                        {t('room.phoneLabel')}
                      </Label>
                      <Input
                        id="guestPhone"
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="0912345678"
                        className="text-xs h-8"
                      />
                    </div>

                    {rentalType === 'hourly' && (
                      <div>
                        <Label htmlFor="hours" className="text-xs font-semibold mb-0.5 block">
                          {t('room.hoursRental')}
                        </Label>
                        <Input
                          id="hours"
                          type="number"
                          value={hours}
                          onChange={(e) => setHours(e.target.value)}
                          placeholder="3"
                          className="text-xs h-8"
                          min="1"
                          required
                        />
                      </div>
                    )}

                    {rentalType === 'monthly' && (
                      <div>
                        <Label htmlFor="months" className="text-xs font-semibold mb-0.5 block">
                          {t('room.monthsRental')}
                        </Label>
                        <Input
                          id="months"
                          type="number"
                          value={months}
                          onChange={(e) => setMonths(e.target.value)}
                          placeholder="1"
                          className="text-xs h-8"
                          min="1"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Additional Guest Information */}
                  <div className="grid grid-cols-2 gap-2 -mt-2">
                    <div>
                      <Label htmlFor="guestIdNumber" className="text-xs font-semibold mb-0.5 block">
                        {t('room.idNumber')}
                      </Label>
                      <Input
                        id="guestIdNumber"
                        value={guestIdNumber}
                        onChange={(e) => setGuestIdNumber(e.target.value)}
                        placeholder={t('room.idNumberPlaceholder')}
                        className="text-xs h-8"
                      />
                    </div>

                    <div>
                      <Label htmlFor="guestNationality" className="text-xs font-semibold mb-0.5 block">
                        {t('room.nationality')}
                      </Label>
                      <Input
                        id="guestNationality"
                        value={guestNationality}
                        onChange={(e) => setGuestNationality(e.target.value)}
                        placeholder={t('room.nationalityPlaceholder')}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 -mt-2">
                    <div>
                      <Label htmlFor="guestAddress" className="text-xs font-semibold mb-0.5 block">
                        {t('room.address')}
                      </Label>
                      <Input
                        id="guestAddress"
                        value={guestAddress}
                        onChange={(e) => setGuestAddress(e.target.value)}
                        placeholder={t('room.addressPlaceholder')}
                        className="text-xs h-8"
                      />
                    </div>

                    <div>
                      <Label htmlFor="guestPassportNumber" className="text-xs font-semibold mb-0.5 block">
                        {t('room.passportNumber')}
                      </Label>
                      <Input
                        id="guestPassportNumber"
                        value={guestPassportNumber}
                        onChange={(e) => setGuestPassportNumber(e.target.value)}
                        placeholder={t('room.passportNumberPlaceholder')}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                </Card>

                {/* Hours/Days Selection */}
                {rentalType === 'hourly' ? (
                  <Card className="p-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="checkInDateHourly" className="text-xs font-semibold mb-0.5 block">
                          {t('room.checkinDate')}
                        </Label>
                        <Input
                          id="checkInDateHourly"
                          type="datetime-local"
                          value={checkInDate}
                          onChange={(e) => setCheckInDate(e.target.value)}
                          onFocus={handleDatePickerFocus}
                          onBlur={handleDatePickerBlur}
                          className="text-xs h-8"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="checkOutDateHourly" className="text-xs font-semibold mb-0.5 block">
                          {t('room.checkoutDateExpected')}
                        </Label>
                        <Input
                          id="checkOutDateHourly"
                          type="datetime-local"
                          value={checkOutDate}
                          className="text-xs h-8 bg-gray-50"
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="checkInDate" className="text-xs font-semibold mb-0.5 block">
                          {t('room.checkinDate')}
                        </Label>
                        <Input
                          id="checkInDate"
                          type="datetime-local"
                          value={checkInDate}
                          onChange={(e) => setCheckInDate(e.target.value)}
                          onFocus={handleDatePickerFocus}
                          onBlur={handleDatePickerBlur}
                          className="text-xs h-8"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="checkOutDate" className="text-xs font-semibold mb-0.5 block">
                          {t('room.checkoutDateExpected')}
                        </Label>
                        <Input
                          id="checkOutDate"
                          type="datetime-local"
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          onFocus={handleDatePickerFocus}
                          onBlur={handleDatePickerBlur}
                          className={rentalType === 'monthly' ? "text-xs h-8 bg-gray-50" : "text-xs h-8"}
                          readOnly={rentalType === 'monthly'}
                          disabled={rentalType === 'monthly'}
                          required
                        />
                      </div>
                    </div>
                  </Card>
                )}

                <div className="bg-blue-50 p-2 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700">
                      {rentalType === 'hourly' ? `${hours} ${t('room.hours')}` : t('room.daily')}
                    </span>
                    <span className="text-xs font-semibold">
                      {formatCurrency(calculateTotal())}₫
                    </span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800">{t('room.total')}</span>
                    <span className="text-base font-bold text-blue-600">
                      {formatCurrency(calculateTotal())}₫
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-xs h-9">
                    {t('delete.cancel')}
                  </Button>
                  <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-9">
                    <CheckCircle2 className="w-3 h-3 mr-1.5" />
                    {t('room.confirmCheckin')}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Services Tab - For occupied rooms */}
            <TabsContent value="services" className="space-y-2 mt-2">
              {room.guest && (
                <>
                  <Card className="p-3">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Coffee className="w-4 h-4" />
                      {t('room.addService')}
                    </h3>
                    <div className="space-y-2">
                      <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder={t('room.selectService')} />
                        </SelectTrigger>
                        <SelectContent>
                          {hotelServices.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">
                              {t('room.noServicesAvailable')}
                            </div>
                          ) : (
                            hotelServices.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                <div className="flex items-center justify-between gap-2">
                                  <span>{service.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {formatCurrency(service.price)}₫
                                    {service.unit && `/${service.unit}`}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          value={serviceQuantity}
                          onChange={(e) => setServiceQuantity(e.target.value)}
                          placeholder={t('room.qty')}
                          className="h-9 text-sm w-20"
                        />
                        <Button
                          onClick={handleAddService}
                          disabled={!selectedServiceId}
                          className="flex-1 h-9 text-sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {t('room.add')}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Services List */}
                  {currentGuestServices.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-600">{t('room.currentServices')}</h4>
                      {currentGuestServices.map((gs) => (
                        <Card key={gs.id} className="p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {gs.serviceName || 'Service'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {t('room.qty')}: {gs.quantity}
                                  {gs.serviceUnit && ` ${gs.serviceUnit}`}
                                </span>
                                <span className="text-xs text-gray-400">×</span>
                                <span className="text-xs text-gray-500">
                                  {formatCurrency(gs.unitPrice)}₫
                                </span>
                              </div>
                              <p className="text-sm font-bold text-green-600 mt-1">
                                {formatCurrency(gs.totalPrice)}₫
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveService(gs.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}

                      {/* Total */}
                      <Card className="p-3 bg-blue-50 border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{t('room.servicesTotal')}</span>
                          <span className="text-base font-bold text-blue-600">
                            {formatCurrency(getServicesTotal())}₫
                          </span>
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Coffee className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{t('room.noServicesAdded')}</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog >

      {/* Payment Dialog - For checkout */}
      {
        room.guest && (
          <GuestHousePaymentDialog
            room={room}
            amount={getTotalWithIncidentals()}
            roomCharge={calculateGuestTotal()}
            services={currentGuestServices.map(gs => ({
              id: gs.id,
              name: gs.serviceName || 'Service',
              price: gs.unitPrice,
              quantity: gs.quantity,
            }))}
            checkOutDate={editedGuestCheckOutDate || room.guest?.checkOutDate}
            open={showPaymentDialog}
            onClose={() => setShowPaymentDialog(false)}
            onComplete={completeCheckOut}
          />
        )
      }

      {/* Cancel Room Confirmation Dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('room.cancelRoom')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('room.cancelRoomConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('action.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRoom}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('room.cancelRoom')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}