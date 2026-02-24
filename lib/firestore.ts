import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  where,
  updateDoc,
  deleteDoc,
  Timestamp 
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

  // Subscribe to boxes count
  const boxesUnsubscribe = onSnapshot(collection(db, 'boxes'), (snapshot) => {
    stats.totalBoxes = snapshot.size;
    stats.activeBoxes = snapshot.docs.filter(doc => doc.data().isOnline === true).length;
    checkAndCallback();
  });
  unsubscribers.push(boxesUnsubscribe);

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
export const subscribeToBoxes = (callback: (boxes: SmartBox[]) => void) => {
  return onSnapshot(
    query(collection(db, 'boxes'), orderBy('lastUpdated', 'desc')),
    (snapshot) => {
      const boxes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
      })) as SmartBox[];
      callback(boxes);
    }
  );
};

// Subscribe to sessions
export const subscribeToSessions = (callback: (sessions: Session[]) => void) => {
  return onSnapshot(
    query(collection(db, 'sessions'), orderBy('startTime', 'desc'), limit(100)),
    (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || null
      })) as Session[];
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
export const updateBoxStatus = async (boxId: string, status: Partial<SmartBox>) => {
  const boxRef = doc(db, 'boxes', boxId);
  await updateDoc(boxRef, {
    ...status,
    lastUpdated: Timestamp.now()
  });
};

// Force stop a session
export const forceStopSession = async (sessionId: string) => {
  const sessionRef = doc(db, 'sessions', sessionId);
  await updateDoc(sessionRef, {
    status: 'completed',
    endTime: Timestamp.now()
  });
};

// Delete user (admin only)
export const deleteUser = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);
};
