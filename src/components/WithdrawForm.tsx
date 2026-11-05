import WithdrawFormClient from "./WithdrawFormClient";
import { withdrawalFeePercent } from "@/lib/platform-fee";

// The fee percentage is read on the server and passed down, so the form always shows the real rate.
export default function WithdrawForm({ balance }: { balance: number }) {
  return <WithdrawFormClient balance={balance} feePercent={withdrawalFeePercent()} />;
}
