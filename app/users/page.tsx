'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { UsersTable } from '@/components/tables/users-table';
import { subscribeToUsers, updateUserWallet, deleteUser } from '@/lib/firestore';
import { User } from '@/types';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUsers((usersData) => {
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateWallet = async (userId: string, newBalance: number) => {
    try {
      await updateUserWallet(userId, newBalance);
      // Users list will update automatically via real-time listener
    } catch (error) {
      console.error('Error updating wallet:', error);
      alert('Failed to update wallet balance');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        // Users list will update automatically via real-time listener
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600">Manage users and wallet balances</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm">
            Total Users: {users.length}
          </span>
          <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
            Active: {users.filter(u => u.isActive).length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading users...</div>
        </div>
      ) : (
        <UsersTable 
          users={filteredUsers} 
          onUpdateWallet={handleUpdateWallet}
          onDeleteUser={handleDeleteUser}
        />
      )}
    </div>
  );
}
