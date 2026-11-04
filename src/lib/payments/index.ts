import { mockProvider } from "./mock";
import { roqquProvider } from "./roqqu";
import type { PaymentProvider } from "./types";

// PAYMENTS_MODE=live uses Roqqu (and falls back to the simulator if Roqqu is unreachable).
// Anything else uses the simulator.
export const payments: PaymentProvider =
  process.env.PAYMENTS_MODE === "live" ? roqquProvider : mockProvider;
