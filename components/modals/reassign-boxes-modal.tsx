import React, { useState } from 'react';
import { User, SmartBox } from '@/types';

interface ReassignBoxesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newOwnerId: string | null) => Promise<void>;
  boxesToReassign: SmartBox[];
  users: User[];
  deletingUser: User | null;
}

export function ReassignBoxesModal({
  isOpen,
  onClose,
  onConfirm,
  boxesToReassign,
  users,
  deletingUser
}: ReassignBoxesModalProps) {
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('admin'); // 'admin' represents null
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !deletingUser) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm(selectedOwnerId === 'admin' ? null : selectedOwnerId);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Reassign Boxes
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          The user <strong>{deletingUser.email}</strong> currently owns {boxesToReassign.length} box(es). 
          You must reassign these boxes before deleting the user.
        </p>
        
        <div className="mb-4 max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {boxesToReassign.map(box => (
              <li key={box.id}>{box.name} ({box.location || 'Unknown Location'})</li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select New Owner:
          </label>
          <select
            value={selectedOwnerId}
            onChange={(e) => setSelectedOwnerId(e.target.value)}
            className="w-full p-2 border border-gray-300 text-gray-900 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="admin">Admin (No specific owner)</option>
            {users
              .filter(u => u.id !== deletingUser.id)
              .map(u => (
                <option key={u.id} value={u.id}>
                  {u.email} {u.displayName ? `(${u.displayName})` : ''}
                </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center"
          >
            {isProcessing ? 'Processing...' : 'Reassign & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
