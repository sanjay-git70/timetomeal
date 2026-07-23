
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Order, OrderStatus, User as AppUser, MenuItem, CanteenProfile } from '../types';
import SummaryDashboard from './SummaryDashboard';
import WalkInOrderView from './WalkInOrderView';
import ReportsAnalysisView from './ReportsAnalysisView';
import TVDashboard from './TVDashboard';
import { 
  Check, Play, Printer, Plus, Search, Trash2, 
  Package, UtensilsCrossed, Settings, 
  LogOut, LayoutDashboard,
  Edit2, ShoppingCart, ArrowLeft, RotateCw, X as XIcon, User as UserIcon,
  BarChart3, Store, Phone, Mail, Save, ToggleLeft as Toggle,
  Clock as ClockIcon, CreditCard, Monitor, AlertCircle, ChevronRight, CheckCircle2,
  Tv2
} from 'lucide-react';

interface StaffViewProps {
  user: AppUser;
  orders: Order[];
  menu: MenuItem[];
  onUpdateOrders: (orders: Order[]) => void;
  onUpdateMenu: (menu: MenuItem[]) => void;
  onLogout: () => void;
}

type StaffTab = 'summary' | 'orders' | 'inventory' | 'reports' | 'profile' | 'walk-in-order' | 'tv-view';

