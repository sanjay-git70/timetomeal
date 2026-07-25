
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
  Tv2, Bell, Sun, Moon, Shield, Lock, ChevronLeft, PanelLeft, PanelLeftClose,
  FileText, HelpCircle, Terminal, TrendingUp
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
  const [activeTab, setActiveTab] = useState<StaffTab>('profile');
  const [tabHistory, setTabHistory] = useState<StaffTab[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Inventory Edit State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    item_name: '',
    price: 0,
    category: 'breakfast',
    availability: true,
    is_veg: true,
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

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'Tab') { e.preventDefault(); navigateTo('walk-in-order'); }
      if (e.key === 'Escape') { e.preventDefault(); goBack(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); setIsSidebarOpen(prev => !prev); }
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
    setNewItem({ item_name: '', price: 0, category: 'breakfast', availability: true, is_veg: true, stock_offline: 100, stock_online: 50, imageUrl: newItem.imageUrl, description: '' });
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

  const navItems = [
    { id: 'summary', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'walk-in-order', icon: FileText, label: 'New Bill' },
    { id: 'orders', icon: ClockIcon, label: 'Live Queue' },
    { id: 'inventory', icon: UtensilsCrossed, label: 'Menu Catalog' },
    { id: 'reports', icon: BarChart3, label: 'Financials' },
    { id: 'profile', icon: Settings, label: 'Configuration' }
  ];

  return (
    <div key={refreshKey} className={`min-h-screen flex bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-5 right-5 z-[200] bg-emerald-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4" /> {showToast}
        </div>
      )}

      {/* Dark Emerald Sidebar with Collapsible Open/Close Mechanism */}
      <aside 
        className={`bg-[#031B15] text-slate-200 border-r border-[#0A3328] flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out z-40 fixed lg:relative inset-y-0 left-0 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div>
          {/* Brand Header & Collapse Toggle */}
          <div className="p-4 border-b border-[#0A3328]/80 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-[#031B15] font-black flex items-center justify-center text-lg shrink-0 shadow-lg shadow-emerald-500/20">
                T
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col whitespace-nowrap">
                  <span className="font-extrabold text-base tracking-tight text-white leading-none">TimeToMeal</span>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1">ADMIN PORTAL</span>
                </div>
              )}
            </div>

            {/* Sidebar Open/Close Toggle Button */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              title={isSidebarOpen ? "Close Sidebar (Ctrl+B)" : "Open Sidebar (Ctrl+B)"}
              className="p-1.5 rounded-xl hover:bg-[#072c22] text-emerald-400/80 hover:text-emerald-300 transition-all ml-auto shrink-0"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Main Navigation Items */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id as StaffTab)}
                  title={!isSidebarOpen ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs transition-all group ${
                    isActive 
                      ? 'bg-[#009E60] text-white shadow-lg shadow-[#009E60]/25' 
                      : 'text-slate-400 hover:text-white hover:bg-[#072c22]'
                  } ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                  {isSidebarOpen && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions Section */}
          <div className="px-3 pt-6">
            {isSidebarOpen && (
              <p className="px-3 text-[10px] font-black text-emerald-500/70 uppercase tracking-widest mb-2">
                QUICK ACTIONS
              </p>
            )}
            <div className="space-y-1">
              <button 
                onClick={() => navigateTo('tv-view')}
                title={!isSidebarOpen ? "Launch TV Panel" : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-[#072c22] transition-all ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
              >
                <Tv2 className="w-4 h-4 text-emerald-400/80 shrink-0" />
                {isSidebarOpen && <span>Launch TV Panel</span>}
              </button>
              <button 
                onClick={() => triggerToast("Printing Diagnostic Hardware Test Slip...")}
                title={!isSidebarOpen ? "Print Test" : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-[#072c22] transition-all ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
              >
                <Printer className="w-4 h-4 text-emerald-400/80 shrink-0" />
                {isSidebarOpen && <span>Print Test</span>}
              </button>
              <button 
                onClick={() => triggerToast("All hardware ports & services active (COM4 115200 Baud)")}
                title={!isSidebarOpen ? "System Logs" : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-[#072c22] transition-all ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
              >
                <Terminal className="w-4 h-4 text-emerald-400/80 shrink-0" />
                {isSidebarOpen && <span>System Logs</span>}
              </button>
              <button 
                onClick={() => triggerToast("TimeToMeal Support Hotline: +91 98765 43210")}
                title={!isSidebarOpen ? "Help & Support" : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-[#072c22] transition-all ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
              >
                <HelpCircle className="w-4 h-4 text-emerald-400/80 shrink-0" />
                {isSidebarOpen && <span>Help & Support</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Staff Account Info at Bottom */}
        <div className="p-3 border-t border-[#0A3328]/80">
          <div className={`p-2.5 bg-[#05261d] rounded-2xl flex items-center justify-between border border-[#0B3A2E] ${!isSidebarOpen ? 'justify-center p-2' : ''}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm shrink-0">
                S
              </div>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <p className="font-extrabold text-xs text-white truncate leading-tight">Staff Account</p>
                  <p className="text-[10px] text-emerald-400/80 truncate">{user.email}</p>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button onClick={onLogout} title="Sign Out" className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Right Content Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Navigation Bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4">
            {/* Open/Close Sidebar Toggle button for mobile / top header */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all"
              title="Toggle Sidebar Menu"
            >
              <PanelLeft className="w-5 h-5" />
            </button>

            {tabHistory.length > 0 && (
              <button 
                onClick={goBack} 
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {activeTab === 'profile' ? 'Portal Setup' : (activeTab === 'orders' ? 'Live Queue' : (activeTab === 'inventory' ? 'Menu Catalog' : (activeTab === 'reports' ? 'Financials' : activeTab.replace('-', ' '))))}
              </h1>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                {canteenProfile?.canteen_name || 'TimeToMeal Main Canteen'} Control Unit
              </p>
            </div>
          </div>

          {/* Right Status Controls */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">System Online</span>
            </div>

            <button 
              onClick={() => triggerToast("3 New walk-in orders received")}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center border-2 border-white dark:border-slate-900">
                3
              </span>
            </button>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Content Views */}
        <main className="p-6 lg:p-8 space-y-8 flex-1">
          {activeTab === 'summary' && <SummaryDashboard orders={orders} onNewWalkIn={() => navigateTo('walk-in-order')} menu={menu} />}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-xs font-bold"
                    placeholder="Search Token ID or Name..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredOrders.length === 0 ? (
                  <div className="py-24 text-center text-slate-400 flex flex-col items-center gap-3">
                    <Package className="w-12 h-12 opacity-20" />
                    <p className="font-bold text-xs">No active orders found in queue</p>
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <div key={order.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="px-4 py-2 bg-slate-950 text-emerald-400 rounded-2xl font-black text-xl">
                            #{order.order_code}
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-slate-900 dark:text-white">{order.student_details?.full_name || 'Walk-in Counter Guest'}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                              <ClockIcon className="w-3 h-3" /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-2 border border-slate-100 dark:border-slate-800">
                          {order.order_items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-bold py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                              <span className="text-slate-700 dark:text-slate-300">{item.quantity}x {item.item_name}</span>
                              <span className="text-slate-400">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between items-end gap-4 min-w-[200px]">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Billable</p>
                          <p className="text-3xl font-black text-slate-900 dark:text-white">₹{order.total_amount}</p>
                          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            order.order_status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {order.order_status}
                          </span>
                        </div>

                        <div className="flex gap-2 w-full justify-end">
                          {order.order_status === 'pending' && (
                            <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
                              <Play className="w-4 h-4 fill-current" /> Prepare
                            </button>
                          )}
                          {order.order_status === 'preparing' && (
                            <button onClick={() => updateOrderStatus(order.id, 'ready')} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all">
                              <Check className="w-4 h-4" /> Mark Ready
                            </button>
                          )}
                          {order.order_status === 'ready' && (
                            <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="px-6 py-3 bg-slate-950 text-white rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-black transition-all">
                              <Package className="w-4 h-4" /> Handover
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catalog SKUs</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{filteredInventory.length} Items Listed</p>
                </div>
                <button onClick={() => setIsAddingItem(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold hover:bg-emerald-700 transition-all">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInventory.map(item => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex gap-4 items-center">
                      <img src={item.imageUrl} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{item.item_name}</h4>
                          <button onClick={() => deleteMenuItem(item.id)} className="text-slate-300 hover:text-red-500 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-emerald-600 font-black text-xl">₹{item.price}</p>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{item.category}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex gap-4 text-xs font-bold text-slate-500">
                        <span>Counter: {item.stock_offline}</span>
                        <span>Online: {item.stock_online}</span>
                      </div>
                      <button onClick={() => toggleAvailability(item.id)} className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.availability ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.availability ? 'Available' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reports' && <ReportsAnalysisView orders={orders} menu={menu} onNewWalkIn={() => navigateTo('walk-in-order')} />}
          {activeTab === 'walk-in-order' && <WalkInOrderView user={user} menu={menu} onBack={goBack} onPlaceOrder={(o) => onUpdateOrders([o, ...orders])} />}

          {/* PORTAL SETUP / CONFIGURATION PAGE (MATCHING THE SCREENSHOT EXACTLY) */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              
              {/* Top Row Cards: CANTEEN IDENTITY & HARDWARE BINDING */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* CANTEEN IDENTITY Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-2xl text-emerald-600 dark:text-emerald-400">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white">CANTEEN IDENTITY</h3>
                      <p className="text-xs text-slate-400 font-medium">Your outlet information and status</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">OUTLET NAME</label>
                        <input 
                          defaultValue={canteenProfile?.canteen_name || "TimeToMeal Main Canteen"} 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-xs text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700/50 outline-none" 
                        />
                      </div>
                      <div className="w-32 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">SYSTEM STATUS</label>
                        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black text-xs text-center flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ACTIVE
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">PRIMARY EMAIL</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                          defaultValue={user.email} 
                          readOnly 
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-xs text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700/50 outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* HARDWARE BINDING Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-2xl text-emerald-600 dark:text-emerald-400">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white">HARDWARE BINDING</h3>
                      <p className="text-xs text-slate-400 font-medium">Printer and hardware configuration</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">MASTER PRINTER DEVICE</label>
                      <div className="relative">
                        <Printer className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                          defaultValue="Thermal BP-100" 
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-xs text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700/50 outline-none" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">PAPER WIDTH</label>
                        <div className="relative">
                          <Edit2 className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input 
                            defaultValue="80mm Thermal" 
                            readOnly 
                            className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-xs text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700/50 outline-none" 
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">SERIAL COM</label>
                        <div className="relative flex items-center">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute right-3 z-10"></span>
                          <input 
                            defaultValue="COM4 Active" 
                            readOnly 
                            className="w-full pl-4 pr-8 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-xs text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700/50 outline-none" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Secure Management Session Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#032B1E] via-[#043d2b] to-[#018855] p-8 text-white shadow-xl">
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                  
                  {/* Left Side Info */}
                  <div className="flex items-start gap-6 max-w-xl">
                    <div className="p-4 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-400 shrink-0">
                      <Shield className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black tracking-tight text-white">Secure Management Session</h2>
                      <p className="text-xs text-emerald-100/80 font-medium">
                        Your session is secure and all systems are operational.
                      </p>

                      <div className="pt-2">
                        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1.5">ACTIVE AUTHORIZED USER</p>
                        <div className="inline-flex items-center gap-3 bg-[#032017]/80 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold text-emerald-100">
                          <UserIcon className="w-4 h-4 text-emerald-400" />
                          <span>{user.email}</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
                            AUTHORIZED
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Session Specs & Terminate Button */}
                  <div className="flex flex-col items-end gap-6 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-emerald-500/20 pt-6 lg:pt-0 lg:pl-8">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-300/80">Session Security</p>
                        <p className="font-extrabold text-white">Encrypted & Secure</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-300/80">System Access</p>
                        <p className="font-extrabold text-white">Full Control</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-300/80">Last Login</p>
                        <p className="font-extrabold text-white">Today, 10:24 AM</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-300/80">IP Address</p>
                        <p className="font-extrabold text-white">192.168.1.105</p>
                      </div>
                    </div>

                    <button 
                      onClick={onLogout}
                      className="px-6 py-3 rounded-xl bg-white text-[#032B1E] hover:bg-emerald-50 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                      <Lock className="w-4 h-4" /> TERMINATE ACCESS SESSION
                    </button>
                  </div>

                </div>

                {/* Decorative Background Shield Vector Graphics */}
                <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden xl:block">
                  <Shield className="w-72 h-72 text-emerald-300" />
                </div>
              </div>

              {/* Bottom Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Today's Orders</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">128</p>
                    <p className="text-[10px] font-bold text-emerald-600">+12% from yesterday</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <ClockIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Live Queue</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">18</p>
                    <p className="text-[10px] font-bold text-blue-600">Active orders</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">₹12,450</p>
                    <p className="text-[10px] font-bold text-emerald-600">Today</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Printer Status</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">Online</p>
                    <p className="text-[10px] font-bold text-emerald-600">Ready to print</p>
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
};

export default StaffView;

