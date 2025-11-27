# WhatsApp Integration Setup Guide

This guide replaces your n8n workflow with Supabase Edge Functions for WhatsApp messaging via Twilio.

## 🚀 Quick Start (Testing with Sandbox)

### 1. Twilio Setup - Sandbox (Free for Testing)

1. **Create Twilio Account**
   - Go to [twilio.com](https://twilio.com) and sign up
   - Verify your email and phone number

2. **Activate WhatsApp Sandbox**
   - In Twilio Console, go to Messaging > Try it out > Send a WhatsApp message
   - Follow the sandbox setup instructions
   - Send the join code to the sandbox number from your WhatsApp
   - Note your sandbox phone number (format: +14155238886)

3. **Get Twilio Credentials**
   - Account SID: Dashboard > General Settings
   - Auth Token: Dashboard > General Settings (click "Show")
   - WhatsApp Number: Your sandbox number

### 2. Supabase Database Setup

1. **Run SQL Migration**
   ```sql
   -- Copy contents of supabase-migrations.sql
   -- Run in Supabase SQL Editor
   ```

2. **Enable Extensions**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

### 3. Deploy Edge Function

1. **Install Supabase CLI**
   ```bash
   npm install -g @supabase/cli
   ```

2. **Deploy Function**
   ```bash
   cd supabase/functions/send-whatsapp
   supabase functions deploy send-whatsapp
   ```

3. **Set Environment Variables**
   ```bash
   supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
   supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
   supabase secrets set TWILIO_WHATSAPP_NUMBER=your_sandbox_number
   ```

### 4. Frontend Integration

1. **Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

2. **Update Cart Modal**
   - Replace your existing cart submission with the new OrderForm component
   - Import and use the orderService functions

## 🏭 Production Setup

### WhatsApp Business API (Required for Real Customers)

1. **Apply for WhatsApp Business API**
   - Go to [Twilio WhatsApp Business API](https://www.twilio.com/whatsapp)
   - Submit your business for verification (1-3 days)
   - You'll need: Business registration documents, website, privacy policy

2. **Create Message Templates**
   ```json
   // Template examples you'll need to submit for approval
   {
     "name": "order_confirmation",
     "language": "fr",
     "category": "TRANSACTIONAL",
     "components": [
       {
         "type": "BODY",
         "text": "🍽️ Votre commande #{1} est confirmée! Total: {2} DA. Merci {3}!"
       }
     ]
   }
   ```

3. **Update Production Environment**
   ```bash
   # Replace sandbox number with your production WhatsApp number
   supabase secrets set TWILIO_WHATSAPP_NUMBER=+14155238886
   ```

## 📱 Phone Number Format

The system automatically handles Algerian phone numbers:
- ✅ `05XX XX XX XX`
- ✅ `+213 5XX XX XX XX` 
- ✅ `00213 5XX XX XX XX`
- ✅ `2135XXXXXXXX`

All numbers are normalized to `2135XXXXXXXX` format for WhatsApp.

## 🔧 Configuration Files

### Environment Variables Required
```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Edge Functions (supabase secrets)
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🚨 Important Notes

### WhatsApp Business Rules
- **24-hour window**: You can only send free-form messages for 24 hours after customer contact
- **Template messages**: Required for first contact and after 24-hour window
- **Rate limits**: 1 message per second per phone number
- **Content restrictions**: No promotional content without opt-in

### Testing vs Production
- **Sandbox**: Free, no template approval, limited to sandbox numbers
- **Production**: Pay per message, requires template approval, works with any WhatsApp number

### Cost Considerations
- **Sandbox**: Free
- **Production**: ~$0.05 per message (varies by country)
- **Twilio**: $0.005 per API call + WhatsApp fees

## 🛠 Troubleshooting

### Common Issues

1. **Message not sending**
   - Check Twilio credentials in Edge Function secrets
   - Verify phone number format (use Algerian format)
   - Check if customer has opted in (production only)

2. **Template not approved**
   - Submit templates 1-3 days before going live
   - Use transactional category for order confirmations
   - Avoid promotional language in templates

3. **Edge Function not working**
   - Check deployment logs: `supabase functions logs send-whatsapp`
   - Verify environment variables are set
   - Test with curl first

### Debug Commands
```bash
# Check Edge Function logs
supabase functions logs send-whatsapp

# Test Edge Function directly
curl -X POST https://your-project.supabase.co/functions/v1/send-whatsapp \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{"message":{"to":"+2135XXXXXXXX","type":"session","message":"Test"}}'
```

## 📊 Monitoring

### Message Logs
View sent messages in your Supabase database:
```sql
SELECT * FROM whatsapp_messages ORDER BY created_at DESC;
```

### Failed Messages
Check for delivery issues:
```sql
SELECT * FROM whatsapp_messages WHERE status = 'failed';
```

## 🔄 Migration from n8n

1. **Export existing workflows** (for reference)
2. **Update order submission** to use new orderService
3. **Test with sandbox** before switching to production
4. **Decommission n8n** once WhatsApp is working

The new system is more reliable, faster, and eliminates the need for external workflow automation!
