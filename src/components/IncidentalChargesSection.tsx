'use client'

import { useState } from 'react';
import { Room, IncidentalCharge } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import { INCIDENTAL_ITEMS } from '../data/incidentalItems';
import { toast } from 'sonner';

interface IncidentalChargesSectionProps {
  room: Room;
  onUpdate: (charges: IncidentalCharge[]) => void;
  userName: string;
}

export function IncidentalChargesSection({ room, onUpdate, userName }: IncidentalChargesSectionProps) {
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customDescription, setCustomDescription] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customQuantity, setCustomQuantity] = useState('1');

  const charges = room.guest?.incidentalCharges || [];

  const addQuickItem = (itemId: string) => {
    const item = INCIDENTAL_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    // Check if item already exists
    const existingCharge = charges.find(c => c.description === item.name);
    
    if (existingCharge) {
      // Increase quantity
      const updatedCharges = charges.map(c => 
        c.id === existingCharge.id 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      );
      onUpdate(updatedCharges);
      toast.success(`Đã thêm ${item.name} (x${existingCharge.quantity + 1})`);
    } else {
      // Add new charge
      const newCharge: IncidentalCharge = {
        id: Date.now().toString(),
        description: item.name,
        amount: item.price,
        quantity: 1,
        timestamp: new Date().toISOString(),
        addedBy: userName,
      };

      onUpdate([...charges, newCharge]);
      toast.success(`Đã thêm ${item.name} (${item.price.toLocaleString()}₫)`);
    }
  };

  const addCustomItem = () => {
    if (!customDescription.trim() || !customAmount) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const newCharge: IncidentalCharge = {
      id: Date.now().toString(),
      description: customDescription,
      amount: parseFloat(customAmount),
      quantity: parseInt(customQuantity) || 1,
      timestamp: new Date().toISOString(),
      addedBy: userName,
    };

    onUpdate([...charges, newCharge]);
    toast.success(`Đã thêm ${customDescription}`);
    
    // Reset form
    setCustomDescription('');
    setCustomAmount('');
    setCustomQuantity('1');
    setShowCustomDialog(false);
  };

  const removeCharge = (chargeId: string) => {
    onUpdate(charges.filter(c => c.id !== chargeId));
    toast.success('Đã xóa phí phát sinh');
  };

  const getItemQuantity = (itemName: string) => {
    const charge = charges.find(c => c.description === itemName);
    return charge?.quantity || 0;
  };

  const totalCharges = charges.reduce((sum, c) => sum + (c.amount * c.quantity), 0);

  return (
    <>
      <Card className="p-2 border">
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-xs font-semibold flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" />
            Phí phát sinh
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCustomDialog(true)}
            className="h-6 text-[10px] px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Khác
          </Button>
        </div>

        {/* Quick Menu */}
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {INCIDENTAL_ITEMS.map(item => {
            const quantity = getItemQuantity(item.name);
            return (
              <Button
                key={item.id}
                type="button"
                variant={quantity > 0 ? "default" : "outline"}
                onClick={() => addQuickItem(item.id)}
                className="h-auto py-1.5 px-1 flex flex-col items-center gap-0.5 relative"
              >
                {quantity > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-[10px]"
                  >
                    {quantity}
                  </Badge>
                )}
                <span className="text-base">{item.icon}</span>
                <span className="text-[9px] leading-tight">{item.name}</span>
                <span className="text-[9px] font-semibold text-blue-600">
                  {item.price.toLocaleString()}₫
                </span>
              </Button>
            );
          })}
        </div>

        {/* Charges List */}
        {charges.length > 0 ? (
          <div className="space-y-1 mb-2">
            <div className="text-[10px] font-semibold text-gray-600 mb-1">Đã thêm:</div>
            {charges.map(charge => (
              <div key={charge.id} className="flex items-center justify-between text-[10px] bg-gray-50 p-1 rounded">
                <div className="flex-1">
                  <span>{charge.description}</span>
                  {charge.quantity > 1 && <span className="text-gray-500"> x{charge.quantity}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">
                    {(charge.amount * charge.quantity).toLocaleString()}₫
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCharge(charge.id)}
                    className="h-5 w-5 p-0 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-1 border-t text-xs font-bold">
              <span>Tổng phí PS:</span>
              <span className="text-blue-600">{totalCharges.toLocaleString()}₫</span>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-gray-500 text-center py-2">
            Chưa có phí phát sinh
          </div>
        )}
      </Card>

      {/* Custom Item Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="max-w-sm p-3">
          <DialogHeader>
            <DialogTitle className="text-base">Thêm phí khác</DialogTitle>
            <DialogDescription className="text-xs">
              Nhập thông tin phí phát sinh tùy chỉnh
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <Label htmlFor="custom-desc" className="text-xs">Mô tả *</Label>
              <Input
                id="custom-desc"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Ví dụ: Cà phê, Giặt ủi..."
                className="text-xs h-8 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="custom-amount" className="text-xs">Đơn giá *</Label>
                <Input
                  id="custom-amount"
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="50000"
                  className="text-xs h-8 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="custom-qty" className="text-xs">Số lượng</Label>
                <Input
                  id="custom-qty"
                  type="number"
                  min="1"
                  value={customQuantity}
                  onChange={(e) => setCustomQuantity(e.target.value)}
                  className="text-xs h-8 mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomDialog(false)}
                className="flex-1 text-xs h-8"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={addCustomItem}
                className="flex-1 text-xs h-8"
              >
                Thêm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
