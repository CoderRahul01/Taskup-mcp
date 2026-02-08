import { AsyncLocalStorage } from "node:async_hooks";

export interface AuthContext {
  token: string;
  userId?: string;
  clientId?: string;
}

export const authStore = new AsyncLocalStorage<AuthContext>();
