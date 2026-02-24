'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { SessionsTable } from '@/components/tables/sessions-table';
import { subscribeToSessions, forceStopSession } from '@/lib/firestore';
import { Session } from '@/types';

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToSessions((sessionsData) => {
      setSessions(sessionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleForceStop = async (sessionId: string) => {
    if (confirm('Are you sure you want to force stop this session?')) {
      try {
        await forceStopSession(sessionId);
        // Sessions list will update automatically via real-time listener
      } catch (error) {
        console.error('Error stopping session:', error);
        alert('Failed to stop session');
      }
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      (session.userName && session.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (session.boxName && session.boxName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      session.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.boxId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const activeSessions = sessions.filter(session => session.status === 'active').length;
  const totalRevenue = sessions
    .filter(session => session.status === 'completed')
    .reduce((sum, session) => sum + session.cost, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
        <p className="text-gray-600">Monitor user sessions and usage</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Sessions</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
            Active: {activeSessions}
          </span>
          <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
            Revenue: ₹{totalRevenue.toFixed(2)}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading sessions...</div>
        </div>
      ) : (
        <SessionsTable 
          sessions={filteredSessions}
          onForceStop={handleForceStop}
        />
      )}
    </div>
  );
}
