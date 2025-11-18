import { AlertCircle, WifiOff } from "lucide-react";

interface EmptyProps {
  title?: string;
  description?: string;
  icon?: "error" | "network";
  action?: React.ReactNode;
}

export function Empty({
  title = "No data available",
  description = "Unable to load data. Please try again.",
  icon = "error",
  action,
}: EmptyProps) {
  const Icon = icon === "network" ? WifiOff : AlertCircle;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
      <div className="rounded-full bg-[#222] p-4 mb-4">
        <Icon className="w-8 h-8 text-[#666]" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#888] mb-4 max-w-sm">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
