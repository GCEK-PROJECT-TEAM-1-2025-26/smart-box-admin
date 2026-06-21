"use client";

import { useState, useEffect } from 'react';
import { Session } from '@/types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface StatsChartProps {
  type: 'line' | 'pie';
  sessions: Session[];
}

export function StatsChart({ type, sessions }: StatsChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-64 bg-gray-900/50 border border-gray-800 rounded-lg flex items-center justify-center animate-pulse">
        <span className="text-sm text-gray-500">Loading chart...</span>
      </div>
    );
  }

  // --- 1. Line Chart Data Preparation ---
  // Generate daily session counts for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  const lineChartData = last7Days.map((date) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const daySessions = sessions.filter((s) => {
      const start = s.startTime;
      return start >= date && start < nextDate;
    });

    const evCount = daySessions.filter(
      (s) => s.deviceType === 'ev_charger' || s.deviceType === 'both'
    ).length;
    const socketCount = daySessions.filter(
      (s) => s.deviceType === '3pin_socket' || s.deviceType === 'both'
    ).length;

    return {
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'EV Charger': evCount,
      '3-Pin Socket': socketCount,
      Total: daySessions.length,
    };
  });

  // --- 2. Pie Chart Data Preparation ---
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  let evRevenue = 0;
  let socketRevenue = 0;
  let combinedRevenue = 0;

  completedSessions.forEach((s) => {
    if (s.deviceType === 'ev_charger') {
      evRevenue += s.cost;
    } else if (s.deviceType === '3pin_socket') {
      socketRevenue += s.cost;
    } else {
      combinedRevenue += s.cost;
    }
  });

  const rawPieData = [
    { name: 'EV Charger', value: parseFloat(evRevenue.toFixed(2)) },
    { name: '3-Pin Socket', value: parseFloat(socketRevenue.toFixed(2)) },
    { name: 'Combined (Both)', value: parseFloat(combinedRevenue.toFixed(2)) },
  ];

  const pieData = rawPieData.filter((item) => item.value > 0);
  const totalRevenue = pieData.reduce((sum, item) => sum + item.value, 0);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#a855f7'];

  if (type === 'line') {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={lineChartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                borderColor: '#4b5563',
                borderRadius: '0.5rem',
                color: '#fff',
                fontSize: '13px',
              }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ fontWeight: 'bold', color: '#9ca3af' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
            />
            <Line
              type="monotone"
              dataKey="EV Charger"
              stroke="#3b82f6"
              strokeWidth={3}
              activeDot={{ r: 6 }}
              dot={{ strokeWidth: 2, r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="3-Pin Socket"
              stroke="#10b981"
              strokeWidth={3}
              activeDot={{ r: 6 }}
              dot={{ strokeWidth: 2, r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="Total"
              stroke="#a855f7"
              strokeWidth={2}
              strokeDasharray="4 4"
              activeDot={{ r: 4 }}
              dot={{ strokeWidth: 1, r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-72 w-full flex flex-col md:flex-row items-center justify-center">
      {pieData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-2 text-gray-500">📊</div>
          <span className="text-sm text-gray-400">No completed session revenue yet</span>
        </div>
      ) : (
        <>
          <div className="h-56 w-56 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[rawPieData.findIndex((p) => p.name === entry.name) % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string | undefined) => [`₹${Number(value || 0).toFixed(2)}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#4b5563',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-4 md:mt-0 md:ml-6 w-full max-w-xs">
            {pieData.map((item) => {
              const color = PIE_COLORS[rawPieData.findIndex((p) => p.name === item.name) % PIE_COLORS.length];
              const percentage = ((item.value / totalRevenue) * 100).toFixed(1);
              return (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-gray-300">{item.name}</span>
                  </div>
                  <span className="font-semibold text-white">
                    ₹{item.value.toFixed(2)} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
