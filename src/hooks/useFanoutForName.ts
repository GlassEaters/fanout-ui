import { useFanoutClient } from "@/contexts/FanoutClientContext";
import { FanoutClient } from "@glasseaters/hydra-sdk";
import { IFanout, useFanout } from "./useFanout"
import { useAsync } from "react-async-hook";
import { useAccount, UseAccountState } from "@strata-foundation/react";

export const useFanoutForName = (name: string): UseAccountState<IFanout> => {
  const { fanoutClient } = useFanoutClient();
  const { result: key } = useAsync(FanoutClient.fanoutKey, [name]);

  return useFanout(key ? key[0] : undefined)
}
