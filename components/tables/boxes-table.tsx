import { SmartBox } from "@/types";

interface BoxesTableProps {
  boxes: SmartBox[];
  onToggleBox?: (boxId: string, isUnlocked: boolean) => void;
  onToggleDevice?: (
    boxId: string,
    deviceType: "ev" | "3pin",
    currentState: boolean
  ) => void;
  onEditTariff?: (box: SmartBox) => void;
  onDeleteBox?: (boxId: string) => void;
}

export function BoxesTable({
  boxes,
  onToggleBox,
  onToggleDevice,
  onEditTariff,
  onDeleteBox,
}: BoxesTableProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBoxRevenue = (revenue: number | undefined | null) => {
    if (typeof revenue !== "number" || Number.isNaN(revenue)) {
      return "0.00";
    }
    return revenue.toFixed(2);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Box Info
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Devices
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Tariff
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Current User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Statistics
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Last Updated
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {boxes.map((box) => (
            <tr key={box.id} className="hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-white">
                    {box.name}
                  </div>
                  <div className="text-sm text-gray-300">{box.location}</div>
                  <div className="text-xs text-gray-500 font-mono">ID: {box.id}</div>
                  {box.ownerName && (
                    <div className="text-xs text-blue-400 font-medium mt-0.5">
                      Owner: {box.ownerName}
                    </div>
                  )}
                  {box.latitude !== undefined && box.longitude !== undefined && (
                    <div className="text-xs text-gray-400 mt-0.5 font-mono">
                      GPS: {box.latitude.toFixed(6)}, {box.longitude.toFixed(6)}
                    </div>
                  )}
                  {box.status === 'pending_provision' && box.pendingRegistrationId && (
                    <div className="text-xs font-mono font-bold text-yellow-400 mt-2 bg-yellow-900/30 px-2 py-1 rounded-md inline-block border border-yellow-700/50">
                      Provisioning Code: {box.pendingRegistrationId}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      box.isOnline
                        ? "bg-green-900 text-green-300 border border-green-700"
                        : "bg-red-900 text-red-300 border border-red-700"
                    }`}
                  >
                    {box.isOnline ? "Online" : "Offline"}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      box.isUnlocked
                        ? "bg-yellow-900 text-yellow-300 border border-yellow-700"
                        : "bg-blue-900 text-blue-300 border border-blue-700"
                    }`}
                  >
                    {box.isUnlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-sm text-gray-300">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      EV:
                    </div>
                    <button
                      onClick={() =>
                        onToggleDevice &&
                        onToggleDevice(box.id, "ev", box.evChargerOn)
                      }
                      className={`px-2 py-1 text-xs rounded ${
                        box.evChargerOn
                          ? "bg-green-900 text-green-300 hover:bg-green-800 border border-green-700"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                      }`}
                      disabled={!box.isUnlocked}
                    >
                      {box.evChargerOn ? "ON" : "OFF"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-sm text-gray-300">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2V3z"
                        />
                      </svg>
                      3-Pin:
                    </div>
                    <button
                      onClick={() =>
                        onToggleDevice &&
                        onToggleDevice(box.id, "3pin", box.threePinOn)
                      }
                      className={`px-2 py-1 text-xs rounded ${
                        box.threePinOn
                          ? "bg-green-900 text-green-300 hover:bg-green-800 border border-green-700"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                      }`}
                      disabled={!box.isUnlocked}
                    >
                      {box.threePinOn ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>
              </td>

              {/* Tariff column */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-blue-400 font-semibold">⚡</span>
                    <span className="text-white font-mono">
                      ₹{(box.tariff?.evRate ?? 12).toFixed(2)}
                    </span>
                    <span className="text-gray-500">/kWh</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-400 font-semibold">🔌</span>
                    <span className="text-white font-mono">
                      ₹{(box.tariff?.socketRate ?? 8).toFixed(2)}
                    </span>
                    <span className="text-gray-500">/kWh</span>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                {box.currentUser ? (
                  <span className="text-blue-400">{box.currentUser}</span>
                ) : (
                  <span className="text-gray-500">None</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-white">
                  <div>Sessions: {box.totalSessions}</div>
                  <div className="text-green-400">
                    ₹{formatBoxRevenue(box.totalRevenue)}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {formatDate(box.lastUpdated)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() =>
                      onToggleBox && onToggleBox(box.id, box.isUnlocked)
                    }
                    className={`px-3 py-1 rounded text-sm border ${
                      box.isUnlocked
                        ? "bg-red-900 text-red-300 hover:bg-red-800 border-red-700"
                        : "bg-green-900 text-green-300 hover:bg-green-800 border-green-700"
                    }`}
                    disabled={!box.isOnline}
                  >
                    {box.isUnlocked ? "Lock" : "Unlock"}
                  </button>
                  <button
                    onClick={() => onEditTariff && onEditTariff(box)}
                    className="px-3 py-1 rounded text-sm border bg-blue-900/60 text-blue-300 hover:bg-blue-800 border-blue-700 cursor-pointer"
                  >
                    Edit Tariff
                  </button>
                  <button
                    onClick={() => onDeleteBox && onDeleteBox(box.id)}
                    className="px-3 py-1 rounded text-sm border bg-red-900/60 text-red-300 hover:bg-red-800 border-red-700 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {boxes.length === 0 && (
        <div className="text-center py-8 text-gray-400">No boxes found</div>
      )}
    </div>
  );
}
