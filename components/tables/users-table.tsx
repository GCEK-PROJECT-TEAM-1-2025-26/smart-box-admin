import { User } from "@/types";
import { useState } from "react";

interface UsersTableProps {
  users: User[];
  onUpdateWallet?: (userId: string, newBalance: number) => void;
  onDeleteUser?: (userId: string) => void;
}

export function UsersTable({
  users,
  onUpdateWallet,
  onDeleteUser,
}: UsersTableProps) {
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<number>(0);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleWalletEdit = (userId: string, currentBalance: number) => {
    setEditingWallet(userId);
    setNewBalance(currentBalance);
  };

  const handleWalletSave = (userId: string) => {
    if (onUpdateWallet) {
      onUpdateWallet(userId, newBalance);
    }
    setEditingWallet(null);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Wallet Balance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Usage
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created At
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-medium text-sm">
                        {(user.displayName || user.email)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user.displayName || "No Name"}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingWallet === user.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">₹</span>
                    <input
                      type="number"
                      value={newBalance}
                      onChange={(e) => setNewBalance(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      step="0.01"
                    />
                    <button
                      onClick={() => handleWalletSave(user.id)}
                      className="text-green-600 hover:text-green-900 text-sm"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingWallet(null)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      ₹{user.walletBalance.toFixed(2)}
                    </span>
                    <button
                      onClick={() =>
                        handleWalletEdit(user.id, user.walletBalance)
                      }
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.totalUsage.toFixed(2)} kWh
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(user.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onDeleteUser && onDeleteUser(user.id)}
                  className="text-red-600 hover:text-red-900 ml-3"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">No users found</div>
      )}
    </div>
  );
}
