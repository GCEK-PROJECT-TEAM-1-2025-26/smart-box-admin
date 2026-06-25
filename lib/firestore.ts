import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  where,
  updateDoc,
  deleteDoc,
  Timestamp,
  QuerySnapshot,
  DocumentData,
  setDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { User, SmartBox, Session, DashboardStats } from '@/types';

// Real-time listeners for dashboard stats
export const subscribeToStats = (callback: (stats: DashboardStats) => void) => {
  const unsubscribers: (() => void)[] = [];

  const stats: DashboardStats = {
    totalUsers: 0,
    activeUsers: 0,
    totalBoxes: 0,
    activeBoxes: 0,
    activeSessions: 0,
    todayRevenue: 0,
    totalRevenue: 0,
  };

  let statsUpdated = 0;
  const totalStatsToLoad = 4; // users, boxes, sessions, revenue

  const checkAndCallback = () => {
    statsUpdated++;
    if (statsUpdated >= totalStatsToLoad) {
      callback(stats);
    }
  };
  // Subscribe to users count
  const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
    stats.totalUsers = snapshot.size;
    stats.activeUsers = snapshot.docs.filter(doc => doc.data().isActive !== false).length;
    checkAndCallback();
  });
  unsubscribers.push(usersUnsubscribe);

  let lastBoxesSnapshot: QuerySnapshot<DocumentData> | null = null;

  // Subscribe to boxes count
  const boxesUnsubscribe = onSnapshot(collection(db, 'boxes'), (snapshot) => {
    lastBoxesSnapshot = snapshot;
    stats.totalBoxes = snapshot.size;
    const now = Date.now();
    stats.activeBoxes = snapshot.docs.filter(doc => {
      const data = doc.data();
      const lastHeartbeat = data.lastHeartbeat?.toDate();
      return lastHeartbeat ? (now - lastHeartbeat.getTime() < 20000) : false;
    }).length;
    checkAndCallback();
  });
  unsubscribers.push(boxesUnsubscribe);

  // Periodically refresh activeBoxes count based on elapsed time without new db reads
  const intervalId = setInterval(() => {
    if (lastBoxesSnapshot) {
      const now = Date.now();
      const activeBoxes = lastBoxesSnapshot.docs.filter((doc) => {
        const data = doc.data();
        const lastHeartbeat = data.lastHeartbeat?.toDate();
        return lastHeartbeat ? (now - lastHeartbeat.getTime() < 20000) : false;
      }).length;
      if (activeBoxes !== stats.activeBoxes) {
        stats.activeBoxes = activeBoxes;
        // Make sure to only invoke callback if all other stats are also loaded
        if (statsUpdated >= totalStatsToLoad) {
          callback({ ...stats });
        }
      }
    }
  }, 10000);

  // Subscribe to active sessions
  const sessionsUnsubscribe = onSnapshot(
    query(collection(db, 'sessions'), where('status', '==', 'active')),
    (snapshot) => {
      stats.activeSessions = snapshot.size;
      checkAndCallback();
    }
  );
  unsubscribers.push(sessionsUnsubscribe);
  // Calculate today's revenue - simplified to avoid compound index
  const revenueUnsubscribe = onSnapshot(
    query(collection(db, 'sessions'), where('status', '==', 'completed')),
    (snapshot) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let todayRevenue = 0;
      let totalRevenue = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const cost = data.cost || 0;
        const startTime = data.startTime?.toDate() || new Date(0);
        
        totalRevenue += cost;
        
        if (startTime >= today) {
          todayRevenue += cost;
        }
      });
        stats.todayRevenue = todayRevenue;
      stats.totalRevenue = totalRevenue;
      
      checkAndCallback();
    }
  );
  unsubscribers.push(revenueUnsubscribe);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    unsubscribers.forEach(unsubscribe => unsubscribe());
  };
};

