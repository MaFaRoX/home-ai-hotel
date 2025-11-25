'use client'

import { useState, useMemo } from 'react';
import { Room } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Search, X } from 'lucide-react';
import { RoomCard } from './RoomCard';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchDialogProps {
  rooms: Room[];
  open: boolean;
  onClose: () => void;
  onSelectRoom: (room: Room) => void;
}

export function SearchDialog({ rooms, open, onClose, onSelectRoom }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    return rooms.filter(room => {
      // Search by room number
      if (room.number.toLowerCase().includes(query)) return true;
      
      // Search by guest name
      if (room.guest?.name.toLowerCase().includes(query)) return true;
      
      // Search by guest phone
      if (room.guest?.phone.includes(query)) return true;
      
      // Search by booking guest name
      if (room.booking?.guestName.toLowerCase().includes(query)) return true;
      
      // Search by booking phone
      if (room.booking?.phone.includes(query)) return true;
      
      return false;
    });
  }, [rooms, searchQuery]);

  const handleSelectRoom = (room: Room) => {
    onSelectRoom(room);
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('search.title')}</DialogTitle>
          <DialogDescription>
            {t('search.placeholder')}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="pl-10 pr-10"
            autoFocus
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 mt-4">
          {!searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Search className="w-16 h-16 mb-4 opacity-20" />
              <p>{t('search.placeholder')}</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Search className="w-16 h-16 mb-4 opacity-20" />
              <p>{t('search.noResults')}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {t('search.results')}: {searchResults.length} {t('common.room').toLowerCase()}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {searchResults.map(room => (
                  <div key={room.id} onClick={() => handleSelectRoom(room)}>
                    <RoomCard room={room} onClick={() => {}} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
