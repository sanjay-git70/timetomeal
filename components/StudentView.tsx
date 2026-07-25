import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, Order, MenuItem, OrderItem, StudentProfile, PaymentMethod } from '../types';
import { 
  ShoppingCart, CheckCircle, Utensils, LogOut, 
  User as UserIcon, ShoppingBag, Bell, X, 
  Clock, ArrowLeft, Mail, Phone, Hash, Key, 
  ChevronRight, MapPin, Search, Info, ShieldCheck, 
  CreditCard, Smartphone, QrCode, Copy, ExternalLink,
  ChevronLeft, ArrowRight, Home, Star, Plus as PlusIcon, Minus, AlertCircle, ShoppingCart as CartIcon, Check,
  Settings, Camera, SlidersHorizontal, Printer, AlertTriangle, Sparkles, Filter,
  LayoutGrid, Coffee, SunMedium, ChevronDown
} from 'lucide-react';
import { CANCEL_WINDOW_MS } from '../constants';
import OrderPlacedPopup from './OrderPlacedPopup';
import { useOrderNotifications } from '../hooks/useOrderNotifications';
import { CameraCaptureModal } from './CameraCaptureModal';
import { OrderPipelineStepper } from './OrderPipelineStepper';
import { NotificationBell } from './NotificationBell';
import { SettingsModal } from './SettingsModal';
import { StudentReceiptModal } from './StudentReceiptModal';
import { CancelOrderModal } from './CancelOrderModal';

// Quick check if constants didn't export some icons, we import them from lucide-react safely
import { Plus, ListFilter, Trash2, CheckCircle2, RotateCw } from 'lucide-react';

interface StudentViewProps {
  user: User;
  orders: Order[];
  menu: MenuItem[];
  onUpdateOrders: (orders: Order[]) => void;
  onLogout: () => void;
  onUpdateProfile: (profile: StudentProfile) => void;
}

type StudentTab = 'home' | 'orders' | 'history' | 'cart' | 'profile' | 'settings' | 'search';
type CheckoutStep = 'basket' | 'billing' | 'payment';

const CancellationTimer = ({ createdAt }: { createdAt: string }) => {
  const getRemaining = useCallback(() => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const diff = CANCEL_WINDOW_MS - (now - created);
    return Math.max(0, diff);
  }, [createdAt]);

  const [timeLeft, setTimeLeft] = useState(getRemaining());

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      const next = getRemaining();
      setTimeLeft(next);
      if (next <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [getRemaining, timeLeft]);

  if (timeLeft <= 0) return null;

  const mins = Math.floor(timeLeft / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full border border-red-100 animate-pulse">
      <Clock className="w-2.5 h-2.5" />
      <span className="text-[8px] font-black uppercase tracking-widest">Cancel: {mins}:{secs.toString().padStart(2, '0')}</span>
    </div>
  );
};