// Subscribe to all users
export const subscribeToUsers = (callback: (users: User[]) => void) => {
  return onSnapshot(
    query(collection(db, 'users'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as User[];
      callback(users);
    }
  );
};

// Subscribe to all smart boxes
// Maps the actual Firestore schema (written by Flutter app) to the SmartBox admin type
export const subscribeToBoxes = (callback: (boxes: SmartBox[]) => void) => {
  return onSnapshot(
    query(collection(db, 'boxes'), orderBy('lastUpdated', 'desc')),
    (snapshot) => {
      const boxes = snapshot.docs.map(doc => {
        const data = doc.data();
        // Flutter stores isLocked (true = locked), admin uses isUnlocked (true = unlocked)
        const isLocked: boolean = data.isLocked ?? true;
        // Flutter stores devices as nested objects
        const evChargerOn: boolean = data.devices?.evCharger?.isOn ?? false;
        const threePinOn: boolean = data.devices?.threePinSocket?.isOn ?? false;
        // Flutter uses status field: 'available', 'in_use'
        const status: string = data.status ?? 'available';
        const lastHeartbeat = data.lastHeartbeat?.toDate() ?? undefined;
        const isOnline = lastHeartbeat ? (Date.now() - lastHeartbeat.getTime() < 20000) : false;

        const ownerId: string | undefined = data.ownerId ?? undefined;
        const latitude: number | undefined = typeof data.latitude === 'number' ? data.latitude : undefined;
        const longitude: number | undefined = typeof data.longitude === 'number' ? data.longitude : undefined;

        return {
          id: doc.id,
          name: data.boxId ?? doc.id,
          location: data.location ?? '',
          isOnline,
          isUnlocked: !isLocked,
          evChargerOn,
          threePinOn,
          currentUser: status === 'in_use' ? (data.currentUserId ?? 'In Use') : undefined,
          lastUpdated: data.lastUpdated?.toDate() ?? new Date(),
          lastHeartbeat,
          ownerId,
          latitude,
          longitude,
          totalSessions: data.totalSessions ?? 0,
          totalRevenue: data.totalRevenue ?? 0,
          tariff: data.tariff
            ? {
                evRate: typeof data.tariff.evRate === 'number' ? data.tariff.evRate : 12,
                socketRate: typeof data.tariff.socketRate === 'number' ? data.tariff.socketRate : 8,
              }
            : { evRate: 12, socketRate: 8 },
          // pass through raw fields for updateBoxStatus
          _raw: data,
        } as SmartBox;
      });
      callback(boxes);
    }
  );
};

// Subscribe to sessions
export const subscribeToSessions = (callback: (sessions: Session[]) => void) => {
  return onSnapshot(
    query(collection(db, 'sessions'), orderBy('startTime', 'desc'), limit(100)),
    async (snapshot) => {
      const docs = snapshot.docs;

      const sessions = await Promise.all(
        docs.map(async (snap) => {
          const data = snap.data();

          const startTime: Date = data.startTime?.toDate() || new Date();
          const endTime: Date | null = data.endTime?.toDate() || null;

          // Compute duration in seconds from start/end if not present
          let duration: number;
          if (typeof data.duration === 'number' && !Number.isNaN(data.duration)) {
            duration = data.duration;
          } else {
            const endForDuration = endTime ?? new Date();
            duration = Math.max(
              0,
              Math.floor((endForDuration.getTime() - startTime.getTime()) / 1000)
            );
          }

          // Fetch user display name/email if userName not already stored
          let userName: string | undefined = data.userName;
          if (!userName && data.userId) {
            try {
              const userSnap = await getDoc(doc(db, 'users', data.userId));
              if (userSnap.exists()) {
                const userData = userSnap.data() as DocumentData;
                userName =
                  userData.displayName ||
                  userData.name ||
                  userData.email ||
                  data.userId;
              }
            } catch (e) {
              console.error('Failed to fetch user for session', snap.id, e);
            }
          }

          return {
            id: snap.id,
            ...data,
            userName,
            startTime,
            endTime,
            duration,
          } as Session;
        })
      );

      callback(sessions);
    }
  );
};

// Update user wallet balance
export const updateUserWallet = async (userId: string, newBalance: number) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { walletBalance: newBalance });
};

// Update box status
// Maps admin SmartBox fields back to the correct Firestore paths used by Flutter
export const updateBoxStatus = async (boxId: string, status: Partial<SmartBox & { isUnlocked?: boolean; evChargerOn?: boolean; threePinOn?: boolean }>) => {
  const boxRef = doc(db, 'boxes', boxId);

  // Build the correct Firestore update object
  const update: Record<string, unknown> = { lastUpdated: Timestamp.now() };

  if (status.isUnlocked !== undefined) {
    // Admin toggles isUnlocked → Flutter reads isLocked (inverted)
    update['isLocked'] = !status.isUnlocked;
  }
  if (status.evChargerOn !== undefined) {
    // Flutter stores nested: devices.evCharger.isOn
    update['devices.evCharger.isOn'] = status.evChargerOn;
  }
  if (status.threePinOn !== undefined) {
    // Flutter stores nested: devices.threePinSocket.isOn
    update['devices.threePinSocket.isOn'] = status.threePinOn;
  }

  await updateDoc(boxRef, update);
};

