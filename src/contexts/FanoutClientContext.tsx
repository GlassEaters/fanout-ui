import { FanoutClient, Wallet } from "@glasseaters/hydra-sdk";
import { Connection } from "@solana/web3.js";
import { useProvider } from "@strata-foundation/react";
import React, { useContext, useMemo } from "react";
import { useAsync } from "react-async-hook";

export const FanoutClientContext =
  React.createContext<IFanoutClientReactState>({
    loading: true,
  });

export interface IFanoutClientReactState {
  error?: Error;
  loading: boolean;
  fanoutClient?: FanoutClient;
}

async function tryProm<A>(prom: Promise<A>): Promise<A | undefined> {
  try {
    return await prom;
  } catch (e) {
    console.error(e);
  }

  return undefined;
}

async function getSdk(
  connection: Connection | undefined | null,
  wallet: Wallet | undefined | null
): Promise<FanoutClient | undefined> {
  if (!connection || !wallet) {
    return undefined;
  }

  return tryProm(FanoutClient.init(connection, wallet));
}

export const FanoutClientProviderRaw: React.FC = ({ children }) => {
  const { provider } = useProvider();
  const { result, loading, error } = useAsync(getSdk, [provider?.connection, provider?.wallet]);
  const sdks = useMemo(
    () => ({
      fanoutClient: result,
      error,
      loading,
    }),
    [result, loading, error]
  );

  return (
    <FanoutClientContext.Provider value={sdks}>
      {children}
    </FanoutClientContext.Provider>
  );
};

export const FanoutClientProvider: React.FC = ({ children }) => {
  return <FanoutClientProviderRaw>{children}</FanoutClientProviderRaw>;
};

export const useFanoutClient = (): IFanoutClientReactState => {
  return useContext(FanoutClientContext);
};
