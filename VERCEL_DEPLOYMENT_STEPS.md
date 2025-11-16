# Deploy GiddyApp to Vercel - Complete Guide

## 🚀 Step-by-Step Deployment

### Step 1: Go to Vercel
Open: https://vercel.com

### Step 2: Sign Up / Login
- Click **"Sign Up"** or **"Login"**
- Choose **"Continue with GitHub"**
- Authorize Vercel to access your repositories

### Step 3: Import Your Project
1. Click **"Add New..."** → **"Project"**
2. Find **`sfutchko/giddyapp`** in the repository list
3. Click **"Import"**

### Step 4: Configure Project Settings

**IMPORTANT SETTINGS:**

1. **Framework Preset**: Next.js (should auto-detect)

2. **Root Directory**: Click "Edit" and set to:
   ```
   apps/web
   ```
   ⚠️ This is CRITICAL! The app won't build without this.

3. **Build Settings**:
   - **Build Command**: `pnpm build` (default is fine)
   - **Output Directory**: `.next` (default is fine)
   - **Install Command**: `pnpm install` (default is fine)

### Step 5: Add Environment Variables

Click **"Environment Variables"** and add these **EXACTLY** as shown:

#### Variable 1:
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://tibxubhjuuqldwvfelbn.supabase.co`

#### Variable 2:
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `[Get from .env.local file]`

#### Variable 3:
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `[Get from .env.local file]`

#### Variable 4:
- **Name**: `NEXT_PUBLIC_MAPBOX_TOKEN`
- **Value**: `[Get from .env.local file]`

#### Variable 5:
- **Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Value**: `[Get from .env.local file]`

#### Variable 6:
- **Name**: `STRIPE_SECRET_KEY`
- **Value**: `[Get from .env.local file]`

#### Variable 7:
- **Name**: `RESEND_API_KEY`
- **Value**: `[Get from .env.local file]`

### Step 6: Deploy!

Click **"Deploy"** button

⏱️ **Wait 2-5 minutes** for the build to complete

You'll see:
- ✅ Building...
- ✅ Deploying...
- ✅ Success! (hopefully 🤞)

---

## 📱 After Deployment

### Your Live URL
You'll get a URL like:
```
https://giddyapp.vercel.app
```
or
```
https://giddyapp-[random].vercel.app
```

### Test the Site
1. Visit your Vercel URL
2. Check:
   - ✅ Homepage loads
   - ✅ Can browse horses
   - ✅ Map works
   - ✅ Can login/register

---

## 🔧 Post-Deployment Configuration

### 1. Update Supabase Redirect URLs

Go to: https://supabase.com/dashboard/project/tibxubhjuuqldwvfelbn/auth/url-configuration

Add your Vercel URL to:
- **Site URL**: `https://your-url.vercel.app`
- **Redirect URLs** (add these):
  ```
  https://your-url.vercel.app/*
  https://your-url.vercel.app/auth/callback
  ```

### 2. Update Stripe Webhooks (for payments)

Go to: https://dashboard.stripe.com/test/webhooks

Add new endpoint:
- **URL**: `https://your-url.vercel.app/api/webhooks/stripe`
- **Events**: Select all `payment_intent.*` and `charge.*` events

Copy the webhook secret and add it to Vercel environment variables:
- **Name**: `STRIPE_WEBHOOK_SECRET`
- **Value**: `whsec_...` (from Stripe)

Then redeploy (Vercel dashboard → Deployments → click "..." → Redeploy)

### 3. Update Mapbox Domain (if needed)

Go to: https://account.mapbox.com/access-tokens/

If you see CORS errors on the map:
- Add your Vercel URL to allowed origins

---

## 🐛 Troubleshooting

### Build Fails with "No Next.js version detected"
- ✅ Make sure **Root Directory** is set to `apps/web`
- ✅ Check build logs in Vercel dashboard

### "Internal Server Error" on site
- ✅ Check all environment variables are added
- ✅ Check Vercel Function Logs (Vercel dashboard → Functions)

### Login doesn't work
- ✅ Update Supabase redirect URLs (see step 1 above)
- ✅ Make sure Supabase keys are correct

### Map doesn't load
- ✅ Check Mapbox token is valid
- ✅ Add Vercel domain to Mapbox allowed URLs

---

## 🎉 Success Checklist

- [ ] Site deployed to Vercel
- [ ] Can access the URL
- [ ] Homepage loads correctly
- [ ] Can browse horses
- [ ] Map displays
- [ ] Login/registration works
- [ ] Supabase redirect URLs updated
- [ ] Stripe webhooks configured (if using payments)

---

## 🔄 Continuous Deployment

Every time you push to GitHub, Vercel automatically deploys!

```bash
git add .
git commit -m "New changes"
git push
```

Vercel will automatically build and deploy the new version.

---

## 📞 Support

If you run into issues:
1. Check Vercel build logs
2. Check Vercel Function logs (for runtime errors)
3. Verify all environment variables are set correctly

**Vercel Dashboard**: https://vercel.com/dashboard
**GitHub Repo**: https://github.com/sfutchko/giddyapp
**Supabase Dashboard**: https://supabase.com/dashboard/project/tibxubhjuuqldwvfelbn
