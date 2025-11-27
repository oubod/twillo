import React, { useState } from 'react';
import { useCart } from '../store/CartContext';
import { X, Trash2, ChefHat, Receipt, ShoppingBag } from 'lucide-react';
import { OrderForm } from './OrderForm';
import { submitOrder, OrderData } from '../services/orderService';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { items, removeFromCart, total, clearCart } = useCart();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOrderSubmit = async (orderData: { customerName: string; customerPhone: string }) => {
    if (items.length === 0) return;
    
    setIsSubmitting(true);
    
    const orderPayload: OrderData = {
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone,
      items: items.map(item => ({
        menu_item_id: item.id,
        item_name_fr: item.nameFr,
        item_name_ar: item.nameAr,
        quantity: item.quantity,
        unit_price: item.price
      })),
      total_amount: total
    };

    try {
      const result = await submitOrder(orderPayload);
      
      if (result.success) {
        // Show success message
        alert(`✅ Commande #${result.orderId?.slice(-8)} confirmée! Vous recevrez une confirmation WhatsApp.`);
        clearCart();
        onClose();
        setShowOrderForm(false);
      } else {
        alert(`⚠️ Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert('⚠️ Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full sm:rounded-2xl rounded-t-3xl shadow-2xl sm:max-w-md max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-900">
                <Receipt size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900 leading-none mb-1">Votre Facture</h2>
              <p className="text-xs text-gray-500 font-arabic">فاتورتك - Mustafa Resto</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          {showOrderForm ? (
            <OrderForm
              items={items}
              totalAmount={total}
              onSubmit={handleOrderSubmit}
              loading={isSubmitting}
              onBack={() => setShowOrderForm(false)}
            />
          ) : (
            <div className="p-5">
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-3">
                     <ShoppingBag size={32} className="opacity-20" />
                  </div>
                  <p className="font-medium text-gray-500">Votre panier est vide</p>
                  <p className="text-sm mt-1 opacity-60">Ajoutez des plats délicieux !</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.id} className="flex justify-between items-start bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex-1">
                        <div className="flex flex-col">
                            <h4 className="font-bold text-gray-900 text-sm">{item.nameFr}</h4>
                            <span className="font-arabic text-xs text-gray-400">{item.nameAr}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 bg-gray-50 inline-block px-2 py-1 rounded-md">
                          <span className="font-semibold text-gray-900">{item.quantity}</span> x {item.price} = <span className="font-bold text-primary">{item.quantity * item.price}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="ml-3 text-red-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!showOrderForm && (
          <div className="p-6 border-t border-gray-100 bg-white pb-safe">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-500 font-medium text-sm">Total à payer</span>
              <span className="text-3xl font-bold text-gray-900">{total} <span className="text-sm text-gray-400 font-medium">MRU</span></span>
            </div>
            
            <div className="flex gap-3">
               <button 
                  onClick={clearCart}
                  disabled={items.length === 0}
                  className="flex-1 py-3.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
               >
                 Vider
               </button>
               <button 
                  onClick={() => setShowOrderForm(true)}
                  disabled={items.length === 0}
                  className="flex-[2] py-3.5 px-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Confirmer la Commande 📱
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};