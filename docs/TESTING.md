# Mobile Testing Strategy

- Unit tests cover formatting, server-time countdowns, permissions, schemas, freshness, masking, cursor deduplication, and reducers.
- Component tests cover loading, empty, error, stale, partial, offline, and unauthorized states at 200% text. The interface is dark only, and `src/theme/colors.test.ts` holds every colour pairing to WCAG 2.2 AA.
- Integration tests cover REST snapshot/WebSocket replay, cursor gaps, expired previews, idempotent pending operations, revocation, and recovery.
- Real-device E2E (M3) covers sign-in, the demo viewer, scanner-to-entry in paper, strategy controls, unwind, push deep links, background recovery, and update enforcement.
- Accessibility evidence includes automated checks, VoiceOver, and TalkBack for critical flows.

## Dependency audit

`npm run audit:deps` (`scripts/audit.ts`, tested in `scripts/audit.test.ts`) runs `npm audit --omit=dev` and fails on any high or critical advisory in the shipped tree that is not reviewed in `scripts/audit-allowlist.json`. Each entry names one advisory and its package, explains why it is not exploitable here and why it cannot be fixed yet, and expires; an expired entry fails the gate again. CI runs it on every PR, and `dependency-review-action` still covers dev dependencies at full severity.

Authentication unit tests cover every server-driven auth transition, pending-user isolation, protected-route admission, revocation cleanup policy, and offline restoration lockout. Native provider cancellation, Secure Store failure/rotation, VoiceOver at 200% text, remote revocation, Apple/Google signup and linking, first-Owner bootstrap, TOTP/recovery, and deletion still require the recorded real-iPhone TestFlight matrix; unit tests are not device evidence or evidence for any trading workflow.

## Milestone evidence

- **M2:** component tests for live-data freshness, stale-feed and blocked-entry states.
- **M3:**
  - a test that demo-viewer mode renders no enabled mutation;
  - a smoke run of the hosted web build against staging;
  - VoiceOver at 200% text through the five tabs and the emergency controls;
  - TestFlight tester availability.
- **M4:** screenshots of the Exchanges surface against testnet and demo accounts.

The flag-gated hardening surfaces (passkeys, credential enrollment, preflight, pilot, audit) keep their unit tests. Their physical-device passkey matrix is optional and is not a milestone gate (DEC-0015).

The iOS TestFlight workflow must reject a missing API URL, either missing Google client ID, a non-Google client-ID suffix, a mismatched reversed iOS URL scheme, or a non-HTTPS API URL before invoking EAS. A successful EAS build and App Store Connect upload do not replace provider or backend E2E evidence.

The TestFlight native prebuild must generate modular-header declarations for `GoogleUtilities` and `RecaptchaInterop`; the EAS CocoaPods phase is the authoritative macOS verification because the managed repository does not track generated native projects.
