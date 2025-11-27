# Netlify Deployment Guide

Your restaurant app with WhatsApp integration is ready for Netlify deployment!

## 🚀 Quick Deploy

### Method 1: Git Integration (Recommended)
1. **Push to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Add WhatsApp integration, remove n8n dependencies"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider
   - Select your repository
   - Build settings should auto-detect:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`

### Method 2: Drag & Drop
1. **Build your app**
   ```bash
   npm run build
   ```

2. **Deploy**
   - Go to [netlify.com](https://netlify.com)
   - Drag the `dist` folder to the deploy area

## ⚙️ Environment Variables

In Netlify dashboard → Site settings → Environment variables, add:

```bash
VITE_SUPABASE_URL=https://guuggupmkhlgerwklxwa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1dWdndXBta2hsZ2Vyd2tseHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzA5NzYsImV4cCI6MjA3OTgwNjk3Nn0.yv963OqgN6EckyXU1NLNySRMoYQnfI2aidKw9epnR9k
```

## 📱 What's Deployed

### ✅ Working Features
- **Restaurant menu** with categories and items
- **Shopping cart** with add/remove functionality
- **WhatsApp order confirmation** (via Supabase Edge Functions)
- **Phone validation** for Algerian (+213) and Mauritanian (+222) numbers
- **Order tracking** in Supabase database
- **Rate limiting** (5 orders/hour per phone number)

### ❌ Removed Dependencies
- **n8n workflows** - replaced with Supabase Edge Functions
- **Netlify functions** - no longer needed
- **Railway deployment** - if only used for n8n

## 🔧 Configuration Files

### `netlify.toml` (Updated)
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

# Handle SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### `.env` (Frontend)
```bash
VITE_SUPABASE_URL=https://guuggupmkhlgerwklxwa.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🧪 Post-Deployment Testing

1. **Visit your site** - Check that menu loads correctly
2. **Add items to cart** - Test cart functionality
3. **Place test order** - Use your Mauritanian number +22227265400
4. **Check WhatsApp** - Verify confirmation message arrives
5. **Check Supabase** - Verify order appears in database

## 📊 Monitoring

### Supabase Dashboard
- **Orders**: Check `orders` table for new submissions
- **Messages**: Monitor `whatsapp_messages` table for delivery status
- **Edge Functions**: View logs in Functions section

### Netlify Analytics
- **Site traffic**: Monitor visitor engagement
- **Form submissions**: Track order conversion rates

## 🔄 CI/CD (Optional)

For automatic deployments on every push:

```yaml
# .github/workflows/deploy.yml (if using GitHub Actions)
name: Deploy to Netlify
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🚨 Troubleshooting

### Common Issues

1. **Build fails**
   - Check `npm run build` works locally
   - Verify all dependencies are in package.json

2. **WhatsApp not working**
   - Check environment variables in Netlify dashboard
   - Verify Supabase Edge Functions are deployed
   - Check Twilio sandbox status

3. **Cart not persisting**
   - Check browser console for JavaScript errors
   - Verify Supabase connection

### Debug Commands
```bash
# Local build test
npm run build

# Preview build locally
npm run preview

# Check environment variables
netlify env:list
```

## 🎉 Production Considerations

### WhatsApp Business API
- **Sandbox**: Works for testing (current setup)
- **Production**: Apply for WhatsApp Business API for real customers
- **Templates**: Create approved message templates for order confirmations

### Performance
- **Images**: Optimize menu images for faster loading
- **Caching**: Netlify automatically caches static assets
- **CDN**: Global CDN included with Netlify

### Security
- **Environment variables**: Never expose secrets in frontend
- **Rate limiting**: Already implemented in order service
- **Input validation**: Phone number validation in place

Your restaurant app is now ready for production with modern WhatsApp messaging! 🎉
