# Smart Box — Test Cases

Covers the ESP32 firmware (`smart_box_app_esp`), the Next.js backend/admin (`smart-box-admin`), and the Flutter app (`smart_box_app`).

---

## TC-01: ESP32 First Boot / Provisioning

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-01-1 | AP mode on unconfigured device | Power ESP32 with empty Preferences/NVS | AP `SmartBox-Setup-XXXX` starts; `errorCode=4`, `lastError="Setup Mode Active"` |
| TC-01-2 | Wi-Fi scan endpoint | `GET http://192.168.4.1/scan` | JSON `{networks: [{ssid, rssi, open}]}` |
| TC-01-3 | Configure with valid payload | `POST /configure` `{ssid, password, deviceId, deviceSecret, location}` | 200 OK; config saved to NVS; device reboots |
| TC-01-4 | Configure with missing body | `POST /configure` (no body) | 400 `{status:"error", message:"Body missing"}` |
| TC-01-5 | Configure with invalid JSON | `POST /configure` with malformed JSON | 400 `JSON parse error` |
| TC-01-6 | Configure missing deviceId | Omit `deviceId` | 400 `Missing ssid or deviceId` |
| TC-01-7 | Config persistence | Reboot after configure | Loads credentials; skips AP mode |

## TC-02: Wi-Fi / Connectivity

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-02-1 | Successful station connect | Valid SSID/password | `wifiConnected=true`, `errorCode=0`, local IP logged |
| TC-02-2 | Failed connect at boot | Wrong password | Falls back to AP mode, `errorCode=3` |
| TC-02-3 | Wi-Fi drop mid-operation | Disable router | Detected within cycle; reconnect attempted every 30 s |
| TC-02-4 | Backend unreachable | Block server URL | `sendStatus`/`fetchNextCommand` fail; `errorCode=2`, `lastError="Backend Timeout"` |

## TC-03: Device Authentication (API)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-03-1 | Missing headers | GET `/api/esp/next-command` without auth headers | 401 `{error:"Unauthorized"}` |
| TC-03-2 | Wrong secret | POST `/api/esp/ack` with bad secret | 401 |
| TC-03-3 | Per-box secret valid | Correct `deviceId`/`deviceSecret` pair | 200 |
| TC-03-4 | Global fallback secret | Use `ESP_DEVICE_SECRET` | 200 (testing only) |

## TC-04: Command Lifecycle

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-04-1 | No pending commands | GET next-command | `{none: true}` |
| TC-04-2 | Unlock command | App writes `unlock` command → ESP polls | ESP triggers lock relay ~1 s; ack marks command `completed` |
| TC-04-3 | EV on command | Write deviceControl EV turnOn | EV relay HIGH; energy counter reset; telemetry reflects ON |
| TC-04-4 | EV off command | Write deviceControl EV turnOff | Relay LOW; `isOn=false` in Firestore |
| TC-04-5 | P3 socket on/off | Same as TC-04-4/5 for threePinSocket | P3 relay toggles; `devices.threePinSocket` updated |
| TC-04-6 | FIFO ordering | Queue multiple commands | Oldest `createdAt` served first |
| TC-04-7 | Command failure ack | Unknown lock action | Command status `failed`, `espResult.success=false` |
| TC-04-8 | camelCase + snake_case | `turnOn` and `turn_on` payloads | Both map to relay ON |

## TC-05: Telemetry / Energy

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-05-1 | PZEM readings present | Normal operation | V/I/P/E values in ack payload, `energy.ok=true` |
| TC-05-2 | PZEM disconnected | Unplug meter | `ok=false`; box UI shows last-known state, no crash |
| TC-05-3 | Energy reset on session start | EV relay off→on | PZEM energy counter resets to 0 |
| TC-05-4 | Time-series logging | POST ack with valid meters | New docs in `energy_readings` (source `ev`/`p3`) |
| TC-05-5 | Heartbeat update | Each ack | `boxes.{id}.lastHeartbeat` refreshed |

## TC-06: Admin Dashboard

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-06-1 | Unauthenticated access | Open `/dashboard` logged out | Redirect to `/login` or `/unauthorized` |
| TC-06-2 | Login success | Valid admin credentials | Dashboard loads with stats/charts |
| TC-06-3 | Add box | Create box with ID + owner | Doc appears in `boxes` with generated `deviceSecret`/registration ID |
| TC-06-4 | Reassign box owner | Use reassign modal | Box `ownerId` updated in Firestore |
| TC-06-5 | Sessions table | Load `/sessions` | Session rows with cost/device totals listed |
| TC-06-6 | Users table | Load `/users` | Users listed with roles |

## TC-07: Mobile App — Auth

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-07-1 | Email sign-up | New email + password | Account created; verification screen shown |
| TC-07-2 | Unverified login | Login before verifying email | Blocked by `email_verification_screen` |
| TC-07-3 | Google Sign-In | Tap Google login | Signed in; lands on home |
| TC-07-4 | Auth state gate | Sign out | Returns to login screen |

## TC-08: Mobile App — Maps / QR

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-08-1 | Map loads boxes | Open map screen | Markers for all boxes, color by availability |
| TC-08-2 | Compass follows heading | Rotate device | Map rotates to heading-up |
| TC-08-3 | Navigate | Tap box → Navigate | External Google Maps opens with destination |
| TC-08-4 | QR scan selects box | Scan valid box QR | Box control screen opens for that box |
| TC-08-5 | Camera permission denied | Deny permission | Permission prompt/SnackBar, no crash |

