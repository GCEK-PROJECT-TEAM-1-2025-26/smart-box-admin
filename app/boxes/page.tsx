"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { BoxesTable } from "@/components/tables/boxes-table";
import { subscribeToBoxes, subscribeToUsers, updateBoxStatus, addBox } from "@/lib/firestore";
import { SmartBox, User } from "@/types";

export default function BoxesPage() {
  const { user } = useAuth();
  const [boxes, setBoxes] = useState<SmartBox[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [now, setNow] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribeBoxes = subscribeToBoxes((boxesData) => {
      setBoxes(boxesData);
      setLoading(false);
    });

    const unsubscribeUsers = subscribeToUsers((usersData) => {
      setUsers(usersData);
    });

    return () => {
      unsubscribeBoxes();
      unsubscribeUsers();
    };
  }, [user]);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setNow(Date.now());
    }, 0);

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(timer);
    };
  }, []);

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

  const computedBoxes = boxes.map((box) => {
    const isOnline = box.lastHeartbeat
      ? now - box.lastHeartbeat.getTime() < 20000
      : false;
    const owner = users.find((u) => u.id === box.ownerId);
    const ownerName = owner ? (owner.displayName || owner.email) : undefined;
    return { ...box, isOnline, ownerName };
  });

  const normalizedSearch = searchTerm.toLowerCase();

  const filteredBoxes = computedBoxes.filter((box) => {
    const name = box.name?.toLowerCase() ?? "";
    const location = box.location?.toLowerCase() ?? "";
    return (
      name.includes(normalizedSearch) || location.includes(normalizedSearch)
    );
  });

  const onlineBoxes = computedBoxes.filter((box) => box.isOnline).length;
  const unlockedBoxes = computedBoxes.filter((box) => box.isUnlocked).length;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Smart Boxes</h1>
          <p className="text-gray-300">Monitor and control smart box devices</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow border border-blue-500 transition-colors cursor-pointer"
        >
          + Add Box
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative">
          <input
            type="text"
            placeholder="Search boxes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-888 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
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

      {isModalOpen && (
        <AddBoxModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          users={users}
          onSuccess={() => {
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

interface AddBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSuccess: () => void;
}

function AddBoxModal({ isOpen, onClose, users, onSuccess }: AddBoxModalProps) {
  const [boxId, setBoxId] = useState("");
  const [location, setLocation] = useState("");
  const [latitudeStr, setLatitudeStr] = useState("");
  const [longitudeStr, setLongitudeStr] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!boxId.trim()) {
      setError("Box ID is required");
      return;
    }
    if (!location.trim()) {
      setError("Location description is required");
      return;
    }

    const latitude = parseFloat(latitudeStr);
    if (isNaN(latitude)) {
      setError("Valid latitude is required");
      return;
    }

    const longitude = parseFloat(longitudeStr);
    if (isNaN(longitude)) {
      setError("Valid longitude is required");
      return;
    }

    setSubmitting(true);
    try {
      await addBox(
        boxId.trim(),
        location.trim(),
        latitude,
        longitude,
        ownerId || undefined
      );
      onSuccess();
    } catch (err: unknown) {
      console.error("Error creating box:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create box document";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <h2 className="text-xl font-bold text-white">Add Smart Box</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
              Box ID (Device ID)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. box_003"
              value={boxId}
              onChange={(e) => setBoxId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
              Location Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Building C - Ground Floor"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 12.040710"
                value={latitudeStr}
                onChange={(e) => setLatitudeStr(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 75.368876"
                value={longitudeStr}
                onChange={(e) => setLongitudeStr(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
              Assign Owner
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="">None (Unassigned)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName || u.email} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-gray-700 flex justify-end gap-3 bg-gray-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors cursor-pointer"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Box"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
