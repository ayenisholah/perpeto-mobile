import { PerpetoApiError } from "@ayenisholah/perpeto-api-client";

/**
 * The sentinel the API client uses when a failure response carried no
 * `problem+json` body to describe itself. Any other code means the server sent
 * a human-readable `title`, and `error.message` is that title — worth showing.
 * `REQUEST_FAILED` means the message is only `"…failed with HTTP <status>"`,
 * which must never reach a user.
 */
const UNDESCRIBED = "REQUEST_FAILED";

export interface FailureCopy {
  readonly title: string;
  readonly detail: string;
  readonly tone: "warning" | "critical";
  /** False where retrying cannot help, so the surface omits the button. */
  readonly retryable: boolean;
}

/**
 * Turns a thrown request failure into something worth reading. Errors explain
 * what happened and what to do next, in the interface's voice, and never
 * expose a status code — a person cannot act on "HTTP 404".
 */
export function describeFailure(error: unknown): FailureCopy {
  // `fetch` rejects with TypeError when it cannot reach the host at all.
  if (error instanceof TypeError) {
    return {
      title: "No connection to Perpeto",
      detail: "The device is offline or the backend is unreachable. Anything shown may be out of date.",
      tone: "warning",
      retryable: true,
    };
  }

  if (!(error instanceof PerpetoApiError)) {
    return {
      title: "Something went wrong",
      detail: "Perpeto could not complete that request. Try again in a moment.",
      tone: "critical",
      retryable: true,
    };
  }

  if (error.code !== UNDESCRIBED) {
    return {
      title: error.message,
      detail: "",
      tone: error.status >= 500 ? "critical" : "warning",
      retryable: error.status >= 500 || error.status === 429,
    };
  }

  switch (error.status) {
    case 401:
      return {
        title: "Your session expired",
        detail: "Sign in again to continue.",
        tone: "warning",
        retryable: false,
      };
    case 403:
      return {
        title: "Your role does not allow this",
        detail: "An Owner can grant the access this action needs.",
        tone: "warning",
        retryable: false,
      };
    case 404:
      // The backend answers a real missing record with a described 404, so an
      // undescribed one means the route itself is absent: the app and the
      // server are built against different API versions.
      return {
        title: "This app and the server disagree",
        detail:
          "The backend does not offer this data. Install the latest build from TestFlight; if it keeps happening, the deployment needs attention.",
        tone: "critical",
        retryable: false,
      };
    case 429:
      return {
        title: "Too many requests",
        detail: "Perpeto is rate-limiting this device. Wait a moment, then try again.",
        tone: "warning",
        retryable: true,
      };
    default:
      return error.status >= 500
        ? {
            title: "Perpeto's backend is having trouble",
            detail: "The request reached the server but it could not answer. Try again shortly.",
            tone: "critical",
            retryable: true,
          }
        : {
            title: "That request was refused",
            detail: "Perpeto could not complete it. Try again, or check the Health screen.",
            tone: "warning",
            retryable: true,
          };
  }
}
