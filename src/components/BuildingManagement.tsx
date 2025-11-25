'use client'

import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useBusinessModel } from '../hooks/useBusinessModel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MoneyInput } from './MoneyInput';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { 
  Building2, 
  Layers, 
  Plus, 
  Trash2, 
  Home,
  AlertCircle,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { RoomType } from '../types';

interface BuildingManagementProps {
  open: boolean;
  onClose: () => void;
}

interface DeleteConfirm {
  type: 'building' | 'floor' | 'room';
  id: string;
  name: string;
  buildingId?: string;
  floor?: number;
}

export function BuildingManagement({ open, onClose }: BuildingManagementProps) {
  const { rooms, hotel, addBuilding, deleteBuilding, addRoom, deleteRoom, deleteFloor } = useApp();
  const { features } = useBusinessModel();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  
  // Add Building Form
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState('');
  
  // Add Floor Form
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [newFloorBuilding, setNewFloorBuilding] = useState('');
  const [newFloorNumber, setNewFloorNumber] = useState('');
  
  // Add Room Form
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomBuilding, setNewRoomBuilding] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomType, setNewRoomType] = useState<RoomType>('standard');
  const [newRoomPrice, setNewRoomPrice] = useState('');

  // Group rooms by building and floor
  const roomsByBuilding = useMemo(() => {
    const grouped = new Map<string, Map<number, typeof rooms>>();
    
    rooms.forEach(room => {
      const buildingId = room.buildingId || 'default';
      if (!grouped.has(buildingId)) {
        grouped.set(buildingId, new Map());
      }
      const building = grouped.get(buildingId)!;
      if (!building.has(room.floor)) {
        building.set(room.floor, []);
      }
      building.get(room.floor)!.push(room);
    });
    
    return grouped;
  }, [rooms]);

  const handleAddBuilding = () => {
    if (!newBuildingName.trim()) {
      toast.error('Vui lòng nhập tên tòa nhà');
      return;
    }
    
    addBuilding({
      name: newBuildingName,
      description: ''
    });
    
    toast.success(`Đã thêm tòa nhà "${newBuildingName}"`);
    setNewBuildingName('');
    setShowAddBuilding(false);
  };

  const handleAddFloor = () => {
    const floorNum = parseInt(newFloorNumber);
    if (!newFloorBuilding || isNaN(floorNum) || floorNum < 1) {
      toast.error('Vui lòng chọn tòa nhà và nhập số tầng hợp lệ');
      return;
    }
    
    // Create a sample room on the new floor
    const building = hotel.buildings?.find(b => b.id === newFloorBuilding);
    const buildingName = building?.name || '';
    
    addRoom({
      number: `${floorNum}01`,
      type: 'standard',
      price: 200000,
      floor: floorNum,
      buildingId: newFloorBuilding === 'default' ? undefined : newFloorBuilding,
      status: 'available'
    });
    
    toast.success(`Đã thêm tầng ${floorNum}${buildingName ? ` vào ${buildingName}` : ''}`);
    setNewFloorNumber('');
    setShowAddFloor(false);
  };

  const handleAddRoom = () => {
    if (!newRoomNumber.trim() || !newRoomFloor || !newRoomPrice) {
      toast.error('Vui lòng điền đầy đủ thông tin phòng');
      return;
    }
    
    const floorNum = parseInt(newRoomFloor);
    const price = parseInt(newRoomPrice);
    
    if (isNaN(floorNum) || isNaN(price) || price < 0) {
      toast.error('Thông tin không hợp lệ');
      return;
    }
    
    // Check if room number already exists
    const existingRoom = rooms.find(r => 
      r.number === newRoomNumber && 
      r.buildingId === (newRoomBuilding === 'default' ? undefined : newRoomBuilding)
    );
    
    if (existingRoom) {
      toast.error(`Phòng ${newRoomNumber} đã tồn tại`);
      return;
    }
    
    addRoom({
      number: newRoomNumber,
      type: newRoomType,
      price: price,
      floor: floorNum,
      buildingId: newRoomBuilding === 'default' ? undefined : newRoomBuilding,
      status: 'available'
    });
    
    toast.success(`Đã thêm phòng ${newRoomNumber}`);
    setNewRoomNumber('');
    setNewRoomPrice('');
    setShowAddRoom(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    
    try {
      if (deleteConfirm.type === 'building') {
        const buildingRooms = rooms.filter(r => r.buildingId === deleteConfirm.id);
        const hasOccupied = features.isGuestHouse 
          ? buildingRooms.some(r => r.guest)
          : buildingRooms.some(r => r.tenant);
        
        if (hasOccupied) {
          toast.error('Không thể xóa tòa nhà đang có khách/người thuê');
          setDeleteConfirm(null);
          return;
        }
        
        deleteBuilding(deleteConfirm.id);
        toast.success(`Đã xóa tòa nhà "${deleteConfirm.name}"`);
      } else if (deleteConfirm.type === 'floor') {
        if (deleteConfirm.buildingId && deleteConfirm.floor !== undefined) {
          deleteFloor(deleteConfirm.buildingId, deleteConfirm.floor);
          toast.success(`Đã xóa ${deleteConfirm.name}`);
        }
      } else if (deleteConfirm.type === 'room') {
        deleteRoom(deleteConfirm.id);
        toast.success(`Đã xóa ${deleteConfirm.name}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi xóa');
    }
    
    setDeleteConfirm(null);
  };

  const getRoomTypeLabel = (type: RoomType) => {
    const labels = {
      standard: 'Tiêu chuẩn',
      deluxe: 'Cao cấp',
      suite: 'Hạng sang',
      dormitory: 'Ký túc xá'
    };
    return labels[type] || type;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Quản lý Tòa nhà & Phòng
            </DialogTitle>
            <DialogDescription>
              Thêm, sửa, xóa tòa nhà, tầng và phòng
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="add">Thêm mới</TabsTrigger>
              <TabsTrigger value="manage">Quản lý</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Tòa nhà</p>
                      <p className="text-2xl font-bold">{hotel.buildings?.length || 0}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Layers className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Tầng</p>
                      <p className="text-2xl font-bold">
                        {new Set(rooms.map(r => `${r.buildingId || 'default'}-${r.floor}`)).size}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Home className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Phòng</p>
                      <p className="text-2xl font-bold">{rooms.length}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Cấu trúc hiện tại</h3>
                
                {hotel.buildings && hotel.buildings.length > 0 ? (
                  <Accordion type="single" collapsible className="space-y-2">
                    {hotel.buildings.map(building => {
                      const buildingRooms = roomsByBuilding.get(building.id);
                      const totalRooms = buildingRooms 
                        ? Array.from(buildingRooms.values()).reduce((sum, floors) => sum + floors.length, 0)
                        : 0;
                      
                      return (
                        <AccordionItem key={building.id} value={building.id}>
                          <AccordionTrigger>
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                <span>{building.name}</span>
                              </div>
                              <Badge variant="outline">{totalRooms} phòng</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {buildingRooms && Array.from(buildingRooms.entries())
                              .sort(([a], [b]) => a - b)
                              .map(([floor, floorRooms]) => (
                                <div key={`${building.id}-floor-${floor}`} className="ml-6 py-2 border-l-2 border-gray-200 pl-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Layers className="w-4 h-4 text-gray-600" />
                                    <span className="font-medium">Tầng {floor}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {floorRooms.length} phòng
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-2 ml-6">
                                    {floorRooms.map(room => (
                                      <Badge 
                                        key={room.id} 
                                        variant={room.guest || room.tenant ? "default" : "outline"}
                                        className="text-xs"
                                      >
                                        {room.number}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <Card className="p-6 text-center text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Chưa có tòa nhà nào</p>
                    <p className="text-sm">Thêm tòa nhà đầu tiên ở tab "Thêm mới"</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Add Tab */}
            <TabsContent value="add" className="space-y-6">
              {/* Add Building */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Thêm Tòa nhà</h3>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowAddBuilding(!showAddBuilding)}
                    variant={showAddBuilding ? "secondary" : "default"}
                  >
                    {showAddBuilding ? 'Hủy' : 'Thêm'}
                  </Button>
                </div>
                
                {showAddBuilding && (
                  <div className="space-y-3 pt-3 border-t">
                    <div>
                      <Label>Tên tòa nhà</Label>
                      <Input
                        value={newBuildingName}
                        onChange={(e) => setNewBuildingName(e.target.value)}
                        placeholder="VD: Tòa A, Tòa B..."
                        onKeyPress={(e) => e.key === 'Enter' && handleAddBuilding()}
                      />
                    </div>
                    <Button onClick={handleAddBuilding} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm tòa nhà
                    </Button>
                  </div>
                )}
              </Card>

              {/* Add Floor */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold">Thêm Tầng</h3>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowAddFloor(!showAddFloor)}
                    variant={showAddFloor ? "secondary" : "default"}
                  >
                    {showAddFloor ? 'Hủy' : 'Thêm'}
                  </Button>
                </div>
                
                {showAddFloor && (
                  <div className="space-y-3 pt-3 border-t">
                    <div>
                      <Label>Tòa nhà</Label>
                      <select
                        value={newFloorBuilding}
                        onChange={(e) => setNewFloorBuilding(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Chọn tòa nhà...</option>
                        <option value="default">Mặc định (không có tòa)</option>
                        {hotel.buildings?.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Số tầng</Label>
                      <Input
                        type="number"
                        value={newFloorNumber}
                        onChange={(e) => setNewFloorNumber(e.target.value)}
                        placeholder="VD: 1, 2, 3..."
                        min="1"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddFloor()}
                      />
                    </div>
                    <Button onClick={handleAddFloor} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm tầng
                    </Button>
                  </div>
                )}
              </Card>

              {/* Add Room */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">Thêm Phòng</h3>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowAddRoom(!showAddRoom)}
                    variant={showAddRoom ? "secondary" : "default"}
                  >
                    {showAddRoom ? 'Hủy' : 'Thêm'}
                  </Button>
                </div>
                
                {showAddRoom && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Tòa nhà</Label>
                        <select
                          value={newRoomBuilding}
                          onChange={(e) => setNewRoomBuilding(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Chọn tòa...</option>
                          <option value="default">Mặc định</option>
                          {hotel.buildings?.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Tầng</Label>
                        <Input
                          type="number"
                          value={newRoomFloor}
                          onChange={(e) => setNewRoomFloor(e.target.value)}
                          placeholder="Số tầng"
                          min="1"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Số phòng</Label>
                        <Input
                          value={newRoomNumber}
                          onChange={(e) => setNewRoomNumber(e.target.value)}
                          placeholder="VD: 101, 102..."
                        />
                      </div>
                      <div>
                        <Label>Loại phòng</Label>
                        <select
                          value={newRoomType}
                          onChange={(e) => setNewRoomType(e.target.value as RoomType)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="standard">Tiêu chuẩn</option>
                          <option value="deluxe">Cao cấp</option>
                          <option value="suite">Hạng sang</option>
                          {features.isBoardingHouse && (
                            <option value="dormitory">Ký túc xá</option>
                          )}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label>
                        Giá {features.isBoardingHouse ? 'thuê/tháng' : features.isGuestHouse ? 'theo giờ' : '/đêm'} (₫)
                      </Label>
                      <MoneyInput
                        id="new-room-price"
                        value={newRoomPrice}
                        onChange={setNewRoomPrice}
                        placeholder="200000"
                      />
                    </div>
                    
                    <Button onClick={handleAddRoom} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm phòng
                    </Button>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Manage Tab */}
            <TabsContent value="manage" className="space-y-4">
              <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Lưu ý khi xóa:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Không thể xóa phòng/tầng/tòa đang có khách hoặc người thuê</li>
                      <li>Xóa tầng sẽ xóa tất cả phòng trong tầng đó</li>
                      <li>Xóa tòa nhà sẽ xóa tất cả tầng và phòng trong tòa</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {hotel.buildings && hotel.buildings.length > 0 ? (
                <div className="space-y-3">
                  {hotel.buildings.map(building => {
                    const buildingRooms = roomsByBuilding.get(building.id);
                    const totalRooms = buildingRooms 
                      ? Array.from(buildingRooms.values()).reduce((sum, floors) => sum + floors.length, 0)
                      : 0;
                    
                    return (
                      <Card key={building.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold">{building.name}</h3>
                            <Badge variant="outline">{totalRooms} phòng</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const hasOccupied = rooms
                                .filter(r => r.buildingId === building.id)
                                .some(r => r.guest || r.tenant);
                              
                              if (hasOccupied) {
                                toast.error('Không thể xóa tòa nhà đang có khách/người thuê');
                                return;
                              }
                              
                              setDeleteConfirm({
                                type: 'building',
                                id: building.id,
                                name: building.name
                              });
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {buildingRooms && (
                          <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                            {Array.from(buildingRooms.entries())
                              .sort(([a], [b]) => a - b)
                              .map(([floor, floorRooms]) => (
                                <div key={`${building.id}-manage-floor-${floor}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Layers className="w-4 h-4 text-purple-600" />
                                      <span className="font-medium">Tầng {floor}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {floorRooms.length} phòng
                                      </Badge>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        const hasOccupied = floorRooms.some(r => r.guest || r.tenant);
                                        if (hasOccupied) {
                                          toast.error('Không thể xóa tầng đang có khách/người thuê');
                                          return;
                                        }
                                        
                                        setDeleteConfirm({
                                          type: 'floor',
                                          id: `${building.id}-${floor}`,
                                          name: `Tầng ${floor} - ${building.name}`,
                                          buildingId: building.id,
                                          floor: floor
                                        });
                                      }}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 ml-6">
                                    {floorRooms.map(room => (
                                      <Card 
                                        key={room.id}
                                        className={`p-3 ${
                                          room.guest || room.tenant 
                                            ? 'bg-blue-50 border-blue-200' 
                                            : 'bg-gray-50'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <p className="font-semibold">{room.number}</p>
                                            <p className="text-xs text-gray-600">
                                              {formatCurrency(room.price)}₫
                                            </p>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              if (room.guest || room.tenant) {
                                                toast.error('Không thể xóa phòng đang có khách/người thuê');
                                                return;
                                              }
                                              
                                              setDeleteConfirm({
                                                type: 'room',
                                                id: room.id,
                                                name: `Phòng ${room.number}`
                                              });
                                            }}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-8 text-center text-gray-500">
                  <Building2 className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">Chưa có tòa nhà</p>
                  <p className="text-sm">Thêm tòa nhà ở tab "Thêm mới"</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Xác nhận xóa
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm && (
                <>
                  Bạn có chắc muốn xóa <strong>{deleteConfirm.name}</strong>?
                  {deleteConfirm.type === 'floor' && (
                    <p className="text-amber-600 mt-2">
                      ⚠️ Tất cả phòng trong tầng này sẽ bị xóa vĩnh viễn!
                    </p>
                  )}
                  {deleteConfirm.type === 'building' && (
                    <p className="text-amber-600 mt-2">
                      ⚠️ Tất cả tầng và phòng trong tòa nhà này sẽ bị xóa vĩnh viễn!
                    </p>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}