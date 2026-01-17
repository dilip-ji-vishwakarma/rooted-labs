// src/lib/api/config.ts

export type ClientConfig = {
  env: { dev_url: string; prod_url: string };
  use_mock?: boolean;
  theme?: string;
  auth_mode?: string;
};

// ---- Test overrides ---------------------------------------------------------
let __mockOverride: boolean | null = null;

/** Jest/tests can force mock or direct routing explicitly */
export function __setMockOverrideForTests(v: boolean | null) {
  __mockOverride = v;
}

// ---- Client identity (hard-coded default, env can override) -----------------
export function getClientName(): string {
  return process.env.NEXT_PUBLIC_CLIENT_NAME || "";
}

// Expose as a constant for easy imports
export const CLIENT = getClientName();

// ---- Config loader (compat; not used by API directly) -----------------------
export function loadClientConfig(): ClientConfig {
  return {
    env: {
      dev_url: "http://localhost:8000/api",
      prod_url: "http://localhost:8000/api",
    },
    use_mock: undefined,
  };
}

// ---- Mock mode: default ON unless explicitly disabled ----------------------
export function isMockMode(): boolean {
  if (__mockOverride !== null) return __mockOverride;

  const v = process.env.NEXT_PUBLIC_USE_MOCK;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;

  return true; // default ON so tests don't hit network unless you say so
}

/** Convenience export used across the codebase */
export const USE_MOCK = isMockMode();

// ---- API base (single source of truth) -------------------------------------
/**
 * You can override these via Next.js env:
 *  - NEXT_PUBLIC_API_BASE   (default: http://localhost:8000)
 *  - NEXT_PUBLIC_API_PREFIX (default: /api)
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api";

// normalize: no trailing slash on base; prefix always starts with "/"
const __base = API_BASE.replace(/\/+$/, "");
const __prefix = API_PREFIX.startsWith("/") ? API_PREFIX : `/${API_PREFIX}`;

/** Final base URL used by all calls (e.g., http://localhost:8000/api) */
export const API_BASE_URL = `${__base}${__prefix}`;

/** Backward-compat function (kept so existing imports keep working) */
export function apiBase(): string {
  return API_BASE_URL;
}

/** Helper to join paths onto the API base */
export function urlFor(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${clean}`;
}
