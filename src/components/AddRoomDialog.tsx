'use client'

import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Home, DoorOpen, DollarSign, Clock, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useBusinessModel } from '../hooks/useBusinessModel';
import { MoneyInput } from './MoneyInput';

interface AddRoomDialogProps {
  open: boolean;
  onClose: () => void;
  defaultBuildingId?: string;
  buildingId?: string; // For direct building specification
}

export function AddRoomDialog({ open, onClose, defaultBuildingId, buildingId }: AddRoomDialogProps) {
  const { hotel, addRoom, businessModel, rooms } = useApp();
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState(buildingId || defaultBuildingId || '');
  const [selectedFloor, setSelectedFloor] = useState('1');
  const [price, setPrice] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const isGuesthouse = businessModel === 'guesthouse';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomNumber.trim()) {
      toast.error('Vui lòng nhập số phòng');
      return;
    }

    if (!selectedBuildingId) {
      toast.error('Vui lòng chọn khu trọ');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast.error('Vui lòng nhập giá phòng hợp lệ');
      return;
    }

    if (isGuesthouse && (!hourlyRate || parseFloat(hourlyRate) <= 0)) {
      toast.error('Vui lòng nhập giá theo giờ hợp lệ');
      return;
    }

    const newRoom = {
      id: `room-${Date.now()}`,
      number: roomNumber.trim(),
      floor: parseInt(selectedFloor),
      buildingId: selectedBuildingId,
      type: 'Single' as const,
      price: parseFloat(price),
      hourlyRate: isGuesthouse ? parseFloat(hourlyRate) : undefined,
      status: 'vacant-clean' as const,
    };

    addRoom(newRoom);
    toast.success(`Đã thêm phòng ${roomNumber} (Tầng ${selectedFloor})`);
    
    // Reset form
    setRoomNumber('');
    setSelectedFloor('1');
    setPrice('');
    setHourlyRate('');
    if (!defaultBuildingId && !buildingId) {
      setSelectedBuildingId('');
    }
    onClose();
  };

  const handleClose = () => {
    setRoomNumber('');
    setSelectedFloor('1');
    setPrice('');
    setHourlyRate('');
    if (!defaultBuildingId && !buildingId) {
      setSelectedBuildingId('');
    }
    onClose();
  };

  // Auto-select building if only one exists or if default is provided
  useEffect(() => {
    if (buildingId) {
      setSelectedBuildingId(buildingId);
    } else if (defaultBuildingId) {
      setSelectedBuildingId(defaultBuildingId);
    } else if (hotel?.buildings.length === 1) {
      setSelectedBuildingId(hotel.buildings[0].id);
    }
  }, [buildingId, defaultBuildingId, hotel?.buildings]);

  // Get available floors for the selected building
  const availableFloors = rooms
    .filter(room => room.buildingId === selectedBuildingId)
    .map(room => room.floor)
    .filter((floor, index, self) => self.indexOf(floor) === index)
    .sort((a, b) => b - a); // Sort descending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <DoorOpen className="w-6 h-6 text-green-600" />
            {isGuesthouse ? 'Thêm Phòng Mới' : 'Thêm Phòng Trọ Mới'}
          </DialogTitle>
          <DialogDescription>
            Tạo phòng mới để {isGuesthouse ? 'phục vụ khách' : 'cho thuê'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Building Selection */}
          {!defaultBuildingId && !buildingId && (
            <div className="space-y-2">
              <Label htmlFor="building-select" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                {isGuesthouse ? 'Tòa nhà' : 'Khu Trọ'} <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                <SelectTrigger>
                  <SelectValue placeholder={isGuesthouse ? "Chọn tòa nhà..." : "Chọn khu trọ..."} />
                </SelectTrigger>
                <SelectContent>
                  {hotel?.buildings.map(building => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Room Number */}
          <div className="space-y-2">
            <Label htmlFor="room-number" className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4" />
              Số Phòng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="room-number"
              placeholder="VD: 101, A1, P1..."
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="text-lg"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              Số phòng duy nhất, dễ nhớ
            </p>
          </div>

          {/* Floor Selection */}
          <div className="space-y-2">
            <Label htmlFor="floor-select" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Tầng <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedFloor} onValueChange={setSelectedFloor}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn tầng..." />
              </SelectTrigger>
              <SelectContent>
                {/* Show existing floors first */}
                {availableFloors.map(floor => (
                  <SelectItem key={floor} value={floor.toString()}>
                    Tầng {floor}
                  </SelectItem>
                ))}
                {/* Always allow creating new floors 1-20 */}
                {Array.from({ length: 20 }, (_, i) => i + 1)
                  .filter(floor => !availableFloors.includes(floor))
                  .map(floor => (
                    <SelectItem key={floor} value={floor.toString()}>
                      Tầng {floor} <span className="text-gray-500 text-xs">(mới)</span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Chọn tầng hiện có hoặc tạo tầng mới
            </p>
          </div>

          {/* Hourly Rate - Only for Guesthouse */}
          {isGuesthouse && (
            <div className="space-y-2">
              <Label htmlFor="hourly-rate" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Giá Theo Giờ <span className="text-red-500">*</span>
              </Label>
              <MoneyInput
                id="hourly-rate"
                value={hourlyRate}
                onChange={setHourlyRate}
                placeholder="80000"
                className="text-lg"
                suffix="/giờ"
                required
              />
              {hourlyRate && parseFloat(hourlyRate) > 0 && (
                <p className="text-xs text-gray-600">
                  ≈ ₫{parseFloat(hourlyRate).toLocaleString()} / giờ
                </p>
              )}
            </div>
          )}

          {/* Daily Price */}
          <div className="space-y-2">
            <Label htmlFor="room-price" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {isGuesthouse ? 'Giá Theo Ngày' : 'Giá Thuê / Tháng'} <span className="text-red-500">*</span>
            </Label>
            <MoneyInput
              id="room-price"
              value={price}
              onChange={setPrice}
              placeholder={isGuesthouse ? "300000" : "2000000"}
              className="text-lg"
              suffix={isGuesthouse ? '/ngày' : ''}
              required
            />
            {price && parseFloat(price) > 0 && (
              <p className="text-xs text-gray-600">
                ≈ ₫{parseFloat(price).toLocaleString()} / {isGuesthouse ? 'ngày' : 'tháng'}
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              💡 <strong>Lưu ý:</strong> {isGuesthouse 
                ? 'Giá theo giờ và theo ngày sẽ được sử dụng khi check-in khách.' 
                : 'Sau khi tạo phòng, bạn có thể thêm người thuê và cài đặt giá điện/nước bằng cách click vào phòng.'}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <DoorOpen className="w-4 h-4 mr-2" />
              Tạo Phòng
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}