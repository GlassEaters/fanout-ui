import {
  Alert, Button, Input,
  Select, VStack
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { FanoutClient, MembershipModel } from "@hydra/fanout";
import { PublicKey } from "@solana/web3.js";
import { MintSelect } from "@strata-foundation/marketplace-ui";
import {
  useProvider
} from "@strata-foundation/react";
import { useRouter } from "next/router";
import React from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { route, routes } from "../../../utils/routes";
import { useFanoutClient } from "../../contexts/FanoutClientContext";
import { FormControlWithError } from "./FormControlWithError";

interface IFanoutFormProps {
  name: string;
  totalShares: number;
  mint?: string;
  membershipModel: number;
}

const validationSchema = yup.object({
  name: yup.string().required(),
  mint: yup.string(),
  totalShares: yup.number().required().min(1),
  membershipModel: yup.number().required(),
});

async function createFanout(
  fanoutClient: FanoutClient,
  values: IFanoutFormProps
): Promise<string> {
  const mint = values.mint ? new PublicKey(values.mint) : undefined;

  await fanoutClient.initializeFanout({
    membershipModel: values.membershipModel,
    name: values.name,
    totalShares: values.totalShares,
    mint
  })

  return values.name
}

export const FanoutForm: React.FC = () => {
  const formProps = useForm<IFanoutFormProps>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      membershipModel: MembershipModel.Wallet
    }
  });
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = formProps;
  const { awaitingApproval } = useProvider();
  const { execute, loading, error } = useAsyncCallback(createFanout);
  const { fanoutClient } = useFanoutClient();
  const router = useRouter();

  const onSubmit = async (values: IFanoutFormProps) => {
    const name = await execute(fanoutClient!, values);
    router.push(
      route(routes.fanout, {
        name
      })
    );
  };

  const membershipModel = watch("membershipModel");
  return (
    <FormProvider {...formProps}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={8}>
          <FormControlWithError
            id="membershipModel"
            help="The membership model for this fanout. NFT means nft holders split this fanout. You will need to add NFTs to the fanout. Token means that token holders split this fannout. Wallet functions like the metaplex nft creators array, an admin manually manages shares."
            label="Membership Model"
            errors={errors}
          >
            <Select
              value={membershipModel}
              onChange={(e) => {
                setValue("membershipModel", Number(e.target.value));
              }}
            >
              <option value={MembershipModel.Wallet}>Wallet</option>
              <option value={MembershipModel.NFT}>NFT</option>
              <option value={MembershipModel.Token}>Token</option>
            </Select>
          </FormControlWithError>
          <FormControlWithError
            id="name"
            help="The name of this fanout. Must be unique"
            label="Name"
            errors={errors}
          >
            <Input {...register("name")} />
          </FormControlWithError>
          {membershipModel == MembershipModel.Token && (
            <FormControlWithError
              id="mint"
              help={`The mint representing shares in this fanout.`}
              label="Mint"
              errors={errors}
            >
              <MintSelect
                value={watch("mint") || ""}
                onChange={(s) => setValue("mint", s)}
              />
            </FormControlWithError>
          )}
          <FormControlWithError
            id="totalShares"
            help="The total number of shares in this fanout"
            label="Total Shares"
            errors={errors}
          >
            <Input
              type="number"
              min={1}
              step={1}
              {...register("totalShares")}
            />
          </FormControlWithError>

          {error && (
            <Alert status="error">
              <Alert status="error">{error.toString()}</Alert>
            </Alert>
          )}

          <Button
            type="submit"
            alignSelf="flex-end"
            colorScheme="primary"
            isLoading={isSubmitting || loading}
            loadingText={awaitingApproval ? "Awaiting Approval" : "Loading"}
          >
            Create Fanout
          </Button>
        </VStack>
      </form>
    </FormProvider>
  );
};
