# Smart Box Admin Dashboard

The Smart Box Admin Dashboard is a web-based management portal built with **Next.js**, **Tailwind CSS**, and **Firebase Admin SDK**. It serves as the central hub for managing users, monitoring hardware, and handling the backend API routes for the ESP32 hardware devices.

## Features

### 📦 Box Management
- **Provisioning**: Generate unique Registration IDs and secure `deviceSecret` keys to provision new ESP32 boxes via the mobile app.
- **Monitoring**: View real-time status of all boxes (Online/Offline, Locked/Unlocked).
- **Tariff Editing**: Modify the EV Charger and 3-Pin Socket rates (₹/kWh) on a per-box basis.
- **Hardware Override**: Manually toggle the lock and relays directly from the dashboard.
- **Deletion**: Safely remove boxes from the network and database.

### 👥 User Management
- View registered users and their wallet balances.
- Securely delete users and reassign their registered hardware boxes to other users or the admin.

### 🔌 ESP32 Backend API
The dashboard hosts the serverless API routes that the ESP32 hardware polls every 5 seconds:
- **`GET /api/esp/next-command`**: Authenticates the ESP32 via its unique `deviceSecret` and returns any pending hardware commands (unlock, relay toggles).
- **`POST /api/esp/ack`**: Receives hardware state updates, power consumption telemetry (voltage, current, energy), and updates the `lastHeartbeat` timestamp in Firestore.

## Getting Started

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env.local`:
   ```env
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=your_client_email
   FIREBASE_PRIVATE_KEY="your_private_key"
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

## Deployment

This dashboard is optimized for deployment on **Vercel**. Ensure that the Firebase Admin credentials are set in the Vercel Environment Variables dashboard before deploying.
