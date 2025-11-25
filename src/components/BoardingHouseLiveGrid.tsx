'use client'

import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Room } from '../types';
import { Menu, Home, Plus, Bell, DollarSign, TrendingUp, Trash2, Building, DoorOpen, X, Layers, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AppMenu } from './AppMenu';
import { BoardingHouseRoomDialog } from './BoardingHouseRoomDialog';
import { BoardingHouseRevenueDialog } from './BoardingHouseRevenueDialog';
import { AddBuildingDialog } from './AddBuildingDialog';
import { AddRoomDialog } from './AddRoomDialog';
import { AddFloorDialog } from './AddFloorDialog';
import { DeleteFloorDialog } from './DeleteFloorDialog';
import { BusinessModelBadge } from './BusinessModelBadge';
import { BackToModelSelectorButton } from './BackToModelSelectorButton';
import { HelpDialog } from './HelpDialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from './ui/alert-dialog';
import { toast } from 'sonner';

export function BoardingHouseLiveGrid() {
  const { user, hotel, rooms, deleteRoom, deleteBuilding, deleteFloor } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [addBuildingOpen, setAddBuildingOpen] = useState(false);
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [addFloorOpen, setAddFloorOpen] = useState(false);
  const [deleteFloorOpen, setDeleteFloorOpen] = useState(false);
  const [selectedBuildingForRoom, setSelectedBuildingForRoom] = useState<string>('');
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'building' | 'room' | 'floor', id: string, name: string, buildingId?: string, floor?: number } | null>(null);
  const [collapsedFloors, setCollapsedFloors] = useState<Set<string>>(new Set());

  // Group rooms by building and floor
  const roomsByZone = useMemo(() => {
    const grouped: { [buildingId: string]: { [floor: number]: Room[] } } = {};
    
    rooms.forEach(room => {
      const buildingId = room.buildingId || 'default';
      if (!grouped[buildingId]) {
        grouped[buildingId] = {};
      }
      if (!grouped[buildingId][room.floor]) {
        grouped[buildingId][room.floor] = [];
      }
      grouped[buildingId][room.floor].push(room);
    });
    
    // Sort rooms by number within each floor
    Object.keys(grouped).forEach(buildingId => {
      Object.keys(grouped[buildingId]).forEach(floor => {
        grouped[buildingId][Number(floor)].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
      });
    });
    
    return grouped;
  }, [rooms]);

  const toggleFloor = (floorKey: string) => {
    const newCollapsed = new Set(collapsedFloors);
    if (newCollapsed.has(floorKey)) {
      newCollapsed.delete(floorKey);
    } else {
      newCollapsed.add(floorKey);
    }
    setCollapsedFloors(newCollapsed);
  };

  // Stats
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.tenant).length;
  const vacantRooms = totalRooms - occupiedRooms;
  
  // Calculate rooms with unpaid rent (overdue)
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const unpaidRooms = rooms.filter(r => {
    if (!r.tenant) return false;
    const currentMonthRental = r.tenant.monthlyHistory.find(m => m.month === currentMonth);
    return !currentMonthRental?.paid;
  }).length;

  // Calculate current month revenue
  const currentMonthRevenue = useMemo(() => {
    let total = 0;
    rooms.forEach(room => {
      if (!room.tenant) return;
      const monthData = room.tenant.monthlyHistory.find(m => m.month === currentMonth);
      if (!monthData || !monthData.paid) return;

      // Add rent
      total += monthData.rentAmount;

      // Add utilities
      if (monthData.utilities?.electricity) {
        const elecCost = 
          (monthData.utilities.electricity.newReading - monthData.utilities.electricity.oldReading) * 
          monthData.utilities.electricity.pricePerUnit;
        total += elecCost;
      }

      if (monthData.utilities?.water) {
        const waterCost = 
          (monthData.utilities.water.newReading - monthData.utilities.water.oldReading) * 
          monthData.utilities.water.pricePerUnit;
        total += waterCost;
      }

      if (monthData.utilities?.internet) {
        total += monthData.utilities.internet;
      }

      if (monthData.utilities?.other) {
        monthData.utilities.other.forEach(item => {
          total += item.amount;
        });
      }
    });
    return total;
  }, [rooms, currentMonth]);

  const getBuilding = (buildingId: string) => {
    return hotel?.buildings.find(b => b.id === buildingId);
  };

  const getRoomStatusColor = (room: Room) => {
    if (!room.tenant) {
      return 'bg-gray-200 border-gray-400 hover:bg-gray-300';
    }
    
    // Check if current month is paid
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthRental = room.tenant.monthlyHistory.find(m => m.month === currentMonth);
    
    if (currentMonthRental?.paid) {
      return 'bg-green-100 border-green-400 hover:bg-green-200';
    } else {
      return 'bg-red-100 border-red-400 hover:bg-red-200';
    }
  };

  const getRoomStatusText = (room: Room) => {
    if (!room.tenant) {
      return { text: 'Trống', color: 'text-gray-600' };
    }
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthRental = room.tenant.monthlyHistory.find(m => m.month === currentMonth);
    
    if (currentMonthRental?.paid) {
      return { text: 'Đã thu', color: 'text-green-600' };
    } else {
      return { text: 'Chưa thu', color: 'text-red-600' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(true)}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <Menu className="w-6 h-6" />
              </Button>
              <div>
                <p className="text-sm font-semibold text-white/90">Quản lý</p>
                <p className="text-lg text-white font-bold">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHelpDialogOpen(true)}
                className="text-white hover:bg-white/20 h-8 w-8"
                title="Hướng dẫn sử dụng"
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
              <BackToModelSelectorButton />
              <BusinessModelBadge />
            </div>
          </div>

          {/* Hotel Name */}
          <div className="text-center mb-2">
            <h1 className="text-white text-xl font-bold">
              {hotel?.name || 'Nhà Trọ'}
            </h1>
            {hotel?.address && (
              <p className="text-white/90 text-xs">{hotel.address}</p>
            )}
          </div>

          {/* Stats - Compact */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Card className="p-2 bg-white/95">
              <div className="text-center">
                <Home className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{totalRooms}</p>
                <p className="text-xs text-gray-600">Tổng phòng</p>
              </div>
            </Card>

            <Card 
              className="p-2 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 cursor-pointer hover:from-yellow-100 hover:to-yellow-200 transition-all"
              onClick={() => setRevenueDialogOpen(true)}
            >
              <div className="text-center">
                <TrendingUp className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-yellow-700">₫{(currentMonthRevenue / 1000000).toFixed(1)}tr</p>
                <p className="text-xs text-yellow-600">Doanh thu</p>
              </div>
            </Card>

            <Card className="p-2 bg-green-50 border-green-200">
              <div className="text-center">
                <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-700">{occupiedRooms}</p>
                <p className="text-xs text-green-600">Đang thuê</p>
              </div>
            </Card>

            <Card className="p-2 bg-red-50 border-red-200">
              <div className="text-center">
                <Bell className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-700">{unpaidRooms}</p>
                <p className="text-xs text-red-600">Chưa thu</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Rooms Grid - Compact */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        {Object.entries(roomsByZone).map(([buildingId, buildingRooms]) => {
          const building = getBuilding(buildingId);
          const totalRoomsInBuilding = Object.values(buildingRooms).reduce((sum, floorRooms) => sum + floorRooms.length, 0);
          
          return (
            <div key={buildingId} className="mb-4">
              {/* Zone Header */}
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">
                    {building?.name || 'Khu mặc định'}
                  </h2>
                  {building?.description && (
                    <p className="text-gray-600 text-sm">{building.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {totalRoomsInBuilding} phòng
                  </p>
                </div>
                
                {/* Building Actions */}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedBuildingForRoom(buildingId);
                      setAddRoomOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Phòng
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (totalRoomsInBuilding > 0) {
                        toast.error('Không thể xóa khu đang có phòng. Vui lòng xóa hết phòng trước.');
                        return;
                      }
                      setDeleteConfirm({ 
                        type: 'building', 
                        id: buildingId, 
                        name: building?.name || 'Khu này' 
                      });
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Floors */}
              <div className="space-y-2">
                {Object.keys(buildingRooms).map(Number).sort((a, b) => b - a).map((floor) => {
                  const floorRooms = buildingRooms[floor];
                  if (!floorRooms || floorRooms.length === 0) return null;

                  const floorKey = `${buildingId}-${floor}`;
                  const isFloorCollapsed = collapsedFloors.has(floorKey);
                  const occupiedCount = floorRooms.filter(r => r.tenant).length;
                  const vacantCount = floorRooms.length - occupiedCount;

                  return (
                    <div key={floorKey} className="bg-white rounded-lg p-2 border border-gray-200">
                      {/* Floor Header */}
                      <div 
                        className="mb-2 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div 
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={() => toggleFloor(floorKey)}
                        >
                          <Layers className="w-3 h-3 text-gray-600" />
                          <h4 className="text-gray-900 font-medium text-sm">Tầng {floor}</h4>
                          <Badge variant="outline" className="text-xs h-5">
                            {floorRooms.length} phòng
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {occupiedCount > 0 && (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs h-5">
                              {occupiedCount}
                            </Badge>
                          )}
                          {vacantCount > 0 && (
                            <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs h-5">
                              {vacantCount}
                            </Badge>
                          )}
                          
                          {/* Delete Floor Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              const hasOccupiedRooms = floorRooms.some(r => r.tenant);
                              if (hasOccupiedRooms) {
                                toast.error('Không thể xóa tầng đang có phòng cho thuê. Vui lòng trả phòng trước.');
                                return;
                              }
                              setDeleteConfirm({ 
                                type: 'floor', 
                                id: floorKey,
                                name: `Tầng ${floor}`,
                                buildingId: buildingId,
                                floor: floor
                              });
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                            title="Xóa tầng"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          
                          <div 
                            className="cursor-pointer p-1"
                            onClick={() => toggleFloor(floorKey)}
                          >
                            {isFloorCollapsed ? (
                              <ChevronDown className="w-3 h-3 text-gray-600" />
                            ) : (
                              <ChevronUp className="w-3 h-3 text-gray-600" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Room Cards Grid */}
                      {!isFloorCollapsed && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                          {floorRooms.map(room => {
                            const status = getRoomStatusText(room);
                            
                            return (
                              <Card
                                key={room.id}
                                className={`p-2 cursor-pointer transition-all border-2 relative ${getRoomStatusColor(room)}`}
                                onClick={() => setSelectedRoom(room)}
                              >
                                {/* Delete Room Button */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (room.tenant) {
                                      toast.error('Không thể xóa phòng đang cho thuê. Vui lòng trả phòng trước.');
                                      return;
                                    }
                                    setDeleteConfirm({ 
                                      type: 'room', 
                                      id: room.id, 
                                      name: `Phòng ${room.number}` 
                                    });
                                  }}
                                  className="absolute top-0.5 right-0.5 h-5 w-5 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 z-10"
                                  title="Xóa phòng"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                                
                                {/* Room Number - Compact */}
                                <div className="text-center mb-1">
                                  <p className="text-2xl font-bold text-gray-900">
                                    {room.number}
                                  </p>
                                </div>

                                {/* Status - Compact */}
                                <div className="flex justify-center mb-1">
                                  <div className={`text-lg font-bold ${status.color}`}>
                                    {status.text}
                                  </div>
                                </div>

                                {/* Tenant Info - Compact */}
                                {room.tenant ? (
                                  <div className="text-center">
                                    <p className="text-xs font-medium text-gray-900 truncate">
                                      {room.tenant.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {room.tenant.phone}
                                    </p>
                                    <p className="text-xs font-bold text-blue-600">
                                      ₫{room.tenant.monthlyRent.toLocaleString()}/th
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500">Trống</p>
                                    <p className="text-xs font-bold text-gray-700">
                                      ₫{room.price.toLocaleString()}/th
                                    </p>
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB - Floating Action Button */}
      <div 
        className="fixed bottom-4 left-4 z-40"
        onMouseLeave={() => setFabMenuOpen(false)}
      >
        {/* FAB Menu */}
        {fabMenuOpen && (
          <div className="mb-3 bg-white rounded-lg shadow-2xl border-2 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={() => {
                setAddBuildingOpen(true);
                setFabMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors w-full text-left border-b"
            >
              <Building className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Thêm Khu Trọ</span>
            </button>
            <button
              onClick={() => {
                setAddFloorOpen(true);
                setFabMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors w-full text-left border-b"
            >
              <Layers className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">Thêm Tầng Mới</span>
            </button>
            <button
              onClick={() => {
                setDeleteFloorOpen(true);
                setFabMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors w-full text-left border-b"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
              <span className="font-medium text-gray-900">Xóa Tầng</span>
            </button>
            <button
              onClick={() => {
                setSelectedBuildingForRoom('');
                setAddRoomOpen(true);
                setFabMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors w-full text-left"
            >
              <DoorOpen className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Thêm Phòng</span>
            </button>
          </div>
        )}
        
        {/* FAB Button */}
        <Button
          size="lg"
          onClick={() => setFabMenuOpen(!fabMenuOpen)}
          className="w-16 h-16 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 border-4 border-blue-700 hover:scale-110 transition-transform"
          title="Thêm Khu/Tầng/Phòng"
        >
          <Plus className={`w-8 h-8 transition-transform ${fabMenuOpen ? 'rotate-45' : ''}`} />
        </Button>
      </div>

      {/* Legend - Simple */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border-2 z-30">
        <p className="text-sm font-bold text-gray-900 mb-2">Trạng thái:</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-300"></div>
            <p className="text-xs text-gray-700">Trống</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-50 border-2 border-green-300"></div>
            <p className="text-xs text-gray-700">Đã thu tiền tháng này</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-50 border-2 border-red-300"></div>
            <p className="text-xs text-gray-700">Chưa thu tiền tháng này</p>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AppMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      
      {selectedRoom && (
        <BoardingHouseRoomDialog
          room={selectedRoom}
          open={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
      
      <BoardingHouseRevenueDialog
        open={revenueDialogOpen}
        onClose={() => setRevenueDialogOpen(false)}
      />

      <HelpDialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        businessModel="boarding-house"
      />
      
      <AddBuildingDialog
        open={addBuildingOpen}
        onClose={() => setAddBuildingOpen(false)}
      />
      
      <AddRoomDialog
        open={addRoomOpen}
        onClose={() => {
          setAddRoomOpen(false);
          setSelectedBuildingForRoom('');
        }}
        defaultBuildingId={selectedBuildingForRoom}
      />

      <AddFloorDialog
        open={addFloorOpen}
        onClose={() => setAddFloorOpen(false)}
        buildingId={selectedBuildingForRoom || hotel?.buildings[0]?.id || ''}
      />

      <DeleteFloorDialog
        open={deleteFloorOpen}
        onClose={() => setDeleteFloorOpen(false)}
        buildingId={selectedBuildingForRoom || hotel?.buildings[0]?.id || ''}
      />

      {/* Delete Confirmation */}
      <AlertDialog 
        open={!!deleteConfirm} 
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Xác Nhận Xóa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa <strong>{deleteConfirm?.name}</strong>?
              {deleteConfirm?.type === 'building' && (
                <span className="block mt-2 text-red-600">
                  ⚠️ Hành động này không thể hoàn tác!
                </span>
              )}
              {deleteConfirm?.type === 'floor' && (
                <span className="block mt-2 text-red-600">
                  ⚠️ Tất cả phòng trong tầng này sẽ bị xóa vĩnh viễn!
                </span>
              )}
              {deleteConfirm?.type === 'room' && (
                <span className="block mt-2 text-gray-600">
                  Phòng sẽ bị xóa vĩnh viễn khỏi hệ thống.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteConfirm) return;
                
                if (deleteConfirm.type === 'building') {
                  deleteBuilding(deleteConfirm.id);
                  toast.success(`Đã xóa ${deleteConfirm.name}`);
                } else if (deleteConfirm.type === 'floor') {
                  if (deleteConfirm.floor !== undefined) {
                    deleteFloor(deleteConfirm.floor, deleteConfirm.buildingId);
                    toast.success(`Đã xóa ${deleteConfirm.name}`);
                  }
                } else {
                  deleteRoom(deleteConfirm.id);
                  toast.success(`Đã xóa ${deleteConfirm.name}`);
                }
                setDeleteConfirm(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}