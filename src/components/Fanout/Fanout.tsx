import { useFanoutForName } from "../../hooks/useFanoutForName";
import { useMembershipVouchers } from "../../hooks/useMembershipVouchers";
import {
  HStack,
  Icon,
  Text,
  Container,
  Heading,
  Skeleton,
  useColorModeValue,
  VStack,
  SimpleGrid,
  StackDivider,
  Stack,
  Button,
  Image,
  LightMode,
  IconButton
} from "@chakra-ui/react";
import { NATIVE_MINT } from "@solana/spl-token";
import { sendMultipleInstructions } from "@strata-foundation/spl-utils";
import { PublicKey } from "@solana/web3.js";
import {
  amountAsNum,
  TokenAccount,
  useAccount,
  useMint,
  useTokenMetadata,
  Notification,
  useWalletTokenAccounts,
  useErrorHandler,
  useOwnedAmount,
  useAssociatedAccount,
} from "@strata-foundation/react";
import { useRouter } from "next/router";
import { AiOutlinePlusCircle, AiOutlineMinusCircle } from "react-icons/ai";
import { route, routes } from "../../../utils/routes";
import { useMembershipVoucher } from "../../hooks/useMembershipVoucher";
import { numberWithCommas } from "@strata-foundation/marketplace-ui";
import { BsClipboard } from "react-icons/bs";
import BN from "bn.js";
import { MembershipModel, FanoutClient, errorFromCode } from "@glasseaters/hydra-sdk";
import { GiPentarrowsTornado } from "react-icons/gi";
import { useAsyncCallback } from "react-async-hook";
import { useMemo } from "react";
import { useFanoutClient } from "../../contexts/FanoutClientContext";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import { Program } from "@project-serum/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMembershipVoucherForMember } from "../../hooks/useMembershipVoucherForMember";

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const Holding = ({
  mint,
  amount
}: {
  mint?: PublicKey;
  amount?: BN;
}) => {
  const { image, metadata, loading, displayName } = useTokenMetadata(mint);
  const mintAcc = useMint(mint);

  const amountNum = amount && mintAcc && amountAsNum(amount, mintAcc);

  return (
    <VStack
      align="start"
      rounded="lg"
      padding={4}
      bg={useColorModeValue("white", "black.300")}
    >
      {loading ? (
        <Skeleton w="50px" h="50px" />
      ) : (
        <Image w="50px" h="50px" src={image} alt={displayName} />
      )}
      <HStack w="full" justifyContent="space-between" spacing={1}>
        <Text fontWeight="700">{displayName}</Text>
        {loading ? (
          <Skeleton w="100px" />
        ) : (
          <Text fontWeight="700">
            {amountNum && numberWithCommas(amountNum, 4)}{" "}
            {metadata?.data.symbol}
          </Text>
        )}
      </HStack>
    </VStack>
  );
};

const Member = ({ member }: { member: PublicKey | undefined }) => {
  const { info: voucher, loading } = useMembershipVoucher(member)
  return (
    <HStack justifyContent="space-between" p={2} w="full">
      {loading && <Skeleton width="250px" />}
      {!loading && (
        <>
          <Text>{voucher?.membershipKey.toBase58()}</Text>
          <Text>{voucher?.shares.toString()} shares</Text>
        </>
      )}
    </HStack>
  );
};

class IdlErrorMap extends Map<number, string> {
  get(key: number) {
    return errorFromCode(key)?.toString();
  }

  //@ts-ignore
  set(key: number, value: string) {
    throw new Error("Not implemented")
  }
};
const errorMap = new IdlErrorMap();

async function runFanout({ fanoutSdk, fanout, tokens }: { fanoutSdk: FanoutClient, fanout: PublicKey, tokens: TokenAccount[] | undefined }): Promise<void> {
  const instructionResultsTokens = await Promise.all(
    tokens?.map((t) => {
      const mint = t.info.mint;
      return fanoutSdk.distributeAllInstructions({
        fanout,
        mint,
        payer: fanoutSdk.wallet.publicKey,
      });
    }) || []
  );
  const instructionResultsSol = await fanoutSdk.distributeAllInstructions({
    fanout,
    mint: NATIVE_MINT,
    payer: fanoutSdk.wallet.publicKey,
  });
  const instructionResults = [instructionResultsSol, ...instructionResultsTokens];

  const allInstructions = instructionResults
    .map((i) => i.instructions)
    .flat();
  const allSigners = instructionResults
    .map((i) => i.signers)
    .flat();

  await sendMultipleInstructions(
    //@ts-ignore
    errorMap as Map<number, string>,
    fanoutSdk.provider,
    allInstructions,
    allSigners
  );
}

