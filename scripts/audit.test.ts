import { describe, expect, it } from "vitest";

import { blockingFindings, expiredEntries, unreviewedFindings, type AuditReport } from "./audit";

const report: AuditReport = {
  vulnerabilities: {
    "image-size": {
      name: "image-size",
      via: [
        { url: "https://example.test/HIGH-1", title: "loop", severity: "high" },
        { url: "https://example.test/MOD-1", title: "minor", severity: "moderate" },
      ],
    },
    metro: { name: "metro", via: ["image-size"] },
    lodash: {
      name: "lodash",
      via: [{ url: "https://example.test/CRIT-1", title: "pollution", severity: "critical" }],
    },
  },
};

const entry = {
  advisory: "https://example.test/HIGH-1",
  package: "image-size",
  reason: "bundle-time only",
  expires: "2027-02-28",
};

describe("dependency audit gate", () => {
  it("collects only high and critical advisories, ignoring transitive pointers", () => {
    expect(blockingFindings(report).map((finding) => finding.advisory)).toEqual([
      "https://example.test/HIGH-1",
      "https://example.test/CRIT-1",
    ]);
  });

  it("treats an empty report as clean", () => {
    expect(blockingFindings({})).toEqual([]);
  });

  it("lets a reviewed, unexpired advisory through and blocks the rest", () => {
    const blocking = unreviewedFindings(blockingFindings(report), [entry], "2026-11-22");
    expect(blocking.map((finding) => finding.package)).toEqual(["lodash"]);
  });

  it("blocks again once the review expires", () => {
    const blocking = unreviewedFindings(blockingFindings(report), [entry], "2027-03-01");
    expect(blocking).toHaveLength(2);
    expect(expiredEntries([entry], "2027-03-01")).toEqual([entry]);
    expect(expiredEntries([entry], "2027-02-28")).toEqual([]);
  });

  it("does not let an entry for one package excuse the same advisory on another", () => {
    const blocking = unreviewedFindings(
      blockingFindings(report),
      [{ ...entry, package: "other" }],
      "2026-11-22",
    );
    expect(blocking).toHaveLength(2);
  });
});
