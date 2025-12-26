'use client'

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { MoneyInput } from './MoneyInput';
import { Plus, Edit2, Save, X, Trash2, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { HotelService } from '../types';
import { serviceApi } from '../utils/api/guesthouse';
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

interface ServiceManagementProps {
    open: boolean;
    onClose: () => void;
}

export function ServiceManagement({ open, onClose }: ServiceManagementProps) {
    const { hotel, hotelServices, loadHotelServices } = useApp();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [unit, setUnit] = useState('');
    const [category, setCategory] = useState('');

    useEffect(() => {
        if (open && hotel && hotelServices.length === 0) {
            loadHotelServices();
        }
    }, [open, hotel, hotelServices.length, loadHotelServices]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setPrice('');
        setUnit('');
        setCategory('');
        setEditingId(null);
        setShowAddForm(false);
    };

    const handleEdit = (service: HotelService) => {
        setName(service.name);
        setDescription(service.description || '');
        setPrice(service.price.toString());
        setUnit(service.unit || '');
        setCategory(service.category || '');
        setEditingId(service.id);
        setShowAddForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hotel) return;

        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            toast.error(t('service.priceError'));
            return;
        }

        try {
            if (editingId) {
                // Update existing service
                await serviceApi.update(editingId, {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    price: priceNum,
                    unit: unit.trim() || undefined,
                    category: category.trim() || undefined,
                });
                toast.success(`✅ ${t('service.updatedSuccess')} ${name}`);
            } else {
                // Create new service
                await serviceApi.create({
                    hotelId: hotel.id,
                    name: name.trim(),
                    description: description.trim() || undefined,
                    price: priceNum,
                    unit: unit.trim() || undefined,
                    category: category.trim() || undefined,
                });
                toast.success(`✅ ${t('service.addedSuccess')} ${name}`);
            }
            await loadHotelServices(); // Reload from server
            resetForm();
        } catch (error: any) {
            toast.error(error.message || t('service.saveError'));
        }
    };

    const handleDelete = async (serviceId: string) => {
        try {
            await serviceApi.update(serviceId, { isActive: false });
            await loadHotelServices(); // Reload from server
            toast.success(t('room.serviceRemoved'));
            setDeleteConfirmId(null);
        } catch (error: any) {
            toast.error(error.message || t('room.serviceRemoveError'));
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    // Group services by category
    const groupedServices = hotelServices.reduce((acc: Record<string, HotelService[]>, service: HotelService) => {
        const cat = service.category || t('service.categoryOther');
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(service);
        return acc;
    }, {} as Record<string, HotelService[]>);

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Coffee className="w-5 h-5" />
                            {t('service.title')}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Add/Edit Form */}
                        {showAddForm ? (
                            <Card className="p-4 border-2 border-blue-200 bg-blue-50">
                                <form onSubmit={handleSave} className="space-y-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {editingId ? t('service.edit') : t('service.addNew')}
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={resetForm}
                                            className="h-7 px-2"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <Label htmlFor="service-name" className="text-xs">{t('service.name')}</Label>
                                            <Input
                                                id="service-name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder={t('service.namePlaceholder')}
                                                required
                                                className="h-9 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="service-price" className="text-xs">{t('service.price')}</Label>
                                            <MoneyInput
                                                id="service-price"
                                                value={price}
                                                onChange={setPrice}
                                                placeholder="0"
                                                className="h-9 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="service-unit" className="text-xs">{t('service.unit')}</Label>
                                            <Input
                                                id="service-unit"
                                                value={unit}
                                                onChange={(e) => setUnit(e.target.value)}
                                                placeholder={t('service.unitPlaceholder')}
                                                className="h-9 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="service-category" className="text-xs">{t('service.category')}</Label>
                                            <Input
                                                id="service-category"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                placeholder={t('service.categoryPlaceholder')}
                                                className="h-9 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="service-desc" className="text-xs">{t('service.description')}</Label>
                                            <Textarea
                                                id="service-desc"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder={t('service.descriptionPlaceholder')}
                                                rows={2}
                                                className="text-sm resize-none"
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full h-9 text-sm">
                                        <Save className="w-4 h-4 mr-2" />
                                        {editingId ? t('service.update') : t('service.add')}
                                    </Button>
                                </form>
                            </Card>
                        ) : (
                            <Button
                                onClick={() => setShowAddForm(true)}
                                variant="outline"
                                className="w-full border-dashed border-2 h-10"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {t('service.addNew')}
                            </Button>
                        )}

                        {/* Service List */}
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">{t('service.loading')}</div>
                        ) : hotelServices.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Coffee className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>{t('service.noServices')}</p>
                                <p className="text-sm">{t('service.addFirst')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(groupedServices).map(([cat, items]) => (
                                    <div key={cat}>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {cat}
                                            </Badge>
                                            <span className="text-xs text-gray-400">({items.length})</span>
                                        </h3>
                                        <div className="space-y-2">
                                            {items.map((service) => (
                                                <Card key={service.id} className="p-3 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-sm truncate">{service.name}</h4>
                                                            {service.description && (
                                                                <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-sm font-bold text-green-600">
                                                                    {formatCurrency(service.price)}₫
                                                                </span>
                                                                {service.unit && (
                                                                    <span className="text-xs text-gray-400">/ {service.unit}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleEdit(service)}
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => setDeleteConfirmId(service.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('service.removeConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('service.removeConfirmDesc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('delete.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {t('service.removeButton')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
