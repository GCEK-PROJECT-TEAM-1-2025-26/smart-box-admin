# Vercel Deployment Checklist

## ✅ Local Environment Setup (COMPLETE)
- ✅ Routes created: `/app/api/esp/next-command/route.ts`
- ✅ Routes created: `/app/api/esp/ack/route.ts`
- ✅ Firebase Admin SDK setup: `/lib/firebase-admin.ts`
- ✅ `.env.local` configured with:
  - Firebase config variables
  - Firebase service account JSON
  - ESP_DEVICE_SECRET

## 🔄 Required: Deploy to Vercel

### Step 1: Push Code to GitHub (if using Git)
```bash
git add .
git commit -m "Add ESP32 API routes for device integration"
git push origin main
```
If your repo is connected to Vercel, this will auto-deploy.

### Step 2: Set Environment Variables in Vercel Dashboard

Go to: **Vercel Dashboard → smart-box-admin → Settings → Environment Variables**

Add these variables:

#### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyAR4D9Yzy2Zbi6X5obXQPbevx1hH4gmJXc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = smart-box-app-6c55c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = smart-box-app-6c55c
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = smart-box-app-6c55c.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 1074349065380
NEXT_PUBLIC_FIREBASE_APP_ID = 1:1074349065380:web:14d93d800b5ae47e1a1231
```

#### Firebase Admin Service Account (COPY THE ENTIRE JSON STRING)
```
FIREBASE_SERVICE_ACCOUNT_JSON = {"type":"service_account","project_id":"smart-box-app-6c55c","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",...}
```

#### ESP32 Device Secret
```
ESP_DEVICE_SECRET = super-secret-token
```

### Step 3: Redeploy

Option A (Recommended): **Auto-deploy via GitHub**
- Just push your code to GitHub
- Vercel will automatically detect changes and redeploy

Option B: **Manual Redeploy in Vercel Dashboard**
1. Go to Vercel Dashboard
2. Click the project **smart-box-admin**
3. Click **Deployments** tab
4. Click the three dots on the latest deployment
5. Select **Redeploy**

### Step 4: Verify Deployment

Once deployed, test the endpoints:

#### Test GET /api/esp/next-command
```bash
curl -X GET "https://smart-box-admin.vercel.app/api/esp/next-command?deviceId=box_001&lastCommandId=" \
  -H "X-DEVICE-ID: box_001" \
  -H "X-DEVICE-SECRET: super-secret-token"
```

Expected response:
```json
{"none": true}
```
or
```json
{"commandId": "cmd_123", "actions": {"lock": "LOCK", "ev": true, "p3": false}}
```

#### Test POST /api/esp/ack
```bash
curl -X POST "https://smart-box-admin.vercel.app/api/esp/ack" \
  -H "X-DEVICE-ID: box_001" \
  -H "X-DEVICE-SECRET: super-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "box_001",
    "commandId": "cmd_123",
    "success": true,
    "timestamp": 1234567890,
    "state": {"lock": "LOCKED", "ev": true, "p3": false},
    "energy": {"ok": false, "evmeter": {}, "p3meter": {}}
  }'
```

Expected response:
```json
{"ok": true, "message": "Status received and saved"}
```

## ⚠️ Common Issues

### Issue: 404 Not Found
**Problem**: Routes not found  
**Solution**: Routes weren't deployed. Make sure you:
1. Committed code to GitHub
2. Vercel auto-deployed (or manually redeployed)
3. Waited for deployment to complete (check Deployment logs)

### Issue: 405 Method Not Allowed
**Problem**: Wrong HTTP method  
**Solution**: Make sure you're using:
- GET for `/api/esp/next-command`
- POST for `/api/esp/ack`

### Issue: 401 Unauthorized
**Problem**: Device authentication failed  
**Solution**: Check:
1. `X-DEVICE-ID` header is set correctly (should be "box_001")
2. `X-DEVICE-SECRET` header matches `ESP_DEVICE_SECRET` in Vercel environment
3. Environment variables are set in Vercel (not just local `.env.local`)

### Issue: 500 Internal Server Error
**Problem**: Server-side error  
**Solution**:
1. Check Vercel Function Logs:
   - Go to Vercel Dashboard → Deployments → Logs tab
2. Common causes:
   - Firebase credentials not loaded (`FIREBASE_SERVICE_ACCOUNT_JSON` not set in Vercel)
   - Firestore connection error
   - Malformed JSON in request body

## 🚀 Quick Summary

1. **Push code to GitHub** (if not already done)
   ```bash
   git push origin main
   ```

2. **Set environment variables in Vercel Dashboard**
   - Copy all NEXT_PUBLIC_* variables
   - Copy FIREBASE_SERVICE_ACCOUNT_JSON (the entire JSON string)
   - Copy ESP_DEVICE_SECRET

3. **Redeploy** (auto or manual)

4. **Test endpoints** with curl commands above

5. **Monitor logs** if something fails

## 📝 Notes

- The `.env.local` file works only for local development
- Production uses Vercel environment variables
- Never commit `.env.local` with real secrets to public repos
- All API routes are protected by X-DEVICE-SECRET header
