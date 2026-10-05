# Smart Box — Feature List

A pay-per-use smart box ecosystem for EV charging and 3-pin power sockets.
Tripartite system: **ESP32 firmware** (`M:\smart_box_app_esp`), **Flutter mobile app** (`M:\smart_box_app`), **Next.js admin panel + device API** (`M:\smart-box-admin`), backed by **Firebase / Firestore**.

---

## 1. Hardware / Firmware (ESP32)

- [x] First-boot Wi-Fi Access Point mode (`SmartBox-Setup-XXXX`) for provisioning
- [x] `GET /scan` endpoint — scans and returns nearby Wi-Fi networks
- [x] `POST /configure` endpoint — receives SSID, password, deviceId, deviceSecret, location; saves to NVS (`Preferences`); reboots
- [x] Station-mode Wi-Fi connect with reconnect logic (30 s interval)
- [x] Command polling of backend (`GET /api/esp/next-command`) every 5 s
- [x] Magnetic lock control (GPIO5) with lock feedback sensing (GPIO18)
- [x] EV charger relay control (GPIO19)
- [x] 3-pin socket relay control (GPIO23)
- [x] Dual PZEM-004T v3.0 energy meters over UART (voltage, current, power, energy)
- [x] Energy counter reset on relay activation (per-session metering)
- [x] RFID card detection pin (GPIO32) reported in telemetry
- [x] Status acknowledgment upload (`POST /api/esp/ack`) with lock/EV/P3/RFID state + energy payload
- [x] 128x64 SSD1306 OLED live status display
- [x] Command success/failure acknowledgement back to backend
- [ ] TLS certificate pinning / proper CA validation (currently `setInsecure()`)
- [ ] RFID-based access gating/authorization logic

## 2. Backend API (Next.js, `/api/esp/*`)

- [x] Device authentication via `x-device-id` / `x-device-secret` headers
- [x] Per-box unique `deviceSecret` validation against Firestore `boxes` doc
- [x] Global fallback device secret (env `ESP_DEVICE_SECRET`) for testing
- [x] `GET /api/esp/next-command` — returns oldest pending command for a box (`unlock`, `lock`, `deviceControl` → EV/P3 actions), `{ none: true }` when idle
- [x] `POST /api/esp/ack` — command status update (`completed`/`failed`), box state update (lock, EV, P3), `lastHeartbeat`, energy time-series logging to `energy_readings`
- [x] Supports snake_case and camelCase command payloads

## 3. Admin Dashboard (Next.js web)

- [x] Admin login/logout with Firebase Auth (`useAuth` hook, `/unauthorized` guard)
- [x] Dashboard with statistics and charts (`recharts`)
- [x] Boxes management: list table, add box, assign owner, reassign-boxes modal
- [x] Users management table
- [x] Sessions history table
- [x] Firestore as single source of truth (`lib/firestore.ts`)
- [x] Firebase Admin SDK integration (`lib/firebase-admin.ts`)
- [x] Sample data setup utility (`lib/setup-sample-data.ts`)

## 4. Mobile App (Flutter — "WattGate")

### Authentication & Profile
- [x] Email/password sign-up and login
- [x] Google Sign-In
- [x] Email verification screen flow
- [x] Auth-state-driven routing (`AuthWrapper`)
- [x] Profile screen

### Box Discovery & Navigation
- [x] Google Maps view of available boxes with status-colored markers
- [x] Compass-aligned (heading-up) map
- [x] Navigate to box via external Google Maps
- [x] QR-code scanning to select a box (`mobile_scanner`, camera permission handling)

### Box Control
- [x] View live box state via Firestore real-time stream (`isLocked`, EV/P3 on-off, telemetry)
- [x] Send unlock command
- [x] Toggle EV charger and 3-pin socket via device-control commands
- [x] Command service writing `pending` commands to Firestore

### Sessions & Billing
- [x] Start/end charging sessions
- [x] Per-device usage tracking (EV + 3-pin usage/cost)
- [x] Live session cost accumulation from energy × tariff
- [x] Session history / total cost calculation

### Wallet & Payments
- [x] Wallet recharge via Razorpay (success / error / external-wallet handlers)

### Provisioning
- [x] Enter registration ID → fetch device secret
- [x] Connect to ESP32 AP, scan networks, POST Wi-Fi + credentials to device
- [x] Device status update to `available` after provisioning

### UX
- [x] Light/dark theme manager
- [x] Owner dashboard screen
- [x] Meter card widget for live electrical readings

---

## 5. Additional Capabilities Found in Code Audit

### ESP32 Firmware
- [x] OLED multi-screen UI: main status, energy readings, network status, diagnostics, AP setup instructions — auto-rotating every 5 s
- [x] I2C bus scan + SSD1306 init diagnostics for display debugging

### Admin Dashboard
- [x] Real-time Firestore subscriptions for boxes and users (`subscribeToBoxes`, `subscribeToUsers`)
- [x] Tariff editing modal (`EditTariffModal` → `updateBoxTariff`) — per-box `evRate`/`socketRate`
- [x] Box status update helper (`updateBoxStatus`)
- [x] Box model fields: `pendingRegistrationId`, `latitude`/`longitude`, `totalRevenue`, `ownerId`/`ownerName`
- [x] Session model supports `deviceType: 'ev_charger' | '3pin_socket' | 'both'`

### Flutter App
- [x] Owner Dashboard (`owner_dashboard_screen.dart`): cabinet door status, RFID card status, EV/P3 relay toggles, live meter readings
- [x] Owner actions: **force stop a session**, **edit box tariff**
- [x] Route service (`route_service.dart`) — fetches route polyline between user and box
- [x] New users get an initial wallet credit of ₹500 and `totalUsage` (kWh) counter
- [x] Wallet balance updated atomically (`FieldValue.increment`); usage stats + wallet debited on session cost
- [x] Command status lifecycle: `pending → sent_to_esp32 → completed/failed`, with `errorMessage` field
- [x] Sign-out with confirmation dialog in dashboard

