/// <reference types="node" />
/**
 * Dependency audit gate for CI: `node scripts/audit.ts`.
 *
 * Runs `npm audit --omit=dev --json` and fails on every high or critical
 * advisory in the shipped dependency tree, except advisories listed in
 * `scripts/audit-allowlist.json`. Each allowlist entry names one advisory URL,
 * explains why it is not exploitable here and why it cannot be fixed yet, and
 * carries an expiry date; an expired entry fails the gate again, so every
 * exception is re-reviewed rather than forgotten.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export interface AllowlistEntry {
  readonly advisory: string;
  readonly package: string;
  readonly reason: string;
  readonly expires: string;
}

interface Advisory {
  readonly url: string;
  readonly title: string;
  readonly severity: string;
}

interface Vulnerability {
  readonly name: string;
  readonly via: readonly (string | Advisory)[];
}

export interface AuditReport {
  readonly vulnerabilities?: Readonly<Record<string, Vulnerability>>;
}

export interface Finding {
  readonly package: string;
  readonly advisory: string;
  readonly title: string;
  readonly severity: string;
}

const BLOCKING = new Set(["high", "critical"]);

/** Every high or critical advisory, attributed to the package that carries it. */
export function blockingFindings(report: AuditReport): Finding[] {
  const findings: Finding[] = [];
  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vulnerability.via) {
      if (typeof via === "string" || !BLOCKING.has(via.severity)) continue;
      findings.push({
        package: vulnerability.name,
        advisory: via.url,
        title: via.title,
        severity: via.severity,
      });
    }
  }
  return findings;
}

/**
 * Findings that block the build: those with no allowlist entry, or whose entry
 * has expired or names a different package.
 */
export function unreviewedFindings(
  findings: readonly Finding[],
  allowlist: readonly AllowlistEntry[],
  today: string,
): Finding[] {
  return findings.filter((finding) => {
    const entry = allowlist.find((candidate) => candidate.advisory === finding.advisory);
    return entry === undefined || entry.package !== finding.package || entry.expires < today;
  });
}

/** Allowlist entries whose expiry date has passed. */
export function expiredEntries(allowlist: readonly AllowlistEntry[], today: string): AllowlistEntry[] {
  return allowlist.filter((entry) => entry.expires < today);
}

function main(): void {
  const allowlist = JSON.parse(
    readFileSync(new URL("./audit-allowlist.json", import.meta.url), "utf8"),
  ) as AllowlistEntry[];
  let output: string;
  try {
    output = execFileSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8" });
  } catch (error) {
    // npm audit exits non-zero whenever it finds anything; the JSON is still on stdout.
    const stdout = (error as { stdout?: unknown }).stdout;
    if (typeof stdout !== "string") throw error;
    output = stdout;
  }
  const today = new Date().toISOString().slice(0, 10);
  const findings = blockingFindings(JSON.parse(output) as AuditReport);
  const blocking = unreviewedFindings(findings, allowlist, today);
  for (const entry of expiredEntries(allowlist, today)) {
    console.error(`audit: allowlist entry for ${entry.package} (${entry.advisory}) expired on ${entry.expires}`);
  }
  for (const finding of blocking) {
    console.error(`audit: ${finding.severity} ${finding.package}: ${finding.title} (${finding.advisory})`);
  }
  const allowed = findings.length - blocking.length;
  console.warn(`audit: ${findings.length} high/critical finding(s), ${allowed} reviewed in scripts/audit-allowlist.json`);
  if (blocking.length > 0) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
