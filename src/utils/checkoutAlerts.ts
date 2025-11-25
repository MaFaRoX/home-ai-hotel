import { useEffect, useState, useRef } from 'react';
import { Room } from '../types';
import { toast } from 'sonner';

export interface CheckoutAlert {
  roomId: string;
  roomNumber: string;
  guestName: string;
  checkoutTime: Date;
  minutesUntilCheckout: number;
}

/**
 * Hook to track and alert rooms that are checking out within the next 2 hours
 */
export function useCheckoutAlerts(rooms: Room[]) {
  const [alerts, setAlerts] = useState<CheckoutAlert[]>([]);
  const notifiedRoomIdsRef = useRef<Set<string>>(new Set());
  const roomsRef = useRef<Room[]>(rooms);

  // Update rooms ref without triggering re-render
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    const checkRooms = () => {
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      const newAlerts: CheckoutAlert[] = [];
      const currentAlertRoomIds = new Set<string>();

      roomsRef.current.forEach(room => {
        // Only check occupied and due-out rooms
        if ((room.status === 'occupied' || room.status === 'due-out') && room.guest?.checkOutDate) {
          const checkoutDate = new Date(room.guest.checkOutDate);
          
          // Check if checkout is within 2 hours
          if (checkoutDate <= twoHoursFromNow && checkoutDate > now) {
            const minutesUntilCheckout = Math.floor((checkoutDate.getTime() - now.getTime()) / (1000 * 60));
            
            const alert: CheckoutAlert = {
              roomId: room.id,
              roomNumber: room.number,
              guestName: room.guest.name,
              checkoutTime: checkoutDate,
              minutesUntilCheckout,
            };
            
            newAlerts.push(alert);
            currentAlertRoomIds.add(room.id);

            // If this room hasn't been notified yet, show toast
            if (!notifiedRoomIdsRef.current.has(room.id)) {
              notifiedRoomIdsRef.current.add(room.id);
              
              // Show toast notification
              const timeString = minutesUntilCheckout < 60 
                ? `${minutesUntilCheckout} phút`
                : `${Math.floor(minutesUntilCheckout / 60)}h ${minutesUntilCheckout % 60}p`;
              
              toast.warning(`⏰ Phòng ${room.number} sắp trả`, {
                description: `Khách ${room.guest.name} sẽ trả phòng trong ${timeString}`,
                duration: 5000,
              });
            }
          }
        }
      });

      // Clean up notified rooms that are no longer in alerts
      const newNotifiedSet = new Set<string>();
      notifiedRoomIdsRef.current.forEach(id => {
        if (currentAlertRoomIds.has(id)) {
          newNotifiedSet.add(id);
        }
      });
      notifiedRoomIdsRef.current = newNotifiedSet;

      // Update alerts
      setAlerts(newAlerts);
    };

    // Initial check
    checkRooms();
    
    // Check rooms every minute
    const interval = setInterval(() => {
      checkRooms();
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount

  return {
    alerts,
    alertCount: alerts.length,
  };
}

/**
 * Check if a specific room is checking out within 2 hours
 */
export function isCheckingOutSoon(room: Room): boolean {
  if ((room.status === 'occupied' || room.status === 'due-out') && room.guest?.checkOutDate) {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const checkoutDate = new Date(room.guest.checkOutDate);
    
    return checkoutDate <= twoHoursFromNow && checkoutDate > now;
  }
  return false;
}

/**
 * Get minutes until checkout for a room
 */
export function getMinutesUntilCheckout(room: Room): number | null {
  if ((room.status === 'occupied' || room.status === 'due-out') && room.guest?.checkOutDate) {
    const now = new Date();
    const checkoutDate = new Date(room.guest.checkOutDate);
    const minutes = Math.floor((checkoutDate.getTime() - now.getTime()) / (1000 * 60));
    return minutes > 0 ? minutes : null;
  }
  return null;
}
