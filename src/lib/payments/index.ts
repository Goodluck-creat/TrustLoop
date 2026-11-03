import { mockProvider } from "./mock";
import type { PaymentProvider } from "./types";

// After the Roqqu session we add a roqquProvider and switch on PAYMENTS_MODE.
export const payments: PaymentProvider =
  process.env.PAYMENTS_MODE === "live"
    ? (() => { throw new Error("Live Roqqu provider is not built yet"); })()
    : mockProvider;