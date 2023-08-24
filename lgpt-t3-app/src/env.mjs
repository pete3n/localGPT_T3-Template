import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    GPT_URL: z.string().url(),
    GPT_PROMPT_ROUTE: z.string(),
    GPT_PROMPT_BODY_KEY: z.string(),
    GPT_SAVE_ROUTE: z.string(),
    GPT_DELETE_ROUTE: z.string(),
    GPT_INGEST_ROUTE: z.string(),
    NODE_ENV: z.enum(["development", "test", "production"]),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    GPT_URL: process.env.GPT_URL,
    GPT_PROMPT_ROUTE: process.env.GPT_PROMPT_ROUTE,
    GPT_PROMPT_BODY_KEY: process.env.GPT_PROMPT_BODY_KEY,
    GPT_SAVE_ROUTE: process.env.GPT_SAVE_ROUTE,
    GPT_DELETE_ROUTE: process.env.GPT_DELETE_ROUTE,
    GPT_INGEST_ROUTE: process.env.GPT_INGEST_ROUTE,
    NODE_ENV: process.env.NODE_ENV,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
