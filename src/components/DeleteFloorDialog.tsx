'use client'

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Room } from '../types';
import { Layers, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface DeleteFloorDialogProps {
  open: boolean;
  onClose: () => void;
  buildingId?: string;
}

export function DeleteFloorDialog({ open, onClose, buildingId = '' }: DeleteFloorDialogProps) {
  const { rooms, deleteFloor } = useApp();
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  // Get available floors in the building
  const availableFloors = useMemo(() => {
    const floors = rooms
      .filter(r => !buildingId || r.buildingId === buildingId)
      .map(r => r.floor);
    
    // Get unique floors and sort descending
    return Array.from(new Set(floors)).sort((a, b) => b - a);
  }, [rooms, buildingId]);

  // Get rooms on selected floor
  const floorRooms = useMemo(() => {
    if (selectedFloor === null) return [];
    return rooms.filter(r => 
      r.floor === selectedFloor && 
      (!buildingId || r.buildingId === buildingId)
    );
  }, [rooms, selectedFloor, buildingId]);

  // Count occupied rooms
  const occupiedRooms = useMemo(() => {
    return floorRooms.filter(r => r.guest || r.tenant);
  }, [floorRooms]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedFloor(null);
    }
  }, [open]);

  const canDelete = selectedFloor !== null && occupiedRooms.length === 0;

  const handleDelete = () => {
    if (selectedFloor === null) {
      toast.error('Vui lòng chọn tầng cần xóa');
      return;
    }

    if (!canDelete) {
      toast.error('Không thể xóa tầng đang có khách/người thuê');
      return;
    }

    // Delete all rooms on this floor
    deleteFloor(selectedFloor, buildingId);

    toast.success(`✅ Đã xóa tầng ${selectedFloor}`, {
      description: `${floorRooms.length} phòng đã được xóa`
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-600" />
            Xóa Tầng
          </DialogTitle>
          <DialogDescription>
            Chọn tầng cần xóa. Tất cả phòng trống trên tầng sẽ bị xóa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Floor Selection */}
          <div className="space-y-2">
            <Label htmlFor="floor-select" className="text-base">
              Chọn Tầng <span className="text-red-500">*</span>
            </Label>
            {availableFloors.length > 0 ? (
              <Select
                value={selectedFloor?.toString() || ''}
                onValueChange={(value) => setSelectedFloor(Number(value))}
              >
                <SelectTrigger id="floor-select" className="text-lg">
                  <SelectValue placeholder="Chọn tầng..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFloors.map(floor => {
                    const roomsOnFloor = rooms.filter(r => 
                      r.floor === floor && 
                      (!buildingId || r.buildingId === buildingId)
                    );
                    const occupiedCount = roomsOnFloor.filter(r => r.guest || r.tenant).length;
                    
                    return (
                      <SelectItem key={floor} value={floor.toString()}>
                        <div className="flex items-center gap-2">
                          <span>Tầng {floor}</span>
                          <Badge variant="outline" className="text-xs">
                            {roomsOnFloor.length} phòng
                          </Badge>
                          {occupiedCount > 0 && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                              {occupiedCount} có khách
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">
                Không có tầng nào để xóa
              </p>
            )}
          </div>

          {/* Floor Info */}
          {selectedFloor !== null && (
            <div className={`rounded-lg p-4 border-2 ${
              canDelete 
                ? 'bg-yellow-50 border-yellow-300' 
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-start gap-3">
                {canDelete ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold mb-2 ${
                    canDelete ? 'text-yellow-900' : 'text-red-900'
                  }`}>
                    {canDelete ? '⚠️ Cảnh báo' : '❌ Không thể xóa'}
                  </p>
                  <ul className={`text-sm space-y-1 ${
                    canDelete ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    <li>• <strong>Tầng:</strong> {selectedFloor}</li>
                    <li>• <strong>Tổng phòng:</strong> {floorRooms.length} phòng</li>
                    <li>• <strong>Phòng trống:</strong> {floorRooms.length - occupiedRooms.length} phòng</li>
                    <li>• <strong>Phòng có khách:</strong> {occupiedRooms.length} phòng</li>
                  </ul>
                  
                  {!canDelete && (
                    <p className="mt-3 text-sm font-semibold text-red-900">
                      ⚠️ Vui lòng checkout/dọn dẹp tất cả phòng trước khi xóa tầng
                    </p>
                  )}
                  
                  {canDelete && floorRooms.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-yellow-900 mb-1">
                        Phòng sẽ bị xóa:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {floorRooms.map(room => (
                          <Badge 
                            key={room.id} 
                            variant="outline" 
                            className="text-xs bg-white"
                          >
                            {room.number}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 text-lg py-6"
            >
              Hủy
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!canDelete || selectedFloor === null}
              className="flex-1 text-lg py-6 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Xóa Tầng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
