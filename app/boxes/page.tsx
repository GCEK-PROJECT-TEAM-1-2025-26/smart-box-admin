"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { BoxesTable } from "@/components/tables/boxes-table";
import { subscribeToBoxes, updateBoxStatus } from "@/lib/firestore";
import { SmartBox } from "@/types";

export default function BoxesPage() {
  const { user } = useAuth();
  const [boxes, setBoxes] = useState<SmartBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToBoxes((boxesData) => {
      setBoxes(boxesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleToggleBox = async (boxId: string, isUnlocked: boolean) => {
    try {
      await updateBoxStatus(boxId, { isUnlocked: !isUnlocked });
    } catch (error) {
      console.error("Error toggling box:", error);
      alert("Failed to toggle box status");
    }
  };

  const handleToggleDevice = async (
    boxId: string,
    deviceType: "ev" | "3pin",
    currentState: boolean
  ) => {
    try {
      const update =
        deviceType === "ev"
          ? { evChargerOn: !currentState }
          : { threePinOn: !currentState };

      await updateBoxStatus(boxId, update);
    } catch (error) {
      console.error("Error toggling device:", error);
      alert("Failed to toggle device");
    }
  };

  const filteredBoxes = boxes.filter(
    (box) =>
      box.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      box.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineBoxes = boxes.filter((box) => box.isOnline).length;
  const unlockedBoxes = boxes.filter((box) => box.isUnlocked).length;
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Smart Boxes</h1>
        <p className="text-gray-300">Monitor and control smart box devices</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative">
          <input
            type="text"
            placeholder="Search boxes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />{" "}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-2 bg-green-900 text-green-300 rounded-lg text-sm border border-green-700">
            Online: {onlineBoxes}/{boxes.length}
          </span>
          <span className="px-3 py-2 bg-yellow-900 text-yellow-300 rounded-lg text-sm border border-yellow-700">
            Unlocked: {unlockedBoxes}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-300">Loading boxes...</div>
        </div>
      ) : (
        <BoxesTable
          boxes={filteredBoxes}
          onToggleBox={handleToggleBox}
          onToggleDevice={handleToggleDevice}
        />
      )}
    </div>
  );
}
