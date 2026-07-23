
import { MenuItem, Shop } from './types';

export const CANTEEN_INFO = {
  name: 'RAGA PVT LTD',
  address: 'S USMAN ROAD, T. NAGAR, CHENNAI, TAMIL NADU.',
  phone: '044 258636222',
  gstin: '33AAAGP0685F1ZH'
};

export const SHOPS: Shop[] = [
  { id: 's1', name: 'Main Canteen', image: 'https://images.unsplash.com/photo-1567529684892-0f296707f2a4?auto=format&fit=crop&q=80&w=400', location: 'Ground Floor, Block A' },
  { id: 's2', name: 'Snack Shack', image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=400', location: 'Near Hostel Gate' }
];

// Fix: Added missing stock and threshold properties to comply with MenuItem interface
export const MENU_ITEMS: MenuItem[] = [
  { 
    id: 'm1', canteen_id: 's1', item_name: 'Masala Dosa', price: 45, category: 'breakfast', availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400',
    stock_online: 50, stock_offline: 100, low_stock_threshold: 10
  },
  { 
    id: 'm2', canteen_id: 's1', item_name: 'Veg Thali', price: 85, category: 'lunch', availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400',
    stock_online: 30, stock_offline: 60, low_stock_threshold: 5
  },
  { 
    id: 'm3', canteen_id: 's2', item_name: 'Vegetable Sandwich', price: 35, category: 'snacks', availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=400',
    stock_online: 40, stock_offline: 80, low_stock_threshold: 8
  },
  { 
    id: 'm4', canteen_id: 's2', item_name: 'Cold Coffee', price: 40, category: 'snacks', availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=80&w=400',
    stock_online: 25, stock_offline: 50, low_stock_threshold: 5
  }
];

export const CANCEL_WINDOW_MS = 20 * 60 * 1000;
