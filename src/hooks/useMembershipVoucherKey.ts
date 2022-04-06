import { FanoutClient } from "@glasseaters/hydra-sdk";
import { PublicKey } from "@solana/web3.js";
import { useAsync } from "react-async-hook";

export function useMembershipVoucherKey(fanout: PublicKey | undefined, member: PublicKey | undefined): PublicKey | undefined {
  const { result } = useAsync(
    async (fanout: PublicKey | undefined, member: PublicKey | undefined) =>
      fanout && member && FanoutClient.membershipVoucher(fanout, member),
    [fanout, member]
  );

  return result && result[0];
}
