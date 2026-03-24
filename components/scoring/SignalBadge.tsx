import { SIGNAL_LABELS } from "@/lib/scoring";
import type { BusinessSignal } from "@/types";

export default function SignalBadge({
  signal,
  compact = false,
}: {
  signal: string;
  compact?: boolean;
}) {
  const config = SIGNAL_LABELS[signal as BusinessSignal];
  if (!config) return null;

  return (
    <span
      className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded border"
      style={{
        backgroundColor: config.style.bg,
        color: config.style.color,
        borderColor: config.style.border,
      }}
      title={compact ? config.description : undefined}
    >
      {config.label}
    </span>
  );
}
