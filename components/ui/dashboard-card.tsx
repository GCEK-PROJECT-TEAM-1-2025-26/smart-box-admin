interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "yellow" | "red";
}

const colorClasses = {
  blue: "bg-gray-900 border-blue-500 text-blue-400",
  green: "bg-gray-900 border-green-500 text-green-400",
  purple: "bg-gray-900 border-purple-500 text-purple-400",
  yellow: "bg-gray-900 border-yellow-500 text-yellow-400",
  red: "bg-gray-900 border-red-500 text-red-400",
};

export function DashboardCard({
  title,
  value,
  icon,
  color,
}: DashboardCardProps) {
  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-300 opacity-75">
            {title}
          </p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
      </div>
    </div>
  );
}