const StaffView: React.FC<StaffViewProps> = ({ user, orders, menu, onUpdateOrders, onUpdateMenu, onLogout }) => {
  const [activeTab, setActiveTab] = useState<StaffTab>('summary');
  const [tabHistory, setTabHistory] = useState<StaffTab[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Inventory Edit State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    item_name: '',
    price: 0,
    category: 'breakfast',
    availability: true,
    stock_offline: 100,
    stock_online: 50,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'
  });

  const canteenProfile = user.profile as CanteenProfile;

  const navigateTo = useCallback((tab: StaffTab) => {
    if (tab === activeTab) return;
    setTabHistory(prev => [...prev, activeTab]);
    setActiveTab(tab);
  }, [activeTab]);

  const goBack = useCallback(() => {
    if (tabHistory.length === 0) return;
    const previous = tabHistory[tabHistory.length - 1];
    setTabHistory(prev => prev.slice(0, -1));
    setActiveTab(previous);
  }, [tabHistory]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'Tab') { e.preventDefault(); navigateTo('walk-in-order'); }
      if (e.key === 'Escape') { e.preventDefault(); goBack(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack, navigateTo]);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, order_status: status } : o);
    onUpdateOrders(updated);
  };

  const toggleAvailability = (itemId: string) => {
    const updated = menu.map(m => m.id === itemId ? { ...m, availability: !m.availability } : m);
    onUpdateMenu(updated);
  };

  const deleteMenuItem = (itemId: string) => {
    if (confirm('Permanently delete this item?')) {
      onUpdateMenu(menu.filter(m => m.id !== itemId));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const createdItem: MenuItem = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9),
      canteen_id: 's1', 
      low_stock_threshold: 10
    } as MenuItem;
    onUpdateMenu([...menu, createdItem]);
    setIsAddingItem(false);
    setNewItem({ item_name: '', price: 0, category: 'breakfast', availability: true, stock_offline: 100, stock_online: 50, imageUrl: newItem.imageUrl, description: '' });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.student_details?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const filteredInventory = useMemo(() => {
    return menu.filter(m => m.item_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [menu, searchTerm]);

  if (activeTab === 'tv-view') {
    return <TVDashboard orders={orders} onBack={goBack} />;
  }

  return (
    <div key={refreshKey} className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] bg-gray-50 text-gray-900 animate-in fade-in duration-700">
      <aside className="w-full lg:w-72 bg-white border-r border-gray-200 p-6 flex flex-col gap-2 shrink-0 print:hidden shadow-sm">
        <div className="p-4 mb-6 bg-gray-950 rounded-[2.5rem] text-white shadow-xl shadow-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-gray-950 shadow-inner">
              {canteenProfile?.canteen_name?.[0] || 'C'}
            </div>
            <div className="overflow-hidden">
              <p className="font-black text-sm truncate uppercase tracking-widest">{canteenProfile?.canteen_name || 'My Canteen'}</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Administrator</p>
            </div>
          </div>
        </div>

        {[
          { id: 'summary', icon: LayoutDashboard, label: 'Summary' },
          { id: 'walk-in-order', icon: ShoppingCart, label: 'New Bill' },
          { id: 'orders', icon: ClockIcon, label: 'Live Queue' },
          { id: 'inventory', icon: UtensilsCrossed, label: 'Menu Catalog' },
          { id: 'reports', icon: BarChart3, label: 'Financials' },
          { id: 'profile', icon: Settings, label: 'Configuration' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => navigateTo(tab.id as StaffTab)}
            className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200' 
                : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            <tab.icon className="w-5 h-5" /> {tab.label}
          </button>
        ))}

        <div className="mt-auto pt-4 border-t border-gray-100">
           <button 
            onClick={() => navigateTo('tv-view')}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-all"
           >
            <Tv2 className="w-5 h-5" /> Launch TV Panel
           </button>
           <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest text-red-400 hover:bg-red-50 hover:text-red-600 transition-all mt-2">
            <LogOut className="w-5 h-5" /> Sign Out
           </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        {/* Header & Search */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
          <div className="flex items-center gap-6">
            {tabHistory.length > 0 && (
              <button onClick={goBack} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-950 transition-all shadow-sm group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
            <div>
              <h2 className="text-4xl font-black text-gray-950 tracking-tight capitalize">
                {activeTab === 'profile' ? 'Portal Setup' : (activeTab === 'orders' ? 'Live Queue' : (activeTab === 'inventory' ? 'Menu Catalog' : activeTab.replace('-', ' ')))}
              </h2>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mt-1">{canteenProfile.canteen_name} Control Unit</p>
            </div>
          </div>
          {(activeTab === 'orders' || activeTab === 'inventory') && (
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] outline-none font-bold text-sm focus:ring-4 focus:ring-emerald-500/10 shadow-sm transition-all"
                placeholder={activeTab === 'orders' ? "Search Token ID or Name..." : "Search Menu Items..."}
              />
            </div>
          )}
        </div>

        {activeTab === 'summary' && <SummaryDashboard orders={orders} onNewWalkIn={() => navigateTo('walk-in-order')} />}
        
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-right-4 duration-500">
             {filteredOrders.length === 0 ? (
               <div className="py-40 text-center text-gray-300 flex flex-col items-center gap-4">
                  <Package className="w-16 h-16 opacity-10" />
                  <p className="font-black uppercase tracking-widest text-[10px]">No active orders found in queue</p>
               </div>
             ) : (
               filteredOrders.map(order => (
                 <div key={order.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-8 hover:border-emerald-100 transition-all">
                    <div className="flex-1 space-y-6">
                       <div className="flex items-center gap-5">
                          <div className="px-5 py-3 bg-gray-950 text-emerald-500 rounded-2xl font-black text-2xl tracking-tighter">
                             #{order.order_code}
                          </div>
                          <div>
                             <h4 className="font-black text-xl text-gray-950 leading-tight">{order.student_details?.full_name || 'Walk-in Counter Guest'}</h4>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                <ClockIcon className="w-3 h-3" /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                          </div>
                       </div>
                       <div className="bg-gray-50/50 p-6 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-100">
                          {order.order_items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-bold border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                               <span className="text-gray-600">{item.quantity}x {item.item_name}</span>
                               <span className="text-gray-400">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                    <div className="flex flex-col justify-between items-end gap-6 min-w-[240px]">
                       <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Billable</p>
                          <p className="text-4xl font-black text-gray-950 tracking-tighter">₹{order.total_amount}</p>
                          <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${order.order_status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                             {order.order_status}
                          </div>
                       </div>
                       <div className="flex flex-wrap gap-3 justify-end w-full">
                          {order.order_status === 'pending' && (
                            <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                               <Play className="w-5 h-5 fill-current" /> Prepare
                            </button>
                          )}
                          {order.order_status === 'preparing' && (
                            <button onClick={() => updateOrderStatus(order.id, 'ready')} className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95">
                               <Check className="w-5 h-5" /> Mark Ready
                            </button>
                          )}
                          {order.order_status === 'ready' && (
                            <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gray-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95">
                               <Package className="w-5 h-5" /> Handover
                            </button>
                          )}
                          {order.order_status === 'delivered' && (
                            <div className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-gray-100">
                               <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Fulfilled
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
               ))
             )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Canteen Catalog Items</p>
                   <p className="text-xl font-black text-gray-950">{filteredInventory.length} Active SKUs</p>
                </div>
                <button onClick={() => setIsAddingItem(true)} className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all hover:bg-emerald-700">
                   <Plus className="w-5 h-5" /> Create Item
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                {filteredInventory.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-[3rem] border border-gray-100 shadow-sm group hover:border-emerald-300 transition-all flex flex-col">
                     <div className="flex gap-6 items-center">
                        <div className="w-24 h-24 rounded-[2rem] overflow-hidden bg-gray-100 flex-shrink-0 relative shadow-inner">
                           <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           {!item.availability && <div className="absolute inset-0 bg-gray-950/70 backdrop-blur-[2px] flex items-center justify-center text-[10px] text-white font-black uppercase tracking-widest">Off-Menu</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start mb-1">
                              <h4 className="font-black text-gray-950 truncate text-lg">{item.item_name}</h4>
                              <button onClick={() => deleteMenuItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                           <p className="text-emerald-600 font-black text-2xl tracking-tighter">₹{item.price}</p>
                           <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">{item.category}</span>
                        </div>
                     </div>
                     
                     <div className="mt-6 p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                        <div className="flex gap-4">
                           <div className="space-y-1">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Counter</p>
                              <p className="text-xs font-black text-gray-900">{item.stock_offline}</p>
                           </div>
                           <div className="w-px h-6 bg-gray-200 mt-1" />
                           <div className="space-y-1">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Online</p>
                              <p className="text-xs font-black text-gray-900">{item.stock_online}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${item.availability ? 'text-emerald-600' : 'text-gray-400'}`}>{item.availability ? 'Listed' : 'Unlisted'}</span>
                           <button onClick={() => toggleAvailability(item.id)} className={`w-12 h-6 rounded-full relative transition-all ${item.availability ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                              <div className={`absolute top-1.5 w-3 h-3 bg-white rounded-full transition-all ${item.availability ? 'right-1.5' : 'left-1.5'}`} />
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>

             {/* Add Item Modal */}
             {isAddingItem && (
               <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                  <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2.5rem] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300 my-auto">
                     <div className="flex justify-between items-center mb-10">
                        <div className="space-y-1">
                           <h3 className="text-3xl font-black text-gray-950">New Menu Entry</h3>
                           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Add item to catalog</p>
                        </div>
                        <button onClick={() => setIsAddingItem(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-gray-950 rounded-2xl transition-all">
                           <XIcon className="w-7 h-7" />
                        </button>
                     </div>
                     <form onSubmit={handleAddItem} className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[11px] font-black text-gray-400 uppercase ml-2 tracking-widest">Item Designation</label>
                           <input required value={newItem.item_name} onChange={e => setNewItem({...newItem, item_name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-[1.5rem] outline-none font-bold text-gray-950 border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner" placeholder="e.g. Traditional Paneer Butter Masala" />
                        </div>
                        
                        <div className="space-y-2">
                           <label className="text-[11px] font-black text-gray-400 uppercase ml-2 tracking-widest">Description</label>
                           <textarea value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-[1.5rem] outline-none font-bold text-gray-950 border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner h-20 resize-none" placeholder="e.g. Rich, creamy paneer dish spiced with indian condiments." />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[11px] font-black text-gray-400 uppercase ml-2 tracking-widest">Item Image URL</label>
                           <input required type="url" value={newItem.imageUrl} onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-[1.5rem] outline-none font-bold text-gray-950 border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner" placeholder="https://unsplash.com/..." />
                           
                           {/* Food Image Presets */}
                           <div className="pt-2">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Or Choose a Preset Dish Image:</p>
                             <div className="flex flex-wrap gap-2">
                               {[
                                 { name: '🍳 Breakfast', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400' },
                                 { name: '🍱 Thali/Lunch', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400' },
                                 { name: '🥪 Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=400' },
                                 { name: '🥤 Cold Coffee', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=80&w=400' },
                                 { name: '🍜 Noodles', url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=400' },
                                 { name: '🥟 Snacks', url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=400' }
                               ].map((preset, idx) => (
                                 <button
                                   key={idx}
                                   type="button"
                                   onClick={() => setNewItem({ ...newItem, imageUrl: preset.url })}
                                   className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                                     newItem.imageUrl === preset.url
                                       ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100'
                                       : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                                   }`}
                                 >
                                   {preset.name}
                                 </button>
                               ))}
                             </div>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[11px] font-black text-gray-400 uppercase ml-2 tracking-widest">Pricing (₹)</label>
                              <input required type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} className="w-full px-6 py-4 bg-gray-50 rounded-[1.5rem] outline-none font-bold text-gray-950 border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[11px] font-black text-gray-400 uppercase ml-2 tracking-widest">Classification</label>
                              <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as any})} className="w-full px-6 py-4 bg-gray-50 rounded-[1.5rem] outline-none font-bold text-gray-950 border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner appearance-none">
                                 <option value="breakfast">Breakfast</option>
                                 <option value="lunch">Lunch</option>
                                 <option value="snacks">Snacks</option>
                              </select>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[11px] font-black text-gray-400 uppercase ml-2 tracking-widest">Offline Stock</label>
                              <input required type="number" value={newItem.stock_offline} onChange={e => setNewItem({...newItem, stock_offline: Number(e.target.value)})} className="w-full px-6 py-4 bg-gray-50 rounded-[1.5rem] outline-none font-bold text-gray-950 border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[11px] font-black text-gray-400 uppercase ml-2 tracking-widest">Online Stock</label>
                              <input required type="number" value={newItem.stock_online} onChange={e => setNewItem({...newItem, stock_online: Number(e.target.value)})} className="w-full px-6 py-4 bg-gray-50 rounded-[1.5rem] outline-none font-bold text-gray-950 border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner" />
                           </div>
                        </div>
                        <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(16,185,129,0.5)] mt-4 uppercase tracking-[0.2em] text-[12px] active:scale-[0.98] transition-all hover:bg-emerald-700">Save To Portal Catalog</button>
                     </form>
                  </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'reports' && <ReportsAnalysisView orders={orders} menu={menu} onNewWalkIn={() => navigateTo('walk-in-order')} />}
        {activeTab === 'walk-in-order' && <WalkInOrderView user={user} menu={menu} onBack={goBack} onPlaceOrder={(o) => onUpdateOrders([o, ...orders])} />}
        
        {activeTab === 'profile' && (
          <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                   <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><Store className="w-5 h-5 text-emerald-600"/> Canteen Identity</h3>
                   <div className="space-y-6">
                      <div className="flex gap-4">
                         <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Outlet Name</label>
                            <input className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 shadow-inner" defaultValue={canteenProfile.canteen_name} />
                         </div>
                         <div className="w-36 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">System Status</label>
                            <div className={`px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-center shadow-inner ${canteenProfile.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                               {canteenProfile.status || 'Live'}
                            </div>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Primary Email</label>
                         <input className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 shadow-inner" defaultValue={canteenProfile.email} readOnly />
                      </div>
                   </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                   <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><Printer className="w-5 h-5 text-emerald-600"/> Hardware Binding</h3>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Master Printer Device</label>
                         <input className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 shadow-inner" placeholder="Searching for hardware..." defaultValue={canteenProfile.printer_settings?.printer_name} />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Paper Width</label>
                            <input className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 shadow-inner" defaultValue="80mm Thermal" readOnly />
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Serial Com</label>
                            <input className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 shadow-inner" defaultValue="COM4 Active" readOnly />
                        </div>
                      </div>
                   </div>
                </div>

                <div className="md:col-span-2 bg-emerald-600 p-12 rounded-[4rem] flex flex-col items-center gap-6 text-center shadow-2xl shadow-emerald-200">
                   <div className="w-20 h-20 bg-white/20 rounded-[2.5rem] flex items-center justify-center text-white backdrop-blur-xl">
                      <Shield className="w-10 h-10" />
                   </div>
                   <div>
                      <h4 className="text-3xl font-black text-white leading-tight">Secure Management Session</h4>
                      <p className="text-emerald-100 font-bold uppercase tracking-[0.4em] text-[10px] mt-2">Active Authorized User: {user.email}</p>
                   </div>
                   <button onClick={onLogout} className="px-12 py-5 bg-white text-emerald-700 font-black rounded-3xl shadow-2xl hover:bg-emerald-50 active:scale-95 transition-all uppercase tracking-[0.2em] text-[12px]">Terminate Access Session</button>
                </div>
             </div>
          </div>
        )}
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

const Shield = ({className}: {className?: string}) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);

export default StaffView;
