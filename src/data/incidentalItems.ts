export interface IncidentalItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  category: 'beverage' | 'food' | 'other';
}

export const INCIDENTAL_ITEMS: IncidentalItem[] = [
  { id: '1', name: 'Nước ngọt', icon: '🥤', price: 10000, category: 'beverage' },
  { id: '2', name: 'Bia', icon: '🍺', price: 20000, category: 'beverage' },
  { id: '3', name: 'Nước suối', icon: '💧', price: 5000, category: 'beverage' },
  { id: '4', name: 'Mì gói', icon: '🍜', price: 15000, category: 'food' },
  { id: '5', name: 'Snack', icon: '🍪', price: 12000, category: 'food' },
  { id: '6', name: 'Bánh mì', icon: '🥖', price: 20000, category: 'food' },
];
