'use client'

import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Building, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface AddBuildingDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddBuildingDialog({ open, onClose }: AddBuildingDialogProps) {
  const { hotel, addBuilding } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Vui lòng nhập tên khu trọ');
      return;
    }

    const newBuilding = {
      id: `building-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      order: (hotel?.buildings.length || 0) + 1,
    };

    addBuilding(newBuilding);
    toast.success(`Đã thêm khu trọ "${name}"`);
    
    // Reset form
    setName('');
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Building className="w-6 h-6 text-blue-600" />
            Thêm Khu Trọ Mới
          </DialogTitle>
          <DialogDescription>
            Tạo khu trọ mới để quản lý phòng riêng biệt
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="building-name" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Tên Khu Trọ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="building-name"
              placeholder="VD: Khu A, Dãy 1, Nhà số 1..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              Tên ngắn gọn, dễ nhớ để phân biệt các khu trọ
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="building-description">Mô Tả (Tùy chọn)</Label>
            <Input
              id="building-description"
              placeholder="VD: Khu phía sau, gần cổng chính..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Ghi chú để dễ nhận biết vị trí, đặc điểm
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
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Building className="w-4 h-4 mr-2" />
              Tạo Khu Trọ
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
