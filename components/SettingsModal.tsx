import React, { useState } from 'react';
import { User, MenuItem } from '../types';
import { 
  Settings, Moon, Sun, Monitor, Bell, Shield, Camera, Key, 
  CreditCard, Sliders, Check, X, Store, Trash2, Plus, Edit2, Volume2
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  menu?: MenuItem[];
  onUpdateMenu?: (updatedMenu: MenuItem[]) => void;
  onOpenCamera?: () => void;
  permission?: NotificationPermission;
  onRequestPermission?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  menu = [],
  onUpdateMenu,
  onOpenCamera,
  permission,
  onRequestPermission
}) => {
  const { theme, setTheme } = useTheme();
  
  const [defaultPaymentRatio, setDefaultPaymentRatio] = useState<'half' | 'full'>(() => {
    return (localStorage.getItem('hb_default_pay_ratio') as any) || 'half';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('hb_sound_enabled') !== 'false';
  });

  const [printerWidth, setPrinterWidth] = useState<'80mm' | '58mm'>(() => {
    return (localStorage.getItem('hb_printer_width') as any) || '80mm';
  });

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  if (!isOpen) return null;

  const handleRatioChange = (ratio: 'half' | 'full') => {
    setDefaultPaymentRatio(ratio);
    localStorage.setItem('hb_default_pay_ratio', ratio);
  };

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('hb_sound_enabled', String(next));
  };

  const handlePrinterChange = (width: '80mm' | '58mm') => {
    setPrinterWidth(width);
    localStorage.setItem('hb_printer_width', width);
  };

  const toggleItemAvailability = (itemId: string) => {
    if (!onUpdateMenu) return;
    const updated = menu.map(m => m.id === itemId ? { ...m, is_available: !m.is_available } : m);
    onUpdateMenu(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 flex flex-col justify-between max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">System Settings</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Preferences & Theme Configuration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-6 space-y-8">
          {/* Theme Selector */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Appearance & Interface Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Light Mode', icon: <Sun className="w-4 h-4 text-amber-500" /> },
                { id: 'dark', label: 'Dark Mode', icon: <Moon className="w-4 h-4 text-indigo-500" /> },
                { id: 'system', label: 'System Theme', icon: <Monitor className="w-4 h-4 text-emerald-500" /> }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    theme === t.id 
                      ? 'bg-emerald-50/80 border-emerald-600 text-emerald-950 shadow-sm' 
                      : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t.icon}
                  <span className="text-[10px] font-black uppercase tracking-wider">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Default Ratio Preference */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Default Checkout Payment Amount</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRatioChange('half')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  defaultPaymentRatio === 'half'
                    ? 'bg-emerald-50/80 border-emerald-600 text-emerald-950 shadow-sm'
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <p className="text-xs font-black text-slate-900">50% Reservation Deposit</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Pay half now, pay half at canteen pickup</p>
              </button>

              <button
                onClick={() => handleRatioChange('full')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  defaultPaymentRatio === 'full'
                    ? 'bg-emerald-50/80 border-emerald-600 text-emerald-950 shadow-sm'
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <p className="text-xs font-black text-slate-900">100% Full Payment Upfront</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Pay entire bill online for instant express pickup</p>
              </button>
            </div>
          </div>

          {/* Notifications & Audio Sounds */}
          <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-black text-slate-900">Desktop Order Status Push Alerts</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Alert when kitchen updates order to 'Ready'</p>
                </div>
              </div>
              <button
                onClick={onRequestPermission}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all"
              >
                {permission === 'granted' ? 'Enabled ✓' : 'Request Permission'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200/50">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-black text-slate-900">Sound Effects & Vibration Chime</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Audio chime on token updates</p>
                </div>
              </div>
              <button
                onClick={handleSoundToggle}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                  soundEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {soundEnabled ? 'Audio On' : 'Audio Muted'}
              </button>
            </div>
          </div>

          {/* Profile Photo Camera Action */}
          {onOpenCamera && (
            <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-black text-slate-900">Device Camera Profile Picture</p>
                  <p className="text-[9px] font-bold text-emerald-700 uppercase">Capture live photo avatar for canteen profile</p>
                </div>
              </div>
              <button
                onClick={onOpenCamera}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm transition-all"
              >
                Open Camera
              </button>
            </div>
          )}

          {/* Canteen Staff / Admin Menu Operations Settings */}
          {(user?.role === 'staff' || user?.role === 'admin') && menu.length > 0 && (
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Quick Menu Availability Toggles</label>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {menu.map(item => (
                  <div key={item.id} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{item.item_name} (₹{item.price})</span>
                    <button
                      onClick={() => toggleItemAvailability(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                        item.is_available 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.is_available ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-950 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all"
          >
            Done Settings
          </button>
        </div>
      </div>
    </div>
  );
};
