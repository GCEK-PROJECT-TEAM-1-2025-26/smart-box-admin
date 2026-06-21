export interface User {
  id: string;
  email: string;
  displayName?: string;
  walletBalance: number;
  createdAt: Date;
  totalUsage: number;
  isActive: boolean;
}

export interface SmartBox {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
  isUnlocked: boolean;
  evChargerOn: boolean;
  threePinOn: boolean;
  currentUser?: string;
  lastUpdated: Date;
  lastHeartbeat?: Date;
  totalSessions: number;
  totalRevenue: number;
  ownerId?: string;
  ownerName?: string;
  latitude?: number;
  longitude?: number;
}

export interface Session {
  id: string;
  userId: string;
  userName?: string;
  boxId: string;
  boxName?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  cost: number;
  deviceType: 'ev_charger' | '3pin_socket' | 'both';
  status: 'active' | 'completed';
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBoxes: number;
  activeBoxes: number;
  activeSessions: number;
  todayRevenue: number;
  totalRevenue: number;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
}
