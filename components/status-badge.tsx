import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  待核实: "bg-slate-100 text-slate-700",
  已公开: "bg-sky-100 text-sky-700",
  已解决: "bg-emerald-100 text-emerald-700",
  已隐藏: "bg-rose-100 text-rose-700"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        statusStyles[status] || "bg-slate-100 text-slate-700"
      )}
    >
      {status}
    </span>
  );
}
