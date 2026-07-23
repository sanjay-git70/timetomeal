
import React, { useState, useMemo } from 'react';
import { MenuItem, Order, OrderItem, User as AppUser, CanteenProfile, PaymentMethod } from '../types';
import { Search, Plus, Minus, X, QrCode, CreditCard, Banknote, Printer, ChevronLeft, ShoppingCart, CheckCircle2, ChevronDown, IndianRupee } from 'lucide-react';

interface WalkInOrderViewProps {
  user: AppUser;
  menu: MenuItem[];
  onBack: () => void;
  onPlaceOrder: (order: Order) => void;
}

type WalkInPaymentMode = 'full-online' | 'half-split' | 'full-cash';

const WalkInOrderView: React.FC<WalkInOrderViewProps> = ({ user, menu, onBack, onPlaceOrder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState<Order | null>(null);
  const [paymentMode, setPaymentMode] = useState<WalkInPaymentMode>('full-online');
  const [cashAmountInput, setCashAmountInput] = useState<string>('');

  const canteenProfile = user.profile as CanteenProfile;

  const filteredMenu = useMemo(() => {
    return menu.filter(item => 
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [menu, searchTerm]);

  const addToCart = (item: MenuItem) => {
    if (!item.availability || item.stock_offline <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(i => i.menu_item_id === item.id);
      if (existing) {
        return prev.map(i => i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        menu_item_id: item.id,
        item_name: item.item_name,
        price: item.price,
        quantity: 1
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.menu_item_id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% GST mock
  const total = subtotal + tax;

  const cashAmount = parseFloat(cashAmountInput) || 0;
  const clampedCashAmount = Math.min(cashAmount, total);
  const onlineAmount = total - (paymentMode === 'half-split' ? clampedCashAmount : (paymentMode === 'full-cash' ? total : 0));

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const payments = [];
    if (paymentMode === 'half-split') {
        payments.push({
            order_id: '',
            payment_method: 'cash' as PaymentMethod,
            payment_status: 'completed' as const,
            paid_amount: clampedCashAmount
        });
        if (onlineAmount > 0) {
            payments.push({
                order_id: '',
                payment_method: 'UPI' as PaymentMethod,
                payment_status: 'completed' as const,
                paid_amount: onlineAmount
            });
        }
    } else {
        payments.push({
            order_id: '',
            payment_method: paymentMode === 'full-cash' ? 'cash' as PaymentMethod : 'UPI' as PaymentMethod,
            payment_status: 'completed' as const,
            paid_amount: total
        });
    }

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      student_id: null,
      canteen_id: canteenProfile.canteen_id || 'c1',
      total_amount: total,
      paid_amount: total, // Full payment assumed at counter
      order_status: 'delivered',
      order_type: 'walk-in',
      order_code: `W-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
      order_items: [...cart],
      payments: payments,
      canteen_details: canteenProfile
    };

    onPlaceOrder(newOrder);
    setOrderComplete(newOrder);
    setIsProcessing(false);
  };

  if (orderComplete) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 border border-gray-100 shadow-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2 text-center leading-tight">Order Success</h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-8">Ticket #{orderComplete.order_code}</p>
          
          <div className="w-full bg-gray-50 rounded-3xl p-6 mb-8 border border-dashed border-gray-200">
            <div className="space-y-3">
              {orderComplete.order_items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm font-bold">
                  <span className="text-gray-600">{item.quantity}x {item.item_name}</span>
                  <span className="text-gray-900">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 flex flex-col gap-1">
                <div className="flex justify-between font-black text-lg">
                    <span>Total</span>
                    <span className="text-emerald-600">₹{orderComplete.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">
                    <span>Mode</span>
                    <span>{paymentMode.replace('-', ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={() => {
                setOrderComplete(null);
                setCart([]);
                setCashAmountInput('');
                setPaymentMode('full-online');
              }}
              className="w-full py-4 bg-gray-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Next Order
            </button>
            <button 
              onClick={onBack}
              className="w-full py-4 bg-white text-gray-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:text-gray-900 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[85vh] animate-in fade-in duration-500">
      {/* Items Section */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-4 bg-white p-3 rounded-[2rem] border border-gray-100 shadow-sm">
          <button onClick={onBack} className="p-2.5 bg-gray-50 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search items..." 
              className="w-full pl-11 pr-6 py-2.5 bg-gray-50 rounded-xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredMenu.map(item => {
            const isOutOfStock = !item.availability || item.stock_offline <= 0;
            return (
              <button 
                key={item.id}
                onClick={() => addToCart(item)}
                disabled={isOutOfStock}
                className={`bg-white p-3 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-start transition-all hover:border-emerald-200 group text-left ${isOutOfStock ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-95'}`}
              >
                <div className="w-full aspect-square bg-gray-100 rounded-[1.5rem] overflow-hidden mb-3 shadow-inner relative">
                  <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={item.item_name} />
                  {item.is_veg === false ? (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">Non-Veg</span>
                  ) : (
                    <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">Veg</span>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="w-full">
                  <h4 className="font-black text-gray-950 truncate text-sm">{item.item_name}</h4>
                  <div className="flex justify-between items-end mt-1">
                    <p className="text-emerald-600 font-black text-base">₹{item.price}</p>
                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{item.stock_offline} Pcs</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Counter Bill Section */}
      <div className="w-full lg:w-[350px] shrink-0">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col h-full sticky top-4">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-950">Counter Bill</h3>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Quick Billing Flow</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>

          {/* Cart List - Tighter Spacing */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[35vh] custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 opacity-20 font-black text-[10px] uppercase tracking-widest gap-3">
                <Plus className="w-10 h-10" />
                Select items to bill
              </div>
            ) : (
              cart.map(item => (
                <div key={item.menu_item_id} className="flex items-center gap-3 group animate-in slide-in-from-right-2">
                   <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm bg-gray-50 flex-shrink-0">
                      <img 
                        src={menu.find(m => m.id === item.menu_item_id)?.imageUrl} 
                        className="w-full h-full object-cover" 
                      />
                   </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-gray-900 text-[12px] truncate leading-tight">{item.item_name}</h5>
                    <p className="text-[10px] font-black text-emerald-600">₹{item.price * item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                    <button 
                      onClick={() => updateQuantity(item.menu_item_id, -1)}
                      className="w-6 h-6 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-black text-[10px] min-w-[1rem] text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.menu_item_id, 1)}
                      className="w-6 h-6 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-400 hover:text-emerald-500 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100">
            {/* Totals Summary */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Tax (5% GST)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-gray-200/50">
                <span className="text-[11px] font-black text-gray-950 uppercase tracking-widest">Grand Total</span>
                <span className="text-2xl font-black text-gray-950">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Dropdown */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Payment Mode</label>
                <div className="relative group">
                    <select 
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value as WalkInPaymentMode)}
                        className="w-full bg-white px-4 py-3 rounded-2xl outline-none font-bold text-xs border border-gray-200 focus:border-emerald-500 appearance-none transition-all shadow-sm cursor-pointer"
                    >
                        <option value="full-online">Full Payment (Online)</option>
                        <option value="half-split">Half Payment (Cash + Online)</option>
                        <option value="full-cash">Full Payment (Cash)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none group-focus-within:text-emerald-500" />
                </div>
              </div>

              {/* Dynamic Inputs Based on Mode */}
              {(paymentMode === 'half-split' || paymentMode === 'full-cash') && (
                <div className="animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                        {paymentMode === 'half-split' ? 'Cash Amount Received' : 'Full Cash Amount'}
                    </label>
                    <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input 
                            type="number" 
                            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl outline-none font-bold text-sm border border-gray-200 focus:border-emerald-500"
                            placeholder="Enter amount..."
                            value={cashAmountInput}
                            onChange={(e) => setCashAmountInput(e.target.value)}
                        />
                    </div>
                  </div>
                </div>
              )}

              {/* Razorpay Gateway / QR Online Collection */}
              {paymentMode !== 'full-cash' && (
                <div className="bg-white p-4 rounded-3xl border border-gray-200 flex flex-col items-center gap-3 animate-in fade-in zoom-in-95">
                    <div className="text-center">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Online Collection Amount</p>
                        <p className="text-xl font-black text-emerald-600">₹{onlineAmount.toFixed(2)}</p>
                    </div>
                    <button
                      type="button"
                      disabled={cart.length === 0 || isProcessing}
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.Razorpay) {
                          const options = {
                            key: 'rzp_test_TGS6KrgRk2UAJ0',
                            amount: Math.round(onlineAmount * 100),
                            currency: 'INR',
                            name: 'TimeToMeal Counter POS',
                            description: `Walk-in POS Collection (₹${onlineAmount})`,
                            handler: function(response: any) {
                              handleCheckout();
                            },
                            theme: { color: '#059669' }
                          };
                          const rzp = new window.Razorpay(options);
                          rzp.open();
                        } else {
                          handleCheckout();
                        }
                      }}
                      className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600" /> Collect via Razorpay Gateway
                    </button>
                </div>
              )}

              <button 
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
                className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                    isProcessing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100/50'
                }`}
              >
                {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                ) : (
                    <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm & Close Order
                    </>
                )}
              </button>
              
              <button 
                disabled={cart.length === 0}
                className="w-full py-3 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:text-gray-900 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-3.5 h-3.5" /> Queue & Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default WalkInOrderView;
