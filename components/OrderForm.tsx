import React, { useState } from 'react';
import { CartItem } from '../types';
import { normalizePhoneNumber } from '../services/phoneUtils';

interface OrderFormProps {
  items: CartItem[];
  totalAmount: number;
  onSubmit: (orderData: OrderFormData) => void;
  loading: boolean;
  onBack?: () => void;
}

interface OrderFormData {
  customerName: string;
  customerPhone: string;
}

export const OrderForm: React.FC<OrderFormProps> = ({ 
  items, 
  totalAmount, 
  onSubmit, 
  loading,
  onBack 
}) => {
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    customerPhone: ''
  });
  const [errors, setErrors] = useState<Partial<OrderFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<OrderFormData> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Le nom est requis';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Le numéro de téléphone est requis';
    } else {
      try {
        normalizePhoneNumber(formData.customerPhone);
      } catch {
        newErrors.customerPhone = 'Numéro de téléphone algérien ou mauritanien invalide (format: 05XX XX XX XX, +213 5XX XX XX XX, ou +222 XX XX XX XX)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof OrderFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Votre panier est vide</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Finaliser la commande
        </h2>
        {onBack && (
          <button 
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
          >
            ← Retour
          </button>
        )}
      </div>

      {/* Order Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3 text-gray-700">Récapitulatif:</h3>
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">
              {item.quantity}x {item.nameFr}
            </span>
            <span className="font-medium">
              {(item.price * item.quantity).toLocaleString('fr-DZ')} DA
            </span>
          </div>
        ))}
        <div className="border-t mt-3 pt-3 flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span className="text-green-600">
            {totalAmount.toLocaleString('fr-DZ')} DA
          </span>
        </div>
      </div>

      {/* Customer Information Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
            Nom complet *
          </label>
          <input
            type="text"
            id="customerName"
            value={formData.customerName}
            onChange={handleInputChange('customerName')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.customerName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Votre nom"
            disabled={loading}
          />
          {errors.customerName && (
            <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>
          )}
        </div>

        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
            Numéro WhatsApp *
          </label>
          <input
            type="tel"
            id="customerPhone"
            value={formData.customerPhone}
            onChange={handleInputChange('customerPhone')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.customerPhone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="05XX XX XX XX ou +213 5XX XX XX XX"
            disabled={loading}
          />
          {errors.customerPhone && (
            <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Vous recevrez une confirmation sur ce numéro
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Traitement...
            </span>
          ) : (
            'Confirmer la commande'
          )}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>📱 Notification WhatsApp:</strong> Vous recevrez une confirmation automatique 
          avec les détails de votre commande et les mises à jour de statut.
        </p>
      </div>
    </div>
  );
};
