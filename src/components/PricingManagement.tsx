'use client'

import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  DollarSign, 
  Edit2, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  Layers,
  TrendingUp
} from 'lucide-react';
import { RoomType } from '../types';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface PricingManagementProps {
  open: boolean;
  onClose: () => void;
}

interface RoomTypeInfo {
  type: RoomType;
  count: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  roomIds: string[];
}

export function PricingManagement({ open, onClose }: PricingManagementProps) {
  const { rooms, updateRoom } = useApp();
  const { language } = useLanguage();
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<RoomType>>(new Set());

  // Group rooms by type with statistics
  const roomTypeStats = useMemo((): RoomTypeInfo[] => {
    const typeMap = new Map<RoomType, { prices: number[]; roomIds: string[] }>();
    
    rooms.forEach(room => {
      if (!typeMap.has(room.type)) {
        typeMap.set(room.type, { prices: [], roomIds: [] });
      }
      const data = typeMap.get(room.type)!;
      data.prices.push(room.price);
      data.roomIds.push(room.id);
    });

    return Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.prices.length,
      minPrice: Math.min(...data.prices),
      maxPrice: Math.max(...data.prices),
      avgPrice: Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length),
      roomIds: data.roomIds,
    })).sort((a, b) => a.avgPrice - b.avgPrice);
  }, [rooms]);

  const roomTypeNames: Record<RoomType, { vi: string; en: string; icon: string }> = {
    'Single': { vi: 'Phòng Đơn', en: 'Single Room', icon: '🛏️' },
    'Double': { vi: 'Phòng Đôi', en: 'Double Room', icon: '🛏️🛏️' },
    'Deluxe': { vi: 'Phòng Deluxe', en: 'Deluxe Room', icon: '✨' },
    'Suite': { vi: 'Phòng Suite', en: 'Suite Room', icon: '👑' },
    'Family': { vi: 'Phòng Gia Đình', en: 'Family Room', icon: '👨‍👩‍👧‍👦' },
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleStartEditType = (type: RoomType, avgPrice: number) => {
    setEditingType(type);
    setNewPrice(avgPrice.toString());
    setEditingRoomId(null);
  };

  const handleStartEditRoom = (roomId: string, currentPrice: number) => {
    setEditingRoomId(roomId);
    setNewPrice(currentPrice.toString());
    setEditingType(null);
  };

  const handleUpdateTypePrice = (typeInfo: RoomTypeInfo) => {
    const price = parseInt(newPrice);
    if (!price || price < 0 || price > 100000000) {
      toast.error('Giá không hợp lệ! Vui lòng nhập từ 0 đến 100,000,000 VND');
      return;
    }

    typeInfo.roomIds.forEach(roomId => {
      updateRoom(roomId, { price });
    });

    const typeName = roomTypeNames[typeInfo.type][language === 'vi' ? 'vi' : 'en'];
    toast.success(`Đã cập nhật giá cho tất cả ${typeInfo.count} phòng ${typeName}!`);
    setEditingType(null);
    setNewPrice('');
  };

  const handleUpdateRoomPrice = (roomId: string, roomNumber: string) => {
    const price = parseInt(newPrice);
    if (!price || price < 0 || price > 100000000) {
      toast.error('Giá không hợp lệ! Vui lòng nhập từ 0 đến 100,000,000 VND');
      return;
    }

    updateRoom(roomId, { price });
    toast.success(`Đã cập nhật giá phòng ${roomNumber}!`);
    setEditingRoomId(null);
    setNewPrice('');
  };

  const handleCancel = () => {
    setEditingType(null);
    setEditingRoomId(null);
    setNewPrice('');
  };

  const toggleExpanded = (type: RoomType) => {
    const newSet = new Set(expandedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setExpandedTypes(newSet);
  };

  const getRoomsOfType = (type: RoomType) => {
    return rooms.filter(r => r.type === type).sort((a, b) => a.number.localeCompare(b.number));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            {language === 'vi' ? 'Quản lý Giá Phòng' : 'Room Pricing Management'}
          </DialogTitle>
          <DialogDescription>
            {language === 'vi' 
              ? 'Cập nhật giá phòng theo loại hoặc từng phòng riêng lẻ'
              : 'Update room prices by type or individual rooms'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sticky top-0 bg-white pb-4 z-10">
            <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-700">{language === 'vi' ? 'Loại phòng' : 'Room Types'}</p>
                  <p className="text-blue-900">{roomTypeStats.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-700">{language === 'vi' ? 'Tổng phòng' : 'Total Rooms'}</p>
                  <p className="text-purple-900">{rooms.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 border-green-200 col-span-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs text-green-700">{language === 'vi' ? 'Giá trung bình' : 'Average Price'}</p>
                  <p className="text-green-900">
                    {formatPrice(Math.round(rooms.reduce((sum, r) => sum + r.price, 0) / rooms.length))}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Room Type Cards */}
          <div className="space-y-3">
            {roomTypeStats.map((typeInfo) => {
              const typeData = roomTypeNames[typeInfo.type];
              const isExpanded = expandedTypes.has(typeInfo.type);
              const isEditing = editingType === typeInfo.type;
              const roomsOfType = getRoomsOfType(typeInfo.type);
              const hasVariedPrices = typeInfo.minPrice !== typeInfo.maxPrice;

              return (
                <Card key={typeInfo.type} className="overflow-hidden">
                  <div className="p-4">
                    {/* Type Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{typeData.icon}</span>
                        <div>
                          <h3 className="text-gray-900 flex items-center gap-2">
                            {typeData[language === 'vi' ? 'vi' : 'en']}
                            <Badge variant="secondary" className="text-xs">
                              {typeInfo.count} {language === 'vi' ? 'phòng' : 'rooms'}
                            </Badge>
                          </h3>
                          {hasVariedPrices ? (
                            <p className="text-sm text-gray-500">
                              {formatPrice(typeInfo.minPrice)} - {formatPrice(typeInfo.maxPrice)}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">
                              {formatPrice(typeInfo.avgPrice)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Edit Type Price */}
                      {!isEditing ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEditType(typeInfo.type, typeInfo.avgPrice)}
                          className="flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          {language === 'vi' ? 'Sửa giá' : 'Edit Price'}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            placeholder="Nhập giá mới"
                            className="w-40"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUpdateTypePrice(typeInfo)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Collapsible Room List */}
                    {hasVariedPrices && (
                      <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(typeInfo.type)}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <span>
                              {isExpanded 
                                ? (language === 'vi' ? 'Ẩn danh sách phòng' : 'Hide room list')
                                : (language === 'vi' ? 'Xem danh sách phòng' : 'View room list')}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <Separator className="my-3" />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {roomsOfType.map((room) => {
                              const isEditingRoom = editingRoomId === room.id;
                              return (
                                <div
                                  key={room.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100"
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{room.number}</Badge>
                                    {!isEditingRoom && (
                                      <span className="text-sm text-gray-700">{formatPrice(room.price)}</span>
                                    )}
                                  </div>
                                  
                                  {!isEditingRoom ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleStartEditRoom(room.id, room.price)}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        className="w-32 h-8 text-sm"
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        variant="default"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleUpdateRoomPrice(room.id, room.number)}
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                        onClick={handleCancel}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Help Text */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-900">
              💡 <strong>{language === 'vi' ? 'Mẹo:' : 'Tip:'}</strong>{' '}
              {language === 'vi' 
                ? 'Click "Sửa giá" để cập nhật giá cho tất cả phòng cùng loại. Nếu các phòng có giá khác nhau, click "Xem danh sách phòng" để chỉnh sửa từng phòng riêng lẻ.'
                : 'Click "Edit Price" to update price for all rooms of the same type. If rooms have different prices, click "View room list" to edit individual rooms.'}
            </p>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            {language === 'vi' ? 'Đóng' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