async function runStake({ fanoutSdk, fanout, amount }: { amount: number, fanoutSdk: FanoutClient, fanout: PublicKey }): Promise<void> {
  await fanoutSdk.stakeTokenMember({
    fanout,
    member: fanoutSdk.wallet.publicKey,
    payer: fanoutSdk.wallet.publicKey,
    shares: amount
  });
}

async function runUnStake({
  fanoutSdk,
  fanout,
}: {
  fanoutSdk: FanoutClient;
  fanout: PublicKey;
}): Promise<void> {
  await fanoutSdk.unstakeTokenMember({
    fanout,
    member: fanoutSdk.wallet.publicKey,
    payer: fanoutSdk.wallet.publicKey,
  });
}

async function runRemoveMember({
  fanoutSdk,
  fanout,
  member
}: {
  fanoutSdk: FanoutClient;
  fanout: PublicKey;
  member: PublicKey;
}): Promise<void> {
  throw new Error("Not yet supported")
}

function toBN(bnOrNumber: BN | number): BN {
  if (BN.isBN(bnOrNumber)) {
    return bnOrNumber
  }

  return new BN(bnOrNumber as number);
}

export const Fanout = ({ name }: { name: string }) => {
  const router = useRouter();
  const { info: fanout } = useFanoutForName(name);
  const { members } = useMembershipVouchers(fanout?.publicKey)
  const { result: tokens } = useWalletTokenAccounts(fanout?.accountKey);
  const { fanoutClient } = useFanoutClient();
  const { info: solOwnedAmount } = useAccount<number>(
    fanout?.accountKey,
    (_, account) => account.lamports
  );
  const { publicKey } = useWallet();
  const tokenSharesAmount = useOwnedAmount(fanout?.membershipMint);
  const { info: membershipVoucher } = useMembershipVoucherForMember(fanout?.publicKey, publicKey || undefined);
  const memberMint = useMint(fanout?.membershipMint);
  const stakedAmount = useMemo(() => memberMint && membershipVoucher && amountAsNum(toBN(membershipVoucher?.shares), memberMint), [membershipVoucher, memberMint])
  const { associatedAccount } = useAssociatedAccount(
    publicKey,
    fanout?.membershipMint
  );
  const isAdmin = fanout && publicKey?.equals(fanout?.authority)

  const solOwnedAmountBn = useMemo(() => {
    if (solOwnedAmount && !isNaN(solOwnedAmount)) {
      return new BN(solOwnedAmount);
    }

    if (solOwnedAmount) {
      return new BN(0)
    }
  }, [solOwnedAmount]);
  const { execute, loading, error } = useAsyncCallback(runFanout)
  const {
    execute: stake,
    loading: stakeLoading,
    error: stakeError,
  } = useAsyncCallback(runStake);
  const {
    execute: unstake,
    loading: unstakeLoading,
    error: unstakeError,
  } = useAsyncCallback(runUnStake);
  const {
    execute: removeMember,
    loading: removeMemberLoading,
    error: removeMemberError,
  } = useAsyncCallback(runRemoveMember);
  const { handleErrors } = useErrorHandler();
  handleErrors(error, stakeError, unstakeError, removeMemberError);
  
  return (
    <Container rounded="lg" maxW={"container.lg"}>
      <VStack w="full">
        <VStack align="left" w="full" shadow="xl" rounded="lg" p="16px">
          <Stack
            direction={["column", "column", "row"]}
            justifyContent={["start", "start", "space-between"]}
          >
            <HStack>
              <Heading size="lg">{name && capitalizeFirstLetter(name)}</Heading>
              <IconButton
                variant="ghost"
                colorScheme="primary"
                aria-label="Wallet Address"
                size="lg"
                onClick={() => {
                  copy(fanout?.accountKey.toBase58() || "");
                  toast.custom((t) => (
                    <Notification
                      type="info"
                      show={t.visible}
                      heading={"Copied to Clipboard"}
                      // @ts-ignore
                      message={fanout?.accountKey.toBase58() || ""}
                      onDismiss={() => toast.dismiss(t.id)}
                    />
                  ));
                }}
                icon={<Icon as={BsClipboard} />}
              />
            </HStack>

            {/* TODO: Distribute */}
            <LightMode>
              <Button
                isLoading={loading}
                onClick={async () => {
                  await execute({
                    fanoutSdk: fanoutClient!,
                    fanout: fanout!.publicKey,
                    tokens,
                  });
                  toast.custom((t) => (
                    <Notification
                      type="info"
                      show={t.visible}
                      heading={"Fanout Successful"}
                      // @ts-ignore
                      message={"Successfully fanned out"}
                      onDismiss={() => toast.dismiss(t.id)}
                    />
                  ));
                }}
                variant="outline"
                colorScheme="primary"
                leftIcon={<Icon as={GiPentarrowsTornado} />}
              >
                Fanout
              </Button>
            </LightMode>
          </Stack>

          <SimpleGrid columns={[1, 2, 3, 4]}>
            <Holding mint={NATIVE_MINT} amount={solOwnedAmountBn} />
            {tokens?.map((token) => {
              return (
                <Holding
                  key={token.pubkey.toBase58()}
                  mint={token.info.mint}
                  amount={token.info.amount}
                />
              );
            })}
          </SimpleGrid>
        </VStack>
        <VStack align="left" w="full" shadow="xl" rounded="lg" p="16px">
          <Stack
            direction={["column", "column", "row"]}
            justifyContent={["start", "start", "space-between"]}
          >
            <Heading size="lg">Holders</Heading>
            {fanout?.membershipModel !== MembershipModel.Token && (
              <Button
                onClick={() => router.push(route(routes.addMember, { name }))}
                variant="outline"
                leftIcon={<Icon as={AiOutlinePlusCircle} />}
              >
                Add
              </Button>
            )}
            {fanout?.membershipModel === MembershipModel.Token &&
              tokenSharesAmount && (
                <Button
                  isDisabled={!tokenSharesAmount}
                  isLoading={stakeLoading}
                  onClick={async () => {
                    await stake({
                      fanoutSdk: fanoutClient!,
                      fanout: fanout.publicKey,
                      amount: associatedAccount!.amount.toNumber(),
                    });
                    toast.custom((t) => (
                      <Notification
                        type="info"
                        show={t.visible}
                        heading={"Stake Successful"}
                        // @ts-ignore
                        message={"Successfully staked your token shares"}
                        onDismiss={() => toast.dismiss(t.id)}
                      />
                    ));
                  }}
                  variant="outline"
                  leftIcon={<Icon as={AiOutlinePlusCircle} />}
                >
                  {tokenSharesAmount
                    ? `Stake ${numberWithCommas(tokenSharesAmount, 2)}`
                    : "No Shares"}
                </Button>
              )}
            {fanout?.membershipModel === MembershipModel.Token &&
              membershipVoucher && (
                <Button
                  isLoading={unstakeLoading}
                  onClick={async () => {
                    await unstake({
                      fanoutSdk: fanoutClient!,
                      fanout: fanout.publicKey,
                    });
                    toast.custom((t) => (
                      <Notification
                        type="info"
                        show={t.visible}
                        heading={"Unstake Successful"}
                        // @ts-ignore
                        message={"Successfully unstaked your token shares"}
                        onDismiss={() => toast.dismiss(t.id)}
                      />
                    ));
                  }}
                  variant="outline"
                  leftIcon={<Icon as={AiOutlineMinusCircle} />}
                >
                  {stakedAmount
                    ? `Unstake ${numberWithCommas(stakedAmount, 2)}`
                    : "No Shares"}
                </Button>
              )}
          </Stack>
          <VStack
            p={4}
            rounded="lg"
            bg={useColorModeValue("white", "black.300")}
            align="stretch"
            divider={
              <StackDivider
                bg="gray.200"
                borderColor={useColorModeValue("gray.200", "gray.500")}
              />
            }
          >
            {members?.map((member) => (
              <HStack key={member.toBase58()} w="full" justify="stretch">
                <Member member={member} />
                {isAdmin && fanout?.membershipModel !== MembershipModel.Token && (
                  <IconButton
                    title="Remove Member not yet Supported"
                    aria-label="Remove Member not yet Supported"
                    icon={<Icon as={AiOutlineMinusCircle} />}
                    isLoading={removeMemberLoading}
                    isDisabled={true}
                    onClick={() => {
                      removeMember({
                        fanoutSdk: fanoutClient!,
                        fanout: fanout?.publicKey!,
                        member,
                      });
                      toast.custom((t) => (
                        <Notification
                          type="info"
                          show={t.visible}
                          heading={"Remove Successful"}
                          // @ts-ignore
                          message={`Successfully removed member ${member.toBase58()}`}
                          onDismiss={() => toast.dismiss(t.id)}
                        />
                      ));
                    }}
                  ></IconButton>
                )}
              </HStack>
            ))}
          </VStack>
        </VStack>
      </VStack>
    </Container>
  );
};
