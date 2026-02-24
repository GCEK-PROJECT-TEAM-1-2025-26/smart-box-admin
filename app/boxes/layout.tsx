"use client";

import { Navigation } from "@/components/ui/navigation";
import { useRequireAuth } from "@/lib/hooks/useAuth";

export default function BoxesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin } = useRequireAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // useRequireAuth will handle the redirect
  }
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <main>{children}</main>
    </div>
  );
}
