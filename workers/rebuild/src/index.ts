// A separate Worker so the site Worker stays static assets only (ADR 0002).
// It has no fetch handler: the Cron Trigger is its only entry point.

interface Env {
  /** Workers Builds deploy hook URL. The URL is the credential, so it is a secret. */
  DEPLOY_HOOK_URL: string;
}

export default {
  async scheduled(_controller: unknown, env: Env): Promise<void> {
    const response = await fetch(env.DEPLOY_HOOK_URL, { method: "POST" });
    // Throwing surfaces the run as failed in the cron logs; the URL stays out
    // of the message. Tomorrow's run is the retry.
    if (!response.ok) {
      throw new Error(`deploy hook returned ${response.status}`);
    }
  },
};
