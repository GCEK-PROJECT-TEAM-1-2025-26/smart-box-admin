import { Session } from "@/types";

interface SessionsTableProps {
  sessions: Session[];
  onForceStop?: (sessionId: string, boxId: string) => void;
}

export function SessionsTable({ sessions, onForceStop }: SessionsTableProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    if (!deviceType) return "🛠";
    switch (deviceType) {
      case "ev_charger":
        return "⚡";
      case "3pin_socket":
        return "🔌";
      case "both":
        return "⚡🔌";
      default:
        return "🛠";
    }
  };

  const formatDeviceLabel = (deviceType?: string) => {
    if (!deviceType) return "Unknown";
    return deviceType.replace(/_/g, " ");
  };

  const formatCost = (cost: number | undefined | null) => {
    if (typeof cost !== "number" || Number.isNaN(cost)) {
      return "0.00";
    }
    return cost.toFixed(2);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-md">
      <div className="px-6 pt-4 pb-2 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Sessions</h2>
        <span className="text-xs text-gray-400">
          {sessions.length} session{sessions.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-800/70">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Box
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Start Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-800">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-300">
                      {session.userName || "Unknown User"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {session.userId}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-300">
                      {session.boxName || session.boxId}
                    </div>
                    <div className="text-sm text-gray-500">{session.boxId}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {getDeviceIcon(session.deviceType)}
                    </span>
                    <span className="text-sm capitalize text-gray-300">
                      {formatDeviceLabel(session.deviceType)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {session.status === "active" ? (
                    <span className="font-medium text-yellow-600">
                      {formatDuration(session.duration)} (Live)
                    </span>
                  ) : (
                    <span>{formatDuration(session.duration)}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                  ₹{formatCost(session.cost)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      session.status === "active"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {session.status.charAt(0).toUpperCase() +
                      session.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div>{formatDate(session.startTime)}</div>
                    {session.endTime && (
                      <div className="text-xs text-gray-400">
                        Ended: {formatDate(session.endTime)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {session.status === "active" && (
                    <button
                      onClick={() => onForceStop && onForceStop(session.id, session.boxId)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Force Stop
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sessions.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-400">
          No sessions found
        </div>
      )}
    </div>
  );
}
