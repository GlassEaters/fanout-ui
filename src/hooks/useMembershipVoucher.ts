import { FanoutMembershipVoucher } from "@glasseaters/hydra-sdk";
import { PublicKey } from "@solana/web3.js";
import { useAccount, UseAccountState } from "@strata-foundation/react";

export interface IMembershipVoucher extends FanoutMembershipVoucher {
  publicKey: PublicKey;
}

export const useMembershipVoucher = (
  MembershipVoucher: PublicKey | undefined | null
): UseAccountState<IMembershipVoucher> => {
  return useAccount(MembershipVoucher, (pubkey, data) => {
    const result = FanoutMembershipVoucher.fromAccountInfo(data)[0];
    // @ts-ignore
    result.publicKey = pubkey;
    return result as IMembershipVoucher;
  });
};
