import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export const setupSampleData = async () => {
  try {
    console.log('Setting up sample data...');
    
    // Sample Users
    const users = [
      {
        email: 'john.doe@example.com',
        displayName: 'John Doe',
        walletBalance: 250.75,
        totalUsage: 15.4,
        isActive: true,
        createdAt: Timestamp.now()
      },
      {
        email: 'jane.smith@example.com',
        displayName: 'Jane Smith',
        walletBalance: 180.20,
        totalUsage: 8.2,
        isActive: true,
        createdAt: Timestamp.now()
      },
      {
        email: 'mike.wilson@example.com',
        displayName: 'Mike Wilson',
        walletBalance: 95.50,
        totalUsage: 22.1,
        isActive: false,
        createdAt: Timestamp.now()
      }
    ];

    // Add users
    for (const user of users) {
      await addDoc(collection(db, 'users'), user);
    }

    // Sample Smart Boxes
    const boxes = [
      {
        name: 'Smart Box Alpha',
        location: 'Building A - Parking Lot',
        isOnline: true,
        isUnlocked: false,
        evChargerOn: false,
        threePinOn: false,
        currentUser: null,
        totalSessions: 45,
        totalRevenue: 2250.75,
        lastUpdated: Timestamp.now()
      },
      {
        name: 'Smart Box Beta',
        location: 'Building B - Ground Floor',
        isOnline: true,
        isUnlocked: true,
        evChargerOn: true,
        threePinOn: false,
        currentUser: 'john.doe@example.com',
        totalSessions: 32,
        totalRevenue: 1680.40,
        lastUpdated: Timestamp.now()
      },
      {
        name: 'Smart Box Gamma',
        location: 'Building C - Basement',
        isOnline: false,
        isUnlocked: false,
        evChargerOn: false,
        threePinOn: false,
        currentUser: null,
        totalSessions: 18,
        totalRevenue: 890.20,
        lastUpdated: Timestamp.fromDate(new Date(Date.now() - 3600000)) // 1 hour ago
      }
    ];

    // Add boxes
    for (const box of boxes) {
      await addDoc(collection(db, 'boxes'), box);
    }

    // Sample Sessions
    const sessions = [
      {
        userId: 'user1',
        userName: 'John Doe',
        boxId: 'box1',
        boxName: 'Smart Box Alpha',
        startTime: Timestamp.now(),
        endTime: null,
        duration: 1800, // 30 minutes
        cost: 15.50,
        deviceType: 'ev_charger',
        status: 'active'
      },
      {
        userId: 'user2',
        userName: 'Jane Smith',
        boxId: 'box2',
        boxName: 'Smart Box Beta',
        startTime: Timestamp.fromDate(new Date(Date.now() - 7200000)), // 2 hours ago
        endTime: Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
        duration: 3600, // 1 hour
        cost: 45.00,
        deviceType: '3pin_socket',
        status: 'completed'
      },
      {
        userId: 'user3',
        userName: 'Mike Wilson',
        boxId: 'box1',
        boxName: 'Smart Box Alpha',
        startTime: Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 day ago
        endTime: Timestamp.fromDate(new Date(Date.now() - 84600000)), // 1 day ago
        duration: 1800, // 30 minutes
        cost: 25.75,
        deviceType: 'both',
        status: 'completed'
      }
    ];

    // Add sessions
    for (const session of sessions) {
      await addDoc(collection(db, 'sessions'), session);
    }

    console.log('Sample data setup completed!');
    return true;
  } catch (error) {
    console.error('Error setting up sample data:', error);
    return false;
  }
};
