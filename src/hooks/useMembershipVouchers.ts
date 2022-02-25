import { Connection, PublicKey } from "@solana/web3.js"
import BN from "bn.js";
import bs58 from "bs58";
import { BorshAccountsCoder } from "@project-serum/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { FanoutClient } from "@hydra/fanout";
import { useAsync } from "react-async-hook";

interface IMemberVouchers {
  loading: boolean;
  error: Error | undefined;
  members: PublicKey[] | undefined;
}

async function getMembershipVouchers(connection: Connection | undefined, fanout: PublicKey | undefined): Promise<PublicKey[] | undefined> {
  if (!connection || !fanout) {
    return undefined;
  }

    const descriminator = BorshAccountsCoder.accountDiscriminator(
      "fanoutMembershipVoucher"
    );
  const filters = [
    {
      memcmp: {
        offset: 0,
        bytes: bs58.encode(
          Buffer.concat([descriminator, fanout.toBuffer()])
        ),
      },
    }
  ];
  const members = await connection.getProgramAccounts(
    FanoutClient.ID,
    {
      // Just get the id
      dataSlice: {
        length: 0,
        offset: 0,
      },
      filters,
    }
  );

  return members.map(mem => mem.pubkey);
}

export function useMembershipVouchers(fanout: PublicKey | undefined): IMemberVouchers {
  const { connection } = useConnection();
  const { result, loading, error } = useAsync(getMembershipVouchers, [
    connection,
    fanout,
  ]);

  return {
    members: result,
    loading,
    error
  }
}
