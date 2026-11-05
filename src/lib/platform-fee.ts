// TrustLoop's own income: a small percentage taken when a freelancer withdraws.
// Set WITHDRAWAL_FEE_PERCENT in the environment to change it (default 2, allowed 0 to 20).
export function withdrawalFeePercent(): number {
  const n = Number(process.env.WITHDRAWAL_FEE_PERCENT ?? "2");
  return Number.isFinite(n) ? Math.min(20, Math.max(0, n)) : 2;
}

// The fee is rounded to the nearest naira. "net" is what the user actually receives.
export function withdrawalFee(amountNgn: number) {
  const percent = withdrawalFeePercent();
  const fee = Math.round((amountNgn * percent) / 100);
  return { percent, fee, net: amountNgn - fee };
}
