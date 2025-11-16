# GiddyApp Deployment Guide - Vercel

## ✅ Prerequisites Complete
- [x] Code pushed to GitHub: https://github.com/sfutchko/giddyapp.git
- [x] Vercel config added (`vercel.json`)
- [x] `.gitignore` configured
- [x] Ready to deploy!

## Next Steps: Deploy to Vercel

### Option 1: Web Dashboard (Recommended for First Deploy)

1. **Go to Vercel**: https://vercel.com

2. **Sign Up/Login**
   - Click "Sign Up" or "Login"
   - Choose "Continue with GitHub"
   - Authorize Vercel to access your repos

3. **Import Project**
   - Click "Add New..." → "Project"
   - Find `sfutchko/giddyapp` in the list
   - Click "Import"

4. **Configure Build Settings**
   Vercel should auto-detect Next.js, but verify:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web` ← IMPORTANT!
   - **Build Command**: Leave as default (will use vercel.json)
   - **Output Directory**: Leave as default

5. **Add Environment Variables** ⚠️ CRITICAL
   Click "Environment Variables" and add these from your `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tibxubhjuuqldwvfelbn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_anon_key]
   SUPABASE_SERVICE_ROLE_KEY=[your_service_role_key]
   NEXT_PUBLIC_MAPBOX_TOKEN=[your_mapbox_token]
   RESEND_API_KEY=[your_resend_key]
   STRIPE_SECRET_KEY=[your_stripe_key]
   STRIPE_WEBHOOK_SECRET=[your_webhook_secret]
   ```

   **Where to find these:**
   - Open `/Users/sean/Desktop/giddyapp/apps/web/.env.local`
   - Copy each value (the part after the `=`)

6. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes
   - You'll get a URL like: `https://giddyapp.vercel.app`

### Option 2: CLI Deploy (Faster for Future Deploys)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd /Users/sean/Desktop/giddyapp
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Scope? (your account)
# - Link to existing? No
# - Project name? giddyapp
# - Directory? apps/web
# - Override settings? No
```

Then add environment variables via dashboard (see Option 1, step 5)

## After Deployment

### 1. Test Your Site
Visit your Vercel URL (e.g., `https://giddyapp.vercel.app`)

**Expected:**
- ✅ Homepage loads
- ✅ Can browse horses
- ⚠️ Map might not work (need to configure Mapbox for new domain)
- ⚠️ Auth might not work (need to configure Supabase redirect URLs)

### 2. Configure Supabase for Production

**In Supabase Dashboard** (https://supabase.com/dashboard/project/tibxubhjuuqldwvfelbn):

1. Go to **Authentication** → **URL Configuration**
2. Add your Vercel URL to:
   - **Site URL**: `https://giddyapp.vercel.app`
   - **Redirect URLs**:
     - `https://giddyapp.vercel.app/auth/callback`
     - `https://giddyapp.vercel.app/login`
     - `https://giddyapp.vercel.app/register`

### 3. Configure Mapbox for New Domain

1. Go to: https://account.mapbox.com/
2. Find your access token
3. Add `https://giddyapp.vercel.app` to allowed URLs

### 4. Update Stripe Webhooks (for payments)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add new endpoint:
   - URL: `https://giddyapp.vercel.app/api/webhooks/stripe`
   - Events: Select all payment events

## Environment Variables Checklist

Make sure you added ALL of these to Vercel:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN`
- [ ] `RESEND_API_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

## Continuous Deployment

Once set up, every `git push` to `main` will automatically deploy!

```bash
# Make changes
git add .
git commit -m "Your changes"
git push

# Vercel automatically deploys! ✨
```

## Troubleshooting

### Build Fails
**Check:**
- Build logs in Vercel dashboard
- Make sure all environment variables are set
- Verify `apps/web` is set as root directory

### "Internal Server Error"
**Check:**
- Environment variables are correct
- Supabase connection works (check dashboard)
- Check Vercel Function Logs

### Map Not Working
**Check:**
- Mapbox token is valid
- Domain is allowed in Mapbox dashboard

### Login Not Working
**Check:**
- Supabase redirect URLs include your Vercel domain
- Environment variables include Supabase keys

## Custom Domain (Optional)

Once deployed, you can add a custom domain like `giddyapp.com`:

1. Go to Vercel project → Settings → Domains
2. Add your domain
3. Update DNS records (Vercel provides instructions)

## Your Deployment URL

Once deployed, share this URL for testing:
`https://giddyapp.vercel.app` (or whatever Vercel assigns)

---

## Quick Reference

- **GitHub Repo**: https://github.com/sfutchko/giddyapp
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/tibxubhjuuqldwvfelbn

## Need Help?

If deployment fails:
1. Check Vercel build logs
2. Verify environment variables
3. Test locally first: `cd apps/web && pnpm dev`
