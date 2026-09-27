import { redirect } from "next/navigation";

/**
 * Valid Sign in with ChatGPT callbacks are consumed by the Sites runtime
 * before they reach the application. Reaching this page means that the
 * short-lived OAuth state could not be validated (for example, it expired).
 * Strip code/state from the address bar and hand off to an explicit retry;
 * never exchange tokens or manufacture a local session here.
 */
export default function ChatGPTCallbackFallbackPage() {
  redirect("/auth-retry");
}
