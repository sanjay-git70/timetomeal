import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface OrderPlacedPopupProps {
  onClose: () => void;
}

const OrderPlacedPopup: React.FC<OrderPlacedPopupProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] p-8 w-[90%] max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-center">
          <DotLottieReact
            src="https://lottie.host/79185a82-1601-499c-859b-1144214a1c1d/m6Kj7yP0lM.lottie"
            autoplay
            loop={false}
            style={{ height: 160 }}
          />
        </div>
        <h2 className="mt-4 text-2xl font-black text-gray-950 tracking-tight">Order Placed!</h2>
        <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest leading-relaxed">
          Your order has been successfully placed. Check your tickets for updates.
        </p>
        <button
          onClick={onClose}
          className="mt-8 w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-emerald-100 active:scale-95 transition-all"
        >
          View Ticket
        </button>
      </div>
    </div>
  );
};

export default OrderPlacedPopup;