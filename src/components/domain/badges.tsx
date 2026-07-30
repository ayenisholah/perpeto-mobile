import type { Venue } from "@ayenisholah/perpeto-api-client";

import type { ColorRole } from "@/theme";
import { formatClock } from "@/utils/decimal";

import { Badge } from "../Badge";
import type { IconName } from "../Icon";

interface FreshnessBadgeProps {
  readonly stale: boolean;
  readonly loadedAt?: number;
  readonly offline?: boolean;
}

/**
 * Data freshness, which section 12.1 gives the same visual weight as yield.
 * Mint `signal` appears here and in almost nowhere else: it is the one role
 * that means "fresh and threshold-qualified".
 */
export function FreshnessBadge({ stale, loadedAt, offline = false }: FreshnessBadgeProps) {
  if (offline) return <Badge icon="offline" label="Offline" tone="warning" />;
  if (loadedAt === undefined) return <Badge icon="stale" label="No data" tone="stale" />;
  if (stale) {
    return <Badge icon="stale" label={`Stale · ${formatClock(new Date(loadedAt).toISOString())}`} tone="stale" />;
  }
  return <Badge icon="signal" label="Fresh" tone="signal" />;
}

/** Venue attribution. Neutral by design — a venue is not a state. */
export function VenueBadge({ venue }: { readonly venue: Venue | string }) {
  return <Badge label={venue} tone="textSecondary" />;
}

const healthTones: Readonly<Record<string, { readonly tone: ColorRole; readonly icon: IconName }>> = {
  HEALTHY: { tone: "healthy", icon: "healthy" },
  DEGRADED: { tone: "warning", icon: "warning" },
  STALE: { tone: "stale", icon: "stale" },
  UNHEALTHY: { tone: "critical", icon: "critical" },
  DOWN: { tone: "critical", icon: "critical" },
};

/** Venue or service health. Colour, word and glyph always travel together. */
export function HealthStatus({ status }: { readonly status: string }) {
  const visual = healthTones[status] ?? { tone: "textSecondary" as const, icon: "stale" as const };
  return <Badge icon={visual.icon} label={status.replaceAll("_", " ")} tone={visual.tone} />;
}
