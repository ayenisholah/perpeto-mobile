# Mobile Testing Strategy

- Unit tests cover formatting, server-time countdowns, permissions, schemas, freshness, masking, cursor deduplication, and reducers.
- Component tests cover loading, empty, error, stale, partial, offline, and unauthorized states in both themes and at 200% text.
- Integration tests cover REST snapshot/WebSocket replay, cursor gaps, expired previews, idempotent pending operations, revocation, and recovery.
- Real-device E2E covers MFA, biometrics, onboarding, scanner-to-entry, strategy controls, unwind, approvals, push deep links, background recovery, and update enforcement.
- Accessibility evidence includes automated checks, VoiceOver, and TalkBack for critical flows.

M1A unit tests cover every server-driven auth transition, pending-user isolation, protected-route admission, revocation cleanup policy, and offline restoration lockout. Native provider cancellation, Secure Store failure/rotation, VoiceOver at 200% text, remote revocation, Apple/Google signup and linking, first-Owner bootstrap, TOTP/recovery, and deletion still require the recorded real-iPhone TestFlight matrix; unit tests are not device evidence or evidence for any trading workflow.

## M4 mobile security and live-control matrix

- Verify passkey registration/assertion on supported physical iOS and Android devices, including cancellation, wrong RP/origin/environment, expired/replayed challenge, lost device, recovery and remote session/passkey revocation.
- Prove credential fields never enter persisted state, Secure Store, MMKV, clipboard, screenshots, analytics, breadcrumbs, logs, crash reports or accessibility announcements beyond the focused masked field. Background, timeout, cancellation, error and success all clear memory/UI state.
- Verify cross-account resource links and cached data cannot switch tenant context; logout/deletion destroys session and redacted cache state.
- Verify platform connector certification and personal account preflight are displayed separately, with actionable failures for permissions, account mode, private stream, reconciliation and shadow readiness.
- Verify live arming requires a fresh native passkey ceremony and typed confirmation, displays exact scope/limits, and fails closed when offline, stale, sealed, ineligible, disarmed, breaker-active or client-incompatible.
- Verify the app accurately observes unattended execution after background/termination and recovers in-flight command state without resubmitting.
- Verify disarm, pause, close, flatten, rotate and revoke warnings/outcomes, especially that revoking an exchange key can prevent Perpeto from closing existing positions.
- Run VoiceOver/TalkBack and 200% text through enrollment, preflight, arm/disarm, critical alerts and emergency controls. Store/TestFlight success is not backend live-readiness evidence.

The iOS TestFlight workflow must reject a missing API URL, either missing Google client ID, a non-Google client-ID suffix, a mismatched reversed iOS URL scheme, or a non-HTTPS API URL before invoking EAS. A successful EAS build and App Store Connect upload do not replace provider or backend E2E evidence.

The TestFlight native prebuild must generate modular-header declarations for `GoogleUtilities` and `RecaptchaInterop`; the EAS CocoaPods phase is the authoritative macOS verification because the managed repository does not track generated native projects.