// Force stop a session
export const forceStopSession = async (sessionId: string, boxId: string) => {
  const batch = writeBatch(db);

  const sessionRef = doc(db, 'sessions', sessionId);
  batch.update(sessionRef, {
    status: 'completed',
    isActive: false,
    endTime: Timestamp.now()
  });

  const boxRef = doc(db, 'boxes', boxId);
  batch.update(boxRef, {
    status: 'available',
    isLocked: true,
    'devices.evCharger.isOn': false,
    'devices.threePinSocket.isOn': false,
    lastUpdated: Timestamp.now()
  });

  await batch.commit();
};

// Delete user (admin only)
export const deleteUser = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);
};

// Add new box
export const addBox = async (
  boxId: string,
  location: string,
  latitude: number,
  longitude: number,
  ownerId?: string,
  evRate: number = 12,
  socketRate: number = 8
) => {
  const boxRef = doc(db, 'boxes', boxId);
  await setDoc(boxRef, {
    boxId: boxId,
    location: location,
    latitude: latitude,
    longitude: longitude,
    ownerId: ownerId || null,
    isLocked: true,
    rfidDetected: true,
    status: 'available',
    devices: {
      evCharger: {
        isOn: false,
        voltage: 0,
        current: 0,
        power: 0
      },
      threePinSocket: {
        isOn: false,
        voltage: 0,
        current: 0,
        power: 0
      }
    },
    tariff: {
      evRate: evRate,
      socketRate: socketRate,
    },
    lastUpdated: serverTimestamp(),
    totalSessions: 0,
    totalRevenue: 0
  });
};

// Update box tariff rates (admin can edit at any time)
export const updateBoxTariff = async (
  boxId: string,
  evRate: number,
  socketRate: number
) => {
  const boxRef = doc(db, 'boxes', boxId);
  await updateDoc(boxRef, {
    tariff: { evRate, socketRate },
    lastUpdated: Timestamp.now(),
  });
};

// Fetch boxes owned by a specific user
export const getBoxesByOwnerId = async (ownerId: string): Promise<SmartBox[]> => {
  const q = query(collection(db, 'boxes'), where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().boxId || doc.id, ...doc.data() } as any));
};

// Reassign an array of boxes to a new owner (or null for admin)
export const reassignBoxes = async (boxIds: string[], newOwnerId: string | null) => {
  const batch = writeBatch(db);
  for (const boxId of boxIds) {
    const boxRef = doc(db, 'boxes', boxId);
    batch.update(boxRef, { 
      ownerId: newOwnerId,
      lastUpdated: Timestamp.now()
    });
  }
  await batch.commit();
};

// Create a new box registration for mobile app provisioning
export const createBoxRegistration = async (boxId: string, ownerId: string) => {
  // Generate a random 6-digit PIN
  const registrationId = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Generate a simple secure device secret (since we can't guarantee crypto.randomUUID here)
  const generateSecret = () => {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, () => {
      return (Math.random() * 16 | 0).toString(16);
    });
  };
  const deviceSecret = generateSecret();

  const batch = writeBatch(db);

  // 1. Create the Box document with pending status
  const boxRef = doc(db, 'boxes', boxId);
  batch.set(boxRef, {
    boxId: boxId,
    ownerId: ownerId,
    location: 'Pending Setup',
    status: 'pending_provision',
    isLocked: true,
    rfidDetected: false,
    latitude: 0.0,
    longitude: 0.0,
    tariff: { evRate: 12.0, socketRate: 8.0 },
    devices: {
      evCharger: { isOn: false, voltage: 0, current: 0, power: 0 },
      threePinSocket: { isOn: false, voltage: 0, current: 0, power: 0 }
    },
    deviceSecret: deviceSecret,
    lastUpdated: serverTimestamp(),
    totalSessions: 0,
    totalRevenue: 0
  });

  // 2. Create the Provisioning Token
  const tokenRef = doc(db, 'provisioningTokens', registrationId);
  batch.set(tokenRef, {
    registrationId,
    boxId,
    ownerId,
    deviceSecret,
    createdAt: serverTimestamp()
  });

  await batch.commit();

  return { registrationId, deviceSecret };
};
