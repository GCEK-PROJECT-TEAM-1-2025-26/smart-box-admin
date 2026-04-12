# ESP32 Integration Diagnostic

## Problem

UI is not updating when `isLocked` status changes from ESP32.

## Root Cause Analysis

### Possible Issues (in order of likelihood):

### 1. ❓ ESP32 is NOT sending ACK to backend

**Symptoms:**

- Console shows "Connection refused" or timeout errors
- Backend logs show no POST requests

**Check:**

- Look at ESP32 serial monitor output
- Does it show "POST https://..." messages?
- Does it show "HTTP POST code: 200"?

**Solution:**

- Verify ESP32 can reach backend (ping `192.168.29.164` from ESP32 WiFi network)
- Ensure backend is running on port 3000
- Check X-DEVICE-ID and X-DEVICE-SECRET headers match

---

### 2. ❓ Backend is receiving ACK but NOT updating Firestore

**Symptoms:**

- Backend logs show POST request received
- Firestore shows old `lastUpdated` timestamp
- Command status not changing to "completed"

**Check:**

- Look at backend server logs in terminal
- Search for "ESP POST /api/esp/ack"
- Is it logging the body data?

**Solution:**

```bash
# In your smart-box-admin terminal, look for:
[deviceId=box_001] { success: true, state: { lock: "LOCKED", ... } }
```

If you see this, backend IS receiving the data.

---

### 3. ❓ Backend is updating, but Firestore write is failing silently

**Symptoms:**

- Backend logs show success response (200)
- But Firestore document is not updated
- `lastUpdated` timestamp is unchanged

**Check:**

- Look at Firestore console
- Check if `lastUpdated` field exists
- Is it a recent timestamp?

**Solution:**

- Verify Admin SDK initialization in `/lib/firebase-admin.ts`
- Check service account credentials in `.env.local`

---

### 4. ❓ Firestore is updated correctly, but Flutter listener is NOT receiving updates

**Symptoms:**

- Firestore document updates successfully
- But Flutter UI doesn't reflect changes
- `isLocked` in console shows old value

**Check:**

- Open Firestore console
- Manually update `isLocked` field to test
- Does Flutter UI update then?

**Solution:**

- If manual Firestore edits work: issue is with how backend writes
- If manual edits don't work: issue is with listener setup

---

## Step-by-Step Verification

### Step 1: Check ESP32 Connection

```
Look at ESP32 serial monitor after pressing "Unlock" in Flutter app:
- Should see: "GET https://..."
- Should see: "HTTP GET code: 200" with command JSON
- Should see: "POST https://..."
- Should see: "HTTP POST code: 200"
```

If you see connection errors (104, -1), then ESP32 can't reach backend.

---

### Step 2: Check Backend Logs

```
In your Next.js terminal (where you ran `npm run dev`):
Look for messages like:
- "[deviceId=box_001] POST /api/esp/next-command"
- "[deviceId=box_001] POST /api/esp/ack" with body data
```

If these appear, backend is receiving ESP32 requests.

---

### Step 3: Check Firestore Updates

```
Firebase Console → Firestore → boxes/box_001
Look for:
- `lastUpdated` field - is it a recent timestamp (not old)?
- `isLocked` field - does it match ESP32 state?
```

If these are updated, backend is writing successfully.

---

### Step 4: Test Manual Firestore Update

```
Firebase Console → Firestore → boxes/box_001
Manually change `isLocked` from true to false
→ Does Flutter app UI update immediately?
  YES: Listener works, issue is backend writing
  NO: Listener broken, need to fix Flutter
```

---

## Most Likely Issue

Based on the error you showed earlier:

```
[100625][E][ssl_client.cpp:129] start_ssl_client(): socket error on fd 48, errno: 104
HTTP GET failed: connection refused
```

**The ESP32 cannot reach the backend.**

### Solution:

ESP32 is trying to connect to `https://192.168.29.164:3000` but:

1. **Backend might not be accepting HTTPS on that address**

   - Next.js by default doesn't support HTTPS in dev mode
   - ESP32 is trying HTTPS but backend is HTTP

2. **Solution**: Change ESP32 to use HTTP instead

---

## Fix: Change ESP32 to Use HTTP

In `main.cpp`:

```cpp
// Change from HTTPS to HTTP
const char *BACKEND_BASE_URL = "http://192.168.29.164:3000";
```

And in `fetchNextCommand()` and `sendStatus()` functions, remove the `WiFiClientSecure` code:

**Current (BROKEN):**

```cpp
WiFiClientSecure client;
client.setInsecure();
http.begin(client, url);
```

**Change to (WORKING):**

```cpp
http.begin(url);  // Use regular HTTP, not HTTPS
```

This avoids SSL/TLS handshake issues.

---

## Summary

**What's happening:**

1. ✅ Flutter app creates command in Firestore
2. ✅ Backend fetches command via `/api/esp/next-command`
3. ❌ ESP32 tries to connect with HTTPS/SSL but fails
4. ❌ Backend never receives ACK from ESP32
5. ❌ Firestore `isLocked` never gets updated
6. ❌ Flutter listener sees no changes

**Quick Fix:**

- Change ESP32 to use HTTP (not HTTPS)
- Remove `WiFiClientSecure` SSL code
- Recompile and upload

Then test again!
