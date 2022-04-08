import { PublicKey } from "@solana/web3.js";
import { useMembershipVoucher } from "./useMembershipVoucher";
import { useMembershipVoucherKey } from "./useMembershipVoucherKey";

export function useMembershipVoucherForMember(fanout: PublicKey | undefined, member: PublicKey | undefined) {
  const key = useMembershipVoucherKey(fanout, member);

  return useMembershipVoucher(key);
}