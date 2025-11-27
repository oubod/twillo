import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Phone normalization for Algerian and Mauritanian numbers
function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Algerian numbers
  if (cleaned.startsWith('00213') || cleaned.startsWith('213') || cleaned.startsWith('0')) {
    let algerianNumber = cleaned;
    
    if (algerianNumber.startsWith('00213')) {
      algerianNumber = algerianNumber.substring(5);
    } else if (algerianNumber.startsWith('213')) {
      algerianNumber = algerianNumber.substring(3);
    } else if (algerianNumber.startsWith('0')) {
      algerianNumber = algerianNumber.substring(1);
    }
    
    if (/^[567]\d{7}$/.test(algerianNumber)) {
      return `213${algerianNumber}`;
    }
  }
  
  // Handle Mauritanian numbers
  if (cleaned.startsWith('00222') || cleaned.startsWith('222')) {
    let mauritanianNumber = cleaned;
    
    if (mauritanianNumber.startsWith('00222')) {
      mauritanianNumber = mauritanianNumber.substring(5);
    } else if (mauritanianNumber.startsWith('222')) {
      mauritanianNumber = mauritanianNumber.substring(3);
    }
    
    // Validate it's a valid Mauritanian mobile number (starts with 2, 3, or 4 and has 8 digits)
    if (/^[234]\d{7}$/.test(mauritanianNumber)) {
      return `222${mauritanianNumber}`;
    }
  }
  
  throw new Error('Invalid phone number');
}

interface WhatsAppMessage {
  to: string
  message: string
  type: 'template' | 'session'
  templateName?: string
  orderId?: string
}

interface OrderData {
  id: string
  customer_name: string
  customer_phone: string
  total_amount: number
  status: string
  items: Array<{
    item_name_fr: string
    item_name_ar: string
    quantity: number
    unit_price: number
  }>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, orderId }: { message: WhatsAppMessage; orderId?: string } = await req.json()
    
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(message.to)
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get order details if orderId provided
    let orderData: OrderData | null = null
    if (orderId) {
      const { data: order, error: orderError } = await supabase
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
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError
      orderData = order
    }

    // Twilio WhatsApp API configuration
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

    if (!accountSid || !authToken || !twilioWhatsAppNumber) {
      throw new Error('Missing Twilio configuration')
    }

    // Log message attempt
    const { data: messageLog, error: logError } = await supabase
      .from('whatsapp_messages')
      .insert({
        order_id: orderId || null,
        recipient_phone: normalizedPhone,
        message_type: message.type,
        template_name: message.templateName || null,
        message_content: message.message,
        status: 'pending'
      })
      .select()
      .single()

    if (logError) throw logError

    // Prepare Twilio request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('To', `whatsapp:${normalizedPhone}`)
    formData.append('From', `whatsapp:${twilioWhatsAppNumber}`)
    
    if (message.type === 'template' && message.templateName) {
      // Template message
      formData.append('ContentSid', message.templateName)
      formData.append('ContentVariables', JSON.stringify({
        "1": orderData?.customer_name || "Customer",
        "2": `${orderData?.total_amount || 0} DA`,
        "3": orderData?.id || "Unknown"
      }))
    } else {
      // Session message
      formData.append('Body', message.message)
    }

    // Send to Twilio
    const authString = btoa(`${accountSid}:${authToken}`)
    
    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      // Update message log with error
      await supabase
        .from('whatsapp_messages')
        .update({
          status: 'failed',
          twilio_error_code: twilioData.code,
          twilio_error_message: twilioData.message
        })
        .eq('id', messageLog.id)

      throw new Error(`Twilio API error: ${twilioData.message}`)
    }

    // Update message log with success
    await supabase
      .from('whatsapp_messages')
      .update({
        status: 'sent',
        twilio_message_sid: twilioData.sid,
        sent_at: new Date().toISOString()
      })
      .eq('id', messageLog.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageSid: twilioData.sid,
        messageId: messageLog.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('WhatsApp send error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Helper function to generate order confirmation message
function generateOrderConfirmationMessage(order: OrderData, language: 'fr' | 'ar' = 'fr'): string {
  const itemsList = order.items.map(item => 
    language === 'fr' 
      ? `${item.quantity}x ${item.item_name_fr} - ${item.unit_price * item.quantity} DA`
      : `${item.quantity}x ${item.item_name_ar} - ${item.unit_price * item.quantity} DA`
  ).join('\n')

  if (language === 'fr') {
    return `🍽️ *Nouvelle commande reçue!*

📋 *Commande:* #${order.id.slice(-8)}
👤 *Client:* ${order.customer_name}
📱 *Téléphone:* ${order.customer_phone}

📝 *Articles:*
${itemsList}

💰 *Total:* ${order.total_amount} DA
⏰ *Heure:* ${new Date().toLocaleString('fr-FR')}

Merci pour votre commande! 🙏`
  } else {
    return `🍽️ *طلب جديد!*

📋 *رقم الطلب:* #${order.id.slice(-8)}
👤 *العميل:* ${order.customer_name}
📱 *الهاتف:* ${order.customer_phone}

📝 *الطلبات:*
${itemsList}

💰 *الإجمالي:* ${order.total_amount} DA
⏰ *الوقت:* ${new Date().toLocaleString('ar-DZ')}

شكرا لطلبك! 🙏`
  }
}

// Helper function to generate order status update message
function generateStatusUpdateMessage(order: OrderData, newStatus: string, language: 'fr' | 'ar' = 'fr'): string {
  const statusMessages = {
    'confirmed': {
      fr: '✅ Votre commande a été confirmée et est en préparation!',
      ar: '✅ تم تأكيد طلبك وجاري التحضير!'
    },
    'ready': {
      fr: '🎉 Votre commande est prête! Vous pouvez venir la récupérer.',
      ar: '🎉 طلبك جاهز! يمكنك استلامه.'
    },
    'completed': {
      fr: '✅ Merci! Votre commande a été complétée avec succès.',
      ar: '✅ شكرا! تم إكمال طلبك بنجاح.'
    },
    'cancelled': {
      fr: '❌ Votre commande a été annulée. Contactez-nous pour plus d\'informations.',
      ar: '❌ تم إلغاء طلبك. اتصل بنا للمزيد من المعلومات.'
    }
  }

  const statusMsg = statusMessages[newStatus] || statusMessages['confirmed']
  
  if (language === 'fr') {
    return `📋 *Mise à jour de commande #${order.id.slice(-8)}*

${statusMsg.fr}

🍽️ *Restaurant Mustafa*`
  } else {
    return `📋 *تحديث الطلب #${order.id.slice(-8)}*

${statusMsg.ar}

🍽️ *مطعم مصطفى*`
  }
}
