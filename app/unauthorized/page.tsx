"use client";

import { useAuth } from "@/lib/hooks/useAuth";

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-12 w-12 text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            You are not authorized to access this admin panel.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Signed in as: {user?.email}
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-black"
          >
            Sign out
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          If you believe this is an error, please contact the administrator.
        </div>
      </div>
    </div>
  );
}