const StudentView: React.FC<StudentViewProps> = ({ user, orders, menu, onUpdateOrders, onLogout, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<StudentTab>('home');
  const [tabHistory, setTabHistory] = useState<StudentTab[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('basket');
  
  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>(() => {
    return (localStorage.getItem('hb_veg_preference') as any) || 'all';
  });
  const [maxPrice, setMaxPrice] = useState<number>(300);
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'price-high'>('recommended');
  const [showFilterBar, setShowFilterBar] = useState(false);

  // Modals & UI Controls State
  const [showPlacedPopup, setShowPlacedPopup] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MenuItem | null>(null);
  const [selectedMealQty, setSelectedMealQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<string>('razorpay'); // razorpay, upi, cod
  const [paymentRatio, setPaymentRatio] = useState<'half' | 'full'>('half'); // 50% vs 100% upfront
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Browser Notification API Hook
  const {
    notifications,
    permission,
    requestNotificationPermission,
    markAllAsRead,
    clearNotifications,
    markAsRead
  } = useOrderNotifications(orders, user.id);

  // UPI Payment State
  const [upiId, setUpiId] = useState('canteen@upi');
  const [payeeName, setPayeeName] = useState('TimeToMeal Canteen');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'submitted'>('pending');

  const studentProfile = user.profile as StudentProfile;
  const isProfileIncomplete = !studentProfile?.register_number || !studentProfile?.hostel_name;

  const myActiveOrders = useMemo(() => {
    return orders.filter(order => order.student_id === user.id && ['pending', 'preparing', 'ready'].includes(order.order_status));
  }, [orders, user.id]);

  const myPastOrders = useMemo(() => {
    return orders.filter(order => order.student_id === user.id && ['delivered', 'cancelled'].includes(order.order_status));
  }, [orders, user.id]);

  useEffect(() => {
    if (orders.length === 0) {
      const seedPastOrders: Order[] = [
        {
          id: 'past-1',
          student_id: user.id,
          canteen_id: 's1',
          total_amount: 85,
          paid_amount: 43,
          order_status: 'delivered',
          order_type: 'online',
          order_code: '5214',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          order_items: [
            { menu_item_id: 'm1', item_name: 'Masala Dosa', price: 45, quantity: 1 },
            { menu_item_id: 'm4', item_name: 'Cold Coffee', price: 40, quantity: 1 }
          ],
          student_details: studentProfile
        },
        {
          id: 'past-2',
          student_id: user.id,
          canteen_id: 's1',
          total_amount: 120,
          paid_amount: 0,
          order_status: 'delivered',
          order_type: 'online',
          order_code: '9420',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          order_items: [
            { menu_item_id: 'm2', item_name: 'Veg Thali', price: 85, quantity: 1 },
            { menu_item_id: 'm3', item_name: 'Vegetable Sandwich', price: 35, quantity: 1 }
          ],
          student_details: studentProfile
        },
        {
          id: 'past-3',
          student_id: user.id,
          canteen_id: 's1',
          total_amount: 40,
          paid_amount: 20,
          order_status: 'cancelled',
          order_type: 'online',
          order_code: '3104',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          order_items: [
            { menu_item_id: 'm4', item_name: 'Cold Coffee', price: 40, quantity: 1 }
          ],
          student_details: studentProfile
        }
      ];
      onUpdateOrders(seedPastOrders);
    }
  }, [orders.length, onUpdateOrders, user.id, studentProfile]);

  const handleReorder = (orderItems: OrderItem[]) => {
    let addedCount = 0;
    const unavailableItems: string[] = [];

    setCart(prev => {
      const newCart = [...prev];
      orderItems.forEach(item => {
        const menuItem = menu.find(m => m.id === item.menu_item_id);
        if (menuItem && menuItem.availability) {
          const existingIdx = newCart.findIndex(c => c.menu_item_id === item.menu_item_id);
          if (existingIdx > -1) {
            newCart[existingIdx].quantity += item.quantity;
          } else {
            newCart.push({
              menu_item_id: item.menu_item_id,
              item_name: item.item_name,
              price: item.price,
              quantity: item.quantity
            });
          }
          addedCount++;
        } else {
          unavailableItems.push(item.item_name);
        }
      });
      return newCart;
    });

    if (addedCount > 0) {
      alert(`Selected meals from past order have been added to your Cart!`);
      navigateTo('cart');
    }
    if (unavailableItems.length > 0) {
      alert(`Some items from this past order are currently unavailable: ${unavailableItems.join(', ')}`);
    }
  };

  const navigateTo = useCallback((tab: StudentTab) => {
    setIsSettingsOpen(false);
    if (tab === activeTab) return;
    setTabHistory(prev => [...prev, activeTab]);
    setActiveTab(tab);
    if (tab === 'cart') setCheckoutStep('basket');
  }, [activeTab]);

  const goBack = useCallback(() => {
    if (activeTab === 'cart' && checkoutStep !== 'basket') {
      if (checkoutStep === 'payment') setCheckoutStep('billing');
      else setCheckoutStep('basket');
      return;
    }
    if (tabHistory.length === 0) return;
    const previous = tabHistory[tabHistory.length - 1];
    setTabHistory(prev => prev.slice(0, -1));
    setActiveTab(previous);
  }, [tabHistory, activeTab, checkoutStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') goBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack]);

  const [profileForm, setProfileForm] = useState({
    full_name: studentProfile?.full_name || '',
    register_number: studentProfile?.register_number || '',
    hostel_name: studentProfile?.hostel_name || '',
    room_number: studentProfile?.room_number || '',
    phone_number: studentProfile?.phone_number || ''
  });

  const total = useMemo(() => cart.reduce((sum, i) => sum + (i.price * i.quantity), 0), [cart]);
  const upfront = paymentRatio === 'full' ? total : Math.round(total * 0.5);

  const handleConfirmCancelOrder = (orderId: string, reason: string) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          order_status: 'cancelled' as const,
          cancellation_reason: reason
        };
      }
      return o;
    });
    onUpdateOrders(updatedOrders);
  };

  const handleCameraPhotoCapture = (dataUrl: string) => {
    onUpdateProfile({
      ...studentProfile,
      photo_url: dataUrl
    });
  };

  const toggleCartItem = (item: MenuItem, qty = 1) => {
    setCart(prev => {
      const exists = prev.find(i => i.menu_item_id === item.id);
      if (exists) {
        // If already exists, we toggle/remove if no qty is passed or update quantity
        return prev.filter(i => i.menu_item_id !== item.id);
      }
      return [...prev, { menu_item_id: item.id, item_name: item.item_name, price: item.price, quantity: qty }];
    });
  };

  const updateCartQty = (menuItemId: string, change: number) => {
    setCart(prev => prev.map(item => {
      if (item.menu_item_id === menuItemId) {
        const nextQty = Math.max(1, item.quantity + change);
        return { ...item, quantity: nextQty };
      }
      return item;
    }));
  };

  const removeCartItem = (menuItemId: string) => {
    setCart(prev => prev.filter(item => item.menu_item_id !== menuItemId));
  };

  const handleRazorpayCheckout = () => {
    if (cart.length === 0) return;
    const canteenId = menu.length > 0 ? menu[0].canteen_id : 'canteen-1';
    const razorpayKey = 'rzp_test_TGS6KrgRk2UAJ0';
    const orderCode = Math.floor(1000 + Math.random() * 9000).toString();

    const processSuccessfulPayment = (paymentId: string) => {
      setTransactionRef(paymentId);
      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        student_id: user.id,
        canteen_id: canteenId,
        total_amount: total,
        paid_amount: upfront,
        order_status: 'pending',
        order_type: 'online',
        order_code: orderCode,
        created_at: new Date().toISOString(),
        order_items: [...cart],
        student_details: studentProfile,
        payments: [{
          order_id: '',
          payment_method: 'Razorpay',
          payment_status: 'completed',
          transaction_reference: paymentId,
          paid_amount: upfront
        }]
      };

      onUpdateOrders([newOrder, ...orders]);
      setShowPlacedPopup(true);
      setCart([]);
      setCheckoutStep('basket');
      navigateTo('orders');
    };

    if (typeof window !== 'undefined' && window.Razorpay) {
      try {
        const options = {
          key: razorpayKey,
          amount: Math.round(upfront * 100), // Upfront reservation in paise
          currency: 'INR',
          name: 'TimeToMeal Campus Canteen',
          description: `Meal Reservation Upfront Payment (Ref: #${orderCode})`,
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
          handler: function (response: any) {
            const paymentId = response.razorpay_payment_id || `pay_${Math.random().toString(36).substr(2, 9)}`;
            processSuccessfulPayment(paymentId);
          },
          prefill: {
            name: studentProfile?.full_name || 'Student User',
            email: user.email || 'student@campus.edu',
            contact: studentProfile?.phone_number || '9876543210'
          },
          notes: {
            student_id: user.id,
            register_number: studentProfile?.register_number || 'REG-USER',
            hostel: studentProfile?.hostel_name || 'Hostel',
            order_code: orderCode
          },
          theme: {
            color: '#059669' // Emerald theme
          },
          modal: {
            ondismiss: function() {
              console.log('Razorpay modal closed');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error('Razorpay invocation error:', err);
        const fallbackPaymentId = `pay_rzp_${Math.random().toString(36).substr(2, 9)}`;
        processSuccessfulPayment(fallbackPaymentId);
      }
    } else {
      const fallbackPaymentId = `pay_rzp_${Math.random().toString(36).substr(2, 9)}`;
      processSuccessfulPayment(fallbackPaymentId);
    }
  };

  const finalizeOrder = () => {
    if (paymentMethod === 'razorpay') {
      handleRazorpayCheckout();
      return;
    }

    const canteenId = menu.length > 0 ? menu[0].canteen_id : 'canteen-1';
    const tr = 'TM-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setTransactionRef(tr);
    
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      student_id: user.id,
      canteen_id: canteenId,
      total_amount: total,
      paid_amount: paymentMethod === 'cod' ? 0 : upfront,
      order_status: 'pending',
      order_type: 'online',
      order_code: Math.floor(1000 + Math.random() * 9000).toString(),
      created_at: new Date().toISOString(),
      order_items: [...cart],
      student_details: studentProfile,
    };
    onUpdateOrders([newOrder, ...orders]);
    
    if (paymentMethod === 'cod') {
      setShowPlacedPopup(true);
      setCart([]);
      navigateTo('orders');
    } else {
      setCheckoutStep('payment');
      setPaymentStatus('pending');
    }
  };

  const handleConfirmPayment = () => {
    setPaymentStatus('submitted');
    setShowPlacedPopup(true);
    setCart([]); // Clear cart upon successful submission
  };

  const handlePopupClose = () => {
    setShowPlacedPopup(false);
    navigateTo('orders');
  };

  const filteredMenu = useMemo(() => {
    return menu.filter(m => {
      const matchesSearch = m.item_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            m.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || m.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesDietary = dietaryFilter === 'all' || 
                             (dietaryFilter === 'veg' && m.is_veg !== false) ||
                             (dietaryFilter === 'non-veg' && m.is_veg === false);
      const matchesPrice = m.price <= maxPrice;
      return matchesSearch && matchesCategory && matchesDietary && matchesPrice;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return 0;
    });
  }, [menu, searchTerm, selectedCategory, dietaryFilter, maxPrice, sortBy]);

  const categories = useMemo(() => {
    const cats = new Set(menu.map(m => m.category));
    return ['all', ...Array.from(cats)];
  }, [menu]);

  // Handle detailed view action
  const handleOpenMealDetail = (item: MenuItem) => {
    setSelectedMeal(item);
    const existing = cart.find(c => c.menu_item_id === item.id);
    setSelectedMealQty(existing ? existing.quantity : 1);
  };

  const handleAddFromDetail = () => {
    if (!selectedMeal) return;
    setCart(prev => {
      const exists = prev.find(i => i.menu_item_id === selectedMeal.id);
      if (exists) {
        return prev.map(i => i.menu_item_id === selectedMeal.id ? { ...i, quantity: selectedMealQty } : i);
      }
      return [...prev, { menu_item_id: selectedMeal.id, item_name: selectedMeal.item_name, price: selectedMeal.price, quantity: selectedMealQty }];
    });
    setSelectedMeal(null);
  };

  // Slider Button for Slide to Confirm
  const SlideButton = ({ onConfirm }: { onConfirm: () => void }) => {
    const [sliderValue, setSliderValue] = useState(0);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    const updateSlider = (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.min(Math.max(0, (x / rect.width) * 100), 100);
      setSliderValue(percent);
      if (percent >= 90) {
        setIsConfirmed(true);
        setSliderValue(100);
        setTimeout(onConfirm, 500);
      }
    };

    return (
      <div 
        ref={sliderRef}
        className="relative h-16 bg-slate-900 rounded-3xl overflow-hidden flex items-center justify-center p-1.5 border border-white/10 select-none cursor-grab active:cursor-grabbing shadow-lg"
        onTouchMove={(e) => !isConfirmed && updateSlider(e.touches[0].clientX)}
        onMouseMove={(e) => !isConfirmed && e.buttons === 1 && updateSlider(e.clientX)}
        onMouseUp={() => !isConfirmed && setSliderValue(0)}
        onTouchEnd={() => !isConfirmed && setSliderValue(0)}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">
            {isConfirmed ? 'Order Accepted!' : 'Slide to Pay Upfront'}
          </span>
        </div>
        <div 
          className="absolute left-1.5 h-12 w-12 bg-yellow-400 text-slate-950 rounded-2xl shadow-md flex items-center justify-center transition-transform"
          style={{ transform: `translateX(${(sliderValue / 100) * (sliderRef.current?.offsetWidth ? sliderRef.current.offsetWidth - 68 : 0)}px)` }}
        >
          <ArrowRight className="w-5 h-5 font-black" />
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans transition-colors duration-300 ${activeTab === 'cart' ? 'h-screen h-[100dvh] overflow-hidden flex flex-col' : 'min-h-screen pb-32'}`}>
      {/* Upper header - Clean human-crafted layout */}
      <header className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex justify-between items-center z-40 transition-colors duration-300 shrink-0">
        <div className="flex items-center gap-3">
          {activeTab !== 'home' ? (
            <button 
              onClick={() => navigateTo('home')}
              className="flex items-center gap-1.5 text-slate-800 dark:text-white font-extrabold hover:text-emerald-600 transition-colors py-1.5 px-3.5 -ml-2 rounded-full bg-slate-100/90 dark:bg-slate-800/90"
              title="Go back to Home"
            >
              <ChevronLeft className="w-5 h-5 text-emerald-600 stroke-[3px]" />
              <span className="text-xs uppercase tracking-wider font-extrabold">Back to Home</span>
            </button>
          ) : (
            <div 
              onClick={() => navigateTo('profile')}
              className="cursor-pointer group flex items-center gap-2"
              title="Click to view profile"
            >
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-400 font-semibold flex items-center gap-1 leading-none">
                  Hello, Welcome! <span className="text-sm">👋</span>
                </p>
                <h2 className="text-base font-black text-slate-900 dark:text-white mt-1 tracking-tight group-hover:text-emerald-600 transition-colors">
                  {studentProfile?.full_name || 'Sanjay Kumar'}
                </h2>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {isProfileIncomplete && (
            <button 
              onClick={() => navigateTo('profile')}
              className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-200 dark:border-amber-800 animate-pulse hidden sm:block"
            >
              Complete Profile
            </button>
          )}

          {/* Circular Bell Button */}
          <div className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full shadow-sm flex items-center justify-center">
            <NotificationBell 
              notifications={notifications}
              permission={permission}
              onRequestPermission={requestNotificationPermission}
              onMarkAllAsRead={markAllAsRead}
              onClearNotifications={clearNotifications}
              onMarkAsRead={markAsRead}
            />
          </div>

          {/* Profile Icon Button */}
          <button 
            onClick={() => navigateTo('profile')}
            className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full flex items-center justify-center transition-colors border border-slate-100 dark:border-slate-800 shadow-sm"
            title="Student Profile"
          >
            <UserIcon className="w-4.5 h-4.5 text-slate-700 dark:text-slate-200" />
          </button>
        </div>
      </header>

      {/* Main Tab Renderers */}
      <main className="max-w-2xl mx-auto">
        {/* DEDICATED FULL SEARCH PAGE VIEW */}
        {activeTab === 'search' && (
          <div className="px-5 pt-3 space-y-4 animate-in fade-in duration-300 pb-24">
            {/* Integrated Search Bar with Right-Side Veg Switch Dropdown Pill */}
            <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-full border border-slate-200/90 dark:border-slate-800 shadow-sm px-4 py-2">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-2.5" />
              <input 
                type="text" 
                placeholder="Search pizza, sandwich, meals..." 
                className="w-full bg-transparent border-none outline-none font-semibold text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 py-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-slate-400 hover:text-slate-600 mr-1.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-1.5 shrink-0" />

              {/* Veg & Non-Veg Toggle Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const next = dietaryFilter === 'veg' ? 'all' : 'veg';
                    setDietaryFilter(next);
                    localStorage.setItem('hb_veg_preference', next);
                  }}
                  className={`px-2.5 py-1 rounded-full font-black text-[9px] tracking-tight uppercase transition-all shadow-xs flex items-center gap-1 ${
                    dietaryFilter === 'veg' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Filter Veg Items"
                >
                  🌱 VEG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = dietaryFilter === 'non-veg' ? 'all' : 'non-veg';
                    setDietaryFilter(next);
                    localStorage.setItem('hb_veg_preference', next);
                  }}
                  className={`px-2.5 py-1 rounded-full font-black text-[9px] tracking-tight uppercase transition-all shadow-xs flex items-center gap-1 ${
                    dietaryFilter === 'non-veg' 
                      ? 'bg-rose-600 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Filter Non-Veg Items"
                >
                  🍗 NON-VEG
                </button>
              </div>
            </div>

            {/* Quick Popular Searches Tags */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Popular Searches</span>
              <div className="flex flex-wrap gap-2">
                {['Pizza 🍕', 'Sandwich 🥪', 'Cold Coffee ☕', 'Veg Thali 🍱', 'Burger 🍔', 'Dosa 🥞', 'Fries 🍟'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearchTerm(tag.split(' ')[0])}
                    className="px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors shadow-sm"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Search Results */}
            <section className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                  {searchTerm ? `Search Results for "${searchTerm}"` : 'All Food Items'}
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{filteredMenu.length} items available</span>
              </div>

              {filteredMenu.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3">
                  <Utensils className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">No food items found matching "{searchTerm}"</p>
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="text-xs font-black text-emerald-600 hover:underline uppercase"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  {filteredMenu.map(item => {
                    const inCart = cart.find(i => i.menu_item_id === item.id);
                    const qty = inCart ? inCart.quantity : 0;
                    
                    const hostelName = item.canteen_id === 's2' ? 'Hostel Block B Mess' : 'Hostel Block A Canteen';
                    const isVeg = item.is_veg !== false;
                    const stockRemaining = item.stock_online || 15;

                    return (
                      <div 
                        key={item.id} 
                        onClick={() => handleOpenMealDetail(item)}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.75rem] p-3 shadow-xs hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between group"
                      >
                        <div>
                          {/* Image Box */}
                          <div className="w-full h-32 rounded-[1.25rem] overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                            <img 
                              src={item.imageUrl} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              referrerPolicy="no-referrer" 
                            />
                            {/* Veg / Non-veg Badge on Top-Left */}
                            <div className="absolute top-2 left-2 z-10">
                              {isVeg ? (
                                <span className="bg-emerald-600 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                                  🌱 VEG
                                </span>
                              ) : (
                                <span className="bg-rose-600 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                                  🍗 NON-VEG
                                </span>
                              )}
                            </div>
                            {/* Category Badge on Bottom-Left */}
                            <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-slate-200 text-[8px] font-extrabold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-slate-200/50 dark:border-slate-800">
                              🧁 {item.category.toLowerCase()}
                            </div>
                          </div>
                          
                          {/* Food Title */}
                          <h4 className="text-xs font-black text-slate-900 dark:text-white mt-2.5 line-clamp-1">{item.item_name}</h4>

                          {/* Location Pin & Hostel Name */}
                          <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-1">
                            <span className="text-rose-500">📍</span> {hostelName}
                          </p>
                          
                          {/* Status & Stock Badges */}
                          <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-extrabold">
                            <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100 dark:border-emerald-900">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                            <span className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-200/70 dark:border-amber-900/60 flex items-center gap-0.5">
                              🔥 {stockRemaining} left
                            </span>
                          </div>
                        </div>

                        {/* Price & Counter Stepper Row */}
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{item.price}</span>
                          
                          {qty > 0 ? (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-200 dark:border-emerald-800/80 rounded-full px-2 py-0.5 flex items-center justify-between gap-1.5 shadow-xs transition-all"
                            >
                              <button 
                                type="button"
                                onClick={() => updateCartQty(item.id, -1)}
                                className="w-5 h-5 rounded-full text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/80 flex items-center justify-center font-black text-xs active:scale-90 transition-all"
                                title="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="text-xs font-black text-emerald-900 dark:text-emerald-100 min-w-[14px] text-center">{qty}</span>
                              <button 
                                type="button"
                                onClick={() => updateCartQty(item.id, 1)}
                                className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xs hover:bg-emerald-700 shadow-xs active:scale-90 transition-all"
                                title="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCartItem(item, 1);
                              }}
                              className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/25 transition-all"
                              title="Add item to cart"
                            >
                              <Plus className="w-4 h-4 stroke-[3px]" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* HOME TAB VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-5 pt-3 animate-in fade-in duration-500">
            {/* Clean White Search Bar Container */}
            <div className="px-5">
              <div 
                onClick={() => navigateTo('search')}
                className="relative flex items-center bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-emerald-500 cursor-pointer"
              >
                <Search className="w-5 h-5 text-slate-400 shrink-0 mr-2.5" />
                <input 
                  type="text" 
                  placeholder="Search pizza, sandwich, meals..." 
                  className="w-full bg-transparent border-none outline-none font-semibold text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 py-1 cursor-pointer"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={() => navigateTo('search')}
                  onFocus={() => navigateTo('search')}
                  readOnly
                />

                <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-1.5 shrink-0" />

                {/* Veg & Non-Veg Toggle Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = dietaryFilter === 'veg' ? 'all' : 'veg';
                      setDietaryFilter(next);
                      localStorage.setItem('hb_veg_preference', next);
                    }}
                    className={`px-2.5 py-1 rounded-full font-black text-[9px] tracking-tight uppercase transition-all shadow-xs flex items-center gap-1 ${
                      dietaryFilter === 'veg' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    title="Filter Veg Items"
                  >
                    🌱 VEG
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = dietaryFilter === 'non-veg' ? 'all' : 'non-veg';
                      setDietaryFilter(next);
                      localStorage.setItem('hb_veg_preference', next);
                    }}
                    className={`px-2.5 py-1 rounded-full font-black text-[9px] tracking-tight uppercase transition-all shadow-xs flex items-center gap-1 ${
                      dietaryFilter === 'non-veg' 
                        ? 'bg-rose-600 text-white shadow-sm' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    title="Filter Non-Veg Items"
                  >
                    🍗 NON-VEG
                  </button>
                </div>
              </div>
            </div>

            {/* Top 40% Section: Categories & Preorder Banner */}
            <div className="space-y-4">
              {/* Categories Section - Exactly like Reference UI */}
              <section className="space-y-2.5">
                <div className="px-5 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Categories</h3>
                  <button 
                    onClick={() => navigateTo('search')}
                    className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    View all <ChevronRight className="w-3.5 h-3.5 stroke-[3px]" />
                  </button>
                </div>

                {/* Horizontal Category Cards */}
                <div className="flex gap-2.5 overflow-x-auto px-5 pb-1 no-scrollbar scroll-smooth">
                  {[
                    { cat: 'all', label: 'All', icon: <LayoutGrid className="w-4 h-4 text-emerald-600" /> },
                    { cat: 'Breakfast', label: 'Breakfast', icon: <Coffee className="w-4 h-4 text-amber-500" /> },
                    { cat: 'Lunch', label: 'Lunch', icon: <SunMedium className="w-4 h-4 text-amber-500" /> },
                    { cat: 'Snacks', label: 'Snacks', icon: <Utensils className="w-4 h-4 text-amber-500" /> }
                  ].map(item => {
                    const isSelected = selectedCategory === item.cat;
                    return (
                      <button
                        key={item.cat}
                        onClick={() => setSelectedCategory(item.cat)}
                        className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all shadow-xs ${
                          isSelected 
                            ? 'bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Campus Cafe Promo Banner - Compact Top 40% height */}
              <div className="px-5">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-3xl p-4 text-white relative overflow-hidden shadow-md shadow-emerald-500/15">
                  <div className="relative z-10 max-w-[70%]">
                    <span className="bg-[#FEF08A] text-slate-900 font-black text-[8px] px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
                      ☕ CAMPUS CAFE
                    </span>
                    <h3 className="text-base font-black tracking-tight mt-1.5 leading-tight text-white">Preorder Meals, Bypass Queue</h3>
                    <p className="text-[10px] text-emerald-100/90 font-medium mt-1 leading-snug">Instant digital reservation for Hostel blocks.</p>
                    
                    <button 
                      onClick={() => navigateTo('search')}
                      className="bg-white text-emerald-800 text-[10px] font-black px-3.5 py-1.5 rounded-full shadow-xs hover:bg-emerald-50 transition-all inline-flex items-center gap-1.5 mt-2.5 cursor-pointer"
                    >
                      <span>Preorder Now</span>
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <ArrowRight className="w-2.5 h-2.5 stroke-[3px]" />
                      </div>
                    </button>
                  </div>

                  {/* Right side illustration graphic */}
                  <div className="absolute -right-1 bottom-0 w-24 h-24 opacity-20 flex items-center justify-center">
                    <Utensils className="w-full h-full text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom 60% Section: Today's Selection Menu Grid */}
            <section className="px-5 space-y-3 pb-24 pt-1">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Today's Selection
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400">Available fresh at Hostel & Campus canteens</p>
                </div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900">
                  {filteredMenu.length} items available
                </span>
              </div>

              {filteredMenu.length === 0 ? (
                <div className="py-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3">
                  <Utensils className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">No matching items found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  {filteredMenu.map(item => {
                    const inCart = cart.find(i => i.menu_item_id === item.id);
                    const qty = inCart ? inCart.quantity : 0;
                    
                    // Hostel Block & Food Status Metadata
                    const hostelName = item.canteen_id === 's2' ? 'Hostel Block B Mess' : 'Hostel Block A Canteen';
                    const isVeg = item.is_veg !== false;
                    const stockRemaining = item.stock_online || 15;

                    return (
                      <div 
                        key={item.id} 
                        onClick={() => handleOpenMealDetail(item)}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.75rem] p-3 shadow-xs hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between group"
                      >
                        <div>
                          {/* Image Box */}
                          <div className="w-full h-32 rounded-[1.25rem] overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                            <img 
                              src={item.imageUrl} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              referrerPolicy="no-referrer" 
                            />
                            {/* Top Left Veg/Non-Veg Badge */}
                            <div className="absolute top-2 left-2 z-10">
                              {isVeg ? (
                                <span className="bg-emerald-600 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                                  🌱 VEG
                                </span>
                              ) : (
                                <span className="bg-rose-600 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                                  🍗 NON-VEG
                                </span>
                              )}
                            </div>
                            {/* Bottom Left Category Badge */}
                            <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-slate-200 text-[8px] font-extrabold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-slate-200/50 dark:border-slate-800">
                              🧁 {item.category.toLowerCase()}
                            </div>
                          </div>

                          {/* Food Title */}
                          <h4 className="text-xs font-black text-slate-900 dark:text-white mt-2.5 line-clamp-1">{item.item_name}</h4>

                          {/* Location Pin & Hostel Name */}
                          <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-1">
                            <span className="text-rose-500">📍</span> {hostelName}
                          </p>
                          
                          {/* Status & Stock Badges */}
                          <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-extrabold">
                            <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100 dark:border-emerald-900">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                            <span className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-200/70 dark:border-amber-900/60 flex items-center gap-0.5">
                              🔥 {stockRemaining} left
                            </span>
                          </div>
                        </div>

                        {/* Price & Counter Stepper Row */}
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{item.price}</span>

                          {qty > 0 ? (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-200 dark:border-emerald-800/80 rounded-full px-2 py-0.5 flex items-center justify-between gap-1.5 shadow-xs transition-all"
                            >
                              <button 
                                type="button"
                                onClick={() => updateCartQty(item.id, -1)}
                                className="w-5 h-5 rounded-full text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/80 flex items-center justify-center font-black text-xs active:scale-90 transition-all"
                                title="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="text-xs font-black text-emerald-900 dark:text-emerald-100 min-w-[14px] text-center">{qty}</span>
                              <button 
                                type="button"
                                onClick={() => updateCartQty(item.id, 1)}
                                className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xs hover:bg-emerald-700 shadow-xs active:scale-90 transition-all"
                                title="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCartItem(item, 1);
                              }}
                              className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/25 transition-all"
                              title="Add item to cart"
                            >
                              <Plus className="w-4 h-4 stroke-[3px]" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ACTIVE TICKETS VIEW */}
        {activeTab === 'orders' && (
          <div className="px-6 pt-4 space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-950 dark:text-white tracking-tight">Active Tickets</h3>
                <p className="text-[9px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Live order progress</p>
              </div>
              <Bell className="w-5 h-5 text-gray-400 animate-bounce" />
            </div>

            {myActiveOrders.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">No Active Orders</p>
                  <p className="text-[9px] font-bold text-gray-300 dark:text-slate-500 uppercase tracking-widest mt-1">Choose some fresh meals and submit!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {myActiveOrders.map(order => (
                  <div key={order.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-100 dark:hover:border-emerald-900 transition-all overflow-hidden p-5">
                    {/* Header bar of ticket */}
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <p className="text-[8px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Token ID</p>
                        <h4 className="font-black text-2xl text-gray-950 dark:text-white tracking-tighter mt-1">#{order.order_code}</h4>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                          order.order_status === 'ready' ? 'bg-emerald-600 text-white animate-pulse' : 
                          order.order_status === 'preparing' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>{order.order_status}</span>
                        <CancellationTimer createdAt={order.created_at} />
                      </div>
                    </div>

                    {/* Progress visual tracker pipeline */}
                    <OrderPipelineStepper 
                      order={order}
                      onCancelOrder={(orderId) => setCancellingOrderId(orderId)}
                      onPrintReceipt={(ord) => setSelectedReceiptOrder(ord)}
                    />

                    {/* Meal details list inside ticket */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/70 p-4 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-700">
                      {order.order_items?.map((i, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
                          <span>{i.quantity}x {i.item_name}</span>
                          <span className="text-gray-900 dark:text-white font-black">₹{i.price * i.quantity}</span>
                        </div>
                      ))}
                      <div className="h-px bg-slate-200/50 dark:bg-slate-700 my-2" />
                      <div className="flex justify-between items-center pt-1 text-slate-900 dark:text-white">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">Total Bill</span>
                        <span className="font-black text-lg">₹{order.total_amount}</span>
                      </div>
                    </div>

                    {/* Action controls footer: Print Receipt & Cancel Order */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 uppercase tracking-widest text-[9px]"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /> Receipt
                      </button>

                      {['pending', 'preparing'].includes(order.order_status) && (
                        <button
                          onClick={() => setCancellingOrderId(order.id)}
                          className="bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 font-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 uppercase tracking-widest text-[9px]"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDER HISTORY VIEW */}
        {activeTab === 'history' && (
          <div className="px-6 pt-4 space-y-6 animate-in slide-in-from-right-4 duration-500 pb-12">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-950 dark:text-white tracking-tight">Order History</h3>
                <p className="text-[9px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Your past meals & records</p>
              </div>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>

            {myPastOrders.length === 0 ? (
              <div className="py-20 text-center bg-white border border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Past Orders</p>
                  <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-1">When you complete order sessions, they appear here!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-12">
                {myPastOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-4 hover:border-emerald-100 transition-all overflow-hidden">
                    {/* Header: order code & status */}
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Order Token</p>
                        <h4 className="font-black text-lg text-gray-950 mt-0.5">#{order.order_code}</h4>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border ${
                          order.order_status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {order.order_status}
                        </span>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Meal details list inside card */}
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                      {order.order_items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-bold text-gray-700">
                          <span>{item.quantity}x {item.item_name}</span>
                          <span className="text-gray-900 font-black">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                      <div className="h-px bg-slate-200/50 my-2" />
                      <div className="flex justify-between items-center pt-1 text-slate-900">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Bill</span>
                        <span className="font-black text-sm">₹{order.total_amount}</span>
                      </div>
                    </div>

                    {/* Action Buttons: Print Receipt & Reorder */}
                    <div className="flex justify-between items-center pt-1 gap-2">
                      <button
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-black px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-widest text-[9px]"
                      >
                        <Printer className="w-3.5 h-3.5" /> Receipt
                      </button>

                      <button
                        onClick={() => handleReorder(order.order_items || [])}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-3 rounded-xl shadow-md shadow-emerald-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[9px]"
                      >
                        <RotateCw className="w-3.5 h-3.5" /> Repeat Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BASKET / CHECKOUT WIZARD VIEW */}
        {activeTab === 'cart' && (
          <div className="flex-1 flex flex-col min-h-0 px-6 pt-4 max-w-2xl mx-auto w-full animate-in duration-500 overflow-hidden">
            {checkoutStep === 'basket' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3 animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-end shrink-0 pb-1">
                  <div>
                    <h3 className="text-xl font-black text-gray-950 dark:text-white tracking-tight">Your Cart</h3>
                    <p className="text-[9px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Review selected meals</p>
                  </div>
                  {cart.length > 0 && (
                    <button 
                      onClick={() => setCart([])}
                      className="text-[9px] font-black uppercase text-red-500 hover:text-red-700 tracking-widest flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear All
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[2.5rem] p-6 gap-4 my-auto">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Your Cart is Empty</p>
                      <p className="text-[9px] font-bold text-gray-300 dark:text-slate-500 uppercase tracking-widest mt-1">Select some hot meals to start booking.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('home')}
                      className="mt-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-95"
                    >
                      <PlusIcon className="w-4 h-4 stroke-[3px]" /> Add Food Items
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Fixed Order Items Header */}
                    <div className="flex justify-between items-center shrink-0 py-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Items</p>
                      <button 
                        onClick={() => setActiveTab('home')}
                        className="px-4 py-2 bg-amber-100/80 hover:bg-amber-200 text-amber-900 border border-amber-300/80 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                      >
                        <PlusIcon className="w-3.5 h-3.5 stroke-[3px]" /> Add More Items
                      </button>
                    </div>

                    {/* Vertically Scrollable Order Items & Verification Policy Section */}
                    <div className="flex-1 overflow-y-auto min-h-0 scroll-smooth space-y-3 pr-1 pb-2">
                      {/* Cart Items List */}
                      <div className="space-y-3">
                        {cart.map(item => {
                          const menuItem = menu.find(m => m.id === item.menu_item_id);
                          return (
                            <div key={item.menu_item_id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 justify-between group">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="w-14 h-14 bg-gray-50 dark:bg-slate-800 rounded-2xl overflow-hidden shrink-0 border border-gray-100 dark:border-slate-800">
                                  <img src={menuItem?.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-black text-slate-900 dark:text-white text-xs truncate leading-snug">{item.item_name}</h4>
                                  <p className="text-emerald-600 dark:text-emerald-400 font-black text-sm mt-0.5">₹{item.price}</p>
                                </div>
                              </div>

                              {/* Quantity buttons */}
                              <div className="flex items-center gap-3">
                                <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-1">
                                  <button 
                                    onClick={() => updateCartQty(item.menu_item_id, -1)}
                                    className="w-7 h-7 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-90 shadow-sm"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="px-3 text-xs font-black text-slate-900 dark:text-white">{item.quantity}</span>
                                  <button 
                                    onClick={() => updateCartQty(item.menu_item_id, 1)}
                                    className="w-7 h-7 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-90 shadow-sm"
                                  >
                                    <PlusIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <button 
                                  onClick={() => removeCartItem(item.menu_item_id)}
                                  className="w-9 h-9 text-slate-300 dark:text-slate-600 hover:text-red-500 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Verification policy card */}
                      <div className="bg-amber-50 dark:bg-amber-950/40 p-5 rounded-3xl border border-amber-100/50 dark:border-amber-900/40 flex gap-3.5">
                        <div className="w-9 h-9 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                          <Info className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest">Verification policy</p>
                          <p className="text-[10px] font-bold text-amber-950 dark:text-amber-200 leading-relaxed mt-0.5">
                            Payments require manual counter verification. You will be asked to slide to authorize half-amount up-front.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fixed Bottom Section (Cost Summary & Checkout Button) */}
                    <div className="shrink-0 pt-2 pb-20 sm:pb-24 space-y-3 bg-[#F8FAF9] dark:bg-slate-950">
                      {/* Cost summary card */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Basket Items Total</span>
                            <span className="font-black text-gray-950 dark:text-white text-sm">₹{total}</span>
                         </div>
                         <div className="h-px bg-gray-50 dark:bg-slate-800" />
                         <div className="flex justify-between items-center">
                            <span className="text-sm font-black text-gray-950 dark:text-white tracking-tight">Total Payable</span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">₹{total}</span>
                         </div>
                      </div>

                      <button 
                        onClick={() => setCheckoutStep('billing')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        To Billing & Details <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {checkoutStep === 'billing' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-in slide-in-from-right-4 overflow-y-auto pb-24 pr-1">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCheckoutStep('basket')} className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-slate-500 shadow-sm">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Checkout Stage</p>
                    <h4 className="text-sm font-black text-slate-900 tracking-tight">Billing & Payment</h4>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Payment Method Selector Cards */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Payment Method</p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {[
                        { 
                          id: 'razorpay', 
                          name: 'Razorpay Payment Gateway (Test Mode)', 
                          desc: 'Instant Cards, UPI, Netbanking & Wallets (Test Key: rzp_test_TGS6KrgRk2UAJ0)', 
                          icon: <CreditCard className="w-5 h-5" />,
                          badge: 'TEST KEY ACTIVE'
                        },
                        { 
                          id: 'upi', 
                          name: 'Manual UPI QR Code Scan', 
                          desc: 'Prepay 50% upfront via GPay / PhonePe QR scan', 
                          icon: <QrCode className="w-5 h-5" /> 
                        },
                        { 
                          id: 'cod', 
                          name: 'Pay Cash at Counter (Full Amount)', 
                          desc: 'Pay entire bill physically upon collection', 
                          icon: <Utensils className="w-5 h-5" /> 
                        }
                      ].map(method => (
                        <div 
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            paymentMethod === method.id 
                              ? 'bg-emerald-50/60 border-emerald-600 shadow-sm' 
                              : 'bg-white border-gray-100 hover:bg-gray-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`p-2.5 rounded-xl ${paymentMethod === method.id ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                              {method.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-slate-900 leading-tight">{method.name}</p>
                                {method.badge && (
                                  <span className="text-[7px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    {method.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-tight">{method.desc}</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            paymentMethod === method.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-200'
                          }`}>
                            {paymentMethod === method.id && <Check className="w-3 h-3 stroke-[3px]" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Deposit Amount Selector (Full vs Half Amount) */}
                  {paymentMethod !== 'cod' && (
                    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Upfront Payment Ratio</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentRatio('half')}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            paymentRatio === 'half'
                              ? 'bg-emerald-50 border-emerald-600 shadow-sm'
                              : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-900">50% Reservation</span>
                            {paymentRatio === 'half' && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3px]" />}
                          </div>
                          <p className="text-sm font-black text-emerald-600 mt-1">₹{Math.round(total * 0.5)}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Pay balance at counter</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentRatio('full')}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            paymentRatio === 'full'
                              ? 'bg-emerald-50 border-emerald-600 shadow-sm'
                              : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-900">100% Full Payment</span>
                            {paymentRatio === 'full' && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3px]" />}
                          </div>
                          <p className="text-sm font-black text-emerald-600 mt-1">₹{total}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Zero counter hassle</p>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pricing Overview */}
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Summary</h4>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{cart.length} Meals Selected</span>
                    </div>
                    <div className="space-y-2.5">
                      {cart.map(item => (
                        <div key={item.menu_item_id} className="flex justify-between items-center text-xs font-bold text-slate-700">
                           <span>{item.quantity}x {item.item_name}</span>
                           <span className="text-slate-900 font-black">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-gray-50" />
                    
                    {paymentMethod !== 'cod' ? (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Order Value</span>
                           <span className="font-black text-slate-900 text-sm">₹{total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">
                             {paymentRatio === 'full' ? 'Full Prepayment (100%)' : 'Upfront Deposit (50%)'}
                           </span>
                           <span className="text-xl font-black text-emerald-600 tracking-tighter">₹{upfront}</span>
                        </div>
                        {paymentRatio === 'half' && (
                          <div className="flex justify-between items-center text-slate-400 text-[9px] font-bold">
                            <span>Balance Due at Counter</span>
                            <span>₹{total - upfront}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center pt-2">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Counter Bill (Pay on Delivery)</span>
                         <span className="text-xl font-black text-emerald-600 tracking-tighter">₹{total}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6">
                  {paymentMethod === 'razorpay' ? (
                    <button
                      onClick={handleRazorpayCheckout}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-200/50 flex items-center justify-center gap-3 transition-all active:scale-[0.98] uppercase tracking-[0.15em] text-xs"
                    >
                      <CreditCard className="w-5 h-5" /> Pay ₹{upfront} via Razorpay Gateway
                    </button>
                  ) : paymentMethod === 'cod' ? (
                    <button
                      onClick={finalizeOrder}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-200/50 flex items-center justify-center gap-3 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
                    >
                      Place Counter Order <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <SlideButton onConfirm={finalizeOrder} />
                  )}
                </div>
              </div>
            )}

            {checkoutStep === 'payment' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 bg-slate-950 -mx-6 -mt-4 p-6 min-h-screen text-white rounded-t-[2.5rem] overflow-x-hidden">
                <div className="flex items-center justify-between mb-6">
                   <button onClick={() => setCheckoutStep('billing')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <ChevronLeft className="w-5 h-5 text-white" />
                   </button>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Payment</p>
                      <h4 className="text-sm font-black tracking-tight text-white">Secure UPI Gate</h4>
                   </div>
                </div>

                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4 backdrop-blur-xl">
                   <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Reference ID</p>
                        <p className="text-xs font-black text-white font-mono truncate">{transactionRef}</p>
                      </div>
                      <div className="p-2.5 bg-emerald-500/20 text-emerald-500 rounded-xl shrink-0">
                         <ShieldCheck className="w-5 h-5" />
                      </div>
                   </div>

                   <div className="space-y-2 pt-3 border-t border-white/5">
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Upfront Amount Required</span>
                        <span className="font-black text-white">₹{upfront}</span>
                      </div>
                   </div>
                </div>

                {paymentStatus === 'pending' ? (
                  <>
                    <div className="space-y-6">
                       <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-[2rem]">
                          <img 
                             src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${payeeName}&am=${upfront}&cu=INR&tr=${transactionRef}`)}`} 
                             className="w-40 h-40"
                             alt="Payment QR"
                             referrerPolicy="no-referrer"
                          />
                          <div className="text-center">
                             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Scan to Prepay ₹{upfront}</p>
                             <div className="flex items-center gap-1.5 justify-center">
                                <span className="font-black text-gray-900 text-xs">{upiId}</span>
                                <button 
                                  onClick={() => navigator.clipboard.writeText(upiId)} 
                                  className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          </div>
                       </div>

                       <div className="flex flex-col gap-3">
                          <button 
                            onClick={handleRazorpayCheckout} 
                            className="flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                          >
                             <CreditCard className="w-4 h-4" /> Pay via Razorpay Gateway (Cards/UPI)
                          </button>
                          <a href={`upi://pay?pa=${upiId}&pn=${payeeName}&am=${upfront}&cu=INR&tr=${transactionRef}`} className="flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-white/10 transition-all">
                             <Smartphone className="w-4 h-4" /> Open Installed UPI App
                          </a>
                          <button onClick={handleConfirmPayment} className="flex items-center justify-center gap-2 py-3.5 bg-white/10 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-white/15 transition-all">
                             Confirm Manual Payment
                          </button>
                       </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95">
                     <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/30">
                        <CheckCircle className="w-8 h-8" />
                     </div>
                     <div className="space-y-2">
                        <h4 className="text-2xl font-black tracking-tight text-white">Submitted!</h4>
                        <p className="text-xs text-gray-400 font-bold leading-relaxed max-w-[180px] mx-auto">Manual verification pending. Check Status in Tickets.</p>
                     </div>
                     <button onClick={() => navigateTo('orders')} className="w-full py-4 bg-white text-gray-950 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                        View Active Tickets
                     </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PROFILE SCREEN VIEW */}
        {activeTab === 'profile' && (
          <div className="px-6 pt-4 space-y-6 animate-in fade-in duration-500 pb-12">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-600 rounded-[1.8rem] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-emerald-200/50 mb-4">
                  {studentProfile?.full_name?.[0] || 'U'}
                </div>
                <h3 className="text-lg font-black text-gray-950 tracking-tight leading-none">{studentProfile?.full_name}</h3>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-2 bg-emerald-50 px-3 py-1 rounded-full">{studentProfile?.register_number || 'REG-USER'}</p>
             </div>

             {/* Personal Details Profile Form */}
             <section className="space-y-3">
                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">My Information</h4>
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                   <div className="space-y-3">
                     <div>
                       <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Full Legal Name</label>
                       <input 
                         type="text" 
                         className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                         value={profileForm.full_name}
                         onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                       />
                     </div>
                     <div>
                       <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Campus Registration ID / Roll No.</label>
                       <input 
                         type="text" 
                         className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                         value={profileForm.register_number}
                         onChange={(e) => setProfileForm({ ...profileForm, register_number: e.target.value })}
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-3.5">
                       <div>
                         <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Hostel Block</label>
                         <input 
                           type="text" 
                           className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                           value={profileForm.hostel_name}
                           onChange={(e) => setProfileForm({ ...profileForm, hostel_name: e.target.value })}
                         />
                       </div>
                       <div>
                         <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Room No.</label>
                         <input 
                           type="text" 
                           className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                           value={profileForm.room_number}
                           onChange={(e) => setProfileForm({ ...profileForm, room_number: e.target.value })}
                         />
                       </div>
                     </div>
                     <div>
                       <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Phone Number</label>
                       <input 
                         type="text" 
                         className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                         value={profileForm.phone_number}
                         onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                       />
                     </div>
                   </div>

                   <button 
                     onClick={() => {
                       onUpdateProfile({
                         student_id: studentProfile?.student_id || 'S-' + Date.now().toString().slice(-6),
                         full_name: profileForm.full_name,
                         register_number: profileForm.register_number,
                         hostel_name: profileForm.hostel_name,
                         room_number: profileForm.room_number,
                         phone_number: profileForm.phone_number
                       });
                       alert('Profile updated successfully!');
                     }}
                     className="w-full py-3.5 bg-slate-900 text-white hover:bg-slate-800 text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all"
                   >
                     Update Profile Info
                   </button>
                </div>
             </section>

             {/* Flutter App & Account Settings Entry Tile */}
             <button 
               onClick={() => setIsSettingsOpen(true)}
               className="w-full p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-[2rem] shadow-lg shadow-emerald-500/20 flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99]"
             >
               <div className="flex items-center gap-3.5">
                 <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white">
                   <Settings className="w-5 h-5" />
                 </div>
                 <div className="text-left">
                   <p className="text-sm font-black tracking-tight">App & Account Settings</p>
                   <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Veg Mode, Theme, Payment Methods & Notifications</p>
                 </div>
               </div>
               <ArrowRight className="w-5 h-5 text-white" />
             </button>

             {/* Logout button */}
             <button 
               onClick={onLogout}
               className="w-full py-4 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-black rounded-2xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
             >
               <LogOut className="w-4 h-4" /> End Security Session
             </button>
          </div>
        )}
      </main>

      {/* Floating Detailed View Overlay Modal - Recreates the pizza details design screen in the reference! */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-300">
          <div 
            className="w-full max-w-lg bg-white rounded-t-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-12 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header image box */}
            <div className="h-64 relative bg-gray-100">
              <img src={selectedMeal.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <button 
                onClick={() => setSelectedMeal(null)}
                className="absolute top-5 right-5 w-10 h-10 bg-black/45 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-950 shadow-sm flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-400" /> 4.9 (180+ reviews)
              </div>
            </div>

            {/* Details info */}
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedMeal.item_name}</h3>
                    {selectedMeal.is_veg === false ? (
                      <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">Non-Veg</span>
                    ) : (
                      <span className="bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">Veg</span>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Available Fresh • Block A</p>
                </div>
                <p className="text-2xl font-black text-slate-950 leading-none">₹{selectedMeal.price}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</h4>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  {selectedMeal.description || 'Preorder this chef-made campus specialty! Prepared with fresh premium ingredients on location in our hygiene-certified canteen stalls.'}
                </p>
              </div>

              {/* Prep stats indicators */}
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-600 shadow-sm">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Prep Time</p>
                    <p className="text-[11px] font-black text-slate-900 mt-1">15 mins</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-600 shadow-sm">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Category</p>
                    <p className="text-[11px] font-black text-slate-900 mt-1 capitalize">{selectedMeal.category}</p>
                  </div>
                </div>
              </div>

              {/* Quantity Picker & Confirm Add */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                <div className="flex items-center bg-slate-100 rounded-2xl border border-slate-200/50 p-1.5">
                  <button 
                    onClick={() => setSelectedMealQty(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 bg-white text-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-50 active:scale-90 shadow-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-5 font-black text-sm text-slate-950">{selectedMealQty}</span>
                  <button 
                    onClick={() => setSelectedMealQty(prev => prev + 1)}
                    className="w-10 h-10 bg-white text-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-50 active:scale-90 shadow-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddFromDetail}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-200/50 uppercase tracking-[0.2em] text-[10px] active:scale-[0.98] transition-all"
                >
                  Confirm & Add (₹{selectedMeal.price * selectedMealQty})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zomato-style Floating Bottom Cart Bar */}
      {cart.length > 0 && activeTab === 'home' && (
        <div className="fixed bottom-[4.5rem] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl bg-slate-900 text-white rounded-3xl p-3 shadow-2xl z-40 flex items-center justify-between animate-in slide-in-from-bottom-5 border border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black flex items-center justify-center text-xs">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'Item' : 'Items'} Added
              </span>
              <span className="text-sm font-black text-white tracking-tight">₹{total}</span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('cart')}
            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black px-6 py-3 rounded-2xl text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            Confirm Order <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Bottom Navigation Bar - Displayed on all tabs including Settings */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[92%] max-w-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-full py-2 px-3 shadow-xl flex items-center justify-around z-[60] transition-colors duration-300">
        {[
          { tab: 'home', icon: <Home className="w-5 h-5" />, label: 'Home' },
          { tab: 'orders', icon: <Utensils className="w-5 h-5" />, label: 'Order' },
          { tab: 'cart', icon: <ShoppingCart className="w-5 h-5" />, label: 'Cart' },
          { tab: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' }
        ].map((item) => {
          const isActive = activeTab === item.tab || (item.tab === 'settings' && isSettingsOpen);
          const totalCartItems = cart.reduce((sum, i) => sum + i.quantity, 0);

          if (isActive) {
            return (
              <button
                key={item.tab}
                onClick={() => navigateTo(item.tab as StudentTab)}
                className="bg-emerald-100/90 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 font-extrabold px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-sm"
              >
                <div className="relative">
                  {item.icon}
                  {item.tab === 'cart' && totalCartItems > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {totalCartItems}
                    </span>
                  )}
                </div>
                <span className="text-xs font-black capitalize tracking-tight">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.tab}
              onClick={() => navigateTo(item.tab as StudentTab)}
              className="flex flex-col items-center justify-center gap-0.5 relative py-1 px-3 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <div className="relative">
                {item.icon}
                {item.tab === 'cart' && totalCartItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {totalCartItems}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold tracking-tight capitalize mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Popups and Modals */}
      {showPlacedPopup && (
        <OrderPlacedPopup 
          onClose={handlePopupClose} 
          orderCode={orders[0]?.order_code || '9999'} 
        />
      )}

      {/* Profile Camera Photo Capture Modal */}
      <CameraCaptureModal 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraPhotoCapture}
      />

      {/* App Settings Modal (Full Screen Page) */}
      <SettingsModal 
        isOpen={isSettingsOpen || activeTab === 'settings'}
        onClose={() => {
          setIsSettingsOpen(false);
          if (activeTab === 'settings') {
            setActiveTab('home');
          }
        }}
        user={user}
        menu={menu}
        onOpenCamera={() => setIsCameraOpen(true)}
        permission={permission}
        onRequestPermission={requestNotificationPermission}
        studentProfile={studentProfile}
        onUpdateProfile={onUpdateProfile}
        onLogout={onLogout}
        onNavigateToTab={(tab) => setActiveTab(tab as StudentTab)}
        vegPreference={dietaryFilter}
        onUpdateVegPreference={(pref) => setDietaryFilter(pref)}
      />

      {/* Printable Receipt Modal */}
      <StudentReceiptModal 
        order={selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />

      {/* Cancel Order Confirmation Modal */}
      <CancelOrderModal 
        isOpen={!!cancellingOrderId}
        order={orders.find(o => o.id === cancellingOrderId) || null}
        onClose={() => setCancellingOrderId(null)}
        onConfirmCancel={handleConfirmCancelOrder}
      />
    </div>
  );
};

export default StudentView;
