/* eslint-disable @typescript-eslint/no-unused-vars */
// src/lib/api/entityRouter.ts

import { USE_MOCK } from "./config";

export type Operation = "options" | "get" | "getOne" | "post" | "update";

/**
 * No mock.behavior.json.
 * Single rule: if USE_MOCK is true, use mocks for ALL operations; else never use.
 */
export function shouldUseMock(_entity: string, _operation: Operation): boolean {
  return USE_MOCK;
}
