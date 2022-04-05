import { Fanout } from "@glasseaters/hydra-sdk";
import { PublicKey } from "@solana/web3.js";
import { useAccount, UseAccountState } from "@strata-foundation/react";

export interface IFanout extends Fanout {
  publicKey: PublicKey;
}

export const useFanout = (
  fanout: PublicKey | undefined | null
): UseAccountState<IFanout> => {
  return useAccount(fanout, (pubkey, data) => {
    const result = Fanout.fromAccountInfo(data)[0];
    // @ts-ignore
    result.publicKey = pubkey;
    return result as IFanout;
  });
};