## TC-09: Mobile App — Control & Sessions

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-09-1 | Unlock box | Tap unlock | `pending` command created; box unlocks within ~5 s; UI reflects unlocked |
| TC-09-2 | Start session | Select EV/P3 + start | Session doc created; relay turns on; timer starts |
| TC-09-3 | Live monitoring | During session | App shows live power/energy via Firestore sync |
| TC-09-4 | End session | Tap end | Relay off; final energy → cost = energy × tariff; wallet debited; session totalCost saved |
| TC-09-5 | Cost math | e.g. 2 kWh @ ₹12/kWh | Session totalCost = ₹24 |

## TC-10: Wallet / Payments

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-10-1 | Recharge success | Valid Razorpay payment | Balance increases; success dialog |
| TC-10-2 | Payment failure | Cancel/fail payment | Error shown; no balance change |
| TC-10-3 | Invalid amount | Enter 0/negative/non-numeric | Validation prevents payment start |

## TC-11: Provisioning Flow (End-to-End)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-11-1 | Fetch secret by registration ID | Enter 6-digit ID | Secret/box config retrieved |
| TC-11-2 | Push config to device | Phone on AP → POST configure | Device saves config, reboots, connects to Wi-Fi |
| TC-11-3 | Box online | After provisioning | Box status → `available`; heartbeat starts; admin shows box online |

## TC-12: Security / Negative Tests

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-12-1 | Wrong device secret → ack | Send ack with bad secret | 401; no Firestore writes |
| TC-12-2 | Unknown commandId in ack | Random commandId | API error handled gracefully (500/404, log entry) |
| TC-12-3 | Oversized ack payload | Large energy values | No crash; values sanitized/stored |
| TC-12-4 | AP mode hijack attempt | POST garbage to `/configure` | 400 JSON parse error; no state change |

---

## TC-13: Load Testing

Context: a single ESP32 cycle every 5 s performs 2 PZEM reads (Serial1/Serial2, 9600 baud), 1× GET `/api/esp/next-command`, and 1× POST `/api/esp/ack`. Load cases scale the number of devices and telemetry rate.

| ID | Test Case | Steps | Expected Result / Threshold |
|----|-----------|-------|-----------------------------|
| TC-13-1 | Single-device baseline | 1 ESP32 running 1 hour | Stable: GET+POST succeed every cycle; no heap/memory drift; OLED updates |
| TC-13-2 | PZEM read under load | Repeated `readEnergyMeters()` + relay toggling | No UART framing errors; meter values remain plausible; `ok` flags accurate |
| TC-13-3 | PZEM unplug/replug race | Hot-unplug one meter during cycle | No crash/hang; `ok=false` for that meter only; other meter unaffected |
| TC-13-4 | Multi-device concurrent polling | 10/50/100 simulated devices hitting `GET /api/esp/next-command` every 5 s | p95 latency < 1 s; no 401s for valid devices; no 429/500 spikes |
| TC-13-5 | Ack storm | 100 devices POST `/api/esp/ack` simultaneously with full energy payload | All 200; Firestore writes succeed; `energy_readings` docs match count |
| TC-13-6 | Firestore write rate | 100 boxes × ack per 5 s (~1200 writes/min counting 2 energy_readings per ack) | No quota errors; heartbeat timestamps fresh; query latency stable |
| TC-13-7 | Command queue contention | 50 devices polling while app writes 500 pending commands | Oldest-first ordering preserved; each command delivered ≤ 1 extra cycle |
| TC-13-8 | Wi-Fi reconnect storm | Router flapping while 20 devices reconnect every 30 s | Devices recover; no AP-mode fallback loop; ack resumes after reconnect |
| TC-13-9 | Long-run soak test | 10 devices for 24–48 h with PZEM + relays active | No memory leak on ESP32, no API 5xx trend, energy counters consistent |
| TC-13-10 | Payload size scaling | Ack with max-length strings/meters active on both sources | Payload parses; POST time < 2 s; no truncation server-side |

---

## TC-14: Admin Tariff & Box Management (audit addendum)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-14-1 | Admin edits tariff | Open box → Edit Tariff → change evRate/socketRate → save | `boxes.{id}.tariff` updated; app shows new rates |
| TC-14-2 | Owner edits tariff | Owner dashboard → Edit Box Tariff | Same update path; session cost uses new rate after change |
| TC-14-3 | Tariff affects billing | Change rate mid-period, start new session | New rate applies to new session cost calc |
| TC-14-4 | Force stop session (owner) | Owner dashboard → Force Stop | Session `status=completed`, relays off, cost finalized |
| TC-14-5 | Real-time admin refresh | Box state changes on device | Admin tables/stats update without manual reload |

## TC-15: App Wallet & Usage (audit addendum)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-15-1 | Initial wallet credit | Create new account | `walletBalance = 500.0`, `totalUsage = 0` |
| TC-15-2 | Wallet increment on recharge | Successful Razorpay payment | `walletBalance` increases by paid amount |
| TC-15-3 | Usage stats update | End a session | `totalUsage` += kWh; wallet debited by cost |
| TC-15-4 | Concurrent session billing | Overlapping sessions on two devices | Costs/usage tracked per device type independently |

## TC-16: Firmware Display & Command States (audit addendum)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-16-1 | OLED screen rotation | Normal operation | Cycles main status → energy → network → diagnostics every ~5 s |
| TC-16-2 | OLED AP setup screen | Device in setup mode | Shows AP SSID + IP instructions |
| TC-16-3 | Command status `sent_to_esp32` | App sends command | Command doc transitions `pending → sent_to_esp32` before device execution |
| TC-16-4 | Command error capture | Device fails action | `errorMessage` populated; status `failed` |
| TC-16-5 | Route service | Open box navigation | Route polyline/directions returned between user and box location |
| TC-16-6 | Sign-out confirmation | Tap sign out | Confirmation dialog; session cleared only on confirm |
