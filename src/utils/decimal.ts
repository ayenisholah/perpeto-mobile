import type { DecimalString } from "@ayenisholah/perpeto-api-client";

/**
 * Display-only conversion. Decimals cross the API boundary as strings and must
 * stay lossless (`docs/ENGINEERING.md`), so `Number` appears here and nowhere
 * else: these helpers format for the screen and their output never feeds a
 * request payload or further arithmetic.
 */
export function displayDecimal(value: DecimalString): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPercent(value: DecimalString): string {
  return `${(displayDecimal(value) * 100).toFixed(2)}%`;
}

export function formatUsd(value: DecimalString): string {
  return `$${Math.round(displayDecimal(value)).toLocaleString("en-US")}`;
}

export function formatDecimal(value: DecimalString, fractionDigits: number): string {
  return displayDecimal(value).toFixed(fractionDigits);
}

/**
 * Halves a decimal string exactly, in `BigInt`, because the result is sent
 * back to the server as a strategy exit threshold rather than merely shown.
 */
export function halfDecimal(value: DecimalString): DecimalString {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [whole, fraction = ""] = unsigned.split(".");
  const scale = 10n ** BigInt(fraction.length);
  let units = BigInt(whole) * scale + BigInt(fraction || "0");
  let outputScale = fraction.length;
  if (units % 2n !== 0n) {
    units *= 5n;
    outputScale += 1;
  } else {
    units /= 2n;
  }
  const digits = units.toString().padStart(outputScale + 1, "0");
  const result = outputScale === 0
    ? digits
    : `${digits.slice(0, -outputScale)}.${digits.slice(-outputScale)}`.replace(/\.?0+$/, "");
  return negative && result !== "0" ? `-${result}` : result;
}

export function formatClock(iso: string): string {
  if (iso === "") return "—";
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Whole-minute countdown to a server timestamp, for funding settlement. */
export function minutesUntil(iso: string, now: number = Date.now()): number | undefined {
  const parsed = new Date(iso).getTime();
  if (Number.isNaN(parsed)) return undefined;
  return Math.max(0, Math.round((parsed - now) / 60_000));
}

/** "4h 12m", "12m", or "due" — never a bare number of minutes. */
export function formatCountdown(minutes: number): string {
  if (minutes <= 0) return "due";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
