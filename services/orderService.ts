import { createClient } from '@supabase/supabase-js';
import { CartItem } from '../types';
import { normalizePhoneNumber } from './phoneUtils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface OrderData {
  customer_name: string;
  customer_phone: string;
  items: Array<{
    menu_item_id: string;
    item_name_fr: string;
    item_name_ar: string;
    quantity: number;
    unit_price: number;
  }>;
  total_amount: number;
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  dailyOrderNumber?: number;
  error?: string;
}

export const submitOrder = async (orderData: OrderData): Promise<OrderResult> => {
  try {
    // Normalize phone number before submission
    const normalizedPhone = normalizePhoneNumber(orderData.customer_phone);
    
    // Get today's order count for daily numbering
    const today = new Date().toISOString().split('T')[0];
    const { data: todayOrders, error: countError } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', today);
    
    let dailyOrderNumber = 1;
    if (!countError && todayOrders) {
      dailyOrderNumber = todayOrders.length + 1;
    }
    
    // Start a transaction by creating the order first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: orderData.customer_name,
        customer_phone: normalizedPhone,
        total_amount: orderData.total_amount,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return {
        success: false,
        error: 'Erreur lors de la création de la commande'
      };
    }

    // Insert order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        orderData.items.map(item => ({
          order_id: order.id,
          menu_item_id: item.menu_item_id,
          item_name_fr: item.item_name_fr,
          item_name_ar: item.item_name_ar,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      );

    if (itemsError) {
      console.error('Order items error:', itemsError);
      // Clean up the order if items failed
      await supabase.from('orders').delete().eq('id', order.id);
      return {
        success: false,
        error: 'Erreur lors de l\'ajout des articles à la commande'
      };
    }

    // Update order status to confirmed
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', order.id);

    if (updateError) {
      console.error('Order status update error:', updateError);
    }

    // Send WhatsApp confirmation via Edge Function
    try {
      const whatsappResponse = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            to: normalizedPhone,
            type: 'session',
            message: `Commande ${dailyOrderNumber}\n${orderData.items.map(item => `${item.quantity}x ${item.item_name_fr}`).join('\n')}\nTotal: ${orderData.total_amount} MRU`
          },
          orderId: order.id
        })
      });

      if (!whatsappResponse.ok) {
        console.error('WhatsApp notification failed:', await whatsappResponse.text());
      }
    } catch (whatsappError) {
      console.error('WhatsApp notification error:', whatsappError);
      // Don't fail the order, just log the error
    }

    return {
      success: true,
      orderId: order.id,
      dailyOrderNumber: dailyOrderNumber
    };

  } catch (error) {
    console.error('Submit order error:', error);
    return {
      success: false,
      error: 'Une erreur inattendue est survenue'
    };
  }
};

export const getOrderStatus = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      order: data
    };

  } catch (error) {
    console.error('Get order status error:', error);
    return {
      success: false,
      error: 'Impossible de récupérer le statut de la commande'
    };
  }
};

export const getOrderHistory = async (customerPhone: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          item_name_fr,
          item_name_ar,
          quantity,
          unit_price
        )
      `)
      .eq('customer_phone', customerPhone)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      orders: data
    };

  } catch (error) {
    console.error('Get order history error:', error);
    return {
      success: false,
      error: 'Impossible de récupérer l\'historique des commandes'
    };
  }
};
