'use client'

import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBusinessModel } from '../hooks/useBusinessModel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Settings,
  Plus,
  Trash2,
  Filter,
  Building2,
  Layers,
  Check,
  X,
  Edit2,
  Eye,
  ArrowRight
} from 'lucide-react';
import { RoomType, RoomStatus } from '../types';
import { toast } from 'sonner';
import { Label } from './ui/label';
import { Progress } from './ui/progress';

interface RoomConfigDialogProps {
  open: boolean;
  onClose: () => void;
}

interface EditingRoom {
  id: string;
  field: 'number' | 'type' | 'price' | 'floor';
  value: string;
}

export function RoomConfigDialog({ open, onClose }: RoomConfigDialogProps) {
  const { rooms, updateRoom, addRoom, deleteRoom, hotel, addBuilding, updateBuilding, deleteBuilding } = useApp();
  const { language } = useLanguage();
  const { features } = useBusinessModel();
  
  const [activeTab, setActiveTab] = useState('rooms');
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterBuilding, setFilterBuilding] = useState<string>('all');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [floorToDelete, setFloorToDelete] = useState<number | null>(null);
  const [editingRoom, setEditingRoom] = useState<EditingRoom | null>(null);
  
  // New room form
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('1');
  const [newRoomBuildingId, setNewRoomBuildingId] = useState('');
  const [newRoomType, setNewRoomType] = useState<RoomType>('Single');
  const [newRoomPrice, setNewRoomPrice] = useState('300000');

  // New floor - inline in table
  const [newFloorNumber, setNewFloorNumber] = useState('');
  const [isAddingFloor, setIsAddingFloor] = useState(false);
  
  // Buildings management
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [newBuildingDescription, setNewBuildingDescription] = useState('');
  const [buildingToDelete, setBuildingToDelete] = useState<string | null>(null);
  const [editingBuilding, setEditingBuilding] = useState<{ id: string; name: string; description: string } | null>(null);

  // Set default building when dialog opens
  useEffect(() => {
    if (open && hotel?.buildings && hotel.buildings.length > 0 && !newRoomBuildingId) {
      setNewRoomBuildingId(hotel.buildings[0].id);
    }
  }, [open, hotel?.buildings]);

  const roomTypeNames: Record<RoomType, { vi: string; en: string }> = {
    'Single': { vi: 'Phòng Đơn', en: 'Single' },
    'Double': { vi: 'Phòng Đôi', en: 'Double' },
    'Deluxe': { vi: 'Phòng Deluxe', en: 'Deluxe' },
    'Suite': { vi: 'Phòng Suite', en: 'Suite' },
    'Family': { vi: 'Phòng Gia Đình', en: 'Family' },
  };

  const statusNames: Record<RoomStatus, { vi: string; en: string; color: string }> = {
    'vacant-clean': { vi: 'Trống - Sạch', en: 'Vacant Clean', color: 'bg-green-100 text-green-800' },
    'occupied': { vi: 'Có khách', en: 'Occupied', color: 'bg-red-100 text-red-800' },
    'vacant-dirty': { vi: 'Trống - Bẩn', en: 'Vacant Dirty', color: 'bg-gray-100 text-gray-800' },
    'due-out': { vi: 'Sắp trả', en: 'Due Out', color: 'bg-orange-100 text-orange-800' },
    'out-of-order': { vi: 'Bảo trì', en: 'Out of Order', color: 'bg-purple-100 text-purple-800' },
  };

  // Floor statistics
  const floorStats = useMemo(() => {
    const stats = new Map<number, {
      floor: number;
      totalRooms: number;
      occupiedRooms: number;
      cleanRooms: number;
      dirtyRooms: number;
      dueOutRooms: number;
      maintenanceRooms: number;
    }>();

    rooms.forEach(room => {
      if (!stats.has(room.floor)) {
        stats.set(room.floor, {
          floor: room.floor,
          totalRooms: 0,
          occupiedRooms: 0,
          cleanRooms: 0,
          dirtyRooms: 0,
          dueOutRooms: 0,
          maintenanceRooms: 0,
        });
      }
      const stat = stats.get(room.floor)!;
      stat.totalRooms++;
      if (room.status === 'occupied') stat.occupiedRooms++;
      if (room.status === 'vacant-clean') stat.cleanRooms++;
      if (room.status === 'vacant-dirty') stat.dirtyRooms++;
      if (room.status === 'due-out') stat.dueOutRooms++;
      if (room.status === 'out-of-order') stat.maintenanceRooms++;
    });

    return Array.from(stats.values()).sort((a, b) => a.floor - b.floor);
  }, [rooms]);

  const floors = useMemo(() => {
    const uniqueFloors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);
    return uniqueFloors;
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms
      .filter(room => {
        if (filterFloor !== 'all' && room.floor !== parseInt(filterFloor)) return false;
        if (filterType !== 'all' && room.type !== filterType) return false;
        if (filterBuilding !== 'all' && room.buildingId !== filterBuilding) return false;
        return true;
      })
      .sort((a, b) => a.number.localeCompare(b.number));
  }, [rooms, filterFloor, filterType, filterBuilding]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const handleAddFloor = () => {
    const floorNum = parseInt(newFloorNumber);
    if (!floorNum || floorNum < 1 || floorNum > 99) {
      toast.error(language === 'vi' 
        ? 'Số tầng không hợp lệ! Vui lòng nhập từ 1-99.' 
        : 'Invalid floor number! Please enter 1-99.');
      return;
    }

    if (floors.includes(floorNum)) {
      toast.error(language === 'vi' 
        ? `Tầng ${floorNum} đã tồn tại!` 
        : `Floor ${floorNum} already exists!`);
      return;
    }

    // Add a default room for the new floor
    const defaultRoomNumber = `${floorNum}01`;
    if (rooms.find(r => r.number === defaultRoomNumber)) {
      // Try 02, 03, etc.
      let found = false;
      for (let i = 1; i <= 99; i++) {
        const roomNum = `${floorNum}${i.toString().padStart(2, '0')}`;
        if (!rooms.find(r => r.number === roomNum)) {
          const newRoom = {
            id: Date.now().toString(),
            number: roomNum,
            floor: floorNum,
            buildingId: hotel?.buildings && hotel.buildings.length > 0 ? hotel.buildings[0].id : 'building-1',
            type: 'Single' as RoomType,
            price: 300000,
            status: 'vacant-clean' as RoomStatus,
          };
          addRoom(newRoom);
          found = true;
          break;
        }
      }
      if (!found) {
        toast.error(language === 'vi' 
          ? 'Không thể tạo phòng mẫu. Vui lòng thêm phòng thủ công.' 
          : 'Cannot create sample room. Please add manually.');
        return;
      }
    } else {
      const newRoom = {
        id: Date.now().toString(),
        number: defaultRoomNumber,
        floor: floorNum,
        buildingId: hotel?.buildings && hotel.buildings.length > 0 ? hotel.buildings[0].id : 'building-1',
        type: 'Single' as RoomType,
        price: 300000,
        status: 'vacant-clean' as RoomStatus,
      };
      addRoom(newRoom);
    }

    toast.success(language === 'vi' 
      ? `Đã thêm tầng ${floorNum}!` 
      : `Floor ${floorNum} added!`);
    
    setNewFloorNumber('');
    setIsAddingFloor(false);
  };

  const handleBulkDeleteFloorRooms = (floor: number) => {
    const roomsOnFloor = rooms.filter(r => r.floor === floor);
    const occupiedRooms = roomsOnFloor.filter(r => r.status === 'occupied' || r.guest);
    
    if (occupiedRooms.length > 0) {
      toast.error(language === 'vi' 
        ? `Không thể xóa tầng ${floor} vì có ${occupiedRooms.length} phòng đang có khách!` 
        : `Cannot delete floor ${floor} with ${occupiedRooms.length} occupied rooms!`);
      return;
    }

    // Delete all rooms on this floor
    roomsOnFloor.forEach(room => {
      deleteRoom(room.id);
    });

    toast.success(language === 'vi' 
      ? `Đã xóa tầng ${floor} với ${roomsOnFloor.length} phòng!` 
      : `Floor ${floor} deleted with ${roomsOnFloor.length} rooms!`);
    setFloorToDelete(null);
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!newRoomNumber.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập số phòng!' : 'Please enter room number!');
      return;
    }
    
    if (rooms.find(r => r.number === newRoomNumber.trim())) {
      toast.error(language === 'vi' ? 'Số phòng đã tồn tại!' : 'Room number already exists!');
      return;
    }

    const price = parseInt(newRoomPrice);
    if (!price || price < 0) {
      toast.error(language === 'vi' ? 'Giá phòng không hợp lệ!' : 'Invalid room price!');
      return;
    }

    if (!newRoomBuildingId && hotel?.buildings && hotel.buildings.length > 0) {
      toast.error(language === 'vi' ? 'Vui lòng chọn tòa nhà!' : 'Please select a building!');
      return;
    }

    const newRoom = {
      id: Date.now().toString(),
      number: newRoomNumber.trim(),
      floor: parseInt(newRoomFloor),
      buildingId: newRoomBuildingId || (hotel?.buildings && hotel.buildings.length > 0 ? hotel.buildings[0].id : 'building-1'),
      type: newRoomType,
      price: price,
      status: 'vacant-clean' as RoomStatus,
    };

    addRoom(newRoom);
    toast.success(language === 'vi' ? `Đã thêm phòng ${newRoomNumber}!` : `Room ${newRoomNumber} added!`);
    
    // Reset form
    setNewRoomNumber('');
    setNewRoomFloor('1');
    setNewRoomBuildingId('');
    setNewRoomType('Single');
    setNewRoomPrice('300000');
    setShowAddRoom(false);
  };

  const handleDeleteRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    // Check if room is occupied
    if (room.status === 'occupied' || room.guest) {
      toast.error(language === 'vi' 
        ? 'Không thể xóa phòng đang có khách!' 
        : 'Cannot delete occupied room!');
      return;
    }

    deleteRoom(roomId);
    toast.success(language === 'vi' 
      ? `Đã xóa phòng ${room.number}!` 
      : `Room ${room.number} deleted!`);
    setRoomToDelete(null);
  };

  const startEdit = (roomId: string, field: 'number' | 'type' | 'price' | 'floor') => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    let value = '';
    if (field === 'number') value = room.number;
    if (field === 'type') value = room.type;
    if (field === 'price') value = room.price.toString();
    if (field === 'floor') value = room.floor.toString();

    setEditingRoom({ id: roomId, field, value });
  };

  const saveEdit = () => {
    if (!editingRoom) return;

    const room = rooms.find(r => r.id === editingRoom.id);
    if (!room) return;

    // Validation
    if (editingRoom.field === 'number') {
      if (!editingRoom.value.trim()) {
        toast.error(language === 'vi' ? 'Số phòng không được để trống!' : 'Room number cannot be empty!');
        return;
      }
      if (rooms.find(r => r.number === editingRoom.value.trim() && r.id !== editingRoom.id)) {
        toast.error(language === 'vi' ? 'Số phòng đã tồn tại!' : 'Room number already exists!');
        return;
      }
      updateRoom(editingRoom.id, { number: editingRoom.value.trim() });
    }

    if (editingRoom.field === 'type') {
      updateRoom(editingRoom.id, { type: editingRoom.value as RoomType });
    }

    if (editingRoom.field === 'price') {
      const price = parseInt(editingRoom.value);
      if (!price || price < 0) {
        toast.error(language === 'vi' ? 'Giá không hợp lệ!' : 'Invalid price!');
        return;
      }
      updateRoom(editingRoom.id, { price });
    }

    if (editingRoom.field === 'floor') {
      const floor = parseInt(editingRoom.value);
      if (!floor || floor < 1) {
        toast.error(language === 'vi' ? 'Tầng không hợp lệ!' : 'Invalid floor!');
        return;
      }
      updateRoom(editingRoom.id, { floor });
    }

    toast.success(language === 'vi' ? 'Đã cập nhật!' : 'Updated!');
    setEditingRoom(null);
  };

  const cancelEdit = () => {
    setEditingRoom(null);
  };

  // Building handlers
  const handleAddBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBuildingName.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập tên tòa nhà!' : 'Please enter building name!');
      return;
    }

    if (hotel?.buildings && hotel.buildings.find(b => b.name === newBuildingName.trim())) {
      toast.error(language === 'vi' ? 'Tên tòa nhà đã tồn tại!' : 'Building name already exists!');
      return;
    }

    const newBuilding = {
      id: `building-${Date.now()}`,
      name: newBuildingName.trim(),
      description: newBuildingDescription.trim(),
      order: (hotel?.buildings?.length || 0) + 1,
    };

    addBuilding(newBuilding);
    toast.success(language === 'vi' ? `Đã thêm tòa ${newBuildingName}!` : `Building ${newBuildingName} added!`);
    
    setNewBuildingName('');
    setNewBuildingDescription('');
    setShowAddBuilding(false);
  };

  const handleSaveBuilding = () => {
    if (!editingBuilding) return;

    if (!editingBuilding.name.trim()) {
      toast.error(language === 'vi' ? 'Tên tòa nhà không được để trống!' : 'Building name cannot be empty!');
      return;
    }

    if (hotel?.buildings && hotel.buildings.find(b => b.name === editingBuilding.name.trim() && b.id !== editingBuilding.id)) {
      toast.error(language === 'vi' ? 'Tên tòa nhà đã tồn tại!' : 'Building name already exists!');
      return;
    }

    updateBuilding(editingBuilding.id, {
      name: editingBuilding.name.trim(),
      description: editingBuilding.description.trim(),
    });

    toast.success(language === 'vi' ? 'Đã cập nhật!' : 'Updated!');
    setEditingBuilding(null);
  };

  const handleDeleteBuilding = (buildingId: string) => {
    deleteBuilding(buildingId);
    setBuildingToDelete(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              {language === 'vi' ? 'Cấu hình Khách sạn' : 'Hotel Configuration'}
            </DialogTitle>
            <DialogDescription>
              {language === 'vi' 
                ? 'Quản lý toàn bộ tầng và phòng của khách sạn'
                : 'Manage all floors and rooms of the hotel'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className={`grid w-full ${features.multiBuilding ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {features.multiBuilding && (
                <TabsTrigger value="buildings" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {language === 'vi' ? 'Tòa nhà' : 'Buildings'}
                </TabsTrigger>
              )}
              <TabsTrigger value="rooms" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {language === 'vi' ? 'Quản lý Phòng' : 'Room Management'}
                <Badge variant="secondary" className="ml-1">{rooms.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="floors" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {language === 'vi' ? 'Quản lý Tầng' : 'Floor Management'}
                <Badge variant="secondary" className="ml-1">{floors.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* BUILDINGS TAB */}
            <TabsContent value="buildings" className="flex-1 flex flex-col overflow-hidden mt-4 space-y-4">
              {/* Stats & Actions */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Card className="px-3 py-2 flex items-center gap-2 bg-blue-50 border-blue-200">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-700">{language === 'vi' ? 'Tổng tòa nhà' : 'Total Buildings'}</p>
                      <p className="text-blue-900">{hotel?.buildings?.length || 0}</p>
                    </div>
                  </Card>
                </div>

                <Button onClick={() => setShowAddBuilding(!showAddBuilding)} className="flex items-center gap-2">
                  {showAddBuilding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {language === 'vi' ? 'Thêm tòa nhà' : 'Add Building'}
                </Button>
              </div>

              {/* Add Building Form */}
              {showAddBuilding && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <form onSubmit={handleAddBuilding} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">{language === 'vi' ? 'Tên tòa nhà' : 'Building Name'}</Label>
                      <Input
                        value={newBuildingName}
                        onChange={(e) => setNewBuildingName(e.target.value)}
                        placeholder={language === 'vi' ? 'Tòa A' : 'Building A'}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{language === 'vi' ? 'Mô tả (tùy chọn)' : 'Description (optional)'}</Label>
                      <Input
                        value={newBuildingDescription}
                        onChange={(e) => setNewBuildingDescription(e.target.value)}
                        placeholder={language === 'vi' ? 'Tòa chính' : 'Main building'}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        {language === 'vi' ? 'Thêm' : 'Add'}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              <Separator />

              {/* Buildings Table */}
              <div className="flex-1 overflow-y-auto -mx-6 px-6">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>{language === 'vi' ? 'Tên tòa nhà' : 'Building Name'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Mô tả' : 'Description'}</TableHead>
                      <TableHead className="text-center">{language === 'vi' ? 'Số phòng' : 'Rooms'}</TableHead>
                      <TableHead className="text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotel?.buildings?.sort((a, b) => a.order - b.order).map((building, index) => {
                      const buildingRooms = rooms.filter(r => r.buildingId === building.id);
                      const isEditing = editingBuilding?.id === building.id;

                      return (
                        <TableRow key={building.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editingBuilding.name}
                                onChange={(e) => setEditingBuilding({ ...editingBuilding, name: e.target.value })}
                                className="h-8"
                              />
                            ) : (
                              <span className="font-medium">{building.name}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editingBuilding.description}
                                onChange={(e) => setEditingBuilding({ ...editingBuilding, description: e.target.value })}
                                className="h-8"
                                placeholder={language === 'vi' ? 'Mô tả...' : 'Description...'}
                              />
                            ) : (
                              <span className="text-sm text-gray-600">{building.description || '-'}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{buildingRooms.length}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isEditing ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSaveBuilding}
                                    className="h-8 px-2"
                                  >
                                    <Check className="w-4 h-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingBuilding(null)}
                                    className="h-8 px-2"
                                  >
                                    <X className="w-4 h-4 text-red-600" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingBuilding({
                                      id: building.id,
                                      name: building.name,
                                      description: building.description || '',
                                    })}
                                    className="h-8 px-2"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setBuildingToDelete(building.id)}
                                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {(!hotel?.buildings || hotel.buildings.length === 0) && (
                  <div className="text-center py-12 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{language === 'vi' ? 'Chưa có tòa nhà nào' : 'No buildings yet'}</p>
                    <p className="text-sm mt-1">
                      {language === 'vi' ? 'Thêm tòa nhà đầu tiên để bắt đầu' : 'Add your first building to get started'}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ROOMS TAB */}
            <TabsContent value="rooms" className="flex-1 flex flex-col overflow-hidden mt-4 space-y-4">
              {/* Stats & Actions */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Card className="px-3 py-2 flex items-center gap-2 bg-blue-50 border-blue-200">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-700">{language === 'vi' ? 'Tổng phòng' : 'Total Rooms'}</p>
                      <p className="text-blue-900">{rooms.length}</p>
                    </div>
                  </Card>
                  <Card className="px-3 py-2 flex items-center gap-2 bg-green-50 border-green-200">
                    <Layers className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-green-700">{language === 'vi' ? 'Số tầng' : 'Floors'}</p>
                      <p className="text-green-900">{floors.length}</p>
                    </div>
                  </Card>
                </div>

                <Button onClick={() => setShowAddRoom(!showAddRoom)} className="flex items-center gap-2">
                  {showAddRoom ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {language === 'vi' ? 'Thêm phòng mới' : 'Add New Room'}
                </Button>
              </div>

              {/* Add Room Form */}
              {showAddRoom && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <form onSubmit={handleAddRoom} className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div>
                      <Label className="text-xs">{language === 'vi' ? 'Số phòng' : 'Room No.'}</Label>
                      <Input
                        value={newRoomNumber}
                        onChange={(e) => setNewRoomNumber(e.target.value)}
                        placeholder="101"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{language === 'vi' ? 'Tòa nhà' : 'Building'}</Label>
                      <Select value={newRoomBuildingId} onValueChange={setNewRoomBuildingId}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'vi' ? 'Chọn tòa' : 'Select building'} />
                        </SelectTrigger>
                        <SelectContent>
                          {hotel?.buildings?.map(building => (
                            <SelectItem key={building.id} value={building.id}>
                              {building.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{language === 'vi' ? 'Tầng' : 'Floor'}</Label>
                      <Select value={newRoomFloor} onValueChange={setNewRoomFloor}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {floors.map(floor => (
                            <SelectItem key={floor} value={floor.toString()}>
                              {language === 'vi' ? `Tầng ${floor}` : `Floor ${floor}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{language === 'vi' ? 'Loại phòng' : 'Room Type'}</Label>
                      <Select value={newRoomType} onValueChange={(v: RoomType) => setNewRoomType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roomTypeNames).map(([type, names]) => (
                            <SelectItem key={type} value={type}>
                              {names[language === 'vi' ? 'vi' : 'en']}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{language === 'vi' ? 'Giá (VND)' : 'Price (VND)'}</Label>
                      <Input
                        type="number"
                        value={newRoomPrice}
                        onChange={(e) => setNewRoomPrice(e.target.value)}
                        min="0"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        {language === 'vi' ? 'Thêm' : 'Add'}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={filterBuilding} onValueChange={setFilterBuilding}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'vi' ? 'Tất cả tòa' : 'All Buildings'}</SelectItem>
                    {hotel?.buildings?.map(building => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterFloor} onValueChange={setFilterFloor}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'vi' ? 'Tất cả tầng' : 'All Floors'}</SelectItem>
                    {floors.map(floor => (
                      <SelectItem key={floor} value={floor.toString()}>
                        {language === 'vi' ? `Tầng ${floor}` : `Floor ${floor}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'vi' ? 'Tất cả loại' : 'All Types'}</SelectItem>
                    {Object.entries(roomTypeNames).map(([type, names]) => (
                      <SelectItem key={type} value={type}>
                        {names[language === 'vi' ? 'vi' : 'en']}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-sm text-gray-500 ml-auto">
                  {filteredRooms.length} {language === 'vi' ? 'phòng' : 'rooms'}
                </span>
              </div>

              <Separator />

              {/* Rooms Table */}
              <div className="flex-1 overflow-y-auto -mx-6 px-6">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>{language === 'vi' ? 'Số phòng' : 'Room No.'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Tòa nhà' : 'Building'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Tầng' : 'Floor'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Loại phòng' : 'Type'}</TableHead>
                      <TableHead className="text-right">{language === 'vi' ? 'Giá (VND)' : 'Price (VND)'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Trạng thái' : 'Status'}</TableHead>
                      <TableHead className="text-right">{language === 'vi' ? 'Hành động' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRooms.map((room) => {
                      const statusInfo = statusNames[room.status];
                      return (
                        <TableRow key={room.id} className="hover:bg-gray-50">
                          <TableCell>
                            {editingRoom?.id === room.id && editingRoom.field === 'number' ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editingRoom.value}
                                  onChange={(e) => setEditingRoom({ ...editingRoom, value: e.target.value })}
                                  className="w-20 h-8"
                                  autoFocus
                                />
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={saveEdit}>
                                  <Check className="w-3 h-3 text-green-600" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEdit}>
                                  <X className="w-3 h-3 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">{room.number}</Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={() => startEdit(room.id, 'number')}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {hotel?.buildings?.find(b => b.id === room.buildingId)?.name || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {editingRoom?.id === room.id && editingRoom.field === 'floor' ? (
                              <div className="flex items-center gap-1">
                                <Select value={editingRoom.value} onValueChange={(v) => setEditingRoom({ ...editingRoom, value: v })}>
                                  <SelectTrigger className="w-24 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {floors.map(floor => (
                                      <SelectItem key={floor} value={floor.toString()}>
                                        {floor}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={saveEdit}>
                                  <Check className="w-3 h-3 text-green-600" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEdit}>
                                  <X className="w-3 h-3 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{room.floor}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                                  onClick={() => startEdit(room.id, 'floor')}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRoom?.id === room.id && editingRoom.field === 'type' ? (
                              <div className="flex items-center gap-1">
                                <Select value={editingRoom.value} onValueChange={(v) => setEditingRoom({ ...editingRoom, value: v })}>
                                  <SelectTrigger className="w-32 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(roomTypeNames).map(([type, names]) => (
                                      <SelectItem key={type} value={type}>
                                        {names[language === 'vi' ? 'vi' : 'en']}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={saveEdit}>
                                  <Check className="w-3 h-3 text-green-600" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEdit}>
                                  <X className="w-3 h-3 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{roomTypeNames[room.type][language === 'vi' ? 'vi' : 'en']}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                                  onClick={() => startEdit(room.id, 'type')}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingRoom?.id === room.id && editingRoom.field === 'price' ? (
                              <div className="flex items-center justify-end gap-1">
                                <Input
                                  type="number"
                                  value={editingRoom.value}
                                  onChange={(e) => setEditingRoom({ ...editingRoom, value: e.target.value })}
                                  className="w-32 h-8 text-right"
                                  autoFocus
                                />
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={saveEdit}>
                                  <Check className="w-3 h-3 text-green-600" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEdit}>
                                  <X className="w-3 h-3 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <span className="font-mono">{formatPrice(room.price)}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                                  onClick={() => startEdit(room.id, 'price')}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusInfo.color}>
                              {statusInfo[language === 'vi' ? 'vi' : 'en']}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRoomToDelete(room.id)}
                              disabled={room.status === 'occupied' || !!room.guest}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Footer Help */}
              <Card className="p-3 bg-amber-50 border-amber-200">
                <p className="text-xs text-amber-900">
                  💡 <strong>{language === 'vi' ? 'Mẹo:' : 'Tip:'}</strong>{' '}
                  {language === 'vi'
                    ? 'Click vào icon bút chì để chỉnh sửa nhanh. Không thể xóa phòng đang có khách.'
                    : 'Click the pencil icon to quick edit. Cannot delete occupied rooms.'}
                </p>
              </Card>
            </TabsContent>

            {/* FLOORS TAB - OPTIMIZED TABLE VIEW */}
            <TabsContent value="floors" className="flex-1 flex flex-col overflow-hidden mt-4 space-y-4">
              {/* Header with Add Floor Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="text-gray-900">
                      {language === 'vi' ? 'Danh sách Tầng' : 'Floor List'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {language === 'vi' 
                        ? `${floors.length} tầng - ${rooms.length} phòng`
                        : `${floors.length} floors - ${rooms.length} rooms`}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsAddingFloor(!isAddingFloor)} 
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isAddingFloor ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {language === 'vi' ? 'Thêm tầng' : 'Add Floor'}
                </Button>
              </div>

              {/* Inline Add Floor Form */}
              {isAddingFloor && (
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 max-w-xs">
                      <Label className="text-xs text-purple-900">
                        {language === 'vi' ? 'Số tầng (1-99)' : 'Floor Number (1-99)'}
                      </Label>
                      <Input
                        type="number"
                        value={newFloorNumber}
                        onChange={(e) => setNewFloorNumber(e.target.value)}
                        placeholder={language === 'vi' ? 'Ví dụ: 5' : 'e.g., 5'}
                        min="1"
                        max="99"
                        className="mt-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFloor();
                          }
                        }}
                      />
                    </div>
                    <Button onClick={handleAddFloor} className="bg-purple-600 hover:bg-purple-700">
                      <Check className="w-4 h-4 mr-2" />
                      {language === 'vi' ? 'Xác nhận' : 'Confirm'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsAddingFloor(false);
                      setNewFloorNumber('');
                    }}>
                      {language === 'vi' ? 'Hủy' : 'Cancel'}
                    </Button>
                  </div>
                </Card>
              )}

              <Separator />

              {/* Compact Table View */}
              <div className="flex-1 overflow-y-auto -mx-6 px-6">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-24">{language === 'vi' ? 'Tầng' : 'Floor'}</TableHead>
                      <TableHead className="w-24 text-center">{language === 'vi' ? 'Tổng' : 'Total'}</TableHead>
                      <TableHead className="w-20 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-xs">{language === 'vi' ? 'Khách' : 'Occ'}</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-20 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs">{language === 'vi' ? 'Sạch' : 'Clean'}</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-20 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                          <span className="text-xs">{language === 'vi' ? 'Bẩn' : 'Dirty'}</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-20 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="text-xs">{language === 'vi' ? 'Trả' : 'Out'}</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-20 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          <span className="text-xs">{language === 'vi' ? 'BT' : 'OOO'}</span>
                        </div>
                      </TableHead>
                      <TableHead>{language === 'vi' ? 'Tỷ lệ lấp đầy' : 'Occupancy'}</TableHead>
                      <TableHead className="text-right">{language === 'vi' ? 'Hành động' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {floorStats.map((stat) => {
                      const occupancyRate = stat.totalRooms > 0 
                        ? Math.round((stat.occupiedRooms / stat.totalRooms) * 100) 
                        : 0;
                      const hasOccupiedRooms = stat.occupiedRooms > 0;

                      return (
                        <TableRow key={stat.floor} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                                <span>{stat.floor}</span>
                              </div>
                              <span className="text-gray-900">
                                {language === 'vi' ? `Tầng ${stat.floor}` : `Floor ${stat.floor}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{stat.totalRooms}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={stat.occupiedRooms > 0 ? 'text-red-700' : 'text-gray-400'}>
                              {stat.occupiedRooms}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={stat.cleanRooms > 0 ? 'text-green-700' : 'text-gray-400'}>
                              {stat.cleanRooms}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={stat.dirtyRooms > 0 ? 'text-gray-700' : 'text-gray-400'}>
                              {stat.dirtyRooms}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={stat.dueOutRooms > 0 ? 'text-orange-700' : 'text-gray-400'}>
                              {stat.dueOutRooms}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={stat.maintenanceRooms > 0 ? 'text-purple-700' : 'text-gray-400'}>
                              {stat.maintenanceRooms}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={occupancyRate} className="h-2 flex-1" />
                              <span className="text-xs text-gray-700 w-10 text-right">{occupancyRate}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setActiveTab('rooms');
                                  setFilterFloor(stat.floor.toString());
                                }}
                                className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                {language === 'vi' ? 'Xem' : 'View'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setFloorToDelete(stat.floor)}
                                disabled={hasOccupiedRooms}
                                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-30"
                                title={hasOccupiedRooms 
                                  ? (language === 'vi' ? 'Không thể xóa tầng có khách' : 'Cannot delete floor with guests')
                                  : (language === 'vi' ? 'Xóa tầng' : 'Delete floor')
                                }
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {floorStats.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{language === 'vi' ? 'Chưa có tầng nào. Click "Thêm tầng" để bắt đầu.' : 'No floors yet. Click "Add Floor" to get started.'}</p>
                  </div>
                )}
              </div>

              {/* Legend & Help */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <p className="text-xs text-blue-900">
                    💡 <strong>{language === 'vi' ? 'Chú thích:' : 'Legend:'}</strong>{' '}
                    {language === 'vi' 
                      ? 'Khách = Có khách | Sạch = Sẵn sàng | Bẩn = Cần dọn | Trả = Sắp trả | BT = Bảo trì'
                      : 'Occ = Occupied | Clean = Ready | Dirty = Needs cleaning | Out = Due out | OOO = Out of order'}
                  </p>
                </Card>
                <Card className="p-3 bg-amber-50 border-amber-200">
                  <p className="text-xs text-amber-900">
                    ⚠️ <strong>{language === 'vi' ? 'Lưu ý:' : 'Note:'}</strong>{' '}
                    {language === 'vi'
                      ? 'Không thể xóa tầng đang có khách. Hãy check-out tất cả khách trước.'
                      : 'Cannot delete floors with guests. Check out all guests first.'}
                  </p>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Room Confirmation */}
      <AlertDialog open={!!roomToDelete} onOpenChange={() => setRoomToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'vi' ? 'Xác nhận xóa phòng' : 'Confirm Delete Room'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'vi'
                ? `Bạn có chắc chắn muốn xóa phòng ${rooms.find(r => r.id === roomToDelete)?.number}? Hành động này không thể hoàn tác.`
                : `Are you sure you want to delete room ${rooms.find(r => r.id === roomToDelete)?.number}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => roomToDelete && handleDeleteRoom(roomToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              {language === 'vi' ? 'Xóa phòng' : 'Delete Room'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Floor Confirmation */}
      <AlertDialog open={!!floorToDelete} onOpenChange={() => setFloorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'vi' ? 'Xác nhận xóa tầng' : 'Confirm Delete Floor'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {floorToDelete && (() => {
                const roomsOnFloor = rooms.filter(r => r.floor === floorToDelete);
                const occupiedRooms = roomsOnFloor.filter(r => r.status === 'occupied' || r.guest);

                if (roomsOnFloor.length === 0) {
                  return language === 'vi'
                    ? `Tầng ${floorToDelete} không có phòng nào. Bạn có muốn xóa tầng này?`
                    : `Floor ${floorToDelete} has no rooms. Do you want to delete this floor?`;
                }

                if (occupiedRooms.length > 0) {
                  return language === 'vi'
                    ? `Tầng ${floorToDelete} có ${occupiedRooms.length} phòng đang có khách. Không thể xóa tầng này!`
                    : `Floor ${floorToDelete} has ${occupiedRooms.length} occupied rooms. Cannot delete this floor!`;
                }

                return language === 'vi'
                  ? `Bạn có chắc chắn muốn xóa tầng ${floorToDelete} cùng với ${roomsOnFloor.length} phòng? Hành động này không thể hoàn tác.`
                  : `Are you sure you want to delete floor ${floorToDelete} with ${roomsOnFloor.length} rooms? This action cannot be undone.`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => floorToDelete && handleBulkDeleteFloorRooms(floorToDelete)}
              className="bg-red-600 hover:bg-red-700"
              disabled={floorToDelete ? rooms.filter(r => r.floor === floorToDelete && (r.status === 'occupied' || r.guest)).length > 0 : false}
            >
              {language === 'vi' ? 'Xóa tầng' : 'Delete Floor'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Building Confirmation */}
      <AlertDialog open={!!buildingToDelete} onOpenChange={() => setBuildingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'vi' ? 'Xác nhận xóa tòa nhà' : 'Confirm Delete Building'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {buildingToDelete && (() => {
                const building = hotel?.buildings.find(b => b.id === buildingToDelete);
                const buildingRooms = rooms.filter(r => r.buildingId === buildingToDelete);

                if (buildingRooms.length > 0) {
                  return language === 'vi'
                    ? `Tòa nhà "${building?.name}" có ${buildingRooms.length} phòng. Không thể xóa tòa nhà đang có phòng!`
                    : `Building "${building?.name}" has ${buildingRooms.length} rooms. Cannot delete building with rooms!`;
                }

                return language === 'vi'
                  ? `Bạn có chắc chắn muốn xóa tòa nhà "${building?.name}"? Hành động này không thể hoàn tác.`
                  : `Are you sure you want to delete building "${building?.name}"? This action cannot be undone.`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => buildingToDelete && handleDeleteBuilding(buildingToDelete)}
              className="bg-red-600 hover:bg-red-700"
              disabled={buildingToDelete ? rooms.filter(r => r.buildingId === buildingToDelete).length > 0 : false}
            >
              {language === 'vi' ? 'Xóa tòa nhà' : 'Delete Building'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
