"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { StatsChart } from "@/components/charts/stats-chart";
import { subscribeToStats } from "@/lib/firestore";
import { DashboardStats } from "@/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBoxes: 0,
    activeBoxes: 0,
    totalUsers: 0,
    activeUsers: 0,
    activeSessions: 0,
    todayRevenue: 0,
    totalRevenue: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToStats((newStats) => {
      setStats(newStats);
      setStatsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading...
      </div>
    );
  }
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-300">Welcome back, {user?.email}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {" "}
        <DashboardCard
          title="Total Boxes"
          value={statsLoading ? "..." : (stats?.totalBoxes || 0).toString()}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          }
          color="blue"
        />{" "}
        <DashboardCard
          title="Active Boxes"
          value={statsLoading ? "..." : (stats?.activeBoxes || 0).toString()}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          color="green"
        />{" "}
        <DashboardCard
          title="Total Users"
          value={statsLoading ? "..." : (stats?.totalUsers || 0).toString()}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          color="purple"
        />{" "}
        <DashboardCard
          title="Active Sessions"
          value={statsLoading ? "..." : (stats?.activeSessions || 0).toString()}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          }
          color="yellow"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {" "}
        <DashboardCard
          title="Today's Revenue"
          value={
            statsLoading ? "..." : `₹${(stats?.todayRevenue || 0).toFixed(2)}`
          }
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          }
          color="green"
        />{" "}
        <DashboardCard
          title="Total Revenue"
          value={
            statsLoading ? "..." : `₹${(stats?.totalRevenue || 0).toFixed(2)}`
          }
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
          }
          color="purple"
        />
      </div>{" "}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-white mb-4">
            Box Usage Over Time
          </h3>
          <StatsChart type="line" />
        </div>
        <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-white mb-4">
            Revenue Distribution
          </h3>
          <StatsChart type="pie" />
        </div>{" "}
      </div>
    </div>
  );
}
