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
} from "@strata-foundation/react";
import { useRouter } from "next/router";
import { AiOutlinePlusCircle } from "react-icons/ai";
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
    <HStack justifyContent="space-between" p={2}>
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
  const solOwnedAmountBn = useMemo(() => {
    if (solOwnedAmount && !isNaN(solOwnedAmount)) {
      return new BN(solOwnedAmount);
    }
  }, [solOwnedAmount]);
  const { execute, loading, result, error } = useAsyncCallback(runFanout)
  const { handleErrors } = useErrorHandler();
  handleErrors(error)
  
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
                  })
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
            {/* TODO: Stake and unstake */}
            {fanout?.membershipModel === MembershipModel.Token && (
              <Button
                onClick={() => {}}
                variant="outline"
                leftIcon={<Icon as={AiOutlinePlusCircle} />}
              >
                Stake
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
              <Member member={member} key={member.toBase58()} />
            ))}
          </VStack>
        </VStack>
      </VStack>
    </Container>
  );
};
