import { IFanout } from "@/hooks/useFanout";
import { useFanoutForName } from "@/hooks/useFanoutForName";
import {
  Alert,
  Button,
  Input, VStack
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { FanoutClient, MembershipModel } from "@glasseaters/hydra-sdk";
import { PublicKey } from "@solana/web3.js";
import { Recipient } from "@strata-foundation/marketplace-ui";
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

interface IAddMemberFormProps {
  member: string;
  shares: number;
}

const validationSchema = yup.object({
  member: yup.string().required(),
  shares: yup.number().required().min(1),
});

async function addMember(
  fanoutClient: FanoutClient,
  fanout: IFanout,
  values: IAddMemberFormProps
): Promise<void> {
  const member = new PublicKey(values.member);

  switch (fanout.membershipModel) {
    case MembershipModel.NFT:
      await fanoutClient.addMemberNft({
        fanout: fanout.publicKey,
        shares: values.shares,
        membershipKey: member,
      });
      break;
    case MembershipModel.Wallet:
      await fanoutClient.addMemberWallet({
        fanout: fanout.publicKey,
        shares: values.shares,
        membershipKey: member,
      });
      break;
  }
}

export const AddMemberForm = ({ name }: { name: string }) => {
  const formProps = useForm<IAddMemberFormProps>({
    resolver: yupResolver(validationSchema),
  });
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = formProps;
  const { awaitingApproval } = useProvider();
  const { execute, loading, error } = useAsyncCallback(addMember);
  const { fanoutClient } = useFanoutClient();
  const router = useRouter();
  const { info: fanout } = useFanoutForName(name)

  const onSubmit = async (values: IAddMemberFormProps) => {
    await execute(fanoutClient!, fanout!, values);
    router.push(
      route(routes.fanout, {
        name,
      })
    );
  };

  return (
    <FormProvider {...formProps}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={8}>
          <FormControlWithError
            id="member"
            help={fanout?.membershipModel === MembershipModel.NFT ? "The mint address of the NFT to add" : "The wallet address to add"}
            label={ fanout?.membershipModel === MembershipModel.NFT ? "NFT Mint" : "Wallet" }
            errors={errors}
          >
            <Recipient
              name={"member"}
              value={watch("member")}
              onChange={register("member").onChange}
            />
          </FormControlWithError>
          <FormControlWithError
            id="shares"
            help="The shares to allocate this member"
            label="Total Shares"
            errors={errors}
          >
            <Input type="number" min={1} step={1} {...register("shares")} />
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
            Add Member
          </Button>
        </VStack>
      </form>
    </FormProvider>
  );
};
